import { GOAL_COUNT, MAX_OBSTACLES } from '../sim/params';

/** Rendering shaders: instanced agents, instanced obstacles and a procedural ground grid. */
export const renderShader = /* wgsl */ `
struct Camera { viewProj: mat4x4f, eye: vec4f, lightDir: vec4f, misc: vec4f /* worldHalf, maxSpeed */ };
struct SimParams {
  count: u32, gridDim: u32, cellSize: f32, worldHalf: f32,
  dt: f32, maxSpeed: f32, radius: f32, obstacleCount: u32,
  w0: vec4f, w1: vec4f,
  obstacles: array<vec4f, ${MAX_OBSTACLES}>,
};

@group(0) @binding(0) var<uniform> cam: Camera;
@group(0) @binding(1) var<storage, read> agents: array<vec4f>;
@group(0) @binding(2) var<storage, read> agentMeta: array<vec4f>;
@group(0) @binding(3) var<uniform> sim: SimParams;

struct VIn { @location(0) pos: vec3f, @location(1) nrm: vec3f };
struct VOut {
  @builtin(position) clip: vec4f,
  @location(0) nrm: vec3f,
  @location(1) color: vec3f,
  @location(2) world: vec3f,
};

const PALETTE = array<vec3f, ${GOAL_COUNT}>(
  vec3f(0.98, 0.45, 0.35), vec3f(0.99, 0.76, 0.30), vec3f(0.45, 0.85, 0.45),
  vec3f(0.30, 0.78, 0.95), vec3f(0.55, 0.50, 0.98), vec3f(0.95, 0.45, 0.80),
);

@vertex
fn vsAgent(v: VIn, @builtin(instance_index) ii: u32) -> VOut {
  let a = agents[ii];
  let m = agentMeta[ii];
  let speed = length(a.zw);
  var fwd = vec2f(0.0, 1.0);
  if (speed > 1e-3) { fwd = a.zw / speed; }
  let F = vec3f(fwd.x, 0.0, fwd.y);
  let R = vec3f(fwd.y, 0.0, -fwd.x);
  // Lean forward slightly with speed, and bob a little, for a sense of walking.
  let lean = speed / max(cam.misc.y, 0.01) * 0.12;
  let bob = abs(sin(cam.misc.z * 9.0 + f32(ii) * 1.7)) * 0.05 * min(speed, 1.0);
  let local = v.pos + vec3f(0.0, bob, v.pos.y * lean);
  let world = vec3f(a.x, 0.0, a.y) + R * local.x + vec3f(0.0, local.y, 0.0) + F * local.z;
  var o: VOut;
  o.clip = cam.viewProj * vec4f(world, 1.0);
  o.nrm = R * v.nrm.x + vec3f(0.0, v.nrm.y, 0.0) + F * v.nrm.z;
  let base = PALETTE[u32(m.w) % ${GOAL_COUNT}u];
  o.color = mix(base * 0.55, base, clamp(speed / cam.misc.y, 0.0, 1.0));
  o.world = world;
  return o;
}

@vertex
fn vsObstacle(v: VIn, @builtin(instance_index) ii: u32) -> VOut {
  let ob = sim.obstacles[ii];
  let world = vec3f(ob.x + v.pos.x * ob.z, v.pos.y * ob.w, ob.y + v.pos.z * ob.z);
  var o: VOut;
  o.clip = cam.viewProj * vec4f(world, 1.0);
  o.nrm = normalize(vec3f(v.nrm.x / ob.z, v.nrm.y / ob.w, v.nrm.z / ob.z));
  o.color = vec3f(0.42, 0.46, 0.55);
  o.world = world;
  return o;
}

fn shade(n: vec3f, albedo: vec3f, world: vec3f) -> vec3f {
  let N = normalize(n);
  let L = normalize(cam.lightDir.xyz);
  let diffuse = max(dot(N, L), 0.0);
  let hemi = mix(vec3f(0.10, 0.09, 0.08), vec3f(0.28, 0.33, 0.42), N.y * 0.5 + 0.5);
  let V = normalize(cam.eye.xyz - world);
  let rim = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.25;
  var c = albedo * (hemi + diffuse * vec3f(1.0, 0.95, 0.85)) + rim;
  // distance fog towards the clear colour
  let fog = clamp((length(cam.eye.xyz - world) - 80.0) / 320.0, 0.0, 1.0);
  return mix(c, vec3f(0.05, 0.067, 0.09), fog);
}

@fragment
fn fsLit(i: VOut) -> @location(0) vec4f { return vec4f(shade(i.nrm, i.color, i.world), 1.0); }

// ---------- ground ----------
struct GOut { @builtin(position) clip: vec4f, @location(0) world: vec3f };

@vertex
fn vsGround(@builtin(vertex_index) vi: u32) -> GOut {
  let corners = array<vec2f, 6>(vec2f(-1, -1), vec2f(1, -1), vec2f(1, 1), vec2f(-1, -1), vec2f(1, 1), vec2f(-1, 1));
  let p = corners[vi] * cam.misc.x * 1.6;
  var o: GOut;
  o.world = vec3f(p.x, 0.0, p.y);
  o.clip = cam.viewProj * vec4f(o.world, 1.0);
  return o;
}

@fragment
fn fsGround(i: GOut) -> @location(0) vec4f {
  let p = i.world.xz;
  let inside = all(abs(p) < vec2f(cam.misc.x));
  // anti-aliased grid lines every 2 units (one sim cell) with a stronger line every 20
  let g1 = abs(fract(p / 2.0 - 0.5) - 0.5) / fwidth(p / 2.0);
  let g2 = abs(fract(p / 20.0 - 0.5) - 0.5) / fwidth(p / 20.0);
  let line1 = 1.0 - min(min(g1.x, g1.y), 1.0);
  let line2 = 1.0 - min(min(g2.x, g2.y), 1.0);
  var c = select(vec3f(0.07, 0.08, 0.10), vec3f(0.13, 0.145, 0.17), inside);
  c += vec3f(0.035) * line1 * f32(inside) + vec3f(0.08, 0.10, 0.13) * line2;
  // ring where the goals live
  let ring = abs(length(p) - cam.misc.x * 0.82);
  c += vec3f(0.10, 0.18, 0.28) * (1.0 - smoothstep(0.0, 1.2, ring));
  let fog = clamp((length(cam.eye.xyz - i.world) - 80.0) / 320.0, 0.0, 1.0);
  return vec4f(mix(c, vec3f(0.05, 0.067, 0.09), fog), 1.0);
}
`;
