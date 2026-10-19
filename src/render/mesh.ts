/**
 * Procedural low-poly meshes as flat-shaded, non-indexed triangle lists.
 * Vertex layout: position.xyz, normal.xyz (24 bytes).
 */
type Profile = [radius: number, y: number][];

function lathe(profile: Profile, segments: number, out: number[]): void {
  const ring = (r: number, y: number, s: number): [number, number, number] => {
    const a = (s / segments) * Math.PI * 2;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  for (let p = 0; p < profile.length - 1; p++) {
    const [r0, y0] = profile[p]!;
    const [r1, y1] = profile[p + 1]!;
    for (let s = 0; s < segments; s++) {
      const a = ring(r0, y0, s), b = ring(r0, y0, s + 1), c = ring(r1, y1, s + 1), d = ring(r1, y1, s);
      if (r0 > 0) tri(out, a, c, b);
      if (r1 > 0) tri(out, a, d, c);
    }
  }
}

function tri(out: number[], a: number[], b: number[], c: number[]): void {
  const u = [b[0]! - a[0]!, b[1]! - a[1]!, b[2]! - a[2]!];
  const v = [c[0]! - a[0]!, c[1]! - a[1]!, c[2]! - a[2]!];
  let n = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  const l = Math.hypot(n[0]!, n[1]!, n[2]!) || 1;
  n = n.map((x) => x / l);
  for (const p of [a, b, c]) out.push(p[0]!, p[1]!, p[2]!, n[0]!, n[1]!, n[2]!);
}

/** A stylised pedestrian (~1.7 units tall): torso + head, with a small "nose" to show heading (+Z). */
export function figureMesh(): Float32Array<ArrayBuffer> {
  const out: number[] = [];
  lathe([[0, 0.05], [0.2, 0.1], [0.27, 0.55], [0.25, 1.05], [0.12, 1.22], [0, 1.24]], 7, out);
  lathe([[0, 1.26], [0.14, 1.32], [0.19, 1.47], [0.14, 1.62], [0, 1.68]], 6, out);
  // nose wedge pointing forward
  tri(out, [-0.06, 1.5, 0.15], [0.06, 1.5, 0.15], [0, 1.45, 0.28]);
  tri(out, [0.06, 1.5, 0.15], [-0.06, 1.5, 0.15], [0, 1.56, 0.15]);
  tri(out, [0, 1.56, 0.15], [0.06, 1.5, 0.15], [0, 1.45, 0.28]);
  tri(out, [-0.06, 1.5, 0.15], [0, 1.56, 0.15], [0, 1.45, 0.28]);
  return new Float32Array(out);
}

/** Unit cylinder (radius 1, height 1) with a cap, used for obstacles. */
export function cylinderMesh(): Float32Array<ArrayBuffer> {
  const out: number[] = [];
  lathe([[1, 0], [1, 1], [0.92, 1.04], [0, 1.04]], 20, out);
  return new Float32Array(out);
}
