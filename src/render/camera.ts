import { lookAt, multiply, perspective, type Mat4, type Vec3 } from './math';

/** Spherical orbit camera driven by pointer drag (orbit), right/shift-drag (pan) and wheel (zoom). */
export class OrbitCamera {
  yaw = 0.7;
  pitch = 0.75;
  distance = 120;
  target: Vec3 = [0, 0, 0];

  constructor(canvas: HTMLCanvasElement) {
    let last: { x: number; y: number; pan: boolean } | null = null;
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('pointerdown', (e) => {
      canvas.setPointerCapture(e.pointerId);
      last = { x: e.clientX, y: e.clientY, pan: e.button === 2 || e.shiftKey };
    });
    canvas.addEventListener('pointerup', () => { last = null; });
    canvas.addEventListener('pointermove', (e) => {
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last.x = e.clientX;
      last.y = e.clientY;
      if (last.pan) {
        const s = this.distance * 0.0015;
        const cy = Math.cos(this.yaw);
        const sy = Math.sin(this.yaw);
        this.target[0] -= (dx * cy - dy * sy) * s;
        this.target[2] -= (-dx * sy - dy * cy) * s;
      } else {
        this.yaw -= dx * 0.005;
        this.pitch = Math.min(1.5, Math.max(0.08, this.pitch + dy * 0.005));
      }
    });
    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.distance = Math.min(400, Math.max(8, this.distance * Math.exp(e.deltaY * 0.001)));
    }, { passive: false });
  }

  eye(): Vec3 {
    const cp = Math.cos(this.pitch);
    return [
      this.target[0] + this.distance * cp * Math.sin(this.yaw),
      this.target[1] + this.distance * Math.sin(this.pitch),
      this.target[2] + this.distance * cp * Math.cos(this.yaw),
    ];
  }

  viewProj(aspect: number): Mat4 {
    return multiply(perspective(Math.PI / 4, aspect, 0.5, 1500), lookAt(this.eye(), this.target, [0, 1, 0]));
  }
}
