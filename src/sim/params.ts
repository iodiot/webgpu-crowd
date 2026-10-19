/** Tunable simulation parameters shared by the UI, the simulation and the renderer. */
export interface SimParams {
  agentCount: number;
  maxSpeed: number;
  neighborRadius: number;
  separation: number;
  alignment: number;
  cohesion: number;
  goalSeeking: number;
  obstacleAvoidance: number;
  timeScale: number;
  paused: boolean;
}

export const MAX_AGENTS = 100_000;
export const MIN_AGENTS = 1_000;

/** World is a square [-WORLD_HALF, WORLD_HALF]² on the XZ plane. */
export const WORLD_HALF = 80;
/** Cell size must be >= neighbour radius so a 3×3 cell lookup is sufficient. */
export const CELL_SIZE = 2;
export const GRID_DIM = Math.ceil((WORLD_HALF * 2) / CELL_SIZE); // 80 → 6 400 cells
export const MAX_OBSTACLES = 8;
export const GOAL_COUNT = 6;

export const defaultParams = (): SimParams => ({
  agentCount: 10_000,
  maxSpeed: 4,
  neighborRadius: 1.6,
  separation: 1.6,
  alignment: 0.6,
  cohesion: 0.15,
  goalSeeking: 1.0,
  obstacleAvoidance: 2.0,
  timeScale: 1,
  paused: false,
});

/** Static obstacles: (x, z, radius, height). */
export const OBSTACLES: [number, number, number, number][] = [
  [0, 0, 9, 3],
  [28, 18, 5, 4],
  [-30, 20, 6, 2.5],
  [-22, -32, 4.5, 5],
  [30, -26, 7, 3],
  [0, 45, 4, 6],
  [0, -50, 5, 2],
  [52, 0, 3.5, 4.5],
];
