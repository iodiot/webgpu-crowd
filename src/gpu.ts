export interface GpuContext {
  device: GPUDevice;
  adapterInfo: string;
  timestamps: boolean;
}

/** Request an adapter/device, enabling timestamp queries when the platform supports them. */
export async function initWebGPU(): Promise<GpuContext> {
  if (!('gpu' in navigator)) throw new Error('navigator.gpu is undefined — this browser does not expose WebGPU.');
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
  if (!adapter) throw new Error('No suitable GPU adapter was found (WebGPU may be disabled or blocklisted).');
  const timestamps = adapter.features.has('timestamp-query');
  const device = await adapter.requestDevice({ requiredFeatures: timestamps ? ['timestamp-query'] : [] });
  const info = adapter.info;
  const adapterInfo = [info?.vendor, info?.architecture || info?.description].filter(Boolean).join(' ') || 'unknown';
  return { device, adapterInfo, timestamps };
}

/** Measures GPU time between the start of the compute pass and the end of the render pass. */
export class GpuTimer {
  private readonly querySet: GPUQuerySet;
  private readonly resolve: GPUBuffer;
  private readonly read: GPUBuffer;
  private pending = false;

  constructor(device: GPUDevice) {
    this.querySet = device.createQuerySet({ type: 'timestamp', count: 2 });
    this.resolve = device.createBuffer({ size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC });
    this.read = device.createBuffer({ size: 16, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST });
  }

  get computeWrites(): GPUComputePassTimestampWrites { return { querySet: this.querySet, beginningOfPassWriteIndex: 0 }; }
  get renderWrites(): GPURenderPassTimestampWrites { return { querySet: this.querySet, endOfPassWriteIndex: 1 }; }

  /** Call after encoding both passes. Skips the copy while a previous readback is in flight. */
  encodeResolve(encoder: GPUCommandEncoder): boolean {
    encoder.resolveQuerySet(this.querySet, 0, 2, this.resolve, 0);
    if (this.pending) return false;
    encoder.copyBufferToBuffer(this.resolve, 0, this.read, 0, 16);
    return true;
  }

  /** Call after submit when encodeResolve returned true. */
  readback(onResult: (ms: number) => void): void {
    this.pending = true;
    this.read.mapAsync(GPUMapMode.READ).then(() => {
      const [t0, t1] = new BigInt64Array(this.read.getMappedRange());
      this.read.unmap();
      this.pending = false;
      if (t0 !== undefined && t1 !== undefined && t1 > t0) onResult(Number(t1 - t0) / 1e6);
    }).catch(() => { this.pending = false; });
  }
}
