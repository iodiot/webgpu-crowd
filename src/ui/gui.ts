import GUI from 'lil-gui';
import { MAX_AGENTS, MIN_AGENTS, type SimParams } from '../sim/params';

/** lil-gui control panel bound directly to the live SimParams object. */
export function createGui(params: SimParams, actions: { reset: () => void }): GUI {
  const gui = new GUI({ title: 'Crowd' });
  gui.add(params, 'agentCount', MIN_AGENTS, MAX_AGENTS, 1000).name('agents');
  gui.add(params, 'paused').name('pause (space)');
  gui.add(params, 'timeScale', 0, 3, 0.05).name('time scale');
  gui.add(actions, 'reset').name('re-seed agents');
  const b = gui.addFolder('Behaviour weights');
  b.add(params, 'separation', 0, 5, 0.05);
  b.add(params, 'alignment', 0, 3, 0.05);
  b.add(params, 'cohesion', 0, 1, 0.01);
  b.add(params, 'goalSeeking', 0, 3, 0.05).name('goal seeking');
  b.add(params, 'obstacleAvoidance', 0, 5, 0.05).name('obstacle avoid');
  const m = gui.addFolder('Motion');
  m.add(params, 'maxSpeed', 0.5, 12, 0.1).name('max speed');
  m.add(params, 'neighborRadius', 0.5, 2, 0.05).name('neighbour radius');
  return gui;
}
