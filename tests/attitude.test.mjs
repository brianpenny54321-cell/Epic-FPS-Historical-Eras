import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sandbox = {
  document: { querySelector() { return null; }, getElementById() { return null; } },
  navigator: { getGamepads() { return []; } },
  performance: { now: () => 0 },
  requestAnimationFrame() {},
  devicePixelRatio: 1,
  innerWidth: 1280,
  innerHeight: 720,
  addEventListener() {},
  console
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('src/main.js', 'utf8'), sandbox, { filename: 'src/main.js' });
const { basis, integrateAttitude, stepFlight, createSim } = sandbox.__tbMath;

function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }

test('A banks left and the bank turns the nose left', () => {
  let q = [0, 0, 0, 1];
  let yaw0 = basis(q).yaw;
  for (let i = 0; i < 30; i++) q = integrateAttitude(q, 1, 0, 0, 170, 1 / 60);
  const left = basis(q);
  assert.ok(left.roll > 0.25, 'A should bank left, roll=' + left.roll);
  for (let i = 0; i < 50; i++) q = integrateAttitude(q, 1, 0, 0, 170, 1 / 60);
  const yaw = wrap(basis(q).yaw - yaw0);
  assert.ok(yaw > 0.05, 'left bank should yaw left, dyaw=' + yaw);
});

test('D banks right', () => {
  let q = [0, 0, 0, 1];
  for (let i = 0; i < 30; i++) q = integrateAttitude(q, -1, 0, 0, 170, 1 / 60);
  assert.ok(basis(q).roll < -0.25, 'roll=' + basis(q).roll);
});

test('W pulls the nose up', () => {
  let q = [0, 0, 0, 1];
  for (let i = 0; i < 40; i++) q = integrateAttitude(q, 0, 1, 0, 170, 1 / 60);
  assert.ok(basis(q).pitch > 0.2, 'pitch=' + basis(q).pitch);
});

test('neutral cruise holds altitude and airspeed', () => {
  const sim = createSim();
  const y0 = sim.pos[1];
  const cmd = { roll: 0, pitch: 0, yaw: 0, boost: 0, throttleUp: false, throttleDown: false };
  for (let i = 0; i < 60 * 8; i++) stepFlight(sim, cmd, 1 / 60);
  assert.ok(Number.isFinite(sim.pos[1]), 'alt nan');
  assert.ok(Math.abs(sim.pos[1] - y0) < 40, 'alt drifted ' + sim.pos[1]);
  const sp = Math.hypot(...sim.vel);
  assert.ok(sp > 120 && sp < 230, 'speed ' + sp);
  assert.equal(sim.alive, true);
});

test('pull-up climbs', () => {
  const sim = createSim();
  const y0 = sim.pos[1];
  const cmd = { roll: 0, pitch: 1, yaw: 0, boost: 0, throttleUp: false, throttleDown: false };
  for (let i = 0; i < 60 * 3; i++) stepFlight(sim, cmd, 1 / 60);
  assert.ok(sim.pos[1] > y0 + 30, 'alt ' + sim.pos[1]);
});
