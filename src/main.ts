import { GpuTimer, initWebGPU } from './gpu';
import { OrbitCamera } from './render/camera';
import { Renderer } from './render/Renderer';
import { CrowdSim } from './sim/CrowdSim';
import { defaultParams } from './sim/params';
import { createGui } from './ui/gui';
import { Stats } from './ui/stats';

function showFallback(reason: string): void {
  document.getElementById('fallback')!.style.display = 'flex';
  document.getElementById('fallback-reason')!.textContent = reason;
  document.getElementById('stats')!.style.display = 'none';
  document.getElementById('hint')!.style.display = 'none';
}

async function main(): Promise<void> {
  const canvas = document.getElementById('gpu') as HTMLCanvasElement;
  const { device, adapterInfo, timestamps } = await initWebGPU();
  device.addEventListener('uncapturederror', (e) => console.error('WebGPU error:', (e as GPUUncapturedErrorEvent).error.message));
  device.lost.then((info) => { if (info.reason !== 'destroyed') showFallback(`GPU device lost: ${info.message}`); });

  const context = canvas.getContext('webgpu');
  if (!context) throw new Error('Could not create a WebGPU canvas context.');

  // Allow overriding the agent count via ?agents=50000 (handy for benchmarks / screenshots).
  const params = defaultParams();
  const q = Number(new URLSearchParams(location.search).get('agents'));
  if (q) params.agentCount = Math.min(100_000, Math.max(1_000, Math.round(q)));

  const sim = new CrowdSim(device);
  const renderer = new Renderer(device, context, sim);
  const camera = new OrbitCamera(canvas);
  const timer = timestamps ? new GpuTimer(device) : null;
  const stats = new Stats(document.getElementById('stats')!, adapterInfo, timestamps);
  createGui(params, { reset: () => sim.seed() });
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') { params.paused = !params.paused; e.preventDefault(); } });

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  };
  window.addEventListener('resize', resize);
  resize();

  let last = performance.now();
  let simTime = 0;
  const frame = (now: number) => {
    const dtMs = now - last;
    last = now;
    // Clamp dt so a backgrounded tab doesn't explode the integration.
    const dt = params.paused ? 0 : Math.min(dtMs / 1000, 1 / 30) * params.timeScale;
    simTime += dt;

    const encoder = device.createCommandEncoder();
    sim.updateParams(params, dt);
    if (!params.paused) sim.encode(encoder, params.agentCount, timer?.computeWrites);
    renderer.encode(encoder, camera, sim.current, params.agentCount, params.maxSpeed, simTime,
      params.paused ? undefined : timer?.renderWrites);
    const doRead = timer && !params.paused ? timer.encodeResolve(encoder) : false;
    device.queue.submit([encoder.finish()]);
    if (doRead) timer!.readback((ms) => { stats.gpuMs = ms; });

    stats.frame(dtMs, params.agentCount, params.paused);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

main().catch((err: unknown) => {
  console.error(err);
  showFallback(err instanceof Error ? err.message : String(err));
});
