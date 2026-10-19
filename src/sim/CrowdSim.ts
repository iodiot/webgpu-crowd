import {
  CELL_SIZE, GOAL_COUNT, GRID_DIM, MAX_AGENTS, MAX_OBSTACLES, OBSTACLES, WORLD_HALF, type SimParams,
} from './params';
import { simShader } from './shaders';

const WG = 256;
/** Params struct: 16 scalars (64 B) + MAX_OBSTACLES vec4f. */
const PARAMS_BYTES = 64 + MAX_OBSTACLES * 16;

/**
 * Owns all GPU buffers for the crowd and encodes the compute passes.
 * Buffers are sized for MAX_AGENTS once, so changing the agent count is free:
 * we just dispatch fewer/more threads.
 */
export class CrowdSim {
  /** Ping-pong agent state: vec4(pos.x, pos.z, vel.x, vel.z). */
  readonly agentBuffers: [GPUBuffer, GPUBuffer];
  /** Per-agent vec4(goal.x, goal.z, speedScale, goalIndex). */
  readonly metaBuffer: GPUBuffer;
  /** Uniform buffer (also read by the renderer for obstacle placement). */
  readonly paramsBuffer: GPUBuffer;
  /** Index (0/1) of the agent buffer holding the latest state. */
  current = 0;

  private readonly pipelines: Record<'clearGrid' | 'countAgents' | 'scanCells' | 'scatter' | 'steer', GPUComputePipeline>;
  private readonly bindGroups: [GPUBindGroup, GPUBindGroup];
  private readonly paramsData = new ArrayBuffer(PARAMS_BYTES);
  private frame = 0;
  private time = 0;

  constructor(private readonly device: GPUDevice) {
    const storage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
    const cells = GRID_DIM * GRID_DIM;
    const mk = (label: string, size: number, usage = storage) => device.createBuffer({ label, size, usage });

    this.agentBuffers = [mk('agentsA', MAX_AGENTS * 16), mk('agentsB', MAX_AGENTS * 16)];
    this.metaBuffer = mk('meta', MAX_AGENTS * 16);
    this.paramsBuffer = mk('simParams', PARAMS_BYTES, GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST);
    const cellCount = mk('cellCount', cells * 4);
    const cellStart = mk('cellStart', cells * 4);
    const agentCell = mk('agentCell', MAX_AGENTS * 8);
    const sortedIdx = mk('sortedIdx', MAX_AGENTS * 4);

    const C = GPUShaderStage.COMPUTE;
    const layout = device.createBindGroupLayout({
      label: 'sim',
      entries: [
        { binding: 0, visibility: C, buffer: { type: 'uniform' } },
        { binding: 1, visibility: C, buffer: { type: 'read-only-storage' } },
        ...[2, 3, 4, 5, 6, 7].map((binding) => ({ binding, visibility: C, buffer: { type: 'storage' as const } })),
      ],
    });
    const group = (src: GPUBuffer, dst: GPUBuffer) => device.createBindGroup({
      layout,
      entries: [this.paramsBuffer, src, dst, this.metaBuffer, cellCount, cellStart, agentCell, sortedIdx]
        .map((buffer, binding) => ({ binding, resource: { buffer } })),
    });
    this.bindGroups = [group(this.agentBuffers[0], this.agentBuffers[1]), group(this.agentBuffers[1], this.agentBuffers[0])];

    const module = device.createShaderModule({ label: 'sim', code: simShader });
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
    const make = (entryPoint: string) =>
      device.createComputePipeline({ label: entryPoint, layout: pipelineLayout, compute: { module, entryPoint } });
    this.pipelines = {
      clearGrid: make('clearGrid'),
      countAgents: make('countAgents'),
      scanCells: make('scanCells'),
      scatter: make('scatter'),
      steer: make('steer'),
    };
    this.seed();
  }

  /** Scatter all MAX_AGENTS agents across free space with a random goal each. */
  seed(): void {
    const agents = new Float32Array(MAX_AGENTS * 4);
    const meta = new Float32Array(MAX_AGENTS * 4);
    const r = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < MAX_AGENTS; i++) {
      let x = 0;
      let z = 0;
      do {
        x = r(-WORLD_HALF + 2, WORLD_HALF - 2);
        z = r(-WORLD_HALF + 2, WORLD_HALF - 2);
      } while (OBSTACLES.some(([ox, oz, rad]) => Math.hypot(x - ox, z - oz) < rad + 0.5));
      agents.set([x, z, r(-1, 1), r(-1, 1)], i * 4);
      const goal = Math.floor(Math.random() * GOAL_COUNT);
      const a = (goal / GOAL_COUNT) * Math.PI * 2;
      meta.set([
        Math.cos(a) * WORLD_HALF * 0.82 + r(-7, 7),
        Math.sin(a) * WORLD_HALF * 0.82 + r(-7, 7),
        r(0.7, 1.15), // per-agent speed variation
        goal,
      ], i * 4);
    }
    this.device.queue.writeBuffer(this.agentBuffers[0], 0, agents);
    this.device.queue.writeBuffer(this.agentBuffers[1], 0, agents);
    this.device.queue.writeBuffer(this.metaBuffer, 0, meta);
    this.current = 0;
  }

  /** Upload uniforms for this frame. Always call (renderer reads obstacles even when paused). */
  updateParams(p: SimParams, dt: number): void {
    this.time += dt;
    this.frame++;
    const u = new Uint32Array(this.paramsData);
    const f = new Float32Array(this.paramsData);
    u[0] = p.agentCount; u[1] = GRID_DIM; f[2] = CELL_SIZE; f[3] = WORLD_HALF;
    f[4] = dt; f[5] = p.maxSpeed; f[6] = Math.min(p.neighborRadius, CELL_SIZE); u[7] = OBSTACLES.length;
    f[8] = p.separation; f[9] = p.alignment; f[10] = p.cohesion; f[11] = p.goalSeeking;
    f[12] = p.obstacleAvoidance; f[13] = this.time; u[14] = this.frame; u[15] = 0;
    OBSTACLES.forEach((o, k) => f.set(o, 16 + k * 4));
    this.device.queue.writeBuffer(this.paramsBuffer, 0, this.paramsData);
  }

  /** Encode one simulation step. Afterwards `current` points at the new state. */
  encode(encoder: GPUCommandEncoder, agentCount: number, timestampWrites?: GPUComputePassTimestampWrites): void {
    const pass = encoder.beginComputePass({ label: 'crowd-sim', timestampWrites });
    pass.setBindGroup(0, this.bindGroups[this.current]);
    const agentGroups = Math.ceil(agentCount / WG);
    pass.setPipeline(this.pipelines.clearGrid);
    pass.dispatchWorkgroups(Math.ceil((GRID_DIM * GRID_DIM) / WG));
    pass.setPipeline(this.pipelines.countAgents);
    pass.dispatchWorkgroups(agentGroups);
    pass.setPipeline(this.pipelines.scanCells);
    pass.dispatchWorkgroups(1);
    pass.setPipeline(this.pipelines.scatter);
    pass.dispatchWorkgroups(agentGroups);
    pass.setPipeline(this.pipelines.steer);
    pass.dispatchWorkgroups(agentGroups);
    pass.end();
    this.current = 1 - this.current;
  }
}
