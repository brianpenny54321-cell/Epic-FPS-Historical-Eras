'use strict';
/* Operation Tidebreaker — original TB-10 strike jet.
   Planform study of an A-10C THUNDERBOLT II (procedural mesh, not a copied model).
   Theater: GULF THEATER, Kharg island. */
const AIRFRAME = 'A-10C THUNDERBOLT II';
const THEATER = 'GULF THEATER';
const ISLAND_NAME = 'Kharg island';
const JETS = {
  a10: { id: 'a10', name: 'A-10C THUNDERBOLT II', role: 'jet', roll: 1.7, pitch: 0.82, yaw: 0.72, thrust: 1, burner: 1.4, drag: 1.05, vmax: 355, cruise: 162, hp: 140, ammo: 780, missiles: 4, lock: 0.1, cone: 0.52 },
  f22: { id: 'f22', name: 'F-22 RAPTOR', role: 'jet', roll: 3.15, pitch: 1.38, yaw: 1.05, thrust: 1.22, burner: 2.25, drag: 0.76, vmax: 530, cruise: 214, hp: 76, ammo: 260, missiles: 6, lock: 0.05, cone: 0.68 },
  f35: { id: 'f35', name: 'F-35 LIGHTNING II', role: 'jet', roll: 2.45, pitch: 1.12, yaw: 0.92, thrust: 1.12, burner: 1.9, drag: 0.84, vmax: 460, cruise: 198, hp: 94, ammo: 340, missiles: 6, lock: 0.055, cone: 0.62 },
  b2: { id: 'b2', name: 'B-2 SPIRIT', role: 'jet', roll: 0.78, pitch: 0.5, yaw: 0.38, thrust: 0.92, burner: 1.2, drag: 0.68, vmax: 275, cruise: 178, hp: 170, ammo: 0, missiles: 12, lock: 0.08, cone: 0.42 },
  apache: { id: 'apache', name: 'AH-64 APACHE', role: 'helo', roll: 1.1, pitch: 0.7, yaw: 1.2, thrust: 1, burner: 1, drag: 1, vmax: 70, cruise: 28, hp: 110, ammo: 420, missiles: 8, lock: 0.09, cone: 0.55 },
  mh6: { id: 'mh6', name: 'MH-6 LITTLE BIRD', role: 'helo', roll: 1.6, pitch: 0.9, yaw: 1.55, thrust: 1.1, burner: 1, drag: 0.8, vmax: 84, cruise: 36, hp: 64, ammo: 220, missiles: 4, lock: 0.07, cone: 0.6 },
  ac130: { id: 'ac130', name: 'AC-130 SUPER HERCULES', role: 'gunship', roll: 0.6, pitch: 0.4, yaw: 0.3, thrust: 1, burner: 1, drag: 1, vmax: 160, cruise: 120, hp: 160, ammo: 1100, missiles: 0, lock: 0.04, cone: 0.9 }
};
JETS.strike = JETS.a10;
JETS.lance = JETS.f35;
JETS.dart = JETS.f22;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const hypot3 = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => { const n = hypot3(a) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };

function qmul(a, b) {
  const ax = a[0], ay = a[1], az = a[2], aw = a[3];
  const bx = b[0], by = b[1], bz = b[2], bw = b[3];
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz
  ];
}
function qaxis(x, y, z, ang) {
  const h = ang * 0.5, s = Math.sin(h), n = Math.hypot(x, y, z) || 1;
  return [x / n * s, y / n * s, z / n * s, Math.cos(h)];
}
function qnorm(q) {
  const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
}
function qrot(q, v) {
  const qx = q[0], qy = q[1], qz = q[2], qw = q[3];
  const tx = 2 * (qy * v[2] - qz * v[1]);
  const ty = 2 * (qz * v[0] - qx * v[2]);
  const tz = 2 * (qx * v[1] - qy * v[0]);
  return [
    v[0] + qw * tx + (qy * tz - qz * ty),
    v[1] + qw * ty + (qz * tx - qx * tz),
    v[2] + qw * tz + (qx * ty - qy * tx)
  ];
}
function basis(q) {
  const r = qrot(q, [1, 0, 0]);
  const u = qrot(q, [0, 1, 0]);
  const f = qrot(q, [0, 0, -1]);
  const pitch = Math.asin(clamp(f[1], -1, 1));
  const roll = Math.atan2(r[1], u[1]);
  const yaw = Math.atan2(-f[0], -f[2]);
  return { r, u, f, pitch, roll, yaw };
}
function quatFromBasis(x, y, z) {
  const m00 = x[0], m01 = y[0], m02 = z[0];
  const m10 = x[1], m11 = y[1], m12 = z[1];
  const m20 = x[2], m21 = y[2], m22 = z[2];
  const tr = m00 + m11 + m22;
  let q;
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, 0.25 * s];
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = [0.25 * s, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = [(m01 + m10) / s, 0.25 * s, (m12 + m21) / s, (m02 - m20) / s];
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = [(m02 + m20) / s, (m12 + m21) / s, 0.25 * s, (m10 - m01) / s];
  }
  return qnorm(q);
}
function quatAim(fwd) {
  const f = norm(fwd);
  let right = cross(f, [0, 1, 0]);
  if (hypot3(right) < 1e-4) right = [1, 0, 0];
  right = norm(right);
  const up = norm(cross(right, f));
  return quatFromBasis(right, up, mul(f, -1));
}
function integrateAttitude(q, rollCmd, pitchCmd, yawCmd, vmag, dt, rates) {
  const R = rates || { roll: 2.05, pitch: 0.95, yaw: 0.72 };
  const sp = clamp((vmag - 50) / 120, 0.55, 1.2);
  q = qnorm(qmul(q, qaxis(0, 0, 1, rollCmd * R.roll * sp * dt)));
  q = qnorm(qmul(q, qaxis(1, 0, 0, pitchCmd * R.pitch * sp * dt)));
  q = qnorm(qmul(q, qaxis(0, 1, 0, yawCmd * R.yaw * dt)));
  const roll = basis(q).roll;
  const coord = 1.65 * 9.81 * Math.tan(clamp(roll, -1.05, 1.05)) / Math.max(80, vmag);
  q = qnorm(qmul(qaxis(0, 1, 0, coord * dt), q));
  if (vmag < 78) q = qnorm(qmul(q, qaxis(1, 0, 0, -(78 - vmag) * 0.012 * dt)));
  return q;
}
function groundY(x, z) {
  const dx = x / 1550, dz = (z - 60) / 1280;
  const e = dx * dx * 0.92 + dz * dz;
  let h = 0;
  if (e < 1.08) {
    const ridge = Math.sin(x * 0.0042) * Math.cos(z * 0.0033) * 8 + Math.sin(x * 0.013 + 1.7) * Math.cos(z * 0.009) * 2.6;
    h = Math.pow(Math.max(0, 1 - Math.min(e, 1)), 0.48) * (14 + ridge);
    const hx = (x - 480) / 260, hz = (z + 40) / 200;
    if (hx * hx + hz * hz < 1 && x > 260) h *= Math.max(0, hx * hx + hz * hz);
  }
  if (Math.abs(x) < 96 && z < 530 && z > -290) {
    if (Math.abs(x) < 26 && z < 490 && z > -240) return 12;
    return 11.15;
  }
  return Math.max(0, h);
}
function createSim() {
  return {
    q: [0, 0, 0, 1],
    pos: [0, 128, 390],
    vel: [0, 0, -166],
    throttle: 0.62,
    boost: 0,
    brake: 0,
    abFuel: 1,
    hp: 100,
    ammo: 420,
    missiles: 4,
    alive: true,
    gunCd: 0,
    misCd: 0
  };
}
function buildHelo(dst) {
  const skin = [0.32, 0.36, 0.28], dark = [0.12, 0.13, 0.11], glass = [0.25, 0.48, 0.52];
  addBox(dst, 0, 0.2, -0.2, 1.8, 1.55, 4.4, skin);
  addBox(dst, 0, 0.35, -2.2, 1.4, 1.3, 1.5, glass);
  addBox(dst, 0, 0.15, 3.6, 0.42, 0.42, 4.4, dark);
  addBox(dst, 0, 0.85, 5.5, 0.18, 1.35, 0.7, skin);
  addBox(dst, 1.05, -0.35, 0.2, 0.28, 1.15, 0.28, dark);
  addBox(dst, -1.05, -0.35, 0.2, 0.28, 1.15, 0.28, dark);
  addBox(dst, 0, 1.2, -0.2, 11, 0.08, 0.28, [0.15, 0.15, 0.14]);
  addBox(dst, 0, 1.2, -0.2, 0.28, 0.08, 11, [0.15, 0.15, 0.14]);
}
function buildGunship(dst) {
  const skin = [0.42, 0.46, 0.43], dark = [0.16, 0.18, 0.16];
  addBox(dst, 0, 0.5, 0, 2.8, 2.9, 18, skin);
  addBox(dst, 0, 1.35, 1.5, 24, 0.32, 3.4, dark);
  addBox(dst, -7, 0.55, 1.4, 1.2, 1.15, 2.6, [0.1, 0.1, 0.1]);
  addBox(dst, 7, 0.55, 1.4, 1.2, 1.15, 2.6, [0.1, 0.1, 0.1]);
  addBox(dst, 0, 3.4, -6, 0.28, 4.4, 2.4, skin);
  addBox(dst, 0, 1.4, 8, 8.5, 0.18, 2.6, dark);
  addBox(dst, -1.45, 0.15, -2, 0.45, 0.45, 3.2, [0.08, 0.08, 0.08]);
}
function buildSub(dst) {
  const skin = [0.16, 0.2, 0.22];
  addBox(dst, 0, 0, 0, 2.5, 2.3, 20, skin);
  addBox(dst, 0, 1.55, 0.6, 1.35, 1.5, 3.4, [0.1, 0.12, 0.14]);
  addBox(dst, 0, 2.45, 0.8, 0.16, 1.3, 0.16, [0.35, 0.35, 0.32]);
  addBox(dst, 0, 0.15, 9, 0.35, 1.7, 2.4, skin);
}
function buildPerson(dst) {
  addBox(dst, 0, 1.05, 0, 0.7, 1.05, 0.4, [1, 1, 1]);
  addBox(dst, 0, 1.9, 0, 0.42, 0.42, 0.42, [1, 1, 1]);
  addBox(dst, -0.22, 0.45, 0, 0.22, 0.85, 0.22, [1, 1, 1]);
  addBox(dst, 0.22, 0.45, 0, 0.22, 0.85, 0.22, [1, 1, 1]);
}
function buildWing(dst) {
  const skin = [0.09, 0.1, 0.11];
  addBox(dst, 0, 0, 0.4, 26, 0.32, 7.2, skin);
  addBox(dst, 0, 0.2, -1.4, 5.2, 0.85, 4.2, [0.14, 0.15, 0.16]);
  addBox(dst, -5.2, -0.2, 1.6, 1.3, 0.55, 2.1, [0.04, 0.04, 0.05]);
  addBox(dst, 5.2, -0.2, 1.6, 1.3, 0.55, 2.1, [0.04, 0.04, 0.05]);
  addBox(dst, 0, 0.05, 2.6, 9, 0.16, 1.5, skin);
}

const MISSIONS = [
  { id: 'light', no: '01', name: 'FIRST LIGHT', mode: 'jet', objective: 'SINK THE RAIDERS AND THE FUEL FARM', art: '', brief: 'First light over Kharg island. Pick an airframe, then sink both raiders and the fuel farm. The TB-10 is an A-10C Thunderbolt II planform study: straight wing, twin tails, nose cannon.', lines: [], hint: 'W PULL · S NOSE DOWN · A BANK LEFT · D BANK RIGHT · SPACE BURNER · SHIFT BRAKE · F GUN · R FOX-2 · T NEXT', spawn: [0, 128, 390], vel: [0, 0, -166], wep: 'CANNON', fox: 'FOX-2', ammo: 0, missiles: 0 },
  { id: 'angel', no: '02', name: 'ANGEL LIFT', mode: 'helo', objective: 'RECOVER THE DOWNED PILOT', art: './assets/cine-angel.jpg', brief: 'A fighter is down on the north beach. Fly the TB-6 lifter, set down with F, then walk the pilot back to the landing zone. A yaws left.', lines: ['A fighter is down on the north beach.', 'TB-6 lifter. Space climbs. Shift descends. A yaws left.', 'Set down, press F, and walk the pilot back to the zone.'], hint: 'W FORWARD · S BACK · A YAW LEFT · D YAW RIGHT · SPACE UP · SHIFT DOWN · F GUN · R DISMOUNT / HOIST', spawn: [240, 72, 280], vel: [0, 0, -22], lz: [240, 0, 230], wep: 'DOOR GUN', fox: 'HOIST', ammo: 360, missiles: 0 },
  { id: 'strait', no: '03', name: 'IRON GATE', mode: 'jet', objective: 'STOP THE STRAIT RAID', art: './assets/cine-strait.jpg', brief: 'Hold the strait. Incoming cruise missiles and a raid jet are running on the carrier. Splash the vampires. The deck guns are already up.', lines: ['The strait is open and the carrier is in the lane.', 'Cruise missiles are inbound. Splash them.', 'Deck guns are firing. You are the intercept.'], hint: 'W PULL · A BANK LEFT · D BANK RIGHT · F GUN · R FOX-2 · T NEXT · KEEP THE CARRIER ALIVE', spawn: [-40, 160, 200], vel: [0, 0, -180], integrity: 3, wep: 'CANNON', fox: 'FOX-2', ammo: 700, missiles: 6 },
  { id: 'skimmer', no: '04', name: 'SKIMMER', mode: 'jet', objective: 'SINK THE FAST CRAFT', art: './assets/cine-skimmer.jpg', brief: 'Six fast craft are cutting across the gulf. Get low, lead the guns, and do not chase one boat off the map.', lines: ['Six fast craft, white wakes, no formation.', 'Get low. Lead them with the cannon.', 'Missiles are for the ones that break wide.'], hint: 'A BANK LEFT · D BANK RIGHT · F GUN · R FOX-2 · STAY LOW OVER THE WATER', spawn: [0, 90, 480], vel: [0, 0, -170], wep: 'CANNON', fox: 'FOX-2', ammo: 640, missiles: 6 },
  { id: 'keel', no: '05', name: 'BLACK KEEL', mode: 'sub', objective: 'TORPEDO THE RAIDER CAPITAL', art: './assets/cine-keel.jpg', brief: 'Periscope depth. The raider capital and two escorts are north of the island. A turns left. W rises. R launches a torpedo once you have lock.', lines: ['Periscope depth, north of Kharg.', 'One capital ship, two escorts.', 'A turns left. W rises toward the scope. R is the torpedo.'], hint: 'A TURN LEFT · D TURN RIGHT · W RISE · S DIVE · R TORPEDO · T NEXT', spawn: [0, 3, 360], vel: [0, 0, -20], wep: 'SCOPE', fox: 'TORPEDO', ammo: 40, missiles: 6 },
  { id: 'specter', no: '06', name: 'HARBOR LIGHT', mode: 'gunship', objective: 'STOP THE HARBOR SWEEP', art: './assets/cine-specter.jpg', brief: 'Orbit the harbor. Regime security — a fictional IRGC-pattern battalion in this sortie — is moving on civilians. The side cannon is yours. A slews the aim left.', lines: ['Night orbit over the harbor.', 'Regime security is pushing the docks. Civilians are still there.', 'Hold the orbit. A slews aim left. F is the side cannon.'], hint: 'A AIM LEFT · D AIM RIGHT · W / S AIM LONG / SHORT · F SIDE CANNON', spawn: [720, 260, -180], vel: [-150, 0, 0], orbit: [0, 0, -40], wep: 'SIDE GUN', fox: '—', ammo: 900, missiles: 0 }
];

function targetsFor(id) {
  if (id === 'angel') return [
    { name: 'DOWNED PILOT', kind: 'pilot', primary: true, hp: 40, pos: [240, 0, -30], r: 5 },
    { name: 'BEACH PATROL', kind: 'troop', primary: false, hp: 18, pos: [270, 0, 90], r: 5, speed: 7, goal: [240, 0, -30] },
    { name: 'BEACH PATROL 2', kind: 'troop', primary: false, hp: 18, pos: [190, 0, 30], r: 5, speed: 8, goal: [240, 0, -30] }
  ];
  if (id === 'strait') return [
    { name: 'CARRIER', kind: 'friend', primary: false, hp: 800, pos: [-180, 4, 640], yaw: 0.15, r: 70 },
    { name: 'VAMPIRE 1', kind: 'vampire', primary: true, hp: 24, pos: [420, 48, -980], r: 9, speed: 100, goal: [-180, 18, 640] },
    { name: 'VAMPIRE 2', kind: 'vampire', primary: true, hp: 24, pos: [-620, 60, -1200], r: 9, speed: 108, goal: [-180, 18, 640] },
    { name: 'VAMPIRE 3', kind: 'vampire', primary: true, hp: 24, pos: [40, 36, -1400], r: 9, speed: 96, goal: [-180, 18, 640] },
    { name: 'RAID JET', kind: 'bandit', primary: true, hp: 36, pos: [80, 190, -360], r: 11, speed: 155, t: 0.3, orbit: [-80, 190, -480], rad: 340, cool: 0.7, q: [0, 0, 0, 1] },
    { name: 'SKIMMER', kind: 'boat', primary: true, hp: 32, pos: [1500, 1.2, 200], yaw: 2.4, r: 16, speed: 34, t: 0.4 }
  ];
  if (id === 'skimmer') {
    const boats = [];
    for (let i = 0; i < 6; i++) boats.push({ name: 'FAST CRAFT ' + (i + 1), kind: 'boat', primary: true, hp: 28, pos: [-1700 + i * 520, 1.2, -980 - (i % 2) * 280], yaw: 0.6 + i * 0.35, r: 15, speed: 32 + i * 2, t: i * 0.6 });
    return boats;
  }
  if (id === 'keel') return [
    { name: 'RAIDER CAPITAL', kind: 'ship', primary: true, hp: 190, max: 190, pos: [80, 4, -1500], yaw: 0.2, r: 68 },
    { name: 'ESCORT EAST', kind: 'ship', primary: true, hp: 80, pos: [420, 4, -1280], yaw: 0.35, r: 40 },
    { name: 'ESCORT WEST', kind: 'ship', primary: true, hp: 80, pos: [-280, 4, -1320], yaw: -0.15, r: 40 }
  ];
  if (id === 'specter') return [
    { name: 'CIVIL DOCKS', kind: 'civil', primary: false, hp: 48, pos: [30, 0, -20], r: 14 },
    { name: 'CIVIL PIER', kind: 'civil', primary: false, hp: 48, pos: [-70, 0, 90], r: 14 },
    { name: 'SECURITY EAST', kind: 'troop', primary: true, hp: 20, pos: [260, 0, -240], r: 6, speed: 12, goal: [30, 0, -20] },
    { name: 'SECURITY NORTH', kind: 'troop', primary: true, hp: 20, pos: [40, 0, -280], r: 6, speed: 11, goal: [30, 0, -20] },
    { name: 'SECURITY WEST', kind: 'troop', primary: true, hp: 20, pos: [-250, 0, -80], r: 6, speed: 12, goal: [-70, 0, 90] },
    { name: 'SECURITY ROAD', kind: 'troop', primary: true, hp: 20, pos: [200, 0, 180], r: 6, speed: 13, goal: [-70, 0, 90] },
    { name: 'TECHNICAL', kind: 'boat', primary: true, hp: 40, pos: [1480, 1.2, 360], yaw: 2.2, r: 16, speed: 22, t: 0.2 }
  ];
  return createTargets();
}
function stampTarget(t) {
  const gy = groundY(t.pos[0], t.pos[2]);
  if (t.kind === 'boat' || t.kind === 'ship' || t.kind === 'friend') t.pos[1] = t.kind === 'boat' ? 1.25 : 4;
  else if (t.kind === 'vampire') t.pos[1] = t.pos[1] || 40;
  else if (gy > 0.35 && (t.kind === 'depot' || t.kind === 'sam' || t.kind === 'troop' || t.kind === 'pilot' || t.kind === 'civil')) t.pos[1] = gy + (t.kind === 'depot' ? 0 : 1);
  t.max = t.max || t.hp;
  t.q = t.q || [0, 0, 0, 1];
  t.cool = t.cool || 0;
  return t;
}
function stepHelo(sim, cmd, dt) {
  if (!sim.alive) return;
  sim.q = qnorm(qmul(sim.q, qaxis(0, 1, 0, cmd.roll * 1.2 * dt)));
  sim.q = qnorm(qmul(sim.q, qaxis(1, 0, 0, cmd.pitch * 0.5 * dt)));
  const b0 = basis(sim.q);
  sim.q = qnorm(qmul(sim.q, qaxis(0, 0, 1, -b0.roll * 2.1 * dt)));
  const b = basis(sim.q);
  const climb = (cmd.boost ? 1 : 0) - (cmd.brake ? 1 : 0);
  let acc = mul(b.f, 14 + sim.throttle * 12);
  acc = add(acc, [0, climb * 24 - 3.4, 0]);
  acc = add(acc, mul(sim.vel, -0.9));
  sim.vel = add(sim.vel, mul(acc, dt));
  const ns = hypot3(sim.vel);
  if (ns > 64) sim.vel = mul(sim.vel, 64 / ns);
  sim.pos = add(sim.pos, mul(sim.vel, dt));
  const gy = groundY(sim.pos[0], sim.pos[2]);
  const floor = gy < 0.4 ? 2.4 : gy + 2.4;
  if (sim.pos[1] < floor) {
    if (sim.vel[1] < -16) sim.hp = Math.max(0, sim.hp - 18);
    sim.pos[1] = floor;
    sim.vel[1] = Math.max(0, sim.vel[1]);
    if (sim.hp <= 0) sim.alive = false;
  }
  if (sim.pos[1] > 380) sim.pos[1] = 380;
  sim.boost = climb > 0 ? 1 : 0;
  sim.brake = climb < 0 ? 1 : 0;
}
function stepSub(sim, cmd, dt) {
  if (!sim.alive) return;
  sim.q = qnorm(qmul(qaxis(0, 1, 0, cmd.roll * 0.72 * dt), sim.q));
  const b = basis(sim.q);
  const spd = 16 + sim.throttle * 14;
  const targetY = cmd.pitch > 0.15 ? 6.5 : cmd.pitch < -0.15 ? -3.5 : sim.pos[1];
  sim.vel = mul(b.f, spd);
  sim.vel[1] = (targetY - sim.pos[1]) * 0.7;
  sim.pos = add(sim.pos, mul(sim.vel, dt));
  sim.pos[1] = clamp(sim.pos[1], -6, 8);
  sim.boost = 0;
  sim.brake = sim.pos[1] < 1 ? 1 : 0;
}
function stepGunship(sim, cmd, dt) {
  if (!sim.alive) return;
  const c = sim.orbitCenter || [0, 0, -40];
  sim.orbitT = (sim.orbitT || 0) + dt * 0.2;
  const rad = 740;
  sim.pos = [c[0] + Math.cos(sim.orbitT) * rad, 250, c[2] + Math.sin(sim.orbitT) * rad];
  const fwd = [-Math.sin(sim.orbitT), -0.02, Math.cos(sim.orbitT)];
  sim.q = quatAim(norm(fwd));
  sim.vel = mul(norm(fwd), 148);
  sim.aimX = clamp((sim.aimX || 0) - cmd.roll * dt * 0.9, -1, 1);
  sim.aimY = clamp((sim.aimY || 0) + cmd.pitch * dt * 0.75, -0.85, 0.85);
  sim.boost = 0;
  sim.brake = 0;
}
function stepFoot(sim, cmd, dt) {
  if (!sim.alive) return;
  const b = basis(sim.q);
  const fn = norm([b.f[0], 0, b.f[2]]);
  const rn = norm([b.r[0], 0, b.r[2]]);
  sim.vel = add(mul(fn, cmd.pitch * 8.5), mul(rn, -cmd.roll * 8.5));
  sim.pos = add(sim.pos, mul(sim.vel, dt));
  const gy = groundY(sim.pos[0], sim.pos[2]);
  sim.pos[1] = (gy < 0.3 ? 1.6 : gy + 1.7);
  sim.boost = 0;
  sim.brake = 0;
}
function stepFlight(sim, cmd, dt) {
  if (!sim.alive) return;
  if (sim.mode === 'helo') return stepHelo(sim, cmd, dt);
  if (sim.mode === 'sub') return stepSub(sim, cmd, dt);
  if (sim.mode === 'gunship') return stepGunship(sim, cmd, dt);
  if (sim.mode === 'foot') return stepFoot(sim, cmd, dt);
  if (cmd.throttleUp) sim.throttle = Math.min(1, sim.throttle + dt * 0.72);
  if (cmd.throttleDown) sim.throttle = Math.max(0.18, sim.throttle - dt * 0.72);
  sim.brake = cmd.brake ? 1 : 0;
  if (sim.abFuel == null) sim.abFuel = 1;
  if (sim.abSpool == null) sim.abSpool = 0;
  if (cmd.boost && sim.abFuel > 0.02 && !sim.brake) {
    sim.abSpool = Math.min(1, sim.abSpool + dt * 5.5);
    sim.abFuel = Math.max(0, sim.abFuel - dt * 0.13 * Math.max(0.35, sim.abSpool));
  } else {
    sim.abSpool = Math.max(0, sim.abSpool - dt * 3.2);
    sim.abFuel = Math.min(1, sim.abFuel + dt * (sim.brake ? 0.04 : 0.16));
  }
  const spool = sim.abSpool;
  sim.boost = spool > 0.28 ? 1 : 0;
  const spec = sim.spec;
  const rates = spec ? { roll: spec.roll, pitch: spec.pitch, yaw: spec.yaw } : null;
  const vmag0 = Math.max(1, hypot3(sim.vel));
  sim.q = integrateAttitude(sim.q, cmd.roll, cmd.pitch, cmd.yaw, vmag0, dt, rates);
  const b = basis(sim.q);
  const f = b.f, up = b.u;
  const vmag = Math.max(1, hypot3(sim.vel));
  const vdir = mul(sim.vel, 1 / vmag);
  const aoa = Math.atan2(-dot(vdir, up), Math.max(0.25, dot(vdir, f)));
  const spF = clamp(vmag / 165, 0, 1.5);
  const cl = clamp(1 + aoa * 3.4, -1.15, 1.85);
  const liftAccel = cl * spF * 9.8;
  let acc = [0, -9.8, 0];
  acc = add(acc, mul(up, liftAccel));
  const thrustK = spec ? spec.thrust : 1;
  const burnK = spec ? spec.burner : 1;
  const dragK = spec ? spec.drag : 1;
  const thrust = (16 + sim.throttle * 38) * thrustK + spool * 92 * burnK;
  let drag = (4.1 + vmag * vmag * 0.00132 + Math.abs(aoa) * 8) * dragK;
  if (sim.brake) drag += 54 + vmag * 0.42;
  acc = add(acc, mul(f, thrust));
  acc = add(acc, mul(vdir, -drag));
  acc = add(acc, mul(sub(mul(f, vmag), sim.vel), sim.brake ? 0.7 : 1.55));
  sim.vel = add(sim.vel, mul(acc, dt));
  let ns = hypot3(sim.vel);
  const cap = spool > 0.2 ? ((spec && spec.vmax) || 360) : 305;
  if (ns > cap) sim.vel = mul(sim.vel, cap / ns);
  if (ns < 48 && sim.alive) sim.vel = mul(f, 48);
  sim.pos = add(sim.pos, mul(sim.vel, dt));
  const gy = groundY(sim.pos[0], sim.pos[2]);
  const floor = gy < 0.4 ? 2.2 : gy + 3.4;
  if (sim.pos[1] < floor) {
    const drop = -sim.vel[1];
    sim.pos[1] = floor;
    if (gy < 0.4 || drop > 22) {
      sim.hp = 0;
      sim.alive = false;
      sim.vel = [0, 0, 0];
    } else {
      sim.vel[1] = Math.max(0, sim.vel[1]);
      sim.hp = Math.max(0, sim.hp - drop * 0.4);
      if (sim.hp <= 0) sim.alive = false;
    }
  }
  if (sim.pos[1] > 2400) sim.pos[1] = 2400;
}

function mm(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}
function persp(fovy, aspect, n, z) {
  const q = 1 / Math.tan(fovy / 2), d = 1 / (n - z);
  return new Float32Array([q / aspect, 0, 0, 0, 0, q, 0, 0, 0, 0, (z + n) * d, -1, 0, 0, 2 * z * n * d, 0]);
}
function lookAt(eye, target, up) {
  let z = norm(sub(eye, target));
  let x = cross(up, z);
  if (hypot3(x) < 1e-4) x = cross(Math.abs(z[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0], z);
  x = norm(x);
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1
  ]);
}
function matQuat(q, p, s) {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const x2 = x + x, y2 = y + y, z2 = z + z;
  const xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2;
  const wx = w * x2, wy = w * y2, wz = w * z2;
  return new Float32Array([
    (1 - (yy + zz)) * s, (xy + wz) * s, (xz - wy) * s, 0,
    (xy - wz) * s, (1 - (xx + zz)) * s, (yz + wx) * s, 0,
    (xz + wy) * s, (yz - wx) * s, (1 - (xx + yy)) * s, 0,
    p[0], p[1], p[2], 1
  ]);
}
const IDENT = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

function pushTri(dst, a, b, c, n, col) {
  dst.push(a[0], a[1], a[2], n[0], n[1], n[2], col[0], col[1], col[2]);
  dst.push(b[0], b[1], b[2], n[0], n[1], n[2], col[0], col[1], col[2]);
  dst.push(c[0], c[1], c[2], n[0], n[1], n[2], col[0], col[1], col[2]);
}
function addBox(dst, cx, cy, cz, sx, sy, sz, col, yaw) {
  yaw = yaw || 0;
  const hx = sx * 0.5, hy = sy * 0.5, hz = sz * 0.5;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const R = (x, y, z) => [cx + x * c + z * s, cy + y, cz - x * s + z * c];
  const Rn = (n) => [n[0] * c + n[2] * s, n[1], -n[0] * s + n[2] * c];
  const faces = [
    [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz], [0, 0, 1]],
    [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz], [0, 0, -1]],
    [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz], [1, 0, 0]],
    [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz], [-1, 0, 0]],
    [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz], [0, 1, 0]],
    [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz], [0, -1, 0]]
  ];
  for (let i = 0; i < faces.length; i++) {
    const fch = faces[i];
    const n = Rn(fch[4]);
    const p0 = R(fch[0][0], fch[0][1], fch[0][2]);
    const p1 = R(fch[1][0], fch[1][1], fch[1][2]);
    const p2 = R(fch[2][0], fch[2][1], fch[2][2]);
    const p3 = R(fch[3][0], fch[3][1], fch[3][2]);
    pushTri(dst, p0, p1, p2, n, col);
    pushTri(dst, p0, p2, p3, n, col);
  }
}
function buildAirframe(dst) {
  const olive = [0.34, 0.38, 0.26];
  const dark = [0.2, 0.23, 0.17];
  const metal = [0.55, 0.57, 0.5];
  const glass = [0.12, 0.3, 0.36];
  const gun = [0.08, 0.08, 0.08];
  const exhaust = [0.1, 0.08, 0.07];
  addBox(dst, 0, 0.02, -7.55, 1.05, 1.15, 2.2, olive);
  addBox(dst, 0, 0.08, -5.35, 1.4, 1.5, 2.3, olive);
  addBox(dst, 0, 0.12, -1.15, 1.72, 1.72, 6.4, olive);
  addBox(dst, 0, 0.16, 3.15, 1.4, 1.48, 3.2, dark);
  addBox(dst, 0, 0.28, 5.45, 0.95, 1.05, 2.1, dark);
  addBox(dst, -0.32, -0.78, -8.55, 0.38, 0.32, 3.6, gun);
  addBox(dst, -0.32, -0.55, -6.55, 0.72, 0.48, 1.15, gun);
  addBox(dst, 0, 1.12, -3.7, 0.82, 0.46, 2.15, glass);
  addBox(dst, 0, 0.92, -5.05, 0.5, 0.26, 0.7, glass);
  addBox(dst, 0, 0.05, -0.35, 6.4, 0.34, 3.7, olive);
  addBox(dst, -6.15, -0.18, -0.2, 6.5, 0.26, 3.2, [0.3, 0.34, 0.24]);
  addBox(dst, 6.15, -0.18, -0.2, 6.5, 0.26, 3.2, [0.3, 0.34, 0.24]);
  addBox(dst, -9.15, -0.22, -0.15, 0.42, 0.85, 1.45, metal);
  addBox(dst, 9.15, -0.22, -0.15, 0.42, 0.85, 1.45, metal);
  addBox(dst, -1.18, 1.18, 2.55, 1.35, 1.12, 4.7, metal);
  addBox(dst, 1.18, 1.18, 2.55, 1.35, 1.12, 4.7, metal);
  addBox(dst, -1.18, 1.18, 5.05, 1.05, 1.02, 0.5, exhaust);
  addBox(dst, 1.18, 1.18, 5.05, 1.05, 1.02, 0.5, exhaust);
  addBox(dst, -1.28, 2.45, 4.55, 0.16, 2.55, 1.85, olive);
  addBox(dst, 1.28, 2.45, 4.55, 0.16, 2.55, 1.85, olive);
  addBox(dst, 0, 1.62, 5.35, 5.6, 0.14, 1.4, dark);
  const stores = [-7.4, -4.4, 4.4, 7.4];
  for (let i = 0; i < stores.length; i++) {
    const x = stores[i];
    addBox(dst, x, -0.55, -0.15, 0.18, 0.55, 0.7, dark);
    addBox(dst, x, -1.05, -0.35, 0.28, 0.28, 2.7, i % 2 ? metal : [0.62, 0.28, 0.14]);
  }
  addBox(dst, 0, 0.7, -7.15, 0.16, 0.18, 1.1, [0.75, 0.5, 0.12]);
  addBox(dst, 0, 0.98, -0.8, 1.5, 0.05, 5.2, [0.26, 0.29, 0.2]);
  addBox(dst, -3.4, 0.18, -0.25, 2.4, 0.07, 2.5, [0.24, 0.27, 0.19]);
  addBox(dst, 3.4, 0.18, -0.25, 2.4, 0.07, 2.5, [0.24, 0.27, 0.19]);
  addBox(dst, 0, -0.7, -1.2, 0.9, 0.16, 4.2, dark);
}
function buildLance(dst) {
  const skin = [0.62, 0.66, 0.7];
  const dark = [0.18, 0.2, 0.24];
  const glass = [0.2, 0.45, 0.55];
  const metal = [0.75, 0.78, 0.8];
  addBox(dst, 0, 0.05, -6.4, 0.7, 0.7, 2.2, skin);
  addBox(dst, 0, 0.08, -4.2, 1.15, 1.05, 2.6, skin);
  addBox(dst, 0, 0.1, -1.2, 1.35, 1.2, 4.2, skin);
  addBox(dst, 0, 0.12, 2.2, 1.15, 1.05, 3.2, dark);
  addBox(dst, 0, 0.9, -2.6, 0.72, 0.42, 2.4, glass);
  addBox(dst, -3.6, 0, 0.2, 6.4, 0.16, 2.15, skin, 0.42);
  addBox(dst, 3.6, 0, 0.2, 6.4, 0.16, 2.15, skin, -0.42);
  addBox(dst, -6.5, 0.05, 1.1, 0.9, 0.16, 1.3, metal, 0.42);
  addBox(dst, 6.5, 0.05, 1.1, 0.9, 0.16, 1.3, metal, -0.42);
  addBox(dst, 0, 1.7, 3.3, 0.14, 2.3, 1.7, skin);
  addBox(dst, 0, 0.35, 3.6, 3.6, 0.1, 1.15, dark);
  addBox(dst, -0.7, 0.15, 3.9, 0.55, 0.55, 1.3, metal);
  addBox(dst, 0.7, 0.15, 3.9, 0.55, 0.55, 1.3, metal);
  addBox(dst, -2.2, -0.45, 0.1, 0.22, 0.22, 2.4, [0.7, 0.32, 0.16]);
  addBox(dst, 2.2, -0.45, 0.1, 0.22, 0.22, 2.4, [0.7, 0.32, 0.16]);
  addBox(dst, 0, 0.15, -7.3, 0.12, 0.12, 0.7, [0.8, 0.55, 0.16]);
}
function buildDart(dst) {
  const skin = [0.16, 0.17, 0.19];
  const edge = [0.28, 0.3, 0.32];
  const hot = [0.72, 0.42, 0.14];
  const glass = [0.35, 0.55, 0.62];
  addBox(dst, 0, 0, -8.2, 0.55, 0.5, 3.2, skin);
  addBox(dst, 0, 0.02, -4.6, 1.05, 0.85, 4.2, skin);
  addBox(dst, 0, 0.04, -0.6, 1.25, 0.95, 4.6, edge);
  addBox(dst, 0, 0.08, 3.4, 1.45, 1.15, 4.4, skin);
  addBox(dst, 0, 0.55, -3.4, 0.55, 0.32, 1.8, glass);
  addBox(dst, -3.3, -0.05, 0.6, 5.6, 0.12, 2.6, edge, 0.55);
  addBox(dst, 3.3, -0.05, 0.6, 5.6, 0.12, 2.6, edge, -0.55);
  addBox(dst, -1.05, 0.15, 4.6, 0.85, 0.85, 2.4, [0.1, 0.1, 0.11]);
  addBox(dst, 1.05, 0.15, 4.6, 0.85, 0.85, 2.4, [0.1, 0.1, 0.11]);
  addBox(dst, -1.05, 0.15, 5.9, 0.7, 0.7, 0.35, hot);
  addBox(dst, 1.05, 0.15, 5.9, 0.7, 0.7, 0.35, hot);
  addBox(dst, -0.85, 1.55, 3.5, 0.12, 1.9, 1.5, skin);
  addBox(dst, 0.85, 1.55, 3.5, 0.12, 1.9, 1.5, skin);
  addBox(dst, 0, 0.15, 4.2, 3.2, 0.08, 1.1, edge);
  addBox(dst, 0, 0.35, -6.5, 0.1, 0.28, 2.2, hot);
}
function buildShip(dst) {
  const hull = [0.22, 0.24, 0.26];
  const superC = [0.38, 0.4, 0.36];
  addBox(dst, 0, 2.2, 0, 11, 4.2, 62, hull, 0);
  addBox(dst, 0, 5.2, 4, 7, 3.2, 16, superC, 0);
  addBox(dst, 0, 7.6, 2, 3.2, 2.4, 6, [0.3, 0.32, 0.3], 0);
  addBox(dst, 0, 4.6, -22, 2.2, 1.4, 6, [0.15, 0.15, 0.16], 0);
  addBox(dst, 0, 0.4, -34, 1.2, 0.15, 8, [0.85, 0.88, 0.9], 0);
}
function buildDepot(dst) {
  const tank = [0.55, 0.16, 0.12];
  addBox(dst, -16, 6, 0, 12, 12, 12, tank);
  addBox(dst, 0, 8, 0, 14, 16, 14, [0.62, 0.2, 0.12]);
  addBox(dst, 16, 5, 0, 11, 10, 11, tank);
  addBox(dst, 0, 3, 18, 28, 4, 10, [0.35, 0.32, 0.28]);
  addBox(dst, 8, 14, -8, 1.2, 18, 1.2, [0.7, 0.68, 0.6]);
}
function buildSam(dst) {
  addBox(dst, 0, 1.2, 0, 10, 2.2, 8, [0.28, 0.3, 0.24]);
  addBox(dst, 0, 4.5, 0, 2.2, 5, 2.2, [0.4, 0.42, 0.34]);
  addBox(dst, 0, 7.2, 1.5, 1.4, 1.4, 6, [0.55, 0.5, 0.3]);
  addBox(dst, 3.2, 6.4, 0, 0.4, 0.4, 7, [0.2, 0.2, 0.18]);
  addBox(dst, -3.2, 6.4, 0, 0.4, 0.4, 7, [0.2, 0.2, 0.18]);
}
function terrainColor(y, x, z) {
  if (Math.abs(x) < 26 && z < 490 && z > -240 && y > 11.5) return [0.16, 0.16, 0.15];
  if (Math.abs(x) < 96 && z < 530 && z > -290 && y > 10.5) return [0.55, 0.48, 0.32];
  if (y < 1.6) return [0.72, 0.62, 0.4];
  if (y < 6) return [0.45, 0.48, 0.22];
  if (y > 16) return [0.48, 0.4, 0.32];
  return [0.4, 0.46, 0.24];
}
function buildIsland() {
  const dst = [];
  const step = 32;
  for (let x = -1750; x < 1750; x += step) {
    for (let z = -1200; z < 1400; z += step) {
      const pts = [[x, 0, z], [x + step, 0, z], [x + step, 0, z + step], [x, 0, z + step]];
      let maxH = 0;
      for (let i = 0; i < 4; i++) {
        pts[i][1] = groundY(pts[i][0], pts[i][2]);
        if (pts[i][1] > maxH) maxH = pts[i][1];
      }
      if (maxH < 0.25) continue;
      const n1 = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
      const n2 = norm(cross(sub(pts[2], pts[0]), sub(pts[3], pts[0])));
      for (const [a, b, c, n] of [[pts[0], pts[1], pts[2], n1], [pts[0], pts[2], pts[3], n2]]) {
        for (const p of [a, b, c]) dst.push(p[0], p[1], p[2], n[0], n[1], n[2], ...terrainColor(p[1], p[0], p[2]));
      }
    }
  }
  for (let z = -180; z < 460; z += 36) addBox(dst, 0, 12.12, z, 1.1, 0.08, 14, [0.9, 0.9, 0.86]);
  addBox(dst, 0, 12.14, 455, 18, 0.08, 3, [0.92, 0.92, 0.9]);
  addBox(dst, 0, 12.14, -210, 18, 0.08, 3, [0.92, 0.92, 0.9]);
  addBox(dst, -48, 16, 250, 22, 8, 16, [0.42, 0.4, 0.36]);
  addBox(dst, 42, 22, 180, 6, 20, 6, [0.5, 0.48, 0.42]);
  addBox(dst, 42, 33, 180, 8, 2, 8, [0.25, 0.28, 0.3]);
  addBox(dst, -20, 13.5, -180, 16, 4, 28, [0.34, 0.32, 0.3]);
  addBox(dst, 18, 18, -200, 1.4, 16, 1.4, [0.55, 0.5, 0.32]);
  addBox(dst, 0, 12.4, -250, 8, 0.4, 40, [0.45, 0.4, 0.32]);
  addBox(dst, 620, 1.2, -40, 18, 2.2, 140, [0.45, 0.42, 0.34]);
  addBox(dst, 540, 1.1, -40, 160, 0.6, 14, [0.35, 0.33, 0.3]);
  addBox(dst, 700, 3.2, 40, 16, 6, 22, [0.4, 0.38, 0.34]);
  addBox(dst, 860, 2, -220, 28, 3.2, 18, [0.5, 0.48, 0.42]);
  addBox(dst, -900, 6, 200, 40, 10, 26, [0.42, 0.38, 0.32]);
  return dst;
}
function buildOcean() {
  const dst = [];
  const step = 150, lim = 7200;
  for (let x = -lim; x < lim; x += step) {
    for (let z = -lim; z < lim; z += step) {
      const tideAt = (px, pz) => {
        const dx = px / 1700, dz = (pz - 120) / 1100;
        const shore = Math.min(1, Math.hypot(dx, dz));
        const deep = Math.min(1, Math.max(0, (shore - 0.85) / 0.7));
        return [
          0.16 - deep * 0.11,
          0.48 - deep * 0.28,
          0.46 - deep * 0.24
        ];
      };
      const y = 0;
      const a = [x, y, z], b = [x + step, y, z], c = [x + step, y, z + step], d = [x, y, z + step];
      const n = [0, 1, 0];
      const ca = tideAt(a[0], a[2]), cb = tideAt(b[0], b[2]), cc = tideAt(c[0], c[2]), cd = tideAt(d[0], d[2]);
      const push = (p, col) => dst.push(p[0], p[1], p[2], n[0], n[1], n[2], col[0], col[1], col[2]);
      push(a, ca); push(b, cb); push(c, cc);
      push(a, ca); push(c, cc); push(d, cd);
    }
  }
  return dst;
}
function buildSky() {
  const dst = [];
  const stacks = 10, slices = 28, radius = 4800;
  for (let i = 0; i < stacks; i++) {
    const t0 = i / stacks, t1 = (i + 1) / stacks;
    const p0 = t0 * Math.PI * 0.5, p1 = t1 * Math.PI * 0.5;
    const col = (t) => {
      const zen = [0.13, 0.24, 0.4], hor = [0.86, 0.58, 0.36];
      return [hor[0] + (zen[0] - hor[0]) * t, hor[1] + (zen[1] - hor[1]) * t, hor[2] + (zen[2] - hor[2]) * t];
    };
    const c0 = col(t0), c1 = col(t1);
    for (let j = 0; j < slices; j++) {
      const a0 = j / slices * Math.PI * 2, a1 = (j + 1) / slices * Math.PI * 2;
      const sph = (phi, th) => [Math.cos(phi) * Math.cos(th) * radius, Math.sin(phi) * radius, Math.cos(phi) * Math.sin(th) * radius];
      const pA = sph(p0, a0), pB = sph(p0, a1), pC = sph(p1, a1), pD = sph(p1, a0);
      const push = (p, colr) => { const inv = norm(mul(p, -1)); dst.push(p[0], p[1], p[2], inv[0], inv[1], inv[2], colr[0], colr[1], colr[2]); };
      push(pA, c0); push(pB, c0); push(pC, c1);
      push(pA, c0); push(pC, c1); push(pD, c1);
    }
  }
  return dst;
}
function buildClouds() {
  const dst = [];
  let seed = 11;
  const rnd = () => { seed = (seed * 16807 + 7) % 2147483647; return (seed & 2147483646) / 2147483647; };
  for (let i = 0; i < 16; i++) {
    const x = (rnd() - 0.5) * 6400, z = (rnd() - 0.5) * 6400, y = 420 + rnd() * 340;
    const blobs = 3 + (rnd() * 3 | 0);
    for (let k = 0; k < blobs; k++) {
      addBox(dst, x + (rnd() - 0.5) * 200, y + (rnd() - 0.5) * 24, z + (rnd() - 0.5) * 110, 90 + rnd() * 110, 20 + rnd() * 16, 54 + rnd() * 50, [0.93, 0.91, 0.88]);
    }
  }
  return dst;
}

const VS = `
attribute vec3 p,n,c;
uniform mat4 mvp, mod;
uniform vec3 light;
uniform float time, wave;
varying vec3 C;
varying vec3 W;
varying vec3 localP;
varying vec3 localN;
varying vec4 pack;
void main(){
  vec3 q=p;
  vec3 nn=n;
  if(wave>0.5 && wave<1.5){
    q.y += sin(p.x*0.008+time*0.7)*2.4 + cos(p.z*0.0065-time*0.5)*1.6 + sin((p.x+p.z)*0.02+time)*0.45;
    nn=normalize(vec3(-cos(p.x*0.008+time*0.7)*0.02,1.0,sin(p.z*0.0065-time*0.5)*0.012));
  }
  vec4 w=mod*vec4(q,1.0);
  vec3 wn=normalize(vec3(mod[0].x*nn.x+mod[1].x*nn.y+mod[2].x*nn.z, mod[0].y*nn.x+mod[1].y*nn.y+mod[2].y*nn.z, mod[0].z*nn.x+mod[1].z*nn.y+mod[2].z*nn.z));
  float lam=max(dot(wn, normalize(light)),0.0);
  float lit = wave>1.5 ? 1.0 : (0.32+0.78*lam+0.08*max(wn.y,0.0));
  C=c;
  W=w.xyz;
  localP=q;
  localN=nn;
  pack=vec4(lit, wave>1.5 ? 1.0 : 0.0, wave>0.5 && wave<1.5 ? 1.0 : 0.0, wave<0.5 ? 1.0 : 0.0);
  gl_Position=mvp*vec4(q,1.0);
}`;
const FS = `
varying vec3 C;
varying vec3 W;
varying vec3 localP;
varying vec3 localN;
varying vec4 pack;
uniform float alpha;
uniform float uMap;
uniform vec3 cam;
uniform sampler2D uGround;
uniform sampler2D uSkin;
uniform sampler2D uSky;
uniform vec3 fogCol, tint, light;
void main(){
  float L=pack.x;
  float skyish=pack.y;
  float wet=pack.z;
  float solid=pack.w;
  float dist=length(W-cam);
  float fogF = skyish>0.5 ? 0.0 : clamp(1.0-exp(-dist*0.00018), 0.0, 0.78);
  float spec=0.0;
  if(wet>0.5){
    vec3 V=normalize(cam-W);
    vec3 wn=normalize(localN);
    vec3 H=normalize(normalize(light)+V);
    spec=pow(max(dot(wn,H),0.0), 48.0)*0.35;
  }
  vec3 col=C*tint*clamp(L,0.0,1.45)+vec3(1.0,0.95,0.82)*spec;
  if(uMap>0.5 && uMap<1.5){
    vec3 dirt=texture2D(uGround, W.xz*0.011).rgb;
    col=mix(col, dirt*(0.55+0.7*clamp(L,0.0,1.2)), 0.82);
  } else if(uMap>1.5 && uMap<2.5){
    vec3 bn=abs(normalize(localN));
    bn=max(bn, vec3(0.001));
    bn/=bn.x+bn.y+bn.z;
    vec3 skin=texture2D(uSkin, localP.zy*0.42).rgb*bn.x + texture2D(uSkin, localP.xz*0.42).rgb*bn.y + texture2D(uSkin, localP.xy*0.42).rgb*bn.z;
    col=mix(col, skin*tint*clamp(L,0.35,1.35), 0.78);
  } else if(uMap>2.5){
    vec3 dir=normalize(W-cam);
    float su=atan(dir.x, dir.z)*0.15915+0.5;
    float sv=clamp(dir.y*1.15, 0.0, 1.0);
    col=texture2D(uSky, vec2(su, sv)).rgb;
  } else if(solid>0.5){
    float cell=fract(sin(dot(floor(W.xz*2.2+W.y*0.6), vec2(19.7,43.1)))*91.7);
    float grit=fract(sin(dot(W.xz, vec2(127.1,311.7)))*43758.5);
    col*=0.88+0.09*cell+0.05*grit;
  }
  gl_FragColor=vec4(mix(col, fogCol, fogF), alpha);
}`;

function createTargets() {
  return [
    { name: 'RAIDER LEAD', kind: 'ship', primary: true, hp: 100, max: 100, pos: [-240, 4, -1040], yaw: 0.35, r: 52, cool: 0 },
    { name: 'RAIDER TRAIL', kind: 'ship', primary: true, hp: 100, max: 100, pos: [380, 4, -1560], yaw: -0.6, r: 50, cool: 0 },
    { name: 'FUEL FARM', kind: 'depot', primary: true, hp: 80, max: 80, pos: [240, 0, 160], yaw: 0.2, r: 34, cool: 0 },
    { name: 'SAM SITE', kind: 'sam', primary: false, hp: 48, max: 48, pos: [-680, 0, -40], yaw: 0.9, r: 18, cool: 1 },
    { name: 'BANDIT NORTH', kind: 'bandit', primary: false, hp: 34, max: 34, pos: [40, 190, -280], r: 11, speed: 145, t: 0.4, orbit: [0, 190, -620], rad: 420, cool: 0.6, q: [0, 0, 0, 1] },
    { name: 'BANDIT WEST', kind: 'bandit', primary: false, hp: 34, max: 34, pos: [-260, 250, -860], r: 11, speed: 155, t: 2.2, orbit: [80, 240, -980], rad: 480, cool: 1.1, q: [0, 0, 0, 1] }
  ];
}

globalThis.__tbMath = { basis, integrateAttitude, stepFlight, createSim, groundY, qrot, qaxis, qmul, qnorm, AIRFRAME, THEATER, ISLAND_NAME };

function bootTidebreaker() {
  const canvas = document.querySelector('#view');
  if (!canvas) return;
  const $ = (id) => document.getElementById(id);
  const diag = $('diag');
  const bootStatus = $('bootStatus');
  const showDiag = (msg) => {
    if (diag) { diag.hidden = false; diag.textContent = 'FLIGHT SYSTEMS // ' + msg; }
    if (bootStatus) bootStatus.textContent = msg;
  };
  window.addEventListener('error', (e) => showDiag(e.message || 'script error'));
  const game = $('game');
  if (game) game.hidden = false;
  const failStart = () => {
    const fly = document.querySelector('#fly');
    if (fly) fly.onclick = () => showDiag(bootStatus ? bootStatus.textContent : 'WebGL failed');
  };
  if (bootStatus) bootStatus.textContent = 'LOADING TERRAIN…';
  const g = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'high-performance' })
    || canvas.getContext('webgl', { antialias: false, alpha: false })
    || canvas.getContext('experimental-webgl');
  if (!g) { showDiag('WebGL unavailable on this device'); failStart(); return; }
  function sh(type, src) {
    const s = g.createShader(type);
    g.shaderSource(s, src);
    g.compileShader(s);
    if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) || 'shader');
    return s;
  }
  function programWith(prec) {
    const head = 'precision ' + prec + ' float;\n';
    const prog = g.createProgram();
    g.attachShader(prog, sh(g.VERTEX_SHADER, head + VS));
    g.attachShader(prog, sh(g.FRAGMENT_SHADER, head + FS));
    g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(prog) || 'shader link');
    return prog;
  }
  let prog;
  const loc = {};
  let texGround, texStrike, texFast, texSky;
  let glLost = false;
  function bindProgram(next) {
    prog = next;
    g.useProgram(prog);
    loc.p = g.getAttribLocation(prog, 'p');
    loc.n = g.getAttribLocation(prog, 'n');
    loc.c = g.getAttribLocation(prog, 'c');
    loc.mvp = g.getUniformLocation(prog, 'mvp');
    loc.mod = g.getUniformLocation(prog, 'mod');
    loc.cam = g.getUniformLocation(prog, 'cam');
    loc.light = g.getUniformLocation(prog, 'light');
    loc.time = g.getUniformLocation(prog, 'time');
    loc.wave = g.getUniformLocation(prog, 'wave');
    loc.alpha = g.getUniformLocation(prog, 'alpha');
    loc.fog = g.getUniformLocation(prog, 'fogCol');
    loc.tint = g.getUniformLocation(prog, 'tint');
    loc.map = g.getUniformLocation(prog, 'uMap');
    loc.ground = g.getUniformLocation(prog, 'uGround');
    loc.skin = g.getUniformLocation(prog, 'uSkin');
    loc.sky = g.getUniformLocation(prog, 'uSky');
    g.enableVertexAttribArray(loc.p);
    g.enableVertexAttribArray(loc.n);
    g.enableVertexAttribArray(loc.c);
  }
  try {
    try { bindProgram(programWith('highp')); }
    catch (errHigh) { bindProgram(programWith('mediump')); }
  } catch (err) {
    showDiag(err.message || 'shader failed');
    failStart();
    return;
  }
  function makeTex(rgb) {
    const tex = g.createTexture();
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 1, 1, 0, g.RGBA, g.UNSIGNED_BYTE, new Uint8Array([rgb[0], rgb[1], rgb[2], 255]));
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.REPEAT);
    return tex;
  }
  function loadTex(url, tex) {
    const img = new Image();
    img.onload = () => {
      if (g.isContextLost()) return;
      g.bindTexture(g.TEXTURE_2D, tex);
      g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, true);
      try {
        g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, img);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR_MIPMAP_LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT);
        g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.REPEAT);
        g.generateMipmap(g.TEXTURE_2D);
      } catch (err) { /* context dropped mid-upload */ }
    };
    img.src = url;
  }
  function makeTextures() {
    texGround = makeTex([150, 130, 90]);
    texStrike = makeTex([90, 100, 70]);
    texFast = makeTex([170, 174, 178]);
    texSky = makeTex([70, 110, 170]);
    loadTex('./assets/ground.jpg', texGround);
    loadTex('./assets/skin-strike.jpg', texStrike);
    loadTex('./assets/skin-fast.jpg', texFast);
    loadTex('./assets/sky.jpg', texSky);
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, texGround);
    g.uniform1i(loc.ground, 0);
    g.activeTexture(g.TEXTURE1);
    g.bindTexture(g.TEXTURE_2D, texStrike);
    g.uniform1i(loc.skin, 1);
    g.activeTexture(g.TEXTURE2);
    g.bindTexture(g.TEXTURE_2D, texSky);
    g.uniform1i(loc.sky, 2);
    g.activeTexture(g.TEXTURE0);
  }
  makeTextures();
  function useSkin(tex) {
    g.activeTexture(g.TEXTURE1);
    g.bindTexture(g.TEXTURE_2D, tex);
    g.activeTexture(g.TEXTURE0);
  }
  const gpuMeshes = [];
  function uploadBuf(mesh) {
    mesh.buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, mesh.buf);
    g.bufferData(g.ARRAY_BUFFER, mesh.arr, mesh.dyn ? g.DYNAMIC_DRAW : g.STATIC_DRAW);
  }
  function upload(data, dynamic) {
    const arr = data instanceof Float32Array ? data : new Float32Array(data);
    const mesh = { buf: null, count: arr.length / 9, dyn: !!dynamic, arr };
    gpuMeshes.push(mesh);
    uploadBuf(mesh);
    return mesh;
  }
  function restoreContext() {
    try {
      try { bindProgram(programWith('highp')); }
      catch (errHigh) { bindProgram(programWith('mediump')); }
      for (let i = 0; i < gpuMeshes.length; i++) uploadBuf(gpuMeshes[i]);
      makeTextures();
      glLost = false;
      if (diag) diag.hidden = true;
    } catch (err) {
      showDiag(err.message || 'graphics restore failed');
    }
  }
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    glLost = true;
    showDiag('GRAPHICS LOST — RECOVERING');
  });
  canvas.addEventListener('webglcontextrestored', () => restoreContext());
  const loseExt = g.getExtension('WEBGL_lose_context');
  const jet = upload((() => { const d = []; buildAirframe(d); return d; })());
  const jetLance = upload((() => { const d = []; buildLance(d); return d; })());
  const jetDart = upload((() => { const d = []; buildDart(d); return d; })());
  const shipM = upload((() => { const d = []; buildShip(d); return d; })());
  const depotM = upload((() => { const d = []; buildDepot(d); return d; })());
  const samM = upload((() => { const d = []; buildSam(d); return d; })());
  const island = upload(buildIsland());
  const ocean = upload(buildOcean());
  const sky = upload(buildSky());
  const clouds = upload(buildClouds());
  const tracer = upload((() => { const d = []; addBox(d, 0, 0, -6, 0.42, 0.42, 12, [1, 1, 1]); return d; })());
  const brakeMesh = upload((() => { const d = []; addBox(d, 0, 0.35, 0, 2.4, 0.08, 0.85, [1, 1, 1]); return d; })());
  const foxMesh = upload((() => { const d = []; addBox(d, 0, 0, -1.4, 0.38, 0.38, 2.8, [0.92, 0.93, 0.95]); return d; })());
  const puff = upload((() => { const d = []; addBox(d, 0, 0, 0, 1, 1, 1, [1, 1, 1]); return d; })());
  const heloM = upload((() => { const d = []; buildHelo(d); return d; })());
  const gunM = upload((() => { const d = []; buildGunship(d); return d; })());
  const subM = upload((() => { const d = []; buildSub(d); return d; })());
  const personM = upload((() => { const d = []; buildPerson(d); return d; })());
  const wingM = upload((() => { const d = []; buildWing(d); return d; })());
  const FOV = 50 * Math.PI / 180;
  const keys = new Set();
  const GAME_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'KeyF', 'KeyR', 'KeyC', 'KeyT', 'KeyX', 'Space', 'ShiftLeft', 'ShiftRight', 'ArrowUp', 'ArrowDown']);
  addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    if (e.code === 'KeyF') trigger = true;
  });
  addEventListener('keyup', (e) => {
    keys.delete(e.code);
    if (e.code === 'KeyF') trigger = false;
  });
  addEventListener('blur', () => { keys.clear(); trigger = false; missileBtn = false; });
  let trigger = false, missileBtn = false, burnBtn = false, brakeBtn = false, mousePitch = 0, mouseRoll = 0, lookYaw = 0;
  let stickX = 0, stickY = 0, cockpit = false;
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) { trigger = true; canvas.requestPointerLock?.(); } });
  addEventListener('mouseup', (e) => { if (e.button === 0) trigger = false; });
  addEventListener('mousemove', (e) => {
    if (!running || document.pointerLockElement !== canvas) return;
    mouseRoll = clamp(mouseRoll - e.movementX * 0.0016, -1, 1);
    mousePitch = clamp(mousePitch + -e.movementY * 0.0016, -1, 1);
  });
  const stick = $('stick'), nub = $('nub');
  let sid = null;
  stick.onpointerdown = (e) => { sid = e.pointerId; stick.setPointerCapture(sid); moveStick(e); };
  stick.onpointermove = (e) => { if (e.pointerId === sid) moveStick(e); };
  stick.onpointerup = stick.onpointercancel = () => { sid = null; stickX = 0; stickY = 0; nub.style.transform = ''; };
  function moveStick(e) {
    const r = stick.getBoundingClientRect();
    let x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    const m = Math.min(r.width, r.height) * 0.38, d = Math.hypot(x, y), k = d > m ? m / d : 1;
    x *= k; y *= k;
    const mag = Math.hypot(x, y), dz = m * 0.18;
    if (mag < dz) { stickX = 0; stickY = 0; }
    else {
      const sc = (mag - dz) / (m - dz) / mag;
      stickX = clamp((x * sc), -1, 1);
      stickY = clamp((-y * sc), -1, 1);
    }
    nub.style.transform = `translate(${x}px,${y}px)`;
  }
  const look = document.getElementById('look');
  let lid = null, lx = 0;
  look.onpointerdown = (e) => { lid = e.pointerId; lx = e.clientX; look.setPointerCapture(lid); look.classList.add('active'); };
  look.onpointermove = (e) => { if (e.pointerId !== lid) return; const dx = e.clientX - lx; lx = e.clientX; lookYaw = clamp(dx * 0.035, -1, 1); };
  look.onpointerup=look.onpointercancel=() => { lid = null; look.classList.remove('active'); };
  $('fire').onpointerdown = (e) => { e.preventDefault(); trigger = true; };
  $('fire').onpointerup = $('fire').onpointercancel = () => { trigger = false; };
  $('missile').onpointerdown = (e) => { e.preventDefault(); missileBtn = true; };
  $('missile').onpointerup = $('missile').onpointercancel = () => { missileBtn = false; };
  if ($('burn')) {
    $('burn').onpointerdown = (e) => { e.preventDefault(); burnBtn = true; };
    $('burn').onpointerup = $('burn').onpointercancel = () => { burnBtn = false; };
  }
  if ($('brake')) {
    $('brake').onpointerdown = (e) => { e.preventDefault(); brakeBtn = true; };
    $('brake').onpointerup = $('brake').onpointercancel = () => { brakeBtn = false; };
  }

  let picked = 'a10';
  let op = 'light';
  function currentOp() { return MISSIONS.find((m) => m.id === op) || MISSIONS[0]; }
  document.querySelectorAll('.jet').forEach((btn) => {
    btn.onclick = () => {
      picked = btn.dataset.jet || 'strike';
      document.querySelectorAll('.jet').forEach((b) => b.classList.toggle('on', b === btn));
      const j = JETS[picked];
      const brief = document.querySelector('.brief');
      if (brief && currentOp().mode === 'jet' && currentOp().id === 'light') brief.textContent = j.id === 'strike'
        ? 'TB-10 Strike. An A-10C Thunderbolt II planform: straight wing, twin tails, heavy nose cannon. Stable gun runs, tough airframe.'
        : j.id === 'lance'
          ? 'TB-4 Lance. Original light fighter. Snappy roll, wide seeker, six fox-2s. Built to turn with the bandits.'
          : 'TB-7 Dart. Original interceptor. Long afterburner, thin wing, serious top speed. Brake early or you will overshoot.';
    };
  });
  document.querySelectorAll('[data-op]').forEach((btn) => {
    btn.onclick = () => {
      op = btn.dataset.op || 'light';
      const m = MISSIONS.find((x) => x.id === op) || MISSIONS[0];
      if (m.mode === 'helo' && (JETS[picked] || {}).role !== 'helo') picked = 'apache';
      if (m.mode === 'gunship') picked = 'ac130';
      if (m.mode === 'jet' && (JETS[picked] || {}).role !== 'jet') picked = 'a10';
      if (m.id === 'keel') picked = picked;
      document.querySelectorAll('.jet').forEach((b) => b.classList.toggle('on', b.dataset.jet === picked));
      document.querySelectorAll('[data-op]').forEach((b) => b.classList.toggle('on', b === btn));
      const brief = document.querySelector('.brief');
      if (brief) brief.textContent = m.brief;
      const hangar = $('hangar');
      if (hangar) hangar.style.display = m.mode === 'jet' ? '' : 'none';
    };
  });

  const sim = createSim();
  const E=createTargets().map((t) => {
    if (t.kind === 'depot' || t.kind === 'sam') t.pos[1] = groundY(t.pos[0], t.pos[2]);
    return t;
  });
  const E0 = JSON.parse(JSON.stringify(E));
  const shots = [], ms = [], parts = [];
  let running = false, ended = false, looping = false, last = 0, accT = 0, time = 0;
  let camEye = sim.pos.slice(), flash = 0, hitMark = 0, misPrev = false, result = '';
  let actx = null, hum = null, humGain = null;
  let lockT = null, lockP = 0, designated = null;
  let viewFov = FOV;

  function say(text) { $('comms').textContent = text; }
  function loadTargets(id) {
    const built = (id === 'light' ? createTargets() : targetsFor(id)).map((t) => stampTarget(t));
    E.length = 0;
    for (let i = 0; i < built.length; i++) E.push(built[i]);
  }
  function resetMission() {
    const m = currentOp();
    const fresh = createSim();
    Object.assign(sim, fresh);
    sim.q = fresh.q.slice();
    const craft = JETS[picked] || JETS.a10;
    sim.mode = m.id === 'keel' ? 'sub' : craft.role === 'gunship' ? 'gunship' : craft.role === 'helo' ? 'helo' : 'jet';
    sim.pos = m.spawn.slice();
    sim.vel = m.vel.slice();
    sim.orbitCenter = (m.orbit || [0, 0, -40]).slice();
    sim.orbitT = 0.4;
    sim.aimX = 0;
    sim.aimY = 0;
    sim.integrity = m.integrity || 3;
    sim.lz = (m.lz || m.spawn).slice();
    sim.rescued = 0;
    sim.lookPitch = 0;
    loadTargets(m.id);
    shots.length = 0; ms.length = 0; parts.length = 0;
    ended = false; result = ''; flash = 0; cockpit = false;
    lockT = null; lockP = 0; designated = null;
    const j = JETS[picked] || JETS.a10;
    sim.spec = j;
    const flying = sim.mode === 'jet';
    sim.hp = j.hp;
    sim.maxHp = j.hp;
    sim.ammo = flying ? (m.ammo || j.ammo) : (m.ammo || j.ammo);
    sim.missiles = flying ? (m.missiles || j.missiles) : (m.missiles != null && m.mode !== 'jet' ? m.missiles : j.missiles);
    if (sim.mode === 'helo') { sim.ammo = j.ammo; sim.missiles = j.missiles; sim.hp = j.hp; sim.maxHp = j.hp; }
    if (sim.mode === 'gunship') { sim.ammo = j.ammo; sim.missiles = 0; sim.hp = j.hp; sim.maxHp = j.hp; }
    if (sim.mode === 'sub') { sim.ammo = 0; sim.missiles = 6; sim.hp = 100; sim.maxHp = 100; }
    sim.abFuel = 1;
    sim.brake = 0;
    sim.boost = 0;
    camEye = add(sim.pos, m.mode === 'gunship' ? [0, 0, 0] : [0, 8, 30]);
    $('endcard').hidden = true;
    if ($('damageBar')) $('damageBar').style.width = '100%';
    if ($('abFill')) $('abFill').style.width = '100%';
    const frame = sim.mode === 'sub' ? 'SUBMARINE  ·  PERISCOPE' : j.name;
    $('airframe').textContent = frame;
    const label = document.querySelector('.mission');
    if (label) label.innerHTML = 'MISSION ' + m.no + ' <strong>' + m.name + '</strong>';
    if ($('wepName')) $('wepName').textContent = m.wep;
    if ($('foxName')) $('foxName').textContent = m.fox;
    if ($('hint')) $('hint').textContent = m.hint;
    $('objective').textContent = m.objective;
    say('AWACS // ' + m.name + ' — ' + m.objective);
  }
  function burst(pos, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const v = [(Math.random() - 0.5), Math.random() * 0.8, (Math.random() - 0.5)];
      parts.push({ p: pos.slice(), v: mul(norm(v), speed * (0.4 + Math.random())), life: 0.45 + Math.random() * 0.6, col: color, s: 0.6 + Math.random() * 1.4 });
    }
  }
  function damageTarget(e, amount) {
    if (e.hp <= 0) return;
    e.hp -= amount;
    hitMark = 0.18;
    if (e.hp <= 0) {
      e.hp = 0;
      burst(e.pos, [1, 0.5, 0.12], amount > 30 ? 40 : 16, amount > 30 ? 36 : 22);
      burst(e.pos, [0.15, 0.15, 0.15], 14, 16);
      burst(e.pos, [1, 0.85, 0.4], 8, 10);
      blip(amount > 30 ? 110 : 720, 0.07, 'square', 0.04);
      say('AWACS // ' + e.name + ' DESTROYED');
      checkWin();
    } else { hitMark = 0.22; say('HIT // ' + e.name); blip(880, 0.04, 'square', 0.025); }
  }
  function hurtPlayer(amount) {
    if (!sim.alive || ended) return;
    sim.hp = Math.max(0, sim.hp - amount);
    flash = 0.85;
    $('damageBar').style.width = sim.hp + '%';
    if (sim.hp <= 0) {
      sim.alive = false;
      finish(false, 'AIRCRAFT LOST');
    } else say('AWACS // YOU ARE HIT');
  }
  function primariesLeft() { return E.filter((e) => e.primary && e.hp > 0).length; }
  function checkWin() {
    $('status').textContent = primariesLeft() + ' PRIMARY TARGETS';
    if (primariesLeft() === 0 && !ended) finish(true, 'RAIDERS DOWN');
  }
  function finish(win, title) {
    ended = true;
    result = title;
    $('endTitle').textContent = win ? 'MISSION COMPLETE' : 'MISSION FAILED';
    $('endText').textContent = title + (win ? ' — sortie complete.' : ' — Refly when ready.');
    $('endcard').hidden = false;
  }
  function gunAim() {
    const center = sim.orbitCenter || [0, 0, -40];
    const eye = sim.pos;
    const to = norm(sub(center, eye));
    const right = norm(cross(to, [0, 1, 0]));
    const aim = add(center, add(mul(right, (sim.aimX || 0) * 420), mul(to, (sim.aimY || 0) * 420)));
    aim[1] = Math.max(1.2, groundY(aim[0], aim[2]) + 1.2);
    return aim;
  }
  function fireOrbit() {
    if (sim.ammo <= 0) return;
    sim.ammo--;
    sim.gunCd = 0.07;
    const aim = gunAim();
    const eye = add(sim.pos, [0, -2, 0]);
    shots.push({ p: eye.slice(), prev: eye.slice(), v: mul(norm(sub(aim, eye)), 980), life: 0.9, owner: 'player', dmg: 0, rad: 1 });
    burst(aim, [1, 0.62, 0.18], 12, 18);
    burst(aim, [0.2, 0.2, 0.18], 6, 8);
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.hp > 0 && e.kind !== 'friend' && e.kind !== 'civil' && hypot3(sub(e.pos, aim)) < (e.r || 8) + 18) damageTarget(e, 18);
    }
    blip(70, 0.08, 'square', 0.05);
    flash = Math.max(flash, 0.2);
  }
  function interact() {
    if (sim.mode === 'helo') {
      const pilot = E.filter((e) => e.kind === 'pilot' && e.hp > 0)[0];
      if (!pilot) return;
      const alt = sim.pos[1] - groundY(sim.pos[0], sim.pos[2]);
      if (hypot3(sub(pilot.pos, sim.pos)) < 36 && alt < 16) {
        sim.mode = 'foot';
        sim.pos = [sim.lz[0], groundY(sim.lz[0], sim.lz[2]) + 1.7, sim.lz[2]];
        sim.q = quatAim(norm(sub(pilot.pos, sim.pos)));
        say('BOOTS DOWN — WALK TO THE PILOT. R TO HOIST. A STRAFES LEFT.');
      } else say('AWACS // SET DOWN CLOSER');
      return;
    }
    if (sim.mode === 'foot') {
      const pilot = E.filter((e) => e.kind === 'pilot')[0];
      if (pilot && pilot.hp > 0 && hypot3(sub(pilot.pos, sim.pos)) < 8) {
        pilot.hp = 0;
        pilot.primary = false;
        sim.rescued = 1;
        say('PILOT WITH YOU — WALK BACK TO THE LIFTER AND PRESS R');
        return;
      }
      if (sim.rescued && hypot3(sub(sim.lz, sim.pos)) < 12) finish(true, 'PILOT RECOVERED');
      else say(sim.rescued ? 'AWACS // BACK TO THE LANDING ZONE' : 'AWACS // CLOSER TO THE PILOT');
    }
  }
  function fire() {
    if (!running || ended || !sim.alive || sim.gunCd > 0) return;
    if (sim.mode === 'foot') return;
    if (sim.mode === 'gunship') return fireOrbit();
    if (sim.ammo <= 0) return;
    sim.ammo--;
    sim.gunCd = 0.045;
    const b = basis(sim.q);
    const muzzle = add(add(sim.pos, mul(b.f, 9.2)), mul(b.u, -0.75));
    const spread = [(Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012];
    const dir = norm(add(b.f, spread));
    const v = add(mul(dir, 860), sim.vel);
    shots.push({ p: muzzle.slice(), prev: muzzle.slice(), v, life: 1.15, owner: 'player', dmg: 9, rad: 2.2 });
    if (sim.ammo % 4 === 0) burst(muzzle, [1, 0.75, 0.3], 1, 4);
    blip(180, 0.03, 'square', 0.03);
  }
  function missile() {
    if (!running || ended || !sim.alive || sim.missiles <= 0 || sim.misCd > 0) return;
    const tgt = locked();
    if (!tgt) { say(lockP > 0.05 ? 'AWACS // STILL LOCKING' : 'AWACS // NO LOCK'); return; }
    sim.missiles--;
    sim.misCd = 0.45;
    const b = basis(sim.q);
    const p = add(sim.pos, mul(b.f, 6));
    ms.push({ p: p.slice(), v: add(mul(b.f, 220), sim.vel), life: 4.2, tgt, smoke: 0 });
    say('AWACS // ' + (sim.mode === 'sub' ? 'TORPEDO' : 'FOX-2') + ' — ' + tgt.name);
    blip(520, 0.18, 'sawtooth', 0.04);
  }
  function angleTo(e) {
    const b = basis(sim.q);
    const d = sub(e.pos, sim.pos);
    const dist = hypot3(d) || 1;
    const dir = mul(d, 1 / dist);
    return { dist, ang: Math.acos(clamp(dot(dir, b.f), -1, 1)) };
  }
  function acquire() {
    const cone = (sim.spec && sim.spec.cone) || 0.36;
    let best = null, score = 1e9;
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.hp <= 0) continue;
      const a = angleTo(e);
      if (a.dist < 36 || a.dist > 3600) continue;
      const wide = e === designated ? cone * 1.85 : cone;
      if (a.ang > wide) continue;
      let s = a.ang * 6 + a.dist * 0.0002;
      if (e === lockT) s -= 0.45;
      if (e === designated) s -= 0.9;
      if (s < score) { score = s; best = e; }
    }
    return best;
  }
  function updateLock(dt) {
    const cand = acquire();
    const need = (sim.spec && sim.spec.lock) || 0.22;
    if (!cand) {
      if (lockT && lockT.hp > 0 && lockP >= 1) {
        const a = angleTo(lockT);
        const hold = ((sim.spec && sim.spec.cone) || 0.36) * 2.5;
        if (a.dist < 4000 && a.ang < hold) return;
      }
      lockP = Math.max(0, lockP - dt * 2.2);
      if (lockP <= 0) lockT = null;
      return;
    }
    if (cand !== lockT) {
      lockT = cand;
      lockP = Math.max(lockP, 0.58);
    }
    lockP = Math.min(1, lockP + dt / need);
  }
  function locked() {
    return lockP >= 1 && lockT && lockT.hp > 0 ? lockT : null;
  }
  function cycleLock() {
    const live = [];
    for (let i = 0; i < E.length; i++) if (E[i].hp > 0) live.push(E[i]);
    if (!live.length) return;
    let i = live.indexOf(designated || lockT);
    designated = live[(i + 1) % live.length];
    lockT = designated;
    lockP = 1;
    say('AWACS // DESIGNATE ' + designated.name);
  }
  function segHit(p0, p1, center, rad) {
    const ab = sub(p1, p0);
    const den = dot(ab, ab) || 1;
    const t = clamp(dot(sub(center, p0), ab) / den, 0, 1);
    const closest = add(p0, mul(ab, t));
    return hypot3(sub(closest, center)) <= rad;
  }
  function update(dt) {
    let gpRoll = 0, gpPitch = 0, gpYaw = 0, gpBoost = false, gpBrake = false, gpGun = false, gpMis = false, gpUp = false, gpDn = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      const gp = pads[i];
      if (!gp || !gp.axes || gp.axes.length < 2) continue;
      const dz = (x, y) => {
        const m = Math.hypot(x, y);
        if (m < 0.16) return [0, 0];
        const s = ((m - 0.16) / 0.84) / m;
        return [x * s, y * s];
      };
      const L = dz(gp.axes[0] || 0, gp.axes[1] || 0);
      const R = gp.axes.length > 3 ? dz(gp.axes[2] || 0, gp.axes[3] || 0) : [0, 0];
      gpRoll += L[0];
      gpPitch += -L[1];
      gpYaw += R[0];
      if (gp.buttons[0] && gp.buttons[0].pressed) gpMis = true;
      if (gp.buttons[1] && gp.buttons[1].pressed) gpBoost = true;
      if (gp.buttons[7] && gp.buttons[7].value > 0.4) gpGun = true;
      if (gp.buttons[6] && gp.buttons[6].value > 0.4) gpBoost = true;
      if (gp.buttons[4] && gp.buttons[4].pressed) gpBrake = true;
      if (gp.buttons[5] && gp.buttons[5].pressed) gpBrake = true;
      if (gp.buttons[12] && gp.buttons[12].pressed) gpUp = true;
      if (gp.buttons[13] && gp.buttons[13].pressed) gpDn = true;
    }
    mouseRoll *= Math.exp(-7 * dt);
    mousePitch *= Math.exp(-7 * dt);
    lookYaw *= Math.exp(-8 * dt);
    if (sim.mode === 'foot') {
      sim.q = qnorm(qmul(qaxis(0, 1, 0, mouseRoll * 8), sim.q));
      sim.lookPitch = clamp((sim.lookPitch || 0) + mousePitch * 3.2, -0.75, 0.65);
      mouseRoll = 0;
      mousePitch = 0;
    }
    const rollCmd = clamp((keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0) - stickX - gpRoll + (sim.mode === 'foot' ? 0 : mouseRoll), -1, 1);
    const pitchCmd = clamp((keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0) + stickY + gpPitch + mousePitch, -1, 1);
    const yawCmd = clamp((keys.has('KeyQ') ? 1 : 0) - (keys.has('KeyE') ? 1 : 0) + lookYaw - gpYaw, -1, 1);
    if (keys.has('KeyC')) { keys.delete('KeyC'); cockpit = !cockpit; }
    if (keys.has('KeyT')) { keys.delete('KeyT'); cycleLock(); }
    const cmd = {
      roll: rollCmd,
      pitch: pitchCmd,
      yaw: yawCmd,
      boost: keys.has('Space') || gpBoost || burnBtn,
      brake: keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyX') || gpBrake || brakeBtn,
      throttleUp: keys.has('ArrowUp') || gpUp,
      throttleDown: keys.has('ArrowDown') || gpDn
    };
    stepFlight(sim, cmd, dt);
    if (!sim.alive && !ended) finish(false, 'AIRCRAFT LOST OVER ' + ISLAND_NAME.toUpperCase());
    sim.gunCd = Math.max(0, sim.gunCd - dt);
    sim.misCd = Math.max(0, sim.misCd - dt);
    updateLock(dt);
    if ((trigger || keys.has('KeyF') || gpGun) && sim.alive && !ended) fire();
    const misDown = missileBtn || keys.has('KeyR') || gpMis;
    if (misDown && !misPrev) {
      if (sim.mode === 'helo' || sim.mode === 'foot') interact();
      else missile();
    }
    misPrev = misDown;
    const playerPos = sim.pos;
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.hp <= 0) {
        if (e.kind === 'ship') e.pos[1] -= dt * 2.2;
        continue;
      }
      if (e.kind === 'bandit') {
        e.t += dt;
        const toP = sub(playerPos, e.pos);
        const dist = hypot3(toP);
        let dest;
        if (dist < 980) {
          dest = add(playerPos, mul(norm(sim.vel), 70));
          dest[1] = clamp(playerPos[1] + 15, 70, 460);
        } else {
          dest = [e.orbit[0] + Math.sin(e.t * 0.32) * e.rad, e.orbit[1], e.orbit[2] + Math.cos(e.t * 0.32) * e.rad];
        }
        const dir = norm(sub(dest, e.pos));
        e.pos = add(e.pos, mul(dir, e.speed * dt));
        e.q = quatAim(dir);
        e.cool -= dt;
        if (e.cool <= 0 && dist < 780) {
          const ang = Math.acos(clamp(dot(dir, norm(toP)), -1, 1));
          if (ang < 0.2) {
            e.cool = 0.55;
            const v = mul(norm(toP), 240);
            shots.push({ p: e.pos.slice(), prev: e.pos.slice(), v, life: 2.4, owner: e, dmg: 7, rad: 3 });
          }
        }
      } else if (e.kind === 'sam') {
        e.cool -= dt;
        const dist = hypot3(sub(playerPos, e.pos));
        if (e.cool <= 0 && dist < 1200 && playerPos[1] < 520) {
          e.cool = 1.7;
          const lead = add(playerPos, mul(sim.vel, dist / 260));
          const v = mul(norm(sub(lead, e.pos)), 230);
          shots.push({ p: add(e.pos, [0, 8, 0]), prev: e.pos.slice(), v, life: 3.2, owner: e, dmg: 12, rad: 4 });
          say('SAM // TRACKING');
        }
      } else if (e.kind === 'boat') {
        e.t = (e.t || 0) + dt;
        e.yaw = (e.yaw || 0) + Math.sin(e.t * 0.8) * dt * 0.45;
        const dirb = [Math.sin(e.yaw), 0, -Math.cos(e.yaw)];
        e.pos = add(e.pos, mul(dirb, (e.speed || 28) * dt));
        e.pos[1] = 1.3;
      } else if (e.kind === 'vampire') {
        const dest = e.goal || [-180, 18, 640];
        const dirv = norm(sub(dest, e.pos));
        e.pos = add(e.pos, mul(dirv, (e.speed || 100) * dt));
        if (hypot3(sub(dest, e.pos)) < 46) {
          e.hp = 0;
          e.primary = false;
          burst(e.pos, [1, 0.45, 0.15], 22, 20);
          sim.integrity = (sim.integrity || 1) - 1;
          say('VAMPIRE IMPACT ON THE CARRIER');
          if (sim.integrity <= 0 && !ended) finish(false, 'THE CARRIER IS OUT OF THE FIGHT');
          else checkWin();
        }
      } else if (e.kind === 'troop') {
        const civ = E.filter((c) => c.kind === 'civil' && c.hp > 0)[0];
        const pilotT = E.filter((c) => c.kind === 'pilot' && c.hp > 0)[0];
        const goal = civ ? civ.pos : pilotT ? pilotT.pos : (e.goal || e.pos);
        const dirt = norm(sub(goal, e.pos));
        e.pos = add(e.pos, mul(dirt, (e.speed || 10) * dt));
        const gyT = groundY(e.pos[0], e.pos[2]);
        e.pos[1] = gyT > 0.3 ? gyT + 1 : 1;
        if (civ && hypot3(sub(civ.pos, e.pos)) < 16) {
          civ.hp -= dt * 7;
          if (civ.hp <= 0 && !E.some((c) => c.kind === 'civil' && c.hp > 0) && !ended) finish(false, 'THE HARBOR CIVILIANS WERE OVERRUN');
        }
        if (pilotT && hypot3(sub(pilotT.pos, e.pos)) < 8) {
          pilotT.hp -= dt * 6;
          if (pilotT.hp <= 0 && !ended) finish(false, 'THE PILOT WAS LOST');
        }
      }
    }
    for (let i = shots.length - 1; i >= 0; i--) {
      const s = shots[i];
      s.prev = s.p.slice();
      s.p = add(s.p, mul(s.v, dt));
      s.life -= dt;
      let gone = s.life <= 0 || s.p[1] < groundY(s.p[0], s.p[2]);
      if (s.owner === 'player') {
        for (let k = 0; k < E.length; k++) {
          const e = E[k];
          if (e.hp > 0 && s.dmg > 0 && e.kind !== 'friend' && e.kind !== 'civil' && e.kind !== 'pilot' && segHit(s.prev, s.p, e.pos, e.r)) { damageTarget(e, s.dmg); burst(s.p, [1, 0.6, 0.2], 8, 16); gone = true; break; }
        }
      } else if (segHit(s.prev, s.p, playerPos, 8)) {
        hurtPlayer(s.dmg); burst(s.p, [1, 0.3, 0.15], 8, 10); gone = true;
      }
      if (gone) shots.splice(i, 1);
    }
    const lock = locked();
    for (let i = ms.length - 1; i >= 0; i--) {
      const m = ms[i];
      const tgt = m.tgt && m.tgt.hp > 0 ? m.tgt : lock;
      if (tgt) {
        const dir = norm(sub(tgt.pos, m.p));
        const vm = hypot3(m.v) || 260;
        m.v = mul(norm(add(mul(norm(m.v), 0.52), mul(dir, 0.48))), Math.min(540, vm + 150 * dt));
      }
      m.p = add(m.p, mul(m.v, dt));
      m.life -= dt;
      m.smoke -= dt;
      if (m.smoke <= 0) { parts.push({ p: m.p.slice(), v: [0, 2, 0], life: 0.45, col: [0.75, 0.75, 0.75], s: 0.8 }); m.smoke = 0.03; }
      let boom = m.life <= 0;
      const tgt2 = m.tgt && m.tgt.hp > 0 ? m.tgt : null;
      if (tgt2 && hypot3(sub(tgt2.pos, m.p)) < tgt2.r + 8) { damageTarget(tgt2, 58); burst(m.p, [1, 0.5, 0.15], 20, 24); boom = true; }
      if (boom) ms.splice(i, 1);
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      p.p = add(p.p, mul(p.v, dt));
      p.v[1] -= 6 * dt;
      if (p.life <= 0) parts.splice(i, 1);
    }
    if (parts.length > 240) parts.splice(0, parts.length - 240);
    const b = basis(sim.q);
    const speed = hypot3(sim.vel);
    $('spd').textContent = String(Math.round(speed * 1.94384));
    $('alt').textContent = String(Math.round((sim.pos[1] - groundY(sim.pos[0], sim.pos[2])) * 3.28084));
    const hdg = ((-b.yaw * 180 / Math.PI) % 360 + 360) % 360;
    $('hdg').textContent = String(Math.round(hdg)).padStart(3, '0');
    $('thr').textContent = sim.boost ? 'AB' : (sim.brake ? 'BRK' : String(Math.round(sim.throttle * 100)));
    $('ammo').textContent = String(sim.ammo);
    $('missileCount').textContent = String(sim.missiles);
    $('weapon').textContent = trigger && sim.ammo > 0 ? 'GUNS' : (sim.ammo ? 'READY' : 'WINCHESTER');
    if ($('prop')) $('prop').textContent = sim.boost ? 'AFTERBURNER' : (sim.brake ? 'AIRBRAKE' : 'MIL POWER');
    if ($('abFill')) $('abFill').style.width = Math.round((sim.abFuel || 0) * 100) + '%';
    if ($('abBar')) {
      $('abBar').classList.toggle('hot', !!sim.boost);
      $('abBar').classList.toggle('brake', !!sim.brake);
    }
    const full = lock;
    if (full) $('lock').textContent = 'LOCK ' + full.name;
    else if (lockT && lockP > 0.04) $('lock').textContent = 'LOCKING ' + lockT.name + ' ' + Math.round(lockP * 100);
    else $('lock').textContent = 'NO LOCK';
    $('reticle').classList.toggle('locked', !!full);
    $('reticle').classList.toggle('locking', !full && lockP > 0.04);
    $('status').textContent = primariesLeft() + ' PRIMARY TARGETS';
    $('damageBar').style.width = Math.max(0, Math.min(100, sim.hp / (sim.maxHp || 100) * 100)) + '%';
    const aoa = Math.atan2(-dot(norm(sim.vel), b.u), Math.max(0.2, dot(norm(sim.vel), b.f)));
    $('aoa').textContent = (aoa * 180 / Math.PI).toFixed(0);
    if (humGain && actx) {
      hum.frequency.setTargetAtTime(62 + speed * 0.35 + (sim.boost ? 40 : 0), actx.currentTime, 0.1);
      humGain.gain.setTargetAtTime(0.018 + sim.throttle * 0.02, actx.currentTime, 0.1);
    }
    if (sim.pos[1] - groundY(sim.pos[0], sim.pos[2]) < 28 && sim.vel[1] < -4 && sim.alive) say('PULL UP');
    flash = Math.max(0, flash - dt * 1.6);
    hitMark = Math.max(0, hitMark - dt);
    $('hurt').style.opacity = String(flash * 0.55);
    $('reticle').classList.toggle('hit', hitMark > 0);
  }
  function bindMesh(mesh) {
    g.bindBuffer(g.ARRAY_BUFFER, mesh.buf);
    g.vertexAttribPointer(loc.p, 3, g.FLOAT, false, 36, 0);
    g.vertexAttribPointer(loc.n, 3, g.FLOAT, false, 36, 12);
    g.vertexAttribPointer(loc.c, 3, g.FLOAT, false, 36, 24);
  }
  let vp = IDENT;
  function draw(mesh, model, alpha, wave, tint, map) {
    if (!mesh || mesh.count < 1) return;
    bindMesh(mesh);
    g.uniformMatrix4fv(loc.mvp, false, mm(vp, model));
    g.uniformMatrix4fv(loc.mod, false, model);
    g.uniform1f(loc.alpha, alpha);
    g.uniform1f(loc.wave, wave);
    g.uniform1f(loc.map, map || 0);
    g.uniform3fv(loc.tint, tint || [1, 1, 1]);
    g.depthMask(alpha >= 0.99);
    g.drawArrays(g.TRIANGLES, 0, mesh.count);
  }
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(2, Math.floor(innerWidth * dpr));
    const h = Math.max(2, Math.floor(innerHeight * dpr));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    g.viewport(0, 0, canvas.width, canvas.height);
  }
  addEventListener('resize', resize);
  function drawLadder() {
    const cv = $('ladder');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = cv.width = Math.floor(innerWidth * dpr);
    const h = cv.height = Math.floor(innerHeight * dpr);
    const x = cv.getContext('2d');
    x.clearRect(0, 0, w, h);
    const b = basis(sim.q);
    const px = (h * 0.5) / Math.tan(viewFov * 0.5);
    x.save();
    x.translate(w / 2, h / 2);
    x.rotate(-b.roll);
    x.translate(0, Math.tan(b.pitch) * px);
    x.lineWidth = 1.5 * dpr;
    x.strokeStyle = 'rgba(236,232,220,0.9)';
    x.beginPath(); x.moveTo(-w, 0); x.lineTo(w, 0); x.stroke();
    x.font = (12 * dpr) + 'px sans-serif';
    x.textAlign = 'center';
    for (let deg = -80; deg <= 80; deg += 10) {
      if (!deg) continue;
      const y = -Math.tan(deg * Math.PI / 180) * px;
      const half = (deg % 20 === 0 ? 78 : 40) * dpr;
      x.strokeStyle = deg > 0 ? 'rgba(236,232,220,0.8)' : 'rgba(232,164,70,0.92)';
      x.beginPath(); x.moveTo(-half, y); x.lineTo(half, y); x.stroke();
      if (deg % 20 === 0) {
        x.fillStyle = x.strokeStyle;
        x.fillText(String(Math.abs(deg)), -half - 18 * dpr, y + 4 * dpr);
        x.fillText(String(Math.abs(deg)), half + 18 * dpr, y + 4 * dpr);
      }
    }
    const vm = hypot3(sim.vel) || 1;
    const vdir = mul(sim.vel, 1 / vm);
    const vx = dot(vdir, b.r), vy = dot(vdir, b.u), vz = Math.max(0.25, dot(vdir, b.f));
    const fx = clamp((vx / vz) * px, -h * 0.34, h * 0.34);
    const fy = clamp(-(vy / vz) * px, -h * 0.34, h * 0.34);
    x.strokeStyle = 'rgba(236,232,220,0.95)';
    x.lineWidth = 1.6 * dpr;
    x.beginPath(); x.arc(fx, fy, 9 * dpr, 0, Math.PI * 2); x.stroke();
    x.beginPath(); x.moveTo(fx - 16 * dpr, fy); x.lineTo(fx - 8 * dpr, fy); x.moveTo(fx + 8 * dpr, fy); x.lineTo(fx + 16 * dpr, fy); x.stroke();
    x.restore();
    const lock = locked();
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.hp <= 0) continue;
      const clipx = vp[0] * e.pos[0] + vp[4] * e.pos[1] + vp[8] * e.pos[2] + vp[12];
      const clipy = vp[1] * e.pos[0] + vp[5] * e.pos[1] + vp[9] * e.pos[2] + vp[13];
      const clipw = vp[3] * e.pos[0] + vp[7] * e.pos[1] + vp[11] * e.pos[2] + vp[15];
      let nx = 0, ny = 0, on = false;
      if (clipw > 0.5) {
        nx = clipx / clipw;
        ny = clipy / clipw;
        on = nx > -0.92 && nx < 0.92 && ny > -0.88 && ny < 0.88;
      } else {
        const mag = Math.hypot(clipx, clipy) || 1;
        nx = -clipx / mag;
        ny = -clipy / mag;
      }
      let sx = (nx * 0.5 + 0.5) * w;
      let sy = (1 - (ny * 0.5 + 0.5)) * h;
      if (!on) {
        const dx = sx - w / 2, dy = sy - h / 2;
        const mag = Math.hypot(dx, dy) || 1;
        sx = w / 2 + (dx / mag) * w * 0.42;
        sy = h / 2 + (dy / mag) * h * 0.34;
      }
      const hot = lock === e || e === lockT;
      x.strokeStyle = e.kind === 'bandit' ? 'rgba(224,96,64,0.95)' : (e.primary ? 'rgba(227,176,90,0.95)' : 'rgba(210,220,210,0.8)');
      x.lineWidth = (hot ? 2.4 : 1.3) * dpr;
      const m = (hot ? 16 : 11) * dpr;
      x.strokeRect(sx - m, sy - m, m * 2, m * 2);
      if (e === lockT) {
        x.beginPath();
        x.strokeStyle = lock ? '#fff' : 'rgba(255,236,210,0.95)';
        x.lineWidth = 3 * dpr;
        x.arc(sx, sy, m + 8 * dpr, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lockP);
        x.stroke();
      }
      if (hot || e.primary) {
        x.font = (11 * dpr) + 'px sans-serif';
        x.fillStyle = x.strokeStyle;
        x.textAlign = 'center';
        x.fillText(e.name, sx, sy - m - 6 * dpr);
      }
    }
    const qcv = $('radar');
    const rw = qcv.width = 180, rh = qcv.height = 180;
    const rx = qcv.getContext('2d');
    rx.clearRect(0, 0, rw, rh);
    rx.strokeStyle = 'rgba(232,210,170,0.35)';
    rx.beginPath(); rx.arc(rw / 2, rh / 2, 70, 0, Math.PI * 2); rx.stroke();
    rx.beginPath(); rx.moveTo(rw / 2, 16); rx.lineTo(rw / 2, rh - 16); rx.moveTo(16, rh / 2); rx.lineTo(rw - 16, rh / 2); rx.stroke();
    const yaw = b.yaw;
    const cyaw = Math.cos(yaw), syaw = Math.sin(yaw);
    rx.fillStyle = '#f2efe6';
    rx.beginPath(); rx.arc(rw / 2, rh / 2, 3, 0, Math.PI * 2); rx.fill();
    rx.save();
    rx.translate(rw / 2, rh / 2);
    rx.rotate(time * 1.6);
    rx.strokeStyle = 'rgba(227,160,74,0.55)';
    rx.beginPath(); rx.moveTo(0, 0); rx.lineTo(70, 0); rx.stroke();
    rx.restore();
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.hp <= 0 && e.kind !== 'ship') continue;
      const d = sub(e.pos, sim.pos);
      const lx = d[0] * cyaw + d[2] * syaw;
      const ly = -d[0] * syaw + d[2] * cyaw;
      const pxr = rw / 2 + clamp(lx / 2200, -1, 1) * 74;
      const pyr = rh / 2 + clamp(ly / 2200, -1, 1) * 74;
      rx.fillStyle = e.hp <= 0 ? '#5c584e' : (e.kind === 'bandit' ? '#e07048' : '#e2b15a');
      rx.fillRect(pxr - 3, pyr - 3, 6, 6);
    }
  }
  function render() {
    if (glLost || g.isContextLost()) return;
    resize();
    const b = basis(sim.q);
    const f = b.f, up = b.u;
    let desired;
    let target;
    const kick = sim.boost ? 5 : (sim.brake ? -3 : 0);
    if (sim.mode === 'gunship') {
      desired = sim.pos.slice();
      target = gunAim();
    } else if (sim.mode === 'foot') {
      desired = add(sim.pos, [0, 1.55, 0]);
      target = add(desired, add(mul(f, 16), [0, (sim.lookPitch || 0) * 8, 0]));
    } else if (sim.mode === 'sub') {
      desired = add(add(sim.pos, mul(f, -18)), [0, 5, 0]);
      target = add(sim.pos, mul(f, 24));
    } else if (cockpit) {
      desired = add(add(sim.pos, mul(f, 1.7)), mul(up, 0.9));
      target = add(sim.pos, mul(f, 90));
    } else {
      desired = add(add(sim.pos, mul(f, -26 - kick)), mul(up, 7.2 + (sim.boost ? 0.8 : 0)));
      target = add(sim.pos, mul(f, 18));
    }
    if (flash > 0.4) desired = add(desired, [(Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.4]);
    const k = 1 - Math.exp(-8 * 0.016);
    camEye = add(camEye, mul(sub(desired, camEye), k));
    if (sim.mode !== 'sub' && camEye[1] < 1.5) camEye[1] = 1.5;
    viewFov = FOV * (sim.mode === 'gunship' ? 0.86 : sim.boost ? 1.08 : sim.brake ? 0.95 : 1);
    vp = mm(persp(viewFov, canvas.width / canvas.height, 0.35, 16000), lookAt(camEye, target, sim.mode === 'gunship' || sim.mode === 'foot' ? [0, 1, 0] : up));
    g.uniform3f(loc.cam, camEye[0], camEye[1], camEye[2]);
    g.uniform3f(loc.light, 0.35, 0.72, 0.22);
    g.uniform1f(loc.time, time);
    if (sim.mode === 'sub' && sim.pos[1] < 5) {
      g.uniform3f(loc.fog, 0.03, 0.1, 0.14);
      g.clearColor(0.02, 0.06, 0.1, 1);
    } else {
      g.uniform3f(loc.fog, 0.78, 0.58, 0.42);
      g.clearColor(0.55, 0.4, 0.28, 1);
    }
    g.clear(g.COLOR_BUFFER_BIT | g.DEPTH_BUFFER_BIT);
    g.enable(g.DEPTH_TEST);
    g.enable(g.BLEND);
    g.blendFunc(g.SRC_ALPHA, g.ONE_MINUS_SRC_ALPHA);
    draw(sky, matQuat([0, 0, 0, 1], camEye, 1), 1, 2, [1, 1, 1], 3);
    draw(ocean, IDENT, 1, 1);
    draw(island, IDENT, 1, 0, [1, 1, 1], 1);
    for (let i = 0; i < E.length; i++) {
      const e = E[i];
      if (e.hp <= 0 && e.pos[1] < -8) continue;
      const yaw = e.yaw || 0;
      const face = quatAim([Math.sin(yaw), 0, -Math.cos(yaw)]);
      if (e.kind === 'ship' || e.kind === 'friend') {
        const sc = e.kind === 'friend' ? 3.3 : (e.r > 55 ? 2.05 : 1.35);
        draw(shipM, matQuat(face, e.pos, sc), e.hp > 0 ? 1 : 0.85, 0, e.kind === 'friend' ? [0.62, 0.66, 0.7] : [1, 1, 1]);
      } else if (e.kind === 'boat' && e.hp > 0) draw(shipM, matQuat(face, e.pos, 0.36), 1, 0, [0.32, 0.28, 0.24]);
      else if (e.kind === 'vampire' && e.hp > 0) draw(foxMesh, matQuat(quatAim(norm(sub(e.goal || [0, 0, 1], e.pos))), e.pos, 1.5), 1, 0, [1, 0.42, 0.12]);
      else if ((e.kind === 'troop' || e.kind === 'pilot' || e.kind === 'civil') && e.hp > 0) {
        const tint = e.kind === 'pilot' ? [0.95, 0.72, 0.32] : e.kind === 'civil' ? [0.78, 0.8, 0.84] : [0.62, 0.16, 0.12];
        draw(personM, matQuat([0, 0, 0, 1], e.pos, e.kind === 'civil' ? 2.4 : 1.35), 1, 0, tint);
      }
      else if (e.kind === 'depot' && e.hp > 0) draw(depotM, matQuat(face, e.pos, 1), 1, 0);
      else if (e.kind === 'sam' && e.hp > 0) draw(samM, matQuat(quatAim([Math.sin(e.yaw), 0, -Math.cos(e.yaw)]), [e.pos[0], e.pos[1] + 1, e.pos[2]], 1), 1, 0);
      else if (e.kind === 'bandit' && e.hp > 0) {
        useSkin(texFast);
        draw(jetLance, matQuat(e.q, e.pos, 0.72), 1, 0, [0.95, 0.55, 0.48], 2);
      }
    }
    const craftId = (JETS[picked] && JETS[picked].id) || 'a10';
    let playerMesh = jet;
    let skinTint = [1, 1, 1];
    let skin = texStrike;
    let pScale = 1;
    if (craftId === 'f22') { playerMesh = jetDart; skinTint = [0.32, 0.36, 0.4]; skin = texFast; }
    else if (craftId === 'f35') { playerMesh = jetLance; skinTint = [0.62, 0.66, 0.62]; skin = texFast; }
    else if (craftId === 'b2') { playerMesh = wingM; skinTint = [0.16, 0.17, 0.18]; skin = texFast; pScale = 1.7; }
    if (sim.alive && sim.mode === 'helo') {
      const little = craftId === 'mh6';
      draw(heloM, matQuat(sim.q, sim.pos, little ? 0.58 : 1.2), 1, 0, little ? [0.18, 0.19, 0.2] : [0.72, 0.78, 0.55]);
    } else if (sim.alive && sim.mode === 'sub') {
      draw(subM, matQuat(sim.q, sim.pos, 1.55), 1, 0, [0.35, 0.48, 0.52]);
    } else if (!cockpit && sim.alive && sim.mode === 'jet') {
      useSkin(skin);
      draw(playerMesh, matQuat(sim.q, sim.pos, pScale), 1, 0, skinTint, 2);
    }
    if (sim.brake && sim.alive && !cockpit) {
      const left = add(add(sim.pos, mul(b.r, -3.1)), add(mul(up, 0.85), mul(f, -0.3)));
      const right = add(add(sim.pos, mul(b.r, 3.1)), add(mul(up, 0.85), mul(f, -0.3)));
      draw(brakeMesh, matQuat(sim.q, left, 1), 1, 0, [0.22, 0.22, 0.2]);
      draw(brakeMesh, matQuat(sim.q, right, 1), 1, 0, [0.22, 0.22, 0.2]);
    }
    if (sim.boost && sim.alive && !cockpit) {
      const flame = 0.7 + (sim.abSpool || 1) * 2.1;
      const glowL = add(add(sim.pos, mul(f, -5.6)), add(mul(b.r, -1.05), mul(up, 0.9)));
      const glowR = add(add(sim.pos, mul(f, -5.6)), add(mul(b.r, 1.05), mul(up, 0.9)));
      draw(puff, matQuat([0, 0, 0, 1], glowL, flame), 0.85, 2, [1, 0.55, 0.16]);
      draw(puff, matQuat([0, 0, 0, 1], glowR, flame), 0.85, 2, [1, 0.42, 0.1]);
    }
    for (let i = 0; i < shots.length; i++) {
      const s = shots[i];
      const dir = norm(s.v);
      draw(tracer, matQuat(quatAim(dir), s.p, s.owner === 'player' ? 1 : 0.7), 1, 0, s.owner === 'player' ? [1, 0.72, 0.22] : [1, 0.32, 0.18]);
    }
    for (let i = 0; i < ms.length; i++) draw(foxMesh, matQuat(quatAim(norm(ms[i].v)), ms[i].p, 1), 1, 0);
    g.depthMask(false);
    draw(clouds, IDENT, 0.42, 0);
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      draw(puff, matQuat([0, 0, 0, 1], p.p, p.s), Math.max(0.15, p.life), 0, p.col);
    }
    g.depthMask(true);
    drawLadder();
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    time += dt;
    if (running && !ended) {
      accT += dt;
      let steps = 0;
      while (accT >= 1 / 60 && steps < 5) { update(1 / 60); accT -= 1 / 60; steps++; }
    }
    render();
    requestAnimationFrame(loop);
  }
  function ensureAudio() {
    if (actx) { actx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    hum = actx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 80;
    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    humGain = actx.createGain();
    humGain.gain.value = 0.02;
    hum.connect(filter); filter.connect(humGain); humGain.connect(actx.destination);
    hum.start();
    actx.resume();
  }
  function blip(freq, dur, type, gain) {
    if (!actx) return;
    const o = actx.createOscillator(), gn = actx.createGain();
    o.type = type; o.frequency.value = freq;
    gn.gain.setValueAtTime(gain, actx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(gn); gn.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  }
  function beginSortie() {
    const boot = document.querySelector('#boot');
    if (boot) boot.style.display = 'none';
    $('game').hidden = false;
    $('game').classList.add('live');
    resetMission();
    running=true;
    ended = false;
    if (!looping) { looping = true; last = performance.now(); requestAnimationFrame(loop); }
    $('endcard').hidden = true;
    try { ensureAudio(); } catch (err) { showDiag(err.message || 'audio unavailable'); }
  }
  function start() {
    const m = currentOp();
    const cine = $('cine');
    if (m.art && cine && $('cineImg')) {
      cine.hidden = false;
      $('cineImg').src = m.art;
      if ($('cineKicker')) $('cineKicker').textContent = 'MISSION ' + m.no;
      if ($('cineTitle')) $('cineTitle').textContent = m.name;
      if ($('cineLines')) $('cineLines').textContent = (m.lines || []).join(' ');
      const go = () => { cine.hidden = true; beginSortie(); };
      if ($('cineGo')) $('cineGo').onclick = go;
      if ($('cineSkip')) $('cineSkip').onclick = go;
      return;
    }
    beginSortie();
  }
  document.querySelector('#fly').onclick=start;
  $('refly').onclick = () => { resetMission(); running = true; ended = false; $('endcard').hidden = true; };
  resize();
  window.__tidebreakerReady = true;
  window.__controlsTest = {
    getYaw: () => basis(sim.q).yaw,
    getRoll: () => basis(sim.q).roll,
    getPitch: () => basis(sim.q).pitch,
    getSpeed: () => hypot3(sim.vel),
    getAlt: () => sim.pos[1],
    setKeys: (codes) => { keys.clear(); trigger = false; for (let i = 0; i < codes.length; i++) keys.add(codes[i]); }
  };
  window.__tidebreaker = {
    jet: () => picked,
    ab: () => sim.abFuel,
    brake: () => sim.brake,
    boost: () => sim.boost,
    theater: THEATER,
    island: ISLAND_NAME,
    place: (x, y, z) => {
      sim.pos = [x, y, z];
      const f = basis(sim.q).f;
      sim.vel = mul(f, Math.max(140, hypot3(sim.vel)));
      camEye = add(add(sim.pos, mul(f, -28)), mul(basis(sim.q).u, 8));
    },
    level: () => { sim.q = [0, 0, 0, 1]; sim.vel = [0, 0, -Math.max(150, hypot3(sim.vel))]; camEye = add(sim.pos, [0, 8, 30]); },
    player: () => ({ hp: sim.hp, ammo: sim.ammo, missiles: sim.missiles, pos: sim.pos.slice(), alive: sim.alive, speed: hypot3(sim.vel) }),
    targets: () => E.map((e) => ({ name: e.name, hp: e.hp, kind: e.kind, primary: e.primary, pos: e.pos.slice() })),
    fire, missile,
    loseContext: () => {
      if (!loseExt) return 'unsupported';
      loseExt.loseContext();
      setTimeout(() => loseExt.restoreContext(), 350);
      return 'cycling';
    }
  };
  $('airframe').textContent = 'A-10C THUNDERBOLT II';
  $('theater').textContent = THEATER + '  ·  ' + ISLAND_NAME.toUpperCase();
  if (bootStatus) bootStatus.textContent = 'READY — CHOOSE AN AIRFRAME';
}

bootTidebreaker();
