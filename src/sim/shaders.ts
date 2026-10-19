import { GOAL_COUNT, MAX_OBSTACLES } from './params';

/**
 * Crowd simulation compute shaders (WGSL).
 *
 * Per frame we run five passes over a uniform spatial hash grid (counting sort):
 *   1. clearGrid   – zero per-cell counters
 *   2. countAgents – atomically bin each agent; remember (cell, slot-in-cell)
 *   3. scanCells   – single-workgroup exclusive prefix sum → cellStart[]
 *   4. scatter     – write agent indices into sortedIdx[] (cell-contiguous)
 *   5. steer       – 3×3 neighbourhood query + steering + integration (ping-pong)
 * No CPU readback is needed; everything stays resident on the GPU.
 */
export const simShader = /* wgsl */ `
const GOAL_COUNT = ${GOAL_COUNT}u;
const MAX_PER_CELL = 32u; // cap neighbour iterations per cell (keeps worst case bounded)

struct Params {
  count: u32, gridDim: u32, cellSize: f32, worldHalf: f32,
  dt: f32, maxSpeed: f32, radius: f32, obstacleCount: u32,
  wSep: f32, wAli: f32, wCoh: f32, wGoal: f32,
  wObs: f32, time: f32, frame: u32, _pad: u32,
  obstacles: array<vec4f, ${MAX_OBSTACLES}>, // x, z, radius, height
};

@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read> agentsIn: array<vec4f>;          // pos.xz, vel.xz
@group(0) @binding(2) var<storage, read_write> agentsOut: array<vec4f>;
@group(0) @binding(3) var<storage, read_write> agentMeta: array<vec4f>;        // goal.xz, speedScale, goalIndex
@group(0) @binding(4) var<storage, read_write> cellCount: array<atomic<u32>>;
@group(0) @binding(5) var<storage, read_write> cellStart: array<u32>;
@group(0) @binding(6) var<storage, read_write> agentCell: array<vec2u>;   // (cell, slot)
@group(0) @binding(7) var<storage, read_write> sortedIdx: array<u32>;

fn pcg(v: u32) -> u32 {
  let s = v * 747796405u + 2891336453u;
  let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
fn rand01(v: u32) -> f32 { return f32(pcg(v)) / 4294967295.0; }

fn cellCoord(p: vec2f) -> vec2i {
  let g = i32(P.gridDim);
  return clamp(vec2i(floor((p + P.worldHalf) / P.cellSize)), vec2i(0), vec2i(g - 1));
}
fn cellIndex(c: vec2i) -> u32 { return u32(c.y) * P.gridDim + u32(c.x); }

/** Goals sit on a ring; streams of agents cross the obstacle field between them. */
fn goalPos(idx: u32, seed: u32) -> vec2f {
  let a = f32(idx) / f32(GOAL_COUNT) * 6.2831853;
  let jitter = vec2f(rand01(seed) - 0.5, rand01(seed ^ 0x9e3779b9u) - 0.5) * 14.0;
  return vec2f(cos(a), sin(a)) * P.worldHalf * 0.82 + jitter;
}

@compute @workgroup_size(256)
fn clearGrid(@builtin(global_invocation_id) id: vec3u) {
  if (id.x < P.gridDim * P.gridDim) { atomicStore(&cellCount[id.x], 0u); }
}

@compute @workgroup_size(256)
fn countAgents(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= P.count) { return; }
  let c = cellIndex(cellCoord(agentsIn[i].xy));
  let slot = atomicAdd(&cellCount[c], 1u);
  agentCell[i] = vec2u(c, slot);
}

var<workgroup> partial: array<u32, 256>;

/** Exclusive scan of cell counts. 256 threads each own a contiguous chunk of cells. */
@compute @workgroup_size(256)
fn scanCells(@builtin(local_invocation_id) lid: vec3u) {
  let n = P.gridDim * P.gridDim;
  let chunk = (n + 255u) / 256u;
  let begin = min(lid.x * chunk, n);
  let end = min(begin + chunk, n);
  var sum = 0u;
  for (var c = begin; c < end; c++) { sum += atomicLoad(&cellCount[c]); }
  partial[lid.x] = sum;
  workgroupBarrier();
  // Hillis–Steele inclusive scan over the 256 chunk sums.
  for (var o = 1u; o < 256u; o = o * 2u) {
    var v = 0u;
    if (lid.x >= o) { v = partial[lid.x - o]; }
    workgroupBarrier();
    partial[lid.x] += v;
    workgroupBarrier();
  }
  var run = partial[lid.x] - sum;
  for (var c = begin; c < end; c++) {
    cellStart[c] = run;
    run += atomicLoad(&cellCount[c]);
  }
}

@compute @workgroup_size(256)
fn scatter(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= P.count) { return; }
  let ac = agentCell[i];
  sortedIdx[cellStart[ac.x] + ac.y] = i;
}

fn limit(v: vec2f, m: f32) -> vec2f {
  let l = length(v);
  if (l > m) { return v * (m / l); }
  return v;
}

@compute @workgroup_size(256)
fn steer(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= P.count) { return; }
  let a = agentsIn[i];
  let p = a.xy;
  let v = a.zw;
  var m = agentMeta[i];

  // --- neighbourhood query over the 3×3 cells around the agent ---
  let cc = cellCoord(p);
  let g = i32(P.gridDim);
  let r2 = P.radius * P.radius;
  var sep = vec2f(0.0);
  var ali = vec2f(0.0);
  var coh = vec2f(0.0);
  var n = 0.0;
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      let c = cc + vec2i(dx, dy);
      if (any(c < vec2i(0)) || any(c >= vec2i(g))) { continue; }
      let ci = cellIndex(c);
      let start = cellStart[ci];
      let cnt = min(atomicLoad(&cellCount[ci]), MAX_PER_CELL);
      for (var k = 0u; k < cnt; k++) {
        let j = sortedIdx[start + k];
        if (j == i) { continue; }
        let o = agentsIn[j];
        let d = p - o.xy;
        let d2 = dot(d, d);
        if (d2 < r2 && d2 > 1e-6) {
          sep += d / d2;           // inverse-distance repulsion
          ali += o.zw;
          coh += o.xy;
          n += 1.0;
        }
      }
    }
  }

  let speedCap = P.maxSpeed * m.z;
  var force = vec2f(0.0);
  if (n > 0.0) {
    force += P.wSep * sep * P.maxSpeed;
    force += P.wAli * (ali / n - v);
    force += P.wCoh * (coh / n - p);
  }

  // --- goal seeking: arrive, then pick a new goal on the ring ---
  var toGoal = m.xy - p;
  if (length(toGoal) < 5.0) {
    let seed = pcg(i * 9781u + P.frame);
    let next = (u32(m.w) + 1u + pcg(seed) % (GOAL_COUNT - 1u)) % GOAL_COUNT;
    m = vec4f(goalPos(next, seed), m.z, f32(next));
    toGoal = m.xy - p;
  }
  let gl = length(toGoal);
  if (gl > 1e-4) { force += P.wGoal * (toGoal / gl * speedCap - v); }

  // --- obstacle avoidance: radial push inside an influence margin + lookahead ---
  let ahead = p + v * 0.6;
  for (var k = 0u; k < P.obstacleCount; k++) {
    let ob = P.obstacles[k];
    let margin = ob.z + 3.0;
    let d = ahead - ob.xy;
    let dl = length(d);
    if (dl < margin && dl > 1e-4) {
      // Push outward plus a tangential component so agents flow around rather than stall.
      let nrm = d / dl;
      let tang = vec2f(-nrm.y, nrm.x) * sign(dot(vec2f(-nrm.y, nrm.x), v) + 1e-3);
      force += P.wObs * (nrm + tang * 0.6) * ((margin - dl) / 3.0) * P.maxSpeed * 2.0;
    }
  }

  // --- soft world boundary ---
  let edge = P.worldHalf - 4.0;
  force += (clamp(p, vec2f(-edge), vec2f(edge)) - p) * 4.0;

  var nv = limit(v + limit(force, P.maxSpeed * 6.0) * P.dt, speedCap);
  var np = p + nv * P.dt;

  // Hard constraint: never penetrate an obstacle.
  for (var k = 0u; k < P.obstacleCount; k++) {
    let ob = P.obstacles[k];
    let d = np - ob.xy;
    let dl = length(d);
    let minD = ob.z + 0.35;
    if (dl < minD) { np = ob.xy + d / max(dl, 1e-4) * minD; }
  }
  np = clamp(np, vec2f(-P.worldHalf + 0.5), vec2f(P.worldHalf - 0.5));

  agentsOut[i] = vec4f(np, nv);
  agentMeta[i] = m;
}
`;
