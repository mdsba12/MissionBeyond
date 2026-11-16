// Deep Run — the game interface. Screens render from state. The rules live in engine.js and sim.js, the campaign in missions.js,
// and every picture is drawn by pixel.js from hand-made bitmaps or from the design itself.
import * as D from './data.js';
import { evaluate, starsFor, defaultDesign, getOrbit, getObjective, getClass, fmt, pct, fmtGb, fmtRate, rng } from './engine.js';
import { createFlight, stepDay, command, snapshot, scoreFlight } from './sim.js';
import { MISSIONS } from './missions.js';
import { play, setSound } from './audio.js';
import { sprite, drawSprite, paintAssembly, PART_SPRITE, INSTRUMENT_SPRITE, PLANET, discPx } from './pixel.js';

const app = document.getElementById('app');
const sky = document.getElementById('sky');
const KEY = 'deeprun.v1';
const C = Object.fromEntries(Object.entries(D.CONST).map(([k, v]) => [k, v.value]));
const STAGES = ['Launch', 'Spacecraft', 'Ground', 'Operations'];
const STAGE_SPRITE = ['rocket', 'camera', 'dish', 'team'];
const STAGE_BRIEF = [
  'Pick the rocket and the path it flies you onto. Everything after this has to fit inside what the launcher can throw.',
  'The spacecraft. Every part adds mass, power or cost, and each instrument has to answer the science question.',
  'Bring the data home. A bigger dish and more tracking time return more data, and both are billed every year.',
  'Turn data into discoveries. A science team, a processing pipeline and an open archive multiply what the mission is worth.',
];
const LISTS = { launcher: D.LAUNCHERS, propulsion: D.PROPULSION, antenna: D.ANTENNAS, tx: D.TRANSMITTERS, shielding: D.SHIELDING,
  redundancy: D.REDUNDANCY, ground: D.GROUND, tracking: D.TRACKING, team: D.TEAMS, pipeline: D.PIPELINES, policy: D.POLICIES };
const CHECK_FOR = { launcher: 'mass', orbit: 'mass', propulsion: 'mass', payload: 'payload', power: 'power', antenna: 'link', tx: 'link', ground: 'link', tracking: 'link', shielding: 'rad' };
const CHECK_SPRITE = { mass: 'rocket', payload: 'camera', power: 'panel', link: 'dish', rad: 'shield' };
const HEALTH = { pass: 100, warn: 55, fail: 15, none: 100 };
const TAG = { pass: 'Holds', warn: 'Thin', fail: 'Fails', none: '' };
const LIGHT_WORD = { pass: 'Holding', warn: 'Thin margin', fail: 'Failing', none: 'No check' };
const SHIELD_NOTE = ['No radiation hardening', 'Hardened electronics', 'Radiation vault'];
const BODY_NAME = { earth: 'Science orbit', moon: 'Moon', mars: 'Mars', l2: 'L2 point', jupiter: 'Jupiter' };

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const find = (list, id) => list.find((x) => x.id === id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const signed = (n) => (n > 0 ? '+' + n : n < 0 ? '−' + Math.abs(n) : '0');

const state = { screen: 'title', commander: 'Commander', sound: true, progress: {}, mission: 0, stage: 0, design: null, sel: null, flight: null, result: null, tutorial: null, tutorialSeen: false };

// ---------- Save ----------
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ commander: state.commander, sound: state.sound, progress: state.progress, tutorialSeen: state.tutorialSeen })); } catch { /* saving is optional */ }
}
function load() {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!r) return;
    state.commander = String(r.commander || 'Commander').slice(0, 20) || 'Commander';
    state.sound = r.sound !== false;
    state.progress = r.progress && typeof r.progress === 'object' ? r.progress : {};
    state.tutorialSeen = !!r.tutorialSeen;
  } catch { /* start fresh */ }
}

// ---------- Tutorial ----------
// A short, plain-language walkthrough shown the first time someone reaches the build bay, and replayable any time from
// the title or the campaign map. Written for someone who has never touched engineering before — no jargon, lots of
// everyday comparisons. Each slide pairs one sprite with one idea.
const TUTORIAL = [
  { art: 'rocket', title: 'Welcome, Commander', text: 'You\'re about to design your own tiny space robot and send it on a real mission — the same kind NASA actually flies. Let\'s walk through how this works before you start.' },
  { art: 'coin', title: 'Everything costs points: the Budget', text: 'Every rocket, part and instrument costs points, like a shopping budget. Spend too much and your mission can\'t fly — so watch the budget bar. If it turns red, you\'re over.' },
  { art: 'rocket', title: 'Getting off the ground: Mass', text: 'Rockets can only lift so much weight, just like you can only fit so much in a suitcase. Pack your spacecraft too heavy for its rocket, and it never reaches space.' },
  { art: 'panel', title: 'Keeping the lights on: Power', text: 'Your spacecraft needs electricity to work, the same way your phone needs battery. Solar panels catch sunlight, or you can use a nuclear battery that keeps working even in the dark.' },
  { art: 'camera', title: 'The tools: Instruments', text: 'Instruments are the cameras and sensors that actually do the science. Pick ones built for your mission\'s big question — a camera doesn\'t help if the question needs a radar.' },
  { art: 'shield', title: 'Staying safe: Radiation', text: 'Space is full of invisible radiation that can fry delicate electronics, a bit like sunburn for computer chips. Shielding protects your spacecraft, especially somewhere harsh like Jupiter.' },
  { art: 'storm', title: 'The real flight: things go wrong on their own', text: 'Once you launch, the flight plays out day by day. Solar storms, computer glitches and antenna outages happen whether you\'re ready or not — just like real missions. You decide when to play it safe and when to push on.' },
  { art: 'star', title: 'Scoring: earning stars', text: 'At the end you\'ll see how much science you collected, how healthy your spacecraft stayed, and how well you managed money. One star unlocks the next mission — three stars means a flawless flight. Ready?' },
];

// Why each mission matters in the real world, and who it's a good fit for — shown as a two-page briefing right before
// the build bay, every time, so nobody starts a mission without knowing what it's for or whether it's a big step up.
const WHY_IT_MATTERS = {
  m1: 'Satellites like this track melting ice, drought and shrinking coastlines year after year — like a doctor tracking a patient\'s vital signs over time, but for the whole planet.',
  m2: 'Water ice on the Moon could one day supply drinking water, breathable oxygen and rocket fuel for astronauts, so finding it matters for every Moon mission that comes after this one.',
  m3: 'Mars once had rivers and a thicker atmosphere. Working out how it lost that air helps scientists understand what makes any planet — including Earth — able to support life.',
  m4: 'Europa may hide a salty ocean under its icy shell, which makes it one of the best places in the whole solar system to search for life beyond Earth.',
};
const AUDIENCE_BY_KLASS = {
  small: 'A good first mission to try — the simplest spacecraft in the campaign to build.',
  medium: 'A step up from a first mission — you\'ll juggle more than one instrument on a tighter budget.',
  flagship: 'The biggest, most demanding build in the campaign.',
};
function missionBriefSlides(mis) {
  const obj = find(D.OBJECTIVES, mis.objective);
  return [
    { body: obj.dest, title: mis.name, text: `${mis.brief} The big question driving this mission: “${obj.question}”` },
    { art: 'star', title: 'Why this mission matters', text: `${WHY_IT_MATTERS[mis.id] || ''} ${AUDIENCE_BY_KLASS[mis.klass] || ''} Good for ages 10 and up, or anyone who's curious about space.` },
  ];
}

let deck = TUTORIAL; // the slide set currently on screen, either the onboarding tutorial or one mission's briefing
function openTutorial() { deck = TUTORIAL; state.tutorial = 0; play('step'); render(true); }
function openBrief(mis) { deck = missionBriefSlides(mis); state.tutorial = 0; play('step'); render(true); }
function closeTutorial() { state.tutorial = null; state.tutorialSeen = true; save(); render(true); }

function tutorialOverlay() {
  const i = state.tutorial, t = deck[i], last = i === deck.length - 1;
  return `<div class="tut-overlay" role="dialog" aria-modal="true" aria-label="Mission briefing">
    <div class="tut-card frame">
      <button class="tut-skip" data-act="tut-close" aria-label="Skip">Skip</button>
      <span class="tut-art">${t.body ? `<canvas class="tut-body" width="32" height="32" data-body="${t.body}" aria-hidden="true"></canvas>` : sprite(t.art, 7)}</span>
      <h2>${esc(t.title)}</h2>
      <p>${esc(t.text)}</p>
      <div class="tut-dots" aria-hidden="true">${deck.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="tut-row">
        ${i > 0 ? `<button class="btn" data-act="tut-prev">Back</button>` : '<span></span>'}
        <button class="btn primary big" data-act="${last ? 'tut-close' : 'tut-next'}">${last ? 'Let\'s build!' : 'Next'}</button>
      </div>
    </div></div>`;
}

// ---------- Campaign ----------
const cur = () => MISSIONS[state.mission];
const stars = (id) => state.progress[id]?.stars || 0;
const unlocked = (i) => i === 0 || stars(MISSIONS[i - 1].id) >= 1;
const startDesign = (mis) => ({ ...defaultDesign(mis.objective, mis.klass), ...mis.design, name: mis.name });

// Repairs a saved build so a stale or edited save can never break the engine.
function sanitize(src, mis) {
  const base = startDesign(mis), d = { ...base, ...src, name: mis.name, objective: mis.objective, klass: mis.klass };
  for (const [key, list] of Object.entries(LISTS)) if (!find(list, d[key])) d[key] = base[key];
  if (!find(D.ORBITS[getObjective(d).dest], d.orbit)) d.orbit = base.orbit;
  const max = getClass(d).maxInstruments, list = Array.isArray(d.instruments) ? d.instruments : [];
  d.instruments = list.slice(0, max).map((id) => (find(D.INSTRUMENTS, id) ? id : null));
  const p = d.power || {};
  d.power = p.type === 'rtg' ? { type: 'rtg', areaM2: 1, units: clamp(Math.round(+p.units || 1), 1, 4) } : { type: 'solar', areaM2: clamp(+p.areaM2 || 4, 2, 60), units: 1 };
  return d;
}

function startMission(i) {
  const mis = MISSIONS[i];
  state.mission = i;
  state.design = sanitize(state.progress[mis.id]?.build || {}, mis);
  state.stage = 0; state.sel = null; state.screen = 'hub';
  state.hub = { x: ROOM_W / 2, y: ROOM_H / 2, dir: 'down', animT: 0, dwell: 0, dwellId: null, justEntered: 0 };
  deck = (state.tutorialSeen ? [] : TUTORIAL).concat(missionBriefSlides(mis));
  state.tutorial = 0;
  play('step'); save(); render();
}

function saveBuild() {
  const id = cur().id, prev = state.progress[id] || { stars: 0 };
  state.progress[id] = { ...prev, build: JSON.parse(JSON.stringify(state.design)) };
  save();
}

// ---------- Command deck ----------
// A small walkable room between the campaign map and the build bay. The commander walks between four consoles —
// one for each build stage — and a launch pad. Walking onto a console (or tapping it) opens it; no console is
// an obstacle, so there's nothing to get stuck on. Arrow keys, WASD, and an on-screen D-pad all drive the same walk.
const ROOM_W = 200, ROOM_H = 120;
const STATIONS = [
  { id: 0, x: 34, y: 34, label: 'Launch', sprite: STAGE_SPRITE[0] },
  { id: 1, x: 100, y: 24, label: 'Spacecraft', sprite: STAGE_SPRITE[1] },
  { id: 2, x: 166, y: 34, label: 'Ground', sprite: STAGE_SPRITE[2] },
  { id: 3, x: 166, y: 96, label: 'Operations', sprite: STAGE_SPRITE[3] },
  { id: 'launch', x: 34, y: 96, label: 'Liftoff!', sprite: 'rocket' },
];
const STATION_R = 15, HERO_R = 5, HERO_SPEED = 70; // room pixels per second
const hubPctX = (x) => (x / ROOM_W * 100).toFixed(2) + '%';
const hubPctY = (y) => (y / ROOM_H * 100).toFixed(2) + '%';
const HUB_KEYS = { up: false, down: false, left: false, right: false };
const KEY_DIR = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };

function enterStation(id) {
  if (id === 'launch') { startFlight(); return; }
  state.stage = id; state.sel = null; state.screen = 'build';
  play('step'); render();
}

function hubScreen() {
  const mis = cur(), h = state.hub;
  const stationBtn = (st) => `<button class="station" id="station-${st.id}" data-station="${st.id}" style="left:${hubPctX(st.x)};top:${hubPctY(st.y)}" aria-label="Open ${esc(st.label)}">
    ${sprite(st.sprite, 4)}<span>${esc(st.label)}</span></button>`;
  return `<header class="bar"><button class="btn ghost" data-act="map">Campaign</button>
      <div class="bar-title"><strong>${esc(mis.name)}</strong><span>Walk up to a console, or tap one, to open it</span></div>
      <button class="btn tiny" data-act="brief">Mission briefing</button>
      <button class="btn tiny" data-act="sound" aria-pressed="${state.sound}">Sound ${state.sound ? 'on' : 'off'}</button></header>
    <main class="hub-wrap">
      <figure class="hub-stage frame">
        <canvas id="hubCv" width="${ROOM_W}" height="${ROOM_H}" role="img" aria-label="Command deck"></canvas>
        ${STATIONS.map(stationBtn).join('')}
        <div class="hero" id="heroChar" style="left:${hubPctX(h.x)};top:${hubPctY(h.y)}">${sprite('hero0', 5)}</div>
      </figure>
      <div class="pad" aria-label="Move the commander">
        <button class="pad-btn pad-up" data-dir="up" aria-label="Move up">▲</button>
        <button class="pad-btn pad-left" data-dir="left" aria-label="Move left">◀</button>
        <button class="pad-btn pad-right" data-dir="right" aria-label="Move right">▶</button>
        <button class="pad-btn pad-down" data-dir="down" aria-label="Move down">▼</button>
      </div>
      <p class="fine hub-hint">Arrow keys, WASD, or the pad to walk — or just tap a console to jump straight there.</p>
    </main>`;
}

// Draws the room's floor and walls once; the character moves as a separate HTML element, not on this canvas.
function paintHubRoom(cv) {
  const g = cv.getContext('2d');
  g.clearRect(0, 0, ROOM_W, ROOM_H);
  g.fillStyle = '#15171c'; g.fillRect(0, 0, ROOM_W, ROOM_H);
  g.strokeStyle = 'rgba(58,65,80,.5)'; g.lineWidth = 1;
  for (let x = 0; x <= ROOM_W; x += 10) { g.beginPath(); g.moveTo(x + 0.5, 12); g.lineTo(x + 0.5, ROOM_H); g.stroke(); }
  for (let y = 12; y <= ROOM_H; y += 10) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(ROOM_W, y + 0.5); g.stroke(); }
  g.fillStyle = '#0b0c0f'; g.fillRect(0, 0, ROOM_W, 12);
  g.fillStyle = '#2c313b'; g.fillRect(0, 11, ROOM_W, 1);
  g.fillStyle = '#efe7d6';
  for (let i = 0; i < 10; i++) g.fillRect(10 + i * 19, 5, 1, 1);
  g.strokeStyle = 'rgba(111,210,224,.35)';
  STATIONS.forEach((st) => { g.beginPath(); g.arc(st.x, st.y, STATION_R, 0, Math.PI * 2); g.stroke(); });
}

let hubRaf = 0, hubLastTs = 0;
function startHubLoop() { if (!hubRaf) { hubLastTs = 0; if (state.hub) state.hub.justEntered = 0.6; hubRaf = requestAnimationFrame(hubTick); } }
function stopHubLoop() { if (hubRaf) cancelAnimationFrame(hubRaf); hubRaf = 0; Object.keys(HUB_KEYS).forEach((k) => { HUB_KEYS[k] = false; }); }

function hubTick(ts) {
  const h = state.hub;
  if (state.screen !== 'hub' || state.tutorial !== null || !h) { hubRaf = 0; return; }
  const dt = hubLastTs ? Math.min(0.1, (ts - hubLastTs) / 1000) : 0;
  hubLastTs = ts;
  if (h.justEntered > 0) h.justEntered -= dt;
  const dx = (HUB_KEYS.right ? 1 : 0) - (HUB_KEYS.left ? 1 : 0), dy = (HUB_KEYS.down ? 1 : 0) - (HUB_KEYS.up ? 1 : 0);
  const moving = dx !== 0 || dy !== 0;
  if (moving) {
    const len = Math.hypot(dx, dy) || 1;
    h.x = clamp(h.x + (dx / len) * HERO_SPEED * dt, HERO_R + 2, ROOM_W - HERO_R - 2);
    h.y = clamp(h.y + (dy / len) * HERO_SPEED * dt, 14, ROOM_H - HERO_R - 2);
    h.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    h.animT += dt;
  } else h.animT = 0;
  const heroEl = document.getElementById('heroChar');
  if (heroEl) {
    heroEl.style.left = hubPctX(h.x); heroEl.style.top = hubPctY(h.y);
    const frame = moving && Math.floor(h.animT * 6) % 2 === 1 ? 'hero1' : 'hero0', flip = h.dir === 'left';
    const key = frame + (flip ? 'f' : '');
    if (heroEl.dataset.frame !== key) { heroEl.dataset.frame = key; heroEl.innerHTML = sprite(frame, 5); heroEl.classList.toggle('flip', flip); }
  }
  let near = null, nearD = STATION_R;
  for (const st of STATIONS) { const d = Math.hypot(st.x - h.x, st.y - h.y); if (d < nearD) { near = st; nearD = d; } }
  STATIONS.forEach((st) => { const el = document.getElementById(`station-${st.id}`); if (el) el.classList.toggle('near', near === st); });
  if (near && h.justEntered <= 0) {
    if (h.dwellId === near.id) { h.dwell += dt; if (h.dwell > 0.35) { h.dwell = 0; h.dwellId = null; enterStation(near.id); return; } }
    else { h.dwellId = near.id; h.dwell = 0; }
  } else { h.dwellId = null; h.dwell = 0; }
  hubRaf = requestAnimationFrame(hubTick);
}

window.addEventListener('keydown', (e) => {
  if (state.screen !== 'hub' || state.tutorial !== null) return;
  const d = KEY_DIR[e.key.toLowerCase()];
  if (d) { HUB_KEYS[d] = true; e.preventDefault(); }
});
window.addEventListener('keyup', (e) => { const d = KEY_DIR[e.key.toLowerCase()]; if (d) HUB_KEYS[d] = false; });

// On-screen D-pad: pointer-based so it works for touch and mouse alike.
app.addEventListener('pointerdown', (ev) => {
  const el = ev.target.closest('.pad-btn');
  if (el) { HUB_KEYS[el.dataset.dir] = true; el.setPointerCapture?.(ev.pointerId); }
});
app.addEventListener('pointerup', (ev) => { const el = ev.target.closest('.pad-btn'); if (el) HUB_KEYS[el.dataset.dir] = false; });
app.addEventListener('pointerleave', (ev) => { const el = ev.target.closest?.('.pad-btn'); if (el) HUB_KEYS[el.dataset.dir] = false; }, true);

// ---------- Build bay ----------
function slotsFor(stage, d) {
  if (stage === 0) return [{ key: 'launcher', label: 'Launcher' }, { key: 'orbit', label: 'Destination orbit' }, { key: 'propulsion', label: 'Engine' }];
  if (stage === 1) return [
    ...Array.from({ length: getClass(d).maxInstruments }, (_, i) => ({ key: 'payload', index: i, label: `Instrument ${i + 1}` })),
    { key: 'power', label: 'Power' }, { key: 'antenna', label: 'Dish' }, { key: 'tx', label: 'Transmitter' },
    { key: 'shielding', label: 'Radiation shield' }, { key: 'redundancy', label: 'Backup systems' }];
  if (stage === 2) return [{ key: 'ground', label: 'Ground station' }, { key: 'tracking', label: 'Tracking plan' }];
  return [{ key: 'team', label: 'Science team' }, { key: 'pipeline', label: 'Data pipeline' }, { key: 'policy', label: 'Data access' }];
}
const slotId = (s) => (s.index === undefined ? s.key : `${s.key}:${s.index}`);

// The id of what a slot holds right now, used to pick its picture.
function slotValue(d, s) {
  if (s.key === 'payload') return d.instruments[s.index];
  if (s.key === 'power') return d.power.type === 'rtg' ? `rtg:${d.power.units}` : 'solar';
  return d[s.key];
}

// Each part has a picture. Instruments use their own, and an empty slot shows a cross.
function itemSprite(key, id) {
  if (key === 'payload') return !id || id === '__none' ? 'cross' : INSTRUMENT_SPRITE[id] || 'camera';
  if (key === 'power') return String(id || '').startsWith('rtg') ? 'rtg' : 'panel';
  return PART_SPRITE[key] || 'star';
}

function valueOf(d, s) {
  if (s.key === 'orbit') return getOrbit(d).name;
  if (s.key === 'payload') { const id = d.instruments[s.index]; return id ? find(D.INSTRUMENTS, id).name : 'Empty'; }
  if (s.key === 'power') return d.power.type === 'solar' ? `${d.power.areaM2} m² solar array` : `${d.power.units} radioisotope generator${d.power.units > 1 ? 's' : ''}`;
  return find(LISTS[s.key] || D.ORBITS.earth, d[s.key])?.name || '';
}

// The design with one part changed. Never mutates the input.
function withPart(d, key, id, index) {
  const n = { ...d, instruments: [...d.instruments], power: { ...d.power } };
  if (key === 'payload') {
    const arr = Array.from({ length: Math.max(d.instruments.length, index + 1) }, (_, i) => d.instruments[i] ?? null);
    arr.forEach((x, i) => { if (x === id && i !== index) arr[i] = null; });
    arr[index] = id;
    while (arr.length && arr.at(-1) === null) arr.pop();
    n.instruments = arr;
  } else if (key === 'power') {
    n.power = id.startsWith('solar:') ? { type: 'solar', areaM2: +id.slice(6), units: 1 } : { type: 'rtg', areaM2: 1, units: +id.slice(4) };
  } else n[key] = id;
  return n;
}

// Every choice for one slot, each with the status of its check and the budget change it would cause.
function optionsFor(d, s, m) {
  const base = m.cost, chk = CHECK_FOR[s.key], obj = getObjective(d);
  const item = (id, name, meta, next, on) => {
    const r = evaluate(next), c = chk ? r.checks.find((x) => x.id === chk) : null;
    return { id, name, meta, on, status: c ? c.ok : 'none', delta: Math.round(r.cost - base) };
  };
  switch (s.key) {
    case 'launcher': return [{ items: D.LAUNCHERS.map((l) => item(l.id, l.name, [`${fmt(l.leoKg)} kg to low orbit`], withPart(d, 'launcher', l.id), d.launcher === l.id)) }];
    case 'orbit': return [{ items: D.ORBITS[obj.dest].map((o) => item(o.id, o.name, [o.desc], { ...d, orbit: o.id }, d.orbit === o.id)) }];
    case 'propulsion': return [{ items: D.PROPULSION.map((p) => item(p.id, p.name, [`Isp ${p.isp} s`], withPart(d, 'propulsion', p.id), d.propulsion === p.id)) }];
    case 'payload': {
      const items = [{ id: '__none', name: 'Leave the slot empty', meta: ['Saves mass, power and cost'] }].map((o) => item(o.id, o.name, o.meta, withPart(d, 'payload', null, s.index), d.instruments[s.index] == null));
      for (const i of D.INSTRUMENTS) {
        const f = i.fit[obj.id] || 0, fit = f >= 1 ? 'Built for this question' : f > 0 ? 'Partly useful' : 'Wrong tool for this question';
        items.push(item(i.id, i.name, [fit, `${i.massKg} kg`, `${i.powerW} W`, `${fmtGb(i.gbDay)} a day`, ...(i.needs ? [`Needs the ${find(D.INSTRUMENTS, i.needs).name.toLowerCase()}`] : [])],
          withPart(d, 'payload', i.id, s.index), d.instruments[s.index] === i.id));
      }
      return [{ items }];
    }
    case 'power': {
      const orb = getOrbit(d), sol = [2, 4, 8, 12, 16, 24, 32, 48, 60].map((a) => item(`solar:${a}`, `${a} m² solar array`,
        [`${fmt(a * m.t.fluxWm2 * C.arrayEff * orb.sunFrac)} W here`, `${fmt(a * C.arrayKgM2)} kg`, `${+(a * C.solarCostM2).toFixed(1)} pts`],
        withPart(d, 'power', `solar:${a}`), d.power.type === 'solar' && d.power.areaM2 === a));
      const rtg = [1, 2, 3, 4].map((u) => item(`rtg:${u}`, `${u} radioisotope generator${u > 1 ? 's' : ''}`,
        [`${u * C.rtgW} W anywhere`, `${u * C.rtgKg} kg`], withPart(d, 'power', `rtg:${u}`), d.power.type === 'rtg' && d.power.units === u));
      return [{ title: 'Solar arrays', items: sol }, { title: 'Radioisotope generators', items: rtg }];
    }
    case 'antenna': return [{ items: D.ANTENNAS.map((a) => item(a.id, a.name, [`${a.massKg} kg`], { ...d, antenna: a.id }, d.antenna === a.id)) }];
    case 'tx': return [{ items: D.TRANSMITTERS.map((x) => item(x.id, x.name, [`Draws ${fmt(x.rfW / C.txEff)} W`, `${x.massKg} kg`], { ...d, tx: x.id }, d.tx === x.id)) }];
    case 'shielding': return [{ items: D.SHIELDING.map((x) => item(x.id, x.name, [SHIELD_NOTE[x.level], `${x.massKg} kg`], { ...d, shielding: x.id }, d.shielding === x.id)) }];
    case 'redundancy': return [{ items: D.REDUNDANCY.map((r) => item(r.id, r.name, r.level ? [`+${pct(r.massFrac)} mass`, `+${pct(r.costFrac)} spacecraft cost`] : ['No spares'], { ...d, redundancy: r.id }, d.redundancy === r.id)) }];
    case 'ground': return [{ items: D.GROUND.map((g) => { const r = evaluate({ ...d, ground: g.id }); return item(g.id, g.name, [`${fmtRate(r.rateBps)} link`, `${fmtGb(r.dataCapGb)} a day`, `${g.costPerYear} pts a year`], { ...d, ground: g.id }, d.ground === g.id); }) }];
    case 'tracking': return [{ items: D.TRACKING.map((t) => item(t.id, t.name, [`${fmt(evaluate({ ...d, tracking: t.id }).contactH)} h of contact a day`], { ...d, tracking: t.id }, d.tracking === t.id)) }];
    case 'team': return [{ items: D.TEAMS.map((t) => item(t.id, t.name, [`Science ×${t.mult}`], { ...d, team: t.id }, d.team === t.id)) }];
    case 'pipeline': return [{ items: D.PIPELINES.map((p) => item(p.id, p.name, [`${pct(p.frac)} of data usable`], { ...d, pipeline: p.id }, d.pipeline === p.id)) }];
    case 'policy': return [{ items: D.POLICIES.map((p) => item(p.id, p.name, [`Science ×${p.mult}`], { ...d, policy: p.id }, d.policy === p.id)) }];
    default: return [];
  }
}

function applyPart(key, id, index) {
  state.design = withPart(state.design, key, id, index);
  saveBuild(); play('click'); render(true);
}

// Pixel pieces shared by every screen.
const pstar = (on, delay = 0, scale = 4) => `<span class="pstar ${on ? 'on' : ''}" style="--d:${delay}s" aria-hidden="true">${sprite('star', scale, { w: on ? '#ffc247' : '#3a4150' })}</span>`;
const starsRow = (n) => `<span class="pstars" role="img" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => pstar(i <= n)).join('')}</span>`;
const hp = (v, cls) => `<div class="hp"><i class="${cls}" style="--v:${clamp(v, 0, 100).toFixed(1)}"></i></div>`;

function slotTile(d, m, s) {
  const id = slotId(s), chk = CHECK_FOR[s.key], light = chk ? m.checks.find((c) => c.id === chk).ok : 'none', sel = state.sel === id;
  return `<button class="slot ${light} ${sel ? 'sel' : ''}" data-slot="${id}" aria-pressed="${sel}">
    <span class="slot-art">${sprite(itemSprite(s.key, slotValue(d, s)), 4)}</span>
    <span class="slot-text"><strong>${esc(s.label)}</strong><span>${esc(valueOf(d, s))}</span></span>
    <i class="led ${light}" aria-hidden="true"></i><span class="sr">${LIGHT_WORD[light]}</span></button>`;
}

function partBtn(o, s) {
  const delta = o.delta === 0 ? 'Budget unchanged' : `Budget ${signed(o.delta)} pts`;
  return `<button class="item ${o.on ? 'on' : ''}" data-part="${esc(o.id)}" data-key="${s.key}" ${s.index !== undefined ? `data-index="${s.index}"` : ''} aria-pressed="${o.on}">
    <span class="item-art">${sprite(itemSprite(s.key, o.id), 5)}</span>
    <span class="item-body">
      <span class="item-top"><strong>${esc(o.name)}</strong>${TAG[o.status] ? `<em class="tag ${o.status}">${TAG[o.status]}</em>` : ''}</span>
      <span class="stats">${o.meta.map((x) => `<span>${esc(x)}</span>`).join('')}</span>
      <span class="delta ${o.delta > 0 ? 'up' : o.delta < 0 ? 'down' : ''}">${delta}</span>
    </span></button>`;
}

// Plain-English translations of the five engineering checks, for anyone who has never built a spacecraft before.
const SIMPLE_CHECK = {
  mass: 'Can the rocket actually lift this? It\'s like trying to fit everything into a suitcase that only holds so much.',
  payload: 'This is your science toolkit — the cameras and sensors that actually answer the mission question.',
  power: 'Electricity for your spacecraft, like a phone battery. Use more than you make, and things switch off.',
  link: 'How you talk to Earth and send pictures and data home — like a Wi-Fi signal that only works sometimes.',
  rad: 'Space is full of invisible radiation that can fry delicate electronics, like sunburn for computer chips.',
};
const checkRow = (c) => `<li class="${c.ok}">${sprite(CHECK_SPRITE[c.id] || 'star', 3)}
  <div><strong>${esc(c.label)}</strong><span>${esc(c.text)}</span>${SIMPLE_CHECK[c.id] ? `<span class="simple">${esc(SIMPLE_CHECK[c.id])}</span>` : ''}${hp(HEALTH[c.ok], c.ok)}</div></li>`;

// ---------- Flight ----------
// The flight is a simulation. The clock runs one mission day at a time, and the crew can switch instruments and safe mode
// between days. The rules live in sim.js; this section draws the scene, the gauges, the cartridges and the log.
const SIM_SECONDS = 150; // a whole flight at 1x
const SPEEDS = [1, 2, 4];
const SW = 192, SH = 112; // the scene is drawn at this size and scaled up with hard pixels
const P0 = { x: 30, y: 72 }, P1 = { x: 94, y: -16 }, P2 = { x: 150, y: 44 }; // Earth, the control point, the destination
const pctX = (x) => (x / SW * 100).toFixed(2) + '%';
const pctY = (y) => (y / SH * 100).toFixed(2) + '%';
const bez = (t) => ({ x: (1 - t) ** 2 * P0.x + 2 * (1 - t) * t * P1.x + t * t * P2.x, y: (1 - t) ** 2 * P0.y + 2 * (1 - t) * t * P1.y + t * t * P2.y });
const ease = (x) => x * x * (3 - 2 * x);
const STARS = (() => { const r = rng(11); return Array.from({ length: 110 }, () => ({ x: (r() * SW) | 0, y: (r() * SH) | 0, c: r() < 0.12 ? '#efe7d6' : r() < 0.5 ? '#4a5160' : '#2c313b' })); })();
const logItem = (l) => `<li class="${l.kind}"><span class="ph">${esc(l.phase)}</span>${esc(l.text)}</li>`;
const setText = (id, v) => { const el = document.getElementById(id); if (el && el.textContent !== v) el.textContent = v; };
const instSprite = (name) => INSTRUMENT_SPRITE[D.INSTRUMENTS.find((i) => i.name === name)?.id] || 'camera';

function startFlight() {
  const design = JSON.parse(JSON.stringify(state.design)), seed = (Math.random() * 1e9) | 0 || 1;
  saveBuild();
  state.flight = { sim: createFlight(design, seed), speed: 1, paused: false, acc: 0, done: false, note: '', ctrlSig: '', tlKey: '' };
  state.screen = 'flight'; state.result = null;
  play('launch'); render(); startLoop();
}

const gauge = (name, art, vid, bid) => `<div class="gauge" title="${esc(SIMPLE_SYS[vid] || '')}"><div class="gauge-head">${sprite(art, 3)}<span>${name}</span><b id="${vid}"></b></div>
  <div class="hp"><i id="${bid}"></i></div></div>`;
// Hover text in plain language for each system readout during the flight.
const SIMPLE_SYS = {
  'g-pow': 'Electricity the spacecraft is making and using right now — like a battery gauge.',
  'g-buf': 'Data waiting on board to be sent home. If this fills up, new data gets thrown away.',
  's-link': 'Whether the spacecraft can talk to Earth today and how much it can send.',
  's-comp': 'The onboard computer — the spacecraft\'s brain. If it crashes, you lose control for a while.',
  's-storm': 'Space weather. Strong solar storms can scramble electronics, like a power surge.',
  's-point': 'How steadily the spacecraft can aim its instruments and antenna at the right target.',
  's-ground': 'Antenna dishes on Earth listening for the spacecraft\'s signal.',
};
const sysTile = (art, label, id) => `<li title="${esc(SIMPLE_SYS[id] || '')}">${sprite(art, 3)}<div><span>${label}</span><b id="${id}"></b></div></li>`;
const finishHtml = (sim) => `<section class="dialog finish"><h2>${sim.alive ? 'The science period is over' : 'Contact is lost'}</h2>
  <p>${sim.alive ? 'The spacecraft has finished its science. Time to see what came home.' : 'The spacecraft stopped answering. The debrief shows why.'}</p>
  <button class="btn primary big" data-act="debrief">See the debrief</button></section>`;

function flightScreen() {
  const f = state.flight, sim = f.sim, mis = cur(), dest = sim.dest;
  const rDest = { earth: 14, l2: 8, moon: 7, mars: 7, jupiter: 11 }[dest] || 7; // the destination's drawn radius, in scene pixels
  return `<header class="bar"><div class="bar-title"><strong>${esc(mis.name)}</strong><span>${esc(sim.m.obj.question)}</span></div>
      <button class="btn tiny" data-act="sound" aria-pressed="${state.sound}">Sound ${state.sound ? 'on' : 'off'}</button></header>
    <main class="flight">
      <div class="flight-main">
        <figure class="scene frame">
          <canvas id="scene" width="${SW}" height="${SH}" role="img" aria-label="Schematic of the path from Earth to ${esc(BODY_NAME[dest])}"></canvas>
          <span class="map-label" style="left:${pctX(P0.x)};top:${pctY(P0.y + 13 + 5)}">Earth</span>
          <span class="map-label" style="left:${pctX(P2.x)};top:${pctY(P2.y + rDest + 5)}">${esc(BODY_NAME[dest])}</span>
          <div class="scene-hud"><span class="plate" id="phase"></span><span class="plate" id="day"></span></div>
          <figcaption class="scene-note">Schematic, not to scale</figcaption>
        </figure>
        <div class="tl frame" aria-hidden="true"><div class="tl-track"><i id="tl-prog"></i><span id="tl-marks"></span></div></div>
        ${f.done ? finishHtml(sim) : ''}
        <h2 class="log-title">Message log, newest first</h2>
        <ol class="log" id="log"></ol>
      </div>
      <aside class="side frame" id="panel" aria-label="Spacecraft systems">
        <div class="diag" aria-label="Quick system diagnostic">
          <div class="diag-row">
            <i class="diag-badge" id="diag-pow" title="Power system"><span>!</span></i>
            <i class="diag-badge" id="diag-comp" title="Onboard computer"><span>!</span></i>
          </div>
          <canvas id="diagShip" class="diag-ship" width="64" height="88" aria-hidden="true"></canvas>
          <div class="diag-row">
            <i class="diag-badge" id="diag-point" title="Pointing and aiming"><span>!</span></i>
            <i class="diag-badge" id="diag-link" title="Ground link"><span>!</span></i>
          </div>
          <p class="diag-status">Status: <b id="diag-status">GOOD</b></p>
        </div>
        <div class="gauges">
          ${gauge('Power', 'panel', 'g-pow', 'g-pow-bar')}
          ${gauge('Data recorder', 'computer', 'g-buf', 'g-buf-bar')}
        </div>
        <ul class="sys">
          ${sysTile('dish', 'Downlink', 's-link')}
          ${sysTile('computer', 'Computer', 's-comp')}
          ${sysTile('storm', 'Solar weather', 's-storm')}
          ${sysTile('wheel', 'Pointing', 's-point')}
          ${sysTile('ground', 'Ground', 's-ground')}
        </ul>
        <p class="conj" id="s-conj" hidden>Mars is behind the Sun. Commands are blocked and no data goes down until the window closes.</p>
        <div id="controls"></div>
      </aside>
    </main>`;
}

const instrState = (x, s) => (x.shed ? 'Shed by autonomy' : x.eff ? 'Running' : !x.on ? 'Off' : !s.arrived ? 'Waits for arrival' : s.safe ? 'Safe mode' : s.computerDown ? 'Computer down' : 'Standby');

// Rebuilt only when a cartridge or a command changes, so a click is never lost to a redraw.
function controlsHtml(f, s) {
  const dis = s.finished ? 'disabled' : '';
  const carts = s.instrs.length
    ? `<ul class="carts">${s.instrs.map((x, i) => `<li><button class="cart ${x.eff ? 'run' : x.shed ? 'shed' : ''}" role="switch" aria-checked="${x.on}" data-act="instr" data-i="${i}" ${dis}>
        <span class="cart-art">${sprite(instSprite(x.name), 4)}</span>
        <span class="cart-text"><strong>${esc(x.name)}</strong><span>${fmt(x.W)} W · ${fmtGb(x.gbDay)} a day</span><em>${instrState(x, s)}</em></span>
        <i class="led ${x.eff ? 'ok' : x.shed ? 'warn' : ''}" aria-hidden="true"></i></button></li>`).join('')}</ul>`
    : '<p class="fine">No instruments are fitted, so the spacecraft collects no science.</p>';
  return `<section class="block"><h2>Instruments</h2>${carts}</section>
    <section class="block"><h2>Commands</h2>
      <button class="btn wide ${s.safe ? 'primary' : ''}" data-act="safe" aria-pressed="${s.safe}" ${dis}>${sprite('shield', 3)} Safe mode ${s.safe ? 'on' : 'off'}</button>
      <p class="fine">Safe mode powers instruments down and makes a storm less likely to upset the computer. No science is collected while it is on.</p>
      <div class="clock"><button class="btn" data-act="pause" ${dis}>${f.paused ? 'Resume' : 'Pause'}</button>
        <button class="btn" data-act="speed" ${dis}>Speed ${f.speed}×</button></div>
      <p class="note" aria-live="polite">${esc(f.note || '')}</p></section>`;
}

function paintGauges(s) {
  const fill = (id, w, cls) => { const el = document.getElementById(id); if (!el) return; el.style.setProperty('--v', clamp(w, 0, 100).toFixed(1)); el.className = cls; };
  setText('g-pow', `${fmt(s.load)} of ${fmt(s.supply)} W`);
  const pw = s.supply > 0 ? (s.load / s.supply) * 100 : 100;
  fill('g-pow-bar', pw, pw > 100 ? 'bad' : pw > 85 ? 'warn' : 'ok');
  setText('g-buf', `${fmt(s.buffer)} of ${s.cap} Gb`);
  const bw = (s.buffer / s.cap) * 100;
  fill('g-buf-bar', bw, bw >= 99 ? 'bad' : bw > 70 ? 'warn' : 'ok');
  setText('s-link', s.conj ? 'Blocked by Mars conjunction' : s.computerDown ? 'Offline while the computer restarts'
    : s.contact > 0 ? `${fmtGb(s.capToday)} a day, ${fmt(s.contact)} h of contact` : 'No ground contact today');
  setText('s-comp', s.computerLabel);
  setText('s-storm', s.stormLabel);
  setText('s-point', `${pct(s.pointing)}, ${s.spares} spare wheel${s.spares === 1 ? '' : 's'}`);
  setText('s-ground', s.outage ? `${s.sites} of ${s.gndSites} antennas up, one down` : `${s.gndSites} antenna${s.gndSites === 1 ? '' : 's'} up`);
  const conj = document.getElementById('s-conj'); if (conj) conj.hidden = !s.conj;
}

function paintTimeline(f, s) {
  const prog = document.getElementById('tl-prog');
  if (prog) prog.style.width = ((s.day / s.end) * 100).toFixed(2) + '%';
  const key = `${s.marks.length}:${s.conjWindows.length}`;
  if (key === f.tlKey) return;
  f.tlKey = key;
  const at = (t) => ((t / s.end) * 100).toFixed(2) + '%';
  const box = document.getElementById('tl-marks');
  if (box) box.innerHTML = s.conjWindows.map((w) => `<b class="tl-conj" style="left:${at(w.start)};width:${((w.days / s.end) * 100).toFixed(2)}%" title="Mars conjunction"></b>`).join('')
    + s.marks.map((mk) => `<b class="tl-mark ${mk.kind}" style="left:${at(mk.t)}" title="${mk.kind === 'storm' ? 'Solar storm' : 'Reaction-wheel fault'}"></b>`).join('');
}

function syncLog(f) {
  const el = document.getElementById('log');
  if (el && el.childElementCount !== f.sim.log.length) el.innerHTML = [...f.sim.log].reverse().map(logItem).join('');
}

function paintFlight() {
  const f = state.flight, s = snapshot(f.sim);
  const sig = JSON.stringify([f.paused, f.speed, f.note, s.safe, s.finished, s.arrived, s.computerDown, s.instrs.map((x) => [x.on, x.eff, x.shed])]);
  if (sig !== f.ctrlSig) { f.ctrlSig = sig; const box = document.getElementById('controls'); if (box) box.innerHTML = controlsHtml(f, s); }
  paintGauges(s); paintTimeline(f, s); syncLog(f); paintDiag(f, s);
  setText('phase', s.phase);
  setText('day', `Day ${Math.floor(s.day)} of ${s.end}`);
}

function flightNote(r) { state.flight.note = r.msg; play(r.ok ? 'click' : 'warn'); render(true); }

// A compact repair-panel readout: four alert badges that light up over whichever systems are in trouble right now,
// a wireframe ship in the middle, and one plain word for how the mission is doing overall.
function paintDiag(f, s) {
  const badge = (id, bad) => { const el = document.getElementById(id); if (el) el.classList.toggle('on', !!bad); };
  const powerBad = s.supply > 0 && s.load > s.supply;
  const compBad = s.computerDown;
  const pointBad = s.pointing < 0.95;
  const linkBad = !!s.conj || !!s.outage;
  badge('diag-pow', powerBad); badge('diag-comp', compBad); badge('diag-point', pointBad); badge('diag-link', linkBad);
  const lost = s.finished && !f.sim.alive, bad = lost || powerBad || compBad, caution = !bad && (pointBad || linkBad);
  const word = lost ? 'LOST' : bad ? 'BAD' : caution ? 'CAUTION' : 'GOOD';
  const el = document.getElementById('diag-status');
  if (el) { el.textContent = word; el.className = bad ? 'bad' : caution ? 'warn' : 'ok'; }
  drawDiagShip(bad || caution);
}

// A wireframe capsule, drawn with plain line segments — a nod to a repair-panel readout, in the game's own pixel style.
function drawDiagShip(trouble) {
  const cv = document.getElementById('diagShip');
  if (!cv) return;
  const g = cv.getContext('2d'), W = 64, H = 88, cx = W / 2, top = 10, bot = H - 10, r = 16;
  g.clearRect(0, 0, W, H);
  g.strokeStyle = trouble ? 'rgba(255,93,79,.9)' : 'rgba(111,210,224,.85)';
  g.lineWidth = 1;
  const halfAt = (y) => (y < top + r ? Math.sqrt(Math.max(0, r * r - (top + r - y) ** 2))
    : y > bot - r ? Math.sqrt(Math.max(0, r * r - (y - (bot - r)) ** 2)) : r);
  g.beginPath(); g.moveTo(cx - r, top + r); g.arc(cx, top + r, r, Math.PI, 0); g.lineTo(cx + r, bot - r); g.arc(cx, bot - r, r, 0, Math.PI); g.closePath(); g.stroke();
  for (let y = top; y <= bot; y += 7) { const hw = halfAt(y); g.beginPath(); g.moveTo(cx - hw, y); g.lineTo(cx + hw, y); g.stroke(); }
  for (const frac of [-1, -0.5, 0.5, 1]) {
    g.beginPath();
    for (let y = top; y <= bot; y++) { const x = cx + frac * halfAt(y); y === top ? g.moveTo(x, y) : g.lineTo(x, y); }
    g.stroke();
  }
}

// Draws the scene on a small canvas. Everything is whole pixels; the CSS scales it up without smoothing.
// t is seconds of real time, used only to animate things that are happening right now (twinkle, pulse, data packets);
// the spacecraft's position is always driven by sim.day, never by t, so pausing the flight freezes the picture.
function drawScene(t = 0) {
  const cv = document.getElementById('scene'), f = state.flight;
  if (!cv || !f) return;
  if (cv.width !== SW) { cv.width = SW; cv.height = SH; }
  const g = cv.getContext('2d'), sim = f.sim, dest = sim.dest, u = ease(sim.day / sim.end);
  const s = snapshot(sim);
  g.fillStyle = '#0b0c0f'; g.fillRect(0, 0, SW, SH);
  for (const st of STARS) { g.globalAlpha = st.c === '#efe7d6' ? 0.55 + 0.45 * Math.sin(t * 2 + st.x * 7 + st.y * 3) : 1; g.fillStyle = st.c; g.fillRect(st.x, st.y, 1, 1); }
  g.globalAlpha = 1;

  // The planned path is dotted, the flown part is solid.
  g.fillStyle = '#3a4150';
  for (let i = 0; i <= 120; i += 3) { const q = bez(i / 120); g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
  const N = Math.max(2, Math.round(120 * u));
  g.fillStyle = '#6fd2e0';
  for (let i = 0; i <= N; i++) { const q = bez((i / N) * u); g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }

  // Events sit on the path where they happened. A storm still in effect today flickers.
  for (const mk of sim.marks) {
    const q = bez(ease(mk.t / sim.end)), live = mk.kind === 'storm' && Math.abs(mk.t - sim.day) < 2;
    if (live && Math.sin(t * 14) < 0) continue;
    drawSprite(g, mk.kind === 'storm' ? 'storm' : 'wheel', Math.round(q.x) - 4, Math.round(q.y) - 10);
  }

  // Earth, with a few land pixels.
  discPx(g, P0.x, P0.y, 13, PLANET.earth.b, PLANET.earth.B);
  g.fillStyle = '#8fd694'; g.fillRect(P0.x - 7, P0.y - 5, 5, 3); g.fillRect(P0.x + 2, P0.y + 1, 4, 4);

  // The destination. A faint pulsing ring once the spacecraft has arrived shows the science orbit is active.
  const destR = { earth: 14, l2: 4, moon: 7, mars: 7, jupiter: 11 }[dest] || 7;
  if (dest === 'earth') {
    g.fillStyle = '#8fd694';
    for (let a = 0; a < 24; a++) { const th = (a / 24) * Math.PI * 2; g.fillRect(Math.round(P2.x + Math.cos(th) * 14), Math.round(P2.y + Math.sin(th) * 14), 1, 1); }
  } else if (dest === 'l2') {
    drawSprite(g, 'telescope', P2.x - 4, P2.y - 4);
  } else {
    const p = PLANET[dest] || PLANET.moon;
    discPx(g, P2.x, P2.y, destR, p.b, p.B);
  }
  if (s.arrived && !s.finished) {
    const ringR = destR + 4 + Math.sin(t * 1.6) * 1.5;
    g.strokeStyle = 'rgba(111,210,224,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(P2.x, P2.y, ringR, 0, Math.PI * 2); g.stroke();
  }

  // A live downlink: packets travel from the spacecraft toward Earth while there is ground contact today.
  const c = bez(u);
  if (s.contact > 0 && !s.conj && !s.computerDown) {
    g.fillStyle = '#ffc247';
    for (let k = 0; k < 3; k++) {
      const ph = ((t * 0.6 + k / 3) % 1), x = c.x + (P0.x - c.x) * ph, y = c.y + (P0.y - c.y) * ph;
      g.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }

  // The spacecraft, with a flickering engine flame while under power (still thrusting toward the destination).
  if (!s.finished && u < 1) { g.fillStyle = Math.sin(t * 20) > 0 ? '#ff7a2f' : '#ffc247'; g.fillRect(Math.round(c.x) - 5, Math.round(c.y) + 1, 2, 2); }
  drawSprite(g, 'rocket', Math.round(c.x) - 4, Math.round(c.y) - 4);
}

// The flight loop. It advances the clock, redraws, and ends the flight when the science period is over or contact is lost.
let rafId = 0, lastTs = 0;
function startLoop() { if (!rafId) { lastTs = 0; rafId = requestAnimationFrame(tick); } }
function tick(ts) {
  const f = state.flight;
  if (state.screen !== 'flight' || !f) { rafId = 0; return; }
  const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0;
  lastTs = ts;
  const sim = f.sim;
  if (!f.paused && !sim.finished) {
    f.acc += dt * f.speed * (sim.end / SIM_SECONDS);
    while (f.acc >= 1 && !sim.finished) { stepDay(sim); f.acc -= 1; }
  }
  if (sim.finished && !f.done) {
    f.done = true; f.paused = true;
    play(sim.alive ? 'win' : 'fail');
    rafId = 0; render(true); return;
  }
  drawScene(ts / 1000); paintFlight();
  rafId = requestAnimationFrame(tick);
}

// ---------- Debrief ----------
function commitResult() {
  const id = cur().id, r = state.result, prev = state.progress[id] || {};
  state.progress[id] = { ...prev, stars: Math.max(prev.stars || 0, starsFor(r)), best: Math.max(prev.best || 0, r.score.total) };
  save();
}

function debriefScreen() {
  const r = state.result, m = r.m, sc = r.score, n = starsFor(r), mis = cur(), next = MISSIONS[state.mission + 1];
  const rows = [['Science returned', sc.science, 45, 'telescope'], ['Engineering margins', sc.margins, 20, 'panel'], ['Budget', sc.budget, 20, 'coin'], ['Resilience', sc.resilience, 15, 'shield']];
  const cls = !r.alive ? 'fail' : n >= 2 ? 'pass' : 'warn';
  const real = m.obj.missions.map((id) => { const x = D.REAL_MISSIONS[id]; return `<p class="real"><a href="${D.SOURCES[x.src].url}" target="_blank" rel="noopener">${esc(x.name)}</a><span>${esc(x.fact)}</span></p>`; }).join('');
  return `<header class="bar"><button class="btn ghost" data-act="map">Campaign</button>
      <div class="bar-title"><strong>${esc(mis.name)}</strong><span>Debrief</span></div>
      <button class="btn tiny" data-act="sound" aria-pressed="${state.sound}">Sound ${state.sound ? 'on' : 'off'}</button></header>
    <main class="debrief">
      <section class="verdict frame ${cls}">
        <div><h1>${esc(r.outcome)}</h1><p class="total"><b>${sc.total}</b> of 100 points</p></div>
        <div class="stars-big" role="img" aria-label="${n} of 3 stars">${[1, 2, 3].map((i) => pstar(i <= n, i * 0.2, 7)).join('')}</div>
      </section>
      <div class="cols">
        <section>
          <h2>Score</h2>
          ${rows.map(([l, v, mx, art]) => { const p = (v / mx) * 100; return `<div class="score-row">${sprite(art, 3)}<span>${l}</span>${hp(p, p >= 70 ? 'ok' : p >= 40 ? 'warn' : 'bad')}<b>${v} of ${mx}</b></div>`; }).join('')}
          <h2>Final numbers</h2>
          <dl class="facts">
            <dt>Science</dt><dd>${r.science.toFixed(2)} of ${m.klass.sciFull.toFixed(1)}</dd>
            <dt>Cost</dt><dd>${fmt(m.cost)} of ${m.klass.budget} pts</dd>
            <dt>Mass margin</dt><dd>${pct(m.massMargin)}</dd>
            <dt>Power margin</dt><dd>${pct(m.powerMargin)}</dd>
            <dt>Data returned</dt><dd>${pct(r.tally.gbGen ? r.tally.gbDown / r.tally.gbGen : 0)}</dd>
            <dt>Solar storms</dt><dd>${r.tally.storms} seen, ${r.tally.upsets} upset the computer</dd>
          </dl>
        </section>
        <section>
          <h2>What the mission taught you</h2>
          <ul class="lessons">${r.lessons.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
          <h2>Real missions like yours</h2>${real}
        </section>
      </div>
      <section><h2>Message log</h2><ol class="log">${r.log.map(logItem).join('')}</ol></section>
      <div class="actions">
        <button class="btn primary big" data-act="again">Fly again</button>
        <button class="btn big" data-act="rebuild">Change the build</button>
        ${next && stars(mis.id) >= 1 ? `<button class="btn big" data-mission="${state.mission + 1}">Next: ${esc(next.name)}</button>` : ''}
        <button class="btn" data-act="map">Campaign</button>
      </div>
    </main>`;
}

// ---------- Build screen ----------
function buildScreen() {
  const d = state.design, m = evaluate(d), mis = cur(), slots = slotsFor(state.stage, d);
  const sel = slots.find((s) => slotId(s) === state.sel) || slots[0];
  state.sel = slotId(sel);
  const groups = optionsFor(d, sel, m), fails = m.checks.filter((c) => c.ok === 'fail').length;
  const bcls = m.cost > m.klass.budget ? 'fail' : m.cost > 0.95 * m.klass.budget ? 'warn' : 'pass';
  const budgetPct = clamp((m.cost / m.klass.budget) * 100, 0, 100);
  const bcolour = bcls === 'pass' ? 'ok' : bcls;
  return `<header class="bar">
      <button class="btn ghost" data-act="map">Campaign</button>
      <div class="bar-title"><strong>${esc(mis.name)}</strong><span>${esc(getObjective(d).question)}</span></div>
      <span class="chip ${bcls}">Budget ${fmt(m.cost)} / ${m.klass.budget}</span>
      <button class="btn tiny" data-act="hub">Command deck</button>
      <button class="btn tiny" data-act="brief">Mission briefing</button>
      <button class="btn tiny" data-act="sound" aria-pressed="${state.sound}">Sound ${state.sound ? 'on' : 'off'}</button>
    </header>
    <nav class="stages" aria-label="Build stages">${STAGES.map((n, i) => `<button class="stage ${i === state.stage ? 'on' : ''} ${i < state.stage ? 'done' : ''}" data-stage="${i}" ${i === state.stage ? 'aria-current="step"' : ''}>${sprite(STAGE_SPRITE[i], 3)}<span>${i + 1}. ${n}</span></button>`).join('')}</nav>
    <main class="build">
      <section class="bay">
        <figure class="scope frame">
          <canvas id="asm" class="asm" role="img" aria-label="Drawing of the spacecraft as it is built"></canvas>
          <figcaption>${esc(valueOf(d, { key: 'launcher' }))} · launch margin ${pct(m.massMargin)} · ${fmt(m.payloadKg)} kg of instruments</figcaption>
        </figure>
        <p class="dialog brief"><span class="speaker">Mission control</span>${esc(STAGE_BRIEF[state.stage])}</p>
        <div class="rack">${slots.map((s) => slotTile(d, m, s)).join('')}</div>
        <h2 class="tray-title">${esc(sel.label)}</h2>
        ${groups.map((g) => `${g.title ? `<h3>${esc(g.title)}</h3>` : ''}<div class="items">${g.items.map((o) => partBtn(o, sel)).join('')}</div>`).join('')}
      </section>
      <aside class="systems frame" aria-label="Spacecraft systems">
        <h2>Budget</h2>
        <div class="hp budget"><i class="${bcolour}" style="--v:${budgetPct.toFixed(1)}"></i></div>
        <p class="fine">Spending ${fmt(m.cost)} of ${m.klass.budget} points. Stay under the line to keep science, margins and budget all green.</p>
        <h2>Systems</h2>
        <ul class="checks">${m.checks.map(checkRow).join('')}</ul>
        <button class="btn primary big launch" data-act="launch">${sprite('rocket', 3)} ${fails ? `Launch with ${fails} red ${fails > 1 ? 'systems' : 'system'}` : 'Launch'}</button>
      </aside>
    </main>
    <footer class="foot">${state.stage > 0 ? `<button class="btn" data-stage="${state.stage - 1}">Previous: ${STAGES[state.stage - 1]}</button>` : '<span></span>'}
      ${state.stage < 3 ? `<button class="btn primary" data-stage="${state.stage + 1}">Next: ${STAGES[state.stage + 1]}</button>` : '<span></span>'}</footer>`;
}

// ---------- Campaign map and title ----------
function mapScreen() {
  const stops = MISSIONS.map((mis, i) => {
    const open = unlocked(i), n = stars(mis.id), obj = find(D.OBJECTIVES, mis.objective), klass = find(D.CLASSES, mis.klass);
    return `<li class="stop ${open ? '' : 'locked'} ${n ? 'cleared' : ''}">
      <button class="stop-btn frame" ${open ? `data-mission="${i}"` : 'disabled'}>
        <span class="stop-top"><span class="stop-num">${i + 1}</span>
          <canvas class="body-px" width="32" height="32" data-body="${obj.dest}" aria-hidden="true"></canvas></span>
        <span class="stop-body"><strong>${esc(mis.name)}</strong><span class="q">${esc(obj.question)}</span>
          <span class="stats"><span>${klass.name} class</span><span>Budget ${obj.budget[mis.klass]}</span></span></span>
        ${starsRow(n)}
        <span class="cta">${!open ? 'Locked. Earn one star on the mission before.' : n ? 'Rebuild this mission' : 'Start the build'}</span>
      </button></li>`;
  }).join('');
  return `<header class="bar"><button class="btn ghost" data-go="title">Title</button>
      <div class="bar-title"><strong>Campaign</strong><span>${esc(state.commander)}</span></div>
      <button class="btn tiny" data-act="tutorial">How this works</button>
      <button class="btn tiny" data-act="sound" aria-pressed="${state.sound}">Sound ${state.sound ? 'on' : 'off'}</button></header>
    <main class="map">
      <h1>Four missions, one spacecraft each</h1>
      <p class="lead">Build inside the budget, then fly. The flight runs day by day: storms, failed wheels and ground outages arrive on their own, and you decide which instruments run and when to enter safe mode. Earn one star to open the next mission. Three stars means a clean flight with healthy margins and a full science return.</p>
      <ol class="chart">${stops}</ol>
    </main>`;
}

function titleScreen() {
  const any = Object.keys(state.progress).length > 0;
  return `<main class="title"><div class="title-inner">
      <canvas id="hero" class="hero" width="160" height="64" aria-hidden="true"></canvas>
      <h1 class="logo">Mission Beyond</h1>
      <p class="lead">Design a spacecraft, launch it onto the right path and fly it through solar storms, radiation belts and a ground network that drops out at the worst moment.</p>
      <nav class="menu" aria-label="Main menu">
        <button class="menu-btn primary" data-act="campaign">${any ? 'Continue the campaign' : 'Start the campaign'}</button>
        <button class="menu-btn" data-go="credits">Credits and sources</button>
        <button class="menu-btn" data-act="sound" aria-pressed="${state.sound}">Sound ${state.sound ? 'on' : 'off'}</button>
      </nav>
      <label class="field">Commander name<input type="text" maxlength="20" data-field="commander" value="${esc(state.commander)}"></label>
      <p class="fine">Trajectories use patched-conic physics with NASA fact-sheet constants. Parts, costs and budgets are game values, marked as such in the credits.</p>
    </div></main>`;
}

function creditsScreen() {
  const tagged = Object.entries(D.CONST).map(([k, v]) => `<tr><th>${k}</th><td>${v.value} ${esc(v.unit || '')}</td><td>${v.src ? `<a href="${D.SOURCES[v.src].url}" target="_blank" rel="noopener">${esc(D.SOURCES[v.src].title)}</a>${v.note ? ' — ' + esc(v.note) : ''}` : v.defined ? esc(v.defined) : '<em>Assumption:</em> ' + esc(v.assumption)}</td></tr>`).join('');
  return `<header class="bar"><button class="btn ghost" data-go="title">Title</button><div class="bar-title"><strong>Credits and sources</strong></div></header>
    <main class="credits"><h1>Where every number comes from</h1>
    <p class="lead">Each value in the game is tagged as a published source, an exact defined constant, or a game assumption. A build check fails if any value is untagged.</p>
    <h2>Sources</h2><ul class="sources">${Object.values(D.SOURCES).map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.title)}</a> <span class="pub">${esc(s.publisher)}</span><br><span class="meta">${esc(s.usedFor)}</span></li>`).join('')}</ul>
    <h2>Constants and allowances</h2><div class="tablewrap"><table class="consts"><thead><tr><th>Name</th><th>Value</th><th>Provenance</th></tr></thead><tbody>${tagged}</tbody></table></div>
    <p class="fine">Launchers, instruments, radios, ground stations, costs and budgets are generic game values, not real hardware or prices. Trajectory figures use Hohmann transfers between circular, coplanar orbits; they were not run through GMAT.</p>
    <p class="fine">Built for the 2026 NASA Space Apps Challenge “Space Mission Design Game”. Code and original content are licensed under Apache 2.0. This project was built with AI assistance (Anthropic's Claude) for code, data assembly and text. NASA does not endorse this project.</p>
    <div class="row"><button class="btn primary" data-go="title">Back to title</button></div></main>`;
}

// ---------- Pixel painting (after each render) ----------
// The sky behind every screen: a dim, sparse starfield drawn at a third of the window size.
function paintSky() {
  if (!sky) return;
  const W = Math.ceil(innerWidth / 3), H = Math.ceil(innerHeight / 3), g = sky.getContext('2d'), r = rng(7);
  sky.width = W; sky.height = H;
  g.fillStyle = '#0b0c0f'; g.fillRect(0, 0, W, H);
  const n = Math.round((W * H) / 70);
  for (let i = 0; i < n; i++) {
    const x = (r() * W) | 0, y = (r() * H) | 0, a = r();
    g.fillStyle = a > 0.94 ? '#efe7d6' : a > 0.7 ? '#4a5160' : '#2c313b';
    g.fillRect(x, y, 1, 1);
  }
}

// A planet on a 32-pixel grid. Each body gets its own marks.
function paintBody(cv, dest) {
  const g = cv.getContext('2d'); cv.width = 32; cv.height = 32; g.clearRect(0, 0, 32, 32);
  if (dest === 'l2') {
    g.fillStyle = '#6fd2e0';
    for (let a = 0; a < 40; a++) { const th = (a / 40) * Math.PI * 2; g.fillRect(Math.round(16 + Math.cos(th) * 14), Math.round(16 + Math.sin(th) * 14), 1, 1); }
    drawSprite(g, 'telescope', 12, 12);
    return;
  }
  const p = PLANET[dest] || PLANET.moon;
  discPx(g, 16, 16, dest === 'jupiter' ? 13 : dest === 'moon' ? 9 : 11, p.b, p.B);
  if (dest === 'earth') { g.fillStyle = '#8fd694'; g.fillRect(10, 11, 4, 3); g.fillRect(17, 16, 3, 4); g.fillRect(12, 20, 2, 2); }
  if (dest === 'mars') { g.fillStyle = '#efe7d6'; g.fillRect(13, 6, 6, 1); g.fillRect(14, 5, 4, 1); }
  if (dest === 'jupiter') { g.fillStyle = p.B; for (const y of [10, 14, 18, 22]) g.fillRect(4, y, 24, 1); }
  if (dest === 'moon') { g.fillStyle = p.B; g.fillRect(12, 11, 2, 2); g.fillRect(18, 17, 3, 2); g.fillRect(9, 18, 2, 2); }
}

// The title scene: Earth, a dotted transfer path and Mars, with a rocket on the way.
function paintHero(cv) {
  const W = 160, H = 64, g = cv.getContext('2d');
  cv.width = W; cv.height = H; g.clearRect(0, 0, W, H);
  const A = { x: 28, y: 44 }, B = { x: 84, y: -10 }, Cc = { x: 132, y: 22 };
  const at = (t) => ({ x: (1 - t) ** 2 * A.x + 2 * (1 - t) * t * B.x + t * t * Cc.x, y: (1 - t) ** 2 * A.y + 2 * (1 - t) * t * B.y + t * t * Cc.y });
  g.fillStyle = '#3a4150';
  for (let i = 0; i <= 80; i += 2) { const q = at(i / 80); g.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); }
  discPx(g, A.x, A.y, 14, PLANET.earth.b, PLANET.earth.B);
  g.fillStyle = '#8fd694'; g.fillRect(20, 36, 6, 4); g.fillRect(28, 42, 5, 4); g.fillRect(15, 44, 3, 3);
  discPx(g, Cc.x, Cc.y, 7, PLANET.mars.b, PLANET.mars.B);
  const c = at(0.62);
  drawSprite(g, 'rocket', Math.round(c.x) - 4, Math.round(c.y) - 4);
}

// Puts the canvases and sprites in place after each render.
function decorate() {
  app.querySelectorAll('canvas[data-body]').forEach((cv) => paintBody(cv, cv.dataset.body));
  const hero = document.getElementById('hero'); if (hero) paintHero(hero);
  const asm = document.getElementById('asm'); if (asm) paintAssembly(asm, state.design, evaluate(state.design));
  const hubCv = document.getElementById('hubCv'); if (hubCv) paintHubRoom(hubCv);
}

const SCREENS = { title: titleScreen, map: mapScreen, hub: hubScreen, build: buildScreen, flight: flightScreen, debrief: debriefScreen, credits: creditsScreen };

function render(keepScroll = false) {
  const y = window.scrollY;
  // Keep keyboard focus on the control the player just used, since the screen is rebuilt.
  const held = document.activeElement?.closest?.('[data-act]');
  const held_key = held && app.contains(held) ? [held.dataset.act, held.dataset.i] : null;
  app.innerHTML = SCREENS[state.screen]() + (state.tutorial !== null ? tutorialOverlay() : '');
  decorate();
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  if (state.screen === 'flight' && state.flight) { state.flight.ctrlSig = ''; state.flight.tlKey = ''; drawScene(); paintFlight(); }
  if (state.screen === 'hub' && state.tutorial === null) startHubLoop(); else stopHubLoop();
  if (held_key) app.querySelector(`[data-act="${held_key[0]}"]${held_key[1] !== undefined ? `[data-i="${held_key[1]}"]` : ''}`)?.focus({ preventScroll: true });
}

// ---------- Events ----------
const actions = {
  sound() { state.sound = !state.sound; setSound(state.sound); play('click'); save(); render(true); },
  campaign() { state.screen = 'map'; play('step'); save(); render(); },
  map() { state.screen = 'map'; play('click'); render(); },
  launch() { startFlight(); },
  pause() { const f = state.flight; f.paused = !f.paused; play('click'); render(true); },
  speed() { const f = state.flight; f.speed = SPEEDS[(SPEEDS.indexOf(f.speed) + 1) % SPEEDS.length]; play('click'); render(true); },
  instr(el) { flightNote(command(state.flight.sim, { type: 'instr', i: +el.dataset.i })); },
  safe() { flightNote(command(state.flight.sim, { type: 'safe' })); },
  debrief() {
    const f = state.flight;
    state.result = scoreFlight(f.sim);
    commitResult(); state.screen = 'debrief';
    play(!state.result.alive ? 'fail' : starsFor(state.result) >= 2 ? 'win' : 'warn'); render();
  },
  again() { startFlight(); },
  rebuild() { state.screen = 'build'; state.stage = 0; state.sel = null; play('click'); render(); },
  hub() {
    state.screen = 'hub'; state.sel = null;
    if (!state.hub) state.hub = { x: ROOM_W / 2, y: ROOM_H / 2, dir: 'down', animT: 0, dwell: 0, dwellId: null, justEntered: 0 };
    // Step the commander away from the console just left, so walking straight back in doesn't instantly retrigger it.
    const st = STATIONS.find((s) => s.id === state.stage);
    if (st) { state.hub.x = clamp(st.x, HERO_R + 2, ROOM_W - HERO_R - 2); state.hub.y = clamp(st.y + 22, 14, ROOM_H - HERO_R - 2); }
    state.hub.justEntered = 0.6;
    play('click'); render();
  },
  tutorial() { openTutorial(); },
  brief() { openBrief(cur()); },
  'tut-next'() { state.tutorial++; play('click'); render(true); },
  'tut-prev'() { state.tutorial--; play('click'); render(true); },
  'tut-close'() { closeTutorial(); },
};

app.addEventListener('click', (ev) => {
  const el = ev.target.closest('button');
  if (!el || el.disabled) return;
  const ds = el.dataset;
  if (ds.act) return actions[ds.act]?.(el);
  if (ds.go) { state.screen = ds.go; play('click'); return render(); }
  if (ds.mission !== undefined) return startMission(+ds.mission);
  if (ds.station !== undefined) { const id = ds.station === 'launch' ? 'launch' : +ds.station; play('click'); return enterStation(id); }
  if (ds.stage !== undefined) { state.stage = +ds.stage; state.sel = null; play('click'); return render(true); }
  if (ds.slot !== undefined) { state.sel = ds.slot; play('click'); return render(true); }
  if (ds.part !== undefined) {
    const id = ds.part === '__none' ? null : ds.part;
    return applyPart(ds.key, id, ds.index === undefined ? undefined : +ds.index);
  }
});

app.addEventListener('input', (ev) => {
  if (ev.target.dataset.field === 'commander') { state.commander = ev.target.value.slice(0, 20) || 'Commander'; save(); }
});

window.addEventListener('resize', paintSky);

// ---------- Start ----------
load();
setSound(state.sound);
paintSky();
render();
