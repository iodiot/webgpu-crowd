/** Rolling-average stats panel (FPS, CPU frame time, GPU time from timestamp queries). */
export class Stats {
  private frames = 0;
  private acc = 0;
  private lastUpdate = performance.now();
  gpuMs: number | null = null;

  constructor(private readonly el: HTMLElement, private readonly adapterInfo: string, private readonly gpuTiming: boolean) {}

  frame(dtMs: number, agents: number, paused: boolean): void {
    this.frames++;
    this.acc += dtMs;
    const now = performance.now();
    if (now - this.lastUpdate < 250) return;
    const avg = this.acc / this.frames;
    this.frames = 0;
    this.acc = 0;
    this.lastUpdate = now;
    const gpu = this.gpuTiming
      ? (this.gpuMs === null ? '…' : `${this.gpuMs.toFixed(2)} ms`)
      : 'n/a (no timestamp-query)';
    this.el.innerHTML =
      `<b>WebGPU Crowd</b>${paused ? '  [paused]' : ''}\n` +
      `FPS        ${(1000 / avg).toFixed(0)}\n` +
      `frame      ${avg.toFixed(2)} ms\n` +
      `GPU        ${gpu}\n` +
      `agents     ${agents.toLocaleString('en-US')}\n` +
      `adapter    ${this.adapterInfo}`;
  }
}
