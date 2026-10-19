import { MAX_AGENTS, OBSTACLES, WORLD_HALF } from '../sim/params';
import type { CrowdSim } from '../sim/CrowdSim';
import type { OrbitCamera } from './camera';
import { normalize } from './math';
import { cylinderMesh, figureMesh } from './mesh';
import { renderShader } from './shaders';

const SAMPLES = 4;
const DEPTH_FORMAT: GPUTextureFormat = 'depth24plus';

/**
 * Draws ground + obstacles + all agents in a single MSAA render pass.
 * Agent transforms are read directly from the simulation's storage buffer in the
 * vertex shader (instance_index → agent), so there is zero per-frame CPU work per agent.
 */
export class Renderer {
  private readonly format: GPUTextureFormat;
  private readonly cameraBuffer: GPUBuffer;
  private readonly bindGroups: [GPUBindGroup, GPUBindGroup];
  private readonly agentPipeline: GPURenderPipeline;
  private readonly obstaclePipeline: GPURenderPipeline;
  private readonly groundPipeline: GPURenderPipeline;
  private readonly figure: { buffer: GPUBuffer; count: number };
  private readonly cylinder: { buffer: GPUBuffer; count: number };
  private msaa?: GPUTexture;
  private depth?: GPUTexture;

  constructor(private readonly device: GPUDevice, private readonly context: GPUCanvasContext, sim: CrowdSim) {
    this.format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format: this.format, alphaMode: 'opaque' });

    this.cameraBuffer = device.createBuffer({ size: 64 + 16 * 3, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    const upload = (data: Float32Array<ArrayBuffer>) => {
      const buffer = device.createBuffer({ size: data.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
      device.queue.writeBuffer(buffer, 0, data);
      return { buffer, count: data.length / 6 };
    };
    this.figure = upload(figureMesh());
    this.cylinder = upload(cylinderMesh());

    const V = GPUShaderStage.VERTEX;
    const layout = device.createBindGroupLayout({
      label: 'render',
      entries: [
        { binding: 0, visibility: V | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
        { binding: 1, visibility: V, buffer: { type: 'read-only-storage' } },
        { binding: 2, visibility: V, buffer: { type: 'read-only-storage' } },
        { binding: 3, visibility: V, buffer: { type: 'uniform' } },
      ],
    });
    const group = (agents: GPUBuffer) => device.createBindGroup({
      layout,
      entries: [this.cameraBuffer, agents, sim.metaBuffer, sim.paramsBuffer].map((buffer, binding) => ({ binding, resource: { buffer } })),
    });
    this.bindGroups = [group(sim.agentBuffers[0]), group(sim.agentBuffers[1])];

    const module = device.createShaderModule({ label: 'render', code: renderShader });
    const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
    const meshLayout: GPUVertexBufferLayout = {
      arrayStride: 24,
      attributes: [
        { shaderLocation: 0, offset: 0, format: 'float32x3' },
        { shaderLocation: 1, offset: 12, format: 'float32x3' },
      ],
    };
    const make = (vs: string, fs: string, buffers: GPUVertexBufferLayout[]) => device.createRenderPipeline({
      label: vs,
      layout: pipelineLayout,
      vertex: { module, entryPoint: vs, buffers },
      fragment: { module, entryPoint: fs, targets: [{ format: this.format }] },
      primitive: { topology: 'triangle-list', cullMode: buffers.length ? 'back' : 'none' },
      depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: 'less' },
      multisample: { count: SAMPLES },
    });
    this.agentPipeline = make('vsAgent', 'fsLit', [meshLayout]);
    this.obstaclePipeline = make('vsObstacle', 'fsLit', [meshLayout]);
    this.groundPipeline = make('vsGround', 'fsGround', []);
  }

  /** (Re)create MSAA + depth targets when the canvas size changes. */
  private ensureTargets(width: number, height: number): void {
    if (this.depth && this.depth.width === width && this.depth.height === height) return;
    this.msaa?.destroy();
    this.depth?.destroy();
    const size = { width, height };
    this.msaa = this.device.createTexture({ size, format: this.format, sampleCount: SAMPLES, usage: GPUTextureUsage.RENDER_ATTACHMENT });
    this.depth = this.device.createTexture({ size, format: DEPTH_FORMAT, sampleCount: SAMPLES, usage: GPUTextureUsage.RENDER_ATTACHMENT });
  }

  encode(
    encoder: GPUCommandEncoder, camera: OrbitCamera, current: number, agentCount: number,
    maxSpeed: number, time: number, timestampWrites?: GPURenderPassTimestampWrites,
  ): void {
    const canvas = this.context.canvas as HTMLCanvasElement;
    this.ensureTargets(canvas.width, canvas.height);

    const cam = new Float32Array(28);
    cam.set(camera.viewProj(canvas.width / canvas.height), 0);
    cam.set([...camera.eye(), 1], 16);
    cam.set([...normalize([0.5, 1, 0.35]), 0], 20);
    cam.set([WORLD_HALF, maxSpeed, time, 0], 24);
    this.device.queue.writeBuffer(this.cameraBuffer, 0, cam);

    const pass = encoder.beginRenderPass({
      label: 'scene',
      colorAttachments: [{
        view: this.msaa!.createView(),
        resolveTarget: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0.05, g: 0.067, b: 0.09, a: 1 },
        loadOp: 'clear',
        storeOp: 'discard',
      }],
      depthStencilAttachment: { view: this.depth!.createView(), depthClearValue: 1, depthLoadOp: 'clear', depthStoreOp: 'discard' },
      timestampWrites,
    });
    pass.setBindGroup(0, this.bindGroups[current]!);
    pass.setPipeline(this.groundPipeline);
    pass.draw(6);
    pass.setPipeline(this.obstaclePipeline);
    pass.setVertexBuffer(0, this.cylinder.buffer);
    pass.draw(this.cylinder.count, OBSTACLES.length);
    pass.setPipeline(this.agentPipeline);
    pass.setVertexBuffer(0, this.figure.buffer);
    pass.draw(this.figure.count, Math.min(agentCount, MAX_AGENTS));
    pass.end();
  }
}
