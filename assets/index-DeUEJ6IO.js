(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))t(n);new MutationObserver(n=>{for(const r of n)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&t(o)}).observe(document,{childList:!0,subtree:!0});function i(n){const r={};return n.integrity&&(r.integrity=n.integrity),n.referrerPolicy&&(r.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?r.credentials="include":n.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function t(n){if(n.ep)return;n.ep=!0;const r=i(n);fetch(n.href,r)}})();async function N(){if(!("gpu"in navigator))throw new Error("navigator.gpu is undefined — this browser does not expose WebGPU.");const s=await navigator.gpu.requestAdapter({powerPreference:"high-performance"});if(!s)throw new Error("No suitable GPU adapter was found (WebGPU may be disabled or blocklisted).");const e=s.features.has("timestamp-query"),i=await s.requestDevice({requiredFeatures:e?["timestamp-query"]:[]}),t=s.info,n=[t?.vendor,t?.architecture||t?.description].filter(Boolean).join(" ")||"unknown";return{device:i,adapterInfo:n,timestamps:e}}class W{querySet;resolve;read;pending=!1;constructor(e){this.querySet=e.createQuerySet({type:"timestamp",count:2}),this.resolve=e.createBuffer({size:16,usage:GPUBufferUsage.QUERY_RESOLVE|GPUBufferUsage.COPY_SRC}),this.read=e.createBuffer({size:16,usage:GPUBufferUsage.MAP_READ|GPUBufferUsage.COPY_DST})}get computeWrites(){return{querySet:this.querySet,beginningOfPassWriteIndex:0}}get renderWrites(){return{querySet:this.querySet,endOfPassWriteIndex:1}}encodeResolve(e){return e.resolveQuerySet(this.querySet,0,2,this.resolve,0),this.pending?!1:(e.copyBufferToBuffer(this.resolve,0,this.read,0,16),!0)}readback(e){this.pending=!0,this.read.mapAsync(GPUMapMode.READ).then(()=>{const[i,t]=new BigInt64Array(this.read.getMappedRange());this.read.unmap(),this.pending=!1,i!==void 0&&t!==void 0&&t>i&&e(Number(t-i)/1e6)}).catch(()=>{this.pending=!1})}}function X(s,e,i,t){const n=1/Math.tan(s/2),r=1/(i-t);return new Float32Array([n/e,0,0,0,0,n,0,0,0,0,t*r,-1,0,0,t*i*r,0])}const j=(s,e)=>[s[0]-e[0],s[1]-e[1],s[2]-e[2]],V=(s,e)=>[s[1]*e[2]-s[2]*e[1],s[2]*e[0]-s[0]*e[2],s[0]*e[1]-s[1]*e[0]],L=(s,e)=>s[0]*e[0]+s[1]*e[1]+s[2]*e[2],O=s=>{const e=Math.hypot(...s)||1;return[s[0]/e,s[1]/e,s[2]/e]};function q(s,e,i){const t=O(j(s,e)),n=O(V(i,t)),r=V(t,n);return new Float32Array([n[0],r[0],t[0],0,n[1],r[1],t[1],0,n[2],r[2],t[2],0,-L(n,s),-L(r,s),-L(t,s),1])}function J(s,e){const i=new Float32Array(16);for(let t=0;t<4;t++)for(let n=0;n<4;n++){let r=0;for(let o=0;o<4;o++)r+=(s[o*4+n]??0)*(e[t*4+o]??0);i[t*4+n]=r}return i}class K{yaw=.7;pitch=.75;distance=120;target=[0,0,0];constructor(e){let i=null;e.addEventListener("contextmenu",t=>t.preventDefault()),e.addEventListener("pointerdown",t=>{e.setPointerCapture(t.pointerId),i={x:t.clientX,y:t.clientY,pan:t.button===2||t.shiftKey}}),e.addEventListener("pointerup",()=>{i=null}),e.addEventListener("pointermove",t=>{if(!i)return;const n=t.clientX-i.x,r=t.clientY-i.y;if(i.x=t.clientX,i.y=t.clientY,i.pan){const o=this.distance*.0015,l=Math.cos(this.yaw),h=Math.sin(this.yaw);this.target[0]-=(n*l-r*h)*o,this.target[2]-=(-n*h-r*l)*o}else this.yaw-=n*.005,this.pitch=Math.min(1.5,Math.max(.08,this.pitch+r*.005))}),e.addEventListener("wheel",t=>{t.preventDefault(),this.distance=Math.min(400,Math.max(8,this.distance*Math.exp(t.deltaY*.001)))},{passive:!1})}eye(){const e=Math.cos(this.pitch);return[this.target[0]+this.distance*e*Math.sin(this.yaw),this.target[1]+this.distance*Math.sin(this.pitch),this.target[2]+this.distance*e*Math.cos(this.yaw)]}viewProj(e){return J(X(Math.PI/4,e,.5,1500),q(this.eye(),this.target,[0,1,0]))}}const y=1e5,Q=1e3,x=80,D=2,E=Math.ceil(x*2/D),z=8,$=6,Z=()=>({agentCount:1e4,maxSpeed:4,neighborRadius:1.6,separation:1.6,alignment:.6,cohesion:.15,goalSeeking:1,obstacleAvoidance:2,timeScale:1,paused:!1}),S=[[0,0,9,3],[28,18,5,4],[-30,20,6,2.5],[-22,-32,4.5,5],[30,-26,7,3],[0,45,4,6],[0,-50,5,2],[52,0,3.5,4.5]];function G(s,e,i){const t=(n,r,o)=>{const l=o/e*Math.PI*2;return[Math.cos(l)*n,r,Math.sin(l)*n]};for(let n=0;n<s.length-1;n++){const[r,o]=s[n],[l,h]=s[n+1];for(let u=0;u<e;u++){const c=t(r,o,u),p=t(r,o,u+1),g=t(l,h,u+1),w=t(l,h,u);r>0&&C(i,c,g,p),l>0&&C(i,c,w,g)}}}function C(s,e,i,t){const n=[i[0]-e[0],i[1]-e[1],i[2]-e[2]],r=[t[0]-e[0],t[1]-e[1],t[2]-e[2]];let o=[n[1]*r[2]-n[2]*r[1],n[2]*r[0]-n[0]*r[2],n[0]*r[1]-n[1]*r[0]];const l=Math.hypot(o[0],o[1],o[2])||1;o=o.map(h=>h/l);for(const h of[e,i,t])s.push(h[0],h[1],h[2],o[0],o[1],o[2])}function ee(){const s=[];return G([[0,.05],[.2,.1],[.27,.55],[.25,1.05],[.12,1.22],[0,1.24]],7,s),G([[0,1.26],[.14,1.32],[.19,1.47],[.14,1.62],[0,1.68]],6,s),C(s,[-.06,1.5,.15],[.06,1.5,.15],[0,1.45,.28]),C(s,[.06,1.5,.15],[-.06,1.5,.15],[0,1.56,.15]),C(s,[0,1.56,.15],[.06,1.5,.15],[0,1.45,.28]),C(s,[-.06,1.5,.15],[0,1.56,.15],[0,1.45,.28]),new Float32Array(s)}function te(){const s=[];return G([[1,0],[1,1],[.92,1.04],[0,1.04]],20,s),new Float32Array(s)}const ie=`
struct Camera { viewProj: mat4x4f, eye: vec4f, lightDir: vec4f, misc: vec4f /* worldHalf, maxSpeed */ };
struct SimParams {
  count: u32, gridDim: u32, cellSize: f32, worldHalf: f32,
  dt: f32, maxSpeed: f32, radius: f32, obstacleCount: u32,
  w0: vec4f, w1: vec4f,
  obstacles: array<vec4f, ${z}>,
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

const PALETTE = array<vec3f, ${$}>(
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
  let base = PALETTE[u32(m.w) % ${$}u];
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
`,M=4,T="depth24plus";class ne{constructor(e,i,t){this.device=e,this.context=i,this.format=navigator.gpu.getPreferredCanvasFormat(),i.configure({device:e,format:this.format,alphaMode:"opaque"}),this.cameraBuffer=e.createBuffer({size:64+16*3,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});const n=g=>{const w=e.createBuffer({size:g.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});return e.queue.writeBuffer(w,0,g),{buffer:w,count:g.length/6}};this.figure=n(ee()),this.cylinder=n(te());const r=GPUShaderStage.VERTEX,o=e.createBindGroupLayout({label:"render",entries:[{binding:0,visibility:r|GPUShaderStage.FRAGMENT,buffer:{type:"uniform"}},{binding:1,visibility:r,buffer:{type:"read-only-storage"}},{binding:2,visibility:r,buffer:{type:"read-only-storage"}},{binding:3,visibility:r,buffer:{type:"uniform"}}]}),l=g=>e.createBindGroup({layout:o,entries:[this.cameraBuffer,g,t.metaBuffer,t.paramsBuffer].map((w,v)=>({binding:v,resource:{buffer:w}}))});this.bindGroups=[l(t.agentBuffers[0]),l(t.agentBuffers[1])];const h=e.createShaderModule({label:"render",code:ie}),u=e.createPipelineLayout({bindGroupLayouts:[o]}),c={arrayStride:24,attributes:[{shaderLocation:0,offset:0,format:"float32x3"},{shaderLocation:1,offset:12,format:"float32x3"}]},p=(g,w,v)=>e.createRenderPipeline({label:g,layout:u,vertex:{module:h,entryPoint:g,buffers:v},fragment:{module:h,entryPoint:w,targets:[{format:this.format}]},primitive:{topology:"triangle-list",cullMode:v.length?"back":"none"},depthStencil:{format:T,depthWriteEnabled:!0,depthCompare:"less"},multisample:{count:M}});this.agentPipeline=p("vsAgent","fsLit",[c]),this.obstaclePipeline=p("vsObstacle","fsLit",[c]),this.groundPipeline=p("vsGround","fsGround",[])}format;cameraBuffer;bindGroups;agentPipeline;obstaclePipeline;groundPipeline;figure;cylinder;msaa;depth;ensureTargets(e,i){if(this.depth&&this.depth.width===e&&this.depth.height===i)return;this.msaa?.destroy(),this.depth?.destroy();const t={width:e,height:i};this.msaa=this.device.createTexture({size:t,format:this.format,sampleCount:M,usage:GPUTextureUsage.RENDER_ATTACHMENT}),this.depth=this.device.createTexture({size:t,format:T,sampleCount:M,usage:GPUTextureUsage.RENDER_ATTACHMENT})}encode(e,i,t,n,r,o,l){const h=this.context.canvas;this.ensureTargets(h.width,h.height);const u=new Float32Array(28);u.set(i.viewProj(h.width/h.height),0),u.set([...i.eye(),1],16),u.set([...O([.5,1,.35]),0],20),u.set([x,r,o,0],24),this.device.queue.writeBuffer(this.cameraBuffer,0,u);const c=e.beginRenderPass({label:"scene",colorAttachments:[{view:this.msaa.createView(),resolveTarget:this.context.getCurrentTexture().createView(),clearValue:{r:.05,g:.067,b:.09,a:1},loadOp:"clear",storeOp:"discard"}],depthStencilAttachment:{view:this.depth.createView(),depthClearValue:1,depthLoadOp:"clear",depthStoreOp:"discard"},timestampWrites:l});c.setBindGroup(0,this.bindGroups[t]),c.setPipeline(this.groundPipeline),c.draw(6),c.setPipeline(this.obstaclePipeline),c.setVertexBuffer(0,this.cylinder.buffer),c.draw(this.cylinder.count,S.length),c.setPipeline(this.agentPipeline),c.setVertexBuffer(0,this.figure.buffer),c.draw(this.figure.count,Math.min(n,y)),c.end()}}const se=`
const GOAL_COUNT = ${$}u;
const MAX_PER_CELL = 32u; // cap neighbour iterations per cell (keeps worst case bounded)

struct Params {
  count: u32, gridDim: u32, cellSize: f32, worldHalf: f32,
  dt: f32, maxSpeed: f32, radius: f32, obstacleCount: u32,
  wSep: f32, wAli: f32, wCoh: f32, wGoal: f32,
  wObs: f32, time: f32, frame: u32, _pad: u32,
  obstacles: array<vec4f, ${z}>, // x, z, radius, height
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
`,U=256,H=64+z*16;class re{constructor(e){this.device=e;const i=GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST,t=E*E,n=(b,f,d=i)=>e.createBuffer({label:b,size:f,usage:d});this.agentBuffers=[n("agentsA",y*16),n("agentsB",y*16)],this.metaBuffer=n("meta",y*16),this.paramsBuffer=n("simParams",H,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);const r=n("cellCount",t*4),o=n("cellStart",t*4),l=n("agentCell",y*8),h=n("sortedIdx",y*4),u=GPUShaderStage.COMPUTE,c=e.createBindGroupLayout({label:"sim",entries:[{binding:0,visibility:u,buffer:{type:"uniform"}},{binding:1,visibility:u,buffer:{type:"read-only-storage"}},...[2,3,4,5,6,7].map(b=>({binding:b,visibility:u,buffer:{type:"storage"}}))]}),p=(b,f)=>e.createBindGroup({layout:c,entries:[this.paramsBuffer,b,f,this.metaBuffer,r,o,l,h].map((d,a)=>({binding:a,resource:{buffer:d}}))});this.bindGroups=[p(this.agentBuffers[0],this.agentBuffers[1]),p(this.agentBuffers[1],this.agentBuffers[0])];const g=e.createShaderModule({label:"sim",code:se}),w=e.createPipelineLayout({bindGroupLayouts:[c]}),v=b=>e.createComputePipeline({label:b,layout:w,compute:{module:g,entryPoint:b}});this.pipelines={clearGrid:v("clearGrid"),countAgents:v("countAgents"),scanCells:v("scanCells"),scatter:v("scatter"),steer:v("steer")},this.seed()}agentBuffers;metaBuffer;paramsBuffer;current=0;pipelines;bindGroups;paramsData=new ArrayBuffer(H);frame=0;time=0;seed(){const e=new Float32Array(y*4),i=new Float32Array(y*4),t=(n,r)=>n+Math.random()*(r-n);for(let n=0;n<y;n++){let r=0,o=0;do r=t(-x+2,x-2),o=t(-x+2,x-2);while(S.some(([u,c,p])=>Math.hypot(r-u,o-c)<p+.5));e.set([r,o,t(-1,1),t(-1,1)],n*4);const l=Math.floor(Math.random()*$),h=l/$*Math.PI*2;i.set([Math.cos(h)*x*.82+t(-7,7),Math.sin(h)*x*.82+t(-7,7),t(.7,1.15),l],n*4)}this.device.queue.writeBuffer(this.agentBuffers[0],0,e),this.device.queue.writeBuffer(this.agentBuffers[1],0,e),this.device.queue.writeBuffer(this.metaBuffer,0,i),this.current=0}updateParams(e,i){this.time+=i,this.frame++;const t=new Uint32Array(this.paramsData),n=new Float32Array(this.paramsData);t[0]=e.agentCount,t[1]=E,n[2]=D,n[3]=x,n[4]=i,n[5]=e.maxSpeed,n[6]=Math.min(e.neighborRadius,D),t[7]=S.length,n[8]=e.separation,n[9]=e.alignment,n[10]=e.cohesion,n[11]=e.goalSeeking,n[12]=e.obstacleAvoidance,n[13]=this.time,t[14]=this.frame,t[15]=0,S.forEach((r,o)=>n.set(r,16+o*4)),this.device.queue.writeBuffer(this.paramsBuffer,0,this.paramsData)}encode(e,i,t){const n=e.beginComputePass({label:"crowd-sim",timestampWrites:t});n.setBindGroup(0,this.bindGroups[this.current]);const r=Math.ceil(i/U);n.setPipeline(this.pipelines.clearGrid),n.dispatchWorkgroups(Math.ceil(E*E/U)),n.setPipeline(this.pipelines.countAgents),n.dispatchWorkgroups(r),n.setPipeline(this.pipelines.scanCells),n.dispatchWorkgroups(1),n.setPipeline(this.pipelines.scatter),n.dispatchWorkgroups(r),n.setPipeline(this.pipelines.steer),n.dispatchWorkgroups(r),n.end(),this.current=1-this.current}}/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.19.2
 * @author George Michael Brower
 * @license MIT
 */class A{constructor(e,i,t,n,r="div"){this.parent=e,this.object=i,this.property=t,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(r),this.domElement.classList.add("controller"),this.domElement.classList.add(n),this.$name=document.createElement("div"),this.$name.classList.add("name"),A.nextNameID=A.nextNameID||0,this.$name.id=`lil-gui-name-${++A.nextNameID}`,this.$widget=document.createElement("div"),this.$widget.classList.add("widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener("keydown",o=>o.stopPropagation()),this.domElement.addEventListener("keyup",o=>o.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(t)}name(e){return this._name=e,this.$name.textContent=e,this}onChange(e){return this._onChange=e,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(e=!0){return this.disable(!e)}disable(e=!0){return e===this._disabled?this:(this._disabled=e,this.domElement.classList.toggle("disabled",e),this.$disable.toggleAttribute("disabled",e),this)}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(e){const i=this.parent.add(this.object,this.property,e);return i.name(this._name),this.destroy(),i}min(e){return this}max(e){return this}step(e){return this}decimals(e){return this}listen(e=!0){return this._listening=e,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const e=this.save();e!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=e}getValue(){return this.object[this.property]}setValue(e){return this.getValue()!==e&&(this.object[this.property]=e,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(e){return this.setValue(e),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class oe extends A{constructor(e,i,t){super(e,i,t,"boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function F(s){let e,i;return(e=s.match(/(#|0x)?([a-f0-9]{6})/i))?i=e[2]:(e=s.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?i=parseInt(e[1]).toString(16).padStart(2,0)+parseInt(e[2]).toString(16).padStart(2,0)+parseInt(e[3]).toString(16).padStart(2,0):(e=s.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(i=e[1]+e[1]+e[2]+e[2]+e[3]+e[3]),i?"#"+i:!1}const ae={isPrimitive:!0,match:s=>typeof s=="string",fromHexString:F,toHexString:F},P={isPrimitive:!0,match:s=>typeof s=="number",fromHexString:s=>parseInt(s.substring(1),16),toHexString:s=>"#"+s.toString(16).padStart(6,0)},le={isPrimitive:!1,match:s=>Array.isArray(s),fromHexString(s,e,i=1){const t=P.fromHexString(s);e[0]=(t>>16&255)/255*i,e[1]=(t>>8&255)/255*i,e[2]=(t&255)/255*i},toHexString([s,e,i],t=1){t=255/t;const n=s*t<<16^e*t<<8^i*t<<0;return P.toHexString(n)}},ce={isPrimitive:!1,match:s=>Object(s)===s,fromHexString(s,e,i=1){const t=P.fromHexString(s);e.r=(t>>16&255)/255*i,e.g=(t>>8&255)/255*i,e.b=(t&255)/255*i},toHexString({r:s,g:e,b:i},t=1){t=255/t;const n=s*t<<16^e*t<<8^i*t<<0;return P.toHexString(n)}},de=[ae,P,le,ce];function he(s){return de.find(e=>e.match(s))}class ue extends A{constructor(e,i,t,n){super(e,i,t,"color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=he(this.initialValue),this._rgbScale=n,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const r=F(this.$text.value);r&&this._setValueFromHexString(r)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(e){if(this._format.isPrimitive){const i=this._format.fromHexString(e);this.setValue(i)}else this._format.fromHexString(e,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(e){return this._setValueFromHexString(e),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class B extends A{constructor(e,i,t){super(e,i,t,"function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",n=>{n.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class pe extends A{constructor(e,i,t,n,r,o){super(e,i,t,"number"),this._initInput(),this.min(n),this.max(r);const l=o!==void 0;this.step(l?o:this._getImplicitStep(),l),this.updateDisplay()}decimals(e){return this._decimals=e,this.updateDisplay(),this}min(e){return this._min=e,this._onUpdateMinMax(),this}max(e){return this._max=e,this._onUpdateMinMax(),this}step(e,i=!0){return this._step=e,this._stepExplicit=i,this}updateDisplay(){const e=this.getValue();if(this._hasSlider){let i=(e-this._min)/(this._max-this._min);i=Math.max(0,Math.min(i,1)),this.$fill.style.width=i*100+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?e:e.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),window.matchMedia("(pointer: coarse)").matches&&(this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any")),this.$widget.appendChild(this.$input),this.$disable=this.$input;const i=()=>{let a=parseFloat(this.$input.value);isNaN(a)||(this._stepExplicit&&(a=this._snap(a)),this.setValue(this._clamp(a)))},t=a=>{const m=parseFloat(this.$input.value);isNaN(m)||(this._snapClampSetValue(m+a),this.$input.value=this.getValue())},n=a=>{a.key==="Enter"&&this.$input.blur(),a.code==="ArrowUp"&&(a.preventDefault(),t(this._step*this._arrowKeyMultiplier(a))),a.code==="ArrowDown"&&(a.preventDefault(),t(this._step*this._arrowKeyMultiplier(a)*-1))},r=a=>{this._inputFocused&&(a.preventDefault(),t(this._step*this._normalizeMouseWheel(a)))};let o=!1,l,h,u,c,p;const g=5,w=a=>{l=a.clientX,h=u=a.clientY,o=!0,c=this.getValue(),p=0,window.addEventListener("mousemove",v),window.addEventListener("mouseup",b)},v=a=>{if(o){const m=a.clientX-l,_=a.clientY-h;Math.abs(_)>g?(a.preventDefault(),this.$input.blur(),o=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(m)>g&&b()}if(!o){const m=a.clientY-u;p-=m*this._step*this._arrowKeyMultiplier(a),c+p>this._max?p=this._max-c:c+p<this._min&&(p=this._min-c),this._snapClampSetValue(c+p)}u=a.clientY},b=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",v),window.removeEventListener("mouseup",b)},f=()=>{this._inputFocused=!0},d=()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()};this.$input.addEventListener("input",i),this.$input.addEventListener("keydown",n),this.$input.addEventListener("wheel",r,{passive:!1}),this.$input.addEventListener("mousedown",w),this.$input.addEventListener("focus",f),this.$input.addEventListener("blur",d)}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("hasSlider");const e=(d,a,m,_,k)=>(d-a)/(m-a)*(k-_)+_,i=d=>{const a=this.$slider.getBoundingClientRect();let m=e(d,a.left,a.right,this._min,this._max);this._snapClampSetValue(m)},t=d=>{this._setDraggingStyle(!0),i(d.clientX),window.addEventListener("mousemove",n),window.addEventListener("mouseup",r)},n=d=>{i(d.clientX)},r=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",r)};let o=!1,l,h;const u=d=>{d.preventDefault(),this._setDraggingStyle(!0),i(d.touches[0].clientX),o=!1},c=d=>{d.touches.length>1||(this._hasScrollBar?(l=d.touches[0].clientX,h=d.touches[0].clientY,o=!0):u(d),window.addEventListener("touchmove",p,{passive:!1}),window.addEventListener("touchend",g))},p=d=>{if(o){const a=d.touches[0].clientX-l,m=d.touches[0].clientY-h;Math.abs(a)>Math.abs(m)?u(d):(window.removeEventListener("touchmove",p),window.removeEventListener("touchend",g))}else d.preventDefault(),i(d.touches[0].clientX)},g=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",p),window.removeEventListener("touchend",g)},w=this._callOnFinishChange.bind(this),v=400;let b;const f=d=>{if(Math.abs(d.deltaX)<Math.abs(d.deltaY)&&this._hasScrollBar)return;d.preventDefault();const m=this._normalizeMouseWheel(d)*this._step;this._snapClampSetValue(this.getValue()+m),this.$input.value=this.getValue(),clearTimeout(b),b=setTimeout(w,v)};this.$slider.addEventListener("mousedown",t),this.$slider.addEventListener("touchstart",c,{passive:!1}),this.$slider.addEventListener("wheel",f,{passive:!1})}_setDraggingStyle(e,i="horizontal"){this.$slider&&this.$slider.classList.toggle("active",e),document.body.classList.toggle("lil-gui-dragging",e),document.body.classList.toggle(`lil-gui-${i}`,e)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(e){let{deltaX:i,deltaY:t}=e;return Math.floor(e.deltaY)!==e.deltaY&&e.wheelDelta&&(i=0,t=-e.wheelDelta/120,t*=this._stepExplicit?1:10),i+-t}_arrowKeyMultiplier(e){let i=this._stepExplicit?1:10;return e.shiftKey?i*=10:e.altKey&&(i/=10),i}_snap(e){const i=Math.round(e/this._step)*this._step;return parseFloat(i.toPrecision(15))}_clamp(e){return e<this._min&&(e=this._min),e>this._max&&(e=this._max),e}_snapClampSetValue(e){this.setValue(this._clamp(this._snap(e)))}get _hasScrollBar(){const e=this.parent.root.$children;return e.scrollHeight>e.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class ge extends A{constructor(e,i,t,n){super(e,i,t,"option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(n)}options(e){return this._values=Array.isArray(e)?e:Object.values(e),this._names=Array.isArray(e)?e:Object.keys(e),this.$select.replaceChildren(),this._names.forEach(i=>{const t=document.createElement("option");t.textContent=i,this.$select.appendChild(t)}),this.updateDisplay(),this}updateDisplay(){const e=this.getValue(),i=this._values.indexOf(e);return this.$select.selectedIndex=i,this.$display.textContent=i===-1?e:this._names[i],this}}class fe extends A{constructor(e,i,t){super(e,i,t,"string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("spellcheck","false"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",n=>{n.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}const me=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.root > .title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.root > .children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.root > .children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.root > .children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.allow-touch-styles, .lil-gui.allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.force-touch-styles, .lil-gui.force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-gui .controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-gui .controller.disabled {
  opacity: 0.5;
}
.lil-gui .controller.disabled, .lil-gui .controller.disabled * {
  pointer-events: none !important;
}
.lil-gui .controller > .name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-gui .controller .widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-gui .controller.string input {
  color: var(--string-color);
}
.lil-gui .controller.boolean {
  cursor: pointer;
}
.lil-gui .controller.color .display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-gui .controller.color .display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-gui .controller.color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-gui .controller.color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-gui .controller.option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-gui .controller.option .display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-gui .controller.option .display.focus {
    background: var(--focus-color);
  }
}
.lil-gui .controller.option .display.active {
  background: var(--focus-color);
}
.lil-gui .controller.option .display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-gui .controller.option .widget,
.lil-gui .controller.option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-gui .controller.option .widget:hover .display {
    background: var(--hover-color);
  }
}
.lil-gui .controller.number input {
  color: var(--number-color);
}
.lil-gui .controller.number.hasSlider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-gui .controller.number .slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-gui .controller.number .slider:hover {
    background: var(--hover-color);
  }
}
.lil-gui .controller.number .slider.active {
  background: var(--focus-color);
}
.lil-gui .controller.number .slider.active .fill {
  opacity: 0.95;
}
.lil-gui .controller.number .fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-gui-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-gui-dragging * {
  cursor: ew-resize !important;
}

.lil-gui-dragging.lil-gui-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .title {
  height: var(--title-height);
  line-height: calc(var(--title-height) - 4px);
  font-weight: 600;
  padding: 0 var(--padding);
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  outline: none;
  text-decoration-skip: objects;
}
.lil-gui .title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-gui-dragging) .lil-gui .title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.root > .title:focus {
  text-decoration: none !important;
}
.lil-gui.closed > .title:before {
  content: "▸";
}
.lil-gui.closed > .children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.closed:not(.transition) > .children {
  display: none;
}
.lil-gui.transition > .children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.root > .children > .lil-gui > .title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.root > .children > .lil-gui.closed > .title {
  border-bottom-color: transparent;
}
.lil-gui + .controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  border: none;
}
@media (hover: hover) {
  .lil-gui button:hover {
    background: var(--hover-color);
  }
  .lil-gui button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==") format("woff");
}`;function ve(s){const e=document.createElement("style");e.innerHTML=s;const i=document.querySelector("head link[rel=stylesheet], head style");i?document.head.insertBefore(e,i):document.head.appendChild(e)}let R=!1;class I{constructor({parent:e,autoPlace:i=e===void 0,container:t,width:n,title:r="Controls",closeFolders:o=!1,injectStyles:l=!0,touchStyles:h=!0}={}){if(this.parent=e,this.root=e?e.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("div"),this.$title.classList.add("title"),this.$title.setAttribute("role","button"),this.$title.setAttribute("aria-expanded",!0),this.$title.setAttribute("tabindex",0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("keydown",u=>{(u.code==="Enter"||u.code==="Space")&&(u.preventDefault(),this.$title.click())}),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(r),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add("root"),h&&this.domElement.classList.add("allow-touch-styles"),!R&&l&&(ve(me),R=!0),t?t.appendChild(this.domElement):i&&(this.domElement.classList.add("autoPlace"),document.body.appendChild(this.domElement)),n&&this.domElement.style.setProperty("--width",n+"px"),this._closeFolders=o}add(e,i,t,n,r){if(Object(t)===t)return new ge(this,e,i,t);const o=e[i];switch(typeof o){case"number":return new pe(this,e,i,t,n,r);case"boolean":return new oe(this,e,i);case"string":return new fe(this,e,i);case"function":return new B(this,e,i)}console.error(`gui.add failed
	property:`,i,`
	object:`,e,`
	value:`,o)}addColor(e,i,t=1){return new ue(this,e,i,t)}addFolder(e){const i=new I({parent:this,title:e});return this.root._closeFolders&&i.close(),i}load(e,i=!0){return e.controllers&&this.controllers.forEach(t=>{t instanceof B||t._name in e.controllers&&t.load(e.controllers[t._name])}),i&&e.folders&&this.folders.forEach(t=>{t._title in e.folders&&t.load(e.folders[t._title])}),this}save(e=!0){const i={controllers:{},folders:{}};return this.controllers.forEach(t=>{if(!(t instanceof B)){if(t._name in i.controllers)throw new Error(`Cannot save GUI with duplicate property "${t._name}"`);i.controllers[t._name]=t.save()}}),e&&this.folders.forEach(t=>{if(t._title in i.folders)throw new Error(`Cannot save GUI with duplicate folder "${t._title}"`);i.folders[t._title]=t.save()}),i}open(e=!0){return this._setClosed(!e),this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("closed",this._closed),this}close(){return this.open(!1)}_setClosed(e){this._closed!==e&&(this._closed=e,this._callOnOpenClose(this))}show(e=!0){return this._hidden=!e,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(e=!0){return this._setClosed(!e),this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const i=this.$children.clientHeight;this.$children.style.height=i+"px",this.domElement.classList.add("transition");const t=r=>{r.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("transition"),this.$children.removeEventListener("transitionend",t))};this.$children.addEventListener("transitionend",t);const n=e?this.$children.scrollHeight:0;this.domElement.classList.toggle("closed",!e),requestAnimationFrame(()=>{this.$children.style.height=n+"px"})}),this}title(e){return this._title=e,this.$title.textContent=e,this}reset(e=!0){return(e?this.controllersRecursive():this.controllers).forEach(t=>t.reset()),this}onChange(e){return this._onChange=e,this}_callOnChange(e){this.parent&&this.parent._callOnChange(e),this._onChange!==void 0&&this._onChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onFinishChange(e){return this._onFinishChange=e,this}_callOnFinishChange(e){this.parent&&this.parent._callOnFinishChange(e),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:e.object,property:e.property,value:e.getValue(),controller:e})}onOpenClose(e){return this._onOpenClose=e,this}_callOnOpenClose(e){this.parent&&this.parent._callOnOpenClose(e),this._onOpenClose!==void 0&&this._onOpenClose.call(this,e)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(e=>e.destroy())}controllersRecursive(){let e=Array.from(this.controllers);return this.folders.forEach(i=>{e=e.concat(i.controllersRecursive())}),e}foldersRecursive(){let e=Array.from(this.folders);return this.folders.forEach(i=>{e=e.concat(i.foldersRecursive())}),e}}function be(s,e){const i=new I({title:"Crowd"});i.add(s,"agentCount",Q,y,1e3).name("agents"),i.add(s,"paused").name("pause (space)"),i.add(s,"timeScale",0,3,.05).name("time scale"),i.add(e,"reset").name("re-seed agents");const t=i.addFolder("Behaviour weights");t.add(s,"separation",0,5,.05),t.add(s,"alignment",0,3,.05),t.add(s,"cohesion",0,1,.01),t.add(s,"goalSeeking",0,3,.05).name("goal seeking"),t.add(s,"obstacleAvoidance",0,5,.05).name("obstacle avoid");const n=i.addFolder("Motion");return n.add(s,"maxSpeed",.5,12,.1).name("max speed"),n.add(s,"neighborRadius",.5,2,.05).name("neighbour radius"),i}class we{constructor(e,i,t){this.el=e,this.adapterInfo=i,this.gpuTiming=t}frames=0;acc=0;lastUpdate=performance.now();gpuMs=null;frame(e,i,t){this.frames++,this.acc+=e;const n=performance.now();if(n-this.lastUpdate<250)return;const r=this.acc/this.frames;this.frames=0,this.acc=0,this.lastUpdate=n;const o=this.gpuTiming?this.gpuMs===null?"…":`${this.gpuMs.toFixed(2)} ms`:"n/a (no timestamp-query)";this.el.innerHTML=`<b>WebGPU Crowd</b>${t?"  [paused]":""}
FPS        ${(1e3/r).toFixed(0)}
frame      ${r.toFixed(2)} ms
GPU        ${o}
agents     ${i.toLocaleString("en-US")}
adapter    ${this.adapterInfo}`}}function Y(s){document.getElementById("fallback").style.display="flex",document.getElementById("fallback-reason").textContent=s,document.getElementById("stats").style.display="none",document.getElementById("hint").style.display="none"}async function ye(){const s=document.getElementById("gpu"),{device:e,adapterInfo:i,timestamps:t}=await N();e.addEventListener("uncapturederror",f=>console.error("WebGPU error:",f.error.message)),e.lost.then(f=>{f.reason!=="destroyed"&&Y(`GPU device lost: ${f.message}`)});const n=s.getContext("webgpu");if(!n)throw new Error("Could not create a WebGPU canvas context.");const r=Z(),o=Number(new URLSearchParams(location.search).get("agents"));o&&(r.agentCount=Math.min(1e5,Math.max(1e3,Math.round(o))));const l=new re(e),h=new ne(e,n,l),u=new K(s),c=t?new W(e):null,p=new we(document.getElementById("stats"),i,t);be(r,{reset:()=>l.seed()}),window.addEventListener("keydown",f=>{f.code==="Space"&&(r.paused=!r.paused,f.preventDefault())});const g=()=>{const f=Math.min(window.devicePixelRatio,2);s.width=Math.max(1,Math.floor(s.clientWidth*f)),s.height=Math.max(1,Math.floor(s.clientHeight*f))};window.addEventListener("resize",g),g();let w=performance.now(),v=0;const b=f=>{const d=f-w;w=f;const a=r.paused?0:Math.min(d/1e3,1/30)*r.timeScale;v+=a;const m=e.createCommandEncoder();l.updateParams(r,a),r.paused||l.encode(m,r.agentCount,c?.computeWrites),h.encode(m,u,l.current,r.agentCount,r.maxSpeed,v,r.paused?void 0:c?.renderWrites);const _=c&&!r.paused?c.encodeResolve(m):!1;e.queue.submit([m.finish()]),_&&c.readback(k=>{p.gpuMs=k}),p.frame(d,r.agentCount,r.paused),requestAnimationFrame(b)};requestAnimationFrame(b)}ye().catch(s=>{console.error(s),Y(s instanceof Error?s.message:String(s))});
