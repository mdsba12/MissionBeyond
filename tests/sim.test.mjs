// Flight simulation: starter builds fly without help, the crew's commands change the outcome, and a seed replays exactly.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlight, stepDay, command, snapshot, runFlight } from '../js/sim.js';
import { starsFor, defaultDesign } from '../js/engine.js';
import { MISSIONS } from '../js/missions.js';

const start = (id) => {
  const mis = MISSIONS.find((x) => x.id === id);
  return { ...defaultDesign(mis.objective, mis.klass), ...mis.design, name: mis.name };
};
const SEEDS = 60;

for (const mis of MISSIONS) {
  test(`${mis.name}: the starter flies itself without commands on most seeds`, () => {
    let stars = 0;
    for (let seed = 1; seed <= SEEDS; seed++) {
      const r = runFlight(start(mis.id), seed);
      assert.ok(r.alive, `seed ${seed} lost`);
      if (starsFor(r) >= 1) stars++;
    }
    assert.ok(stars / SEEDS >= 0.8, `only ${stars} of ${SEEDS} seeds earned a star`);
  });
}

test('the same seed and the same commands replay the same flight; another seed does not', () => {
  const d = start('m3');
  assert.deepEqual(runFlight(d, 7).log, runFlight(d, 7).log);
  assert.notDeepEqual(runFlight(d, 7).log, runFlight(d, 8).log);
});

test('an overweight spacecraft is lost at launch', () => {
  const r = runFlight({ ...start('m3'), launcher: 'small', instruments: ['irspec', 'sounder'] }, 1);
  assert.equal(r.alive, false);
  assert.match(r.log.at(-1).text, /short/);
  assert.equal(r.science, 0);
});

test('solar arrays too small for the bus brown out far from the Sun; RTGs keep the craft alive', () => {
  const r = runFlight({ ...start('m4'), power: { type: 'solar', areaM2: 4, units: 1 } }, 1);
  assert.equal(r.alive, false);
  assert.match(r.lessons.join(' '), /power source/);
  assert.equal(runFlight(start('m4'), 1).alive, true);
});

test('when power runs short, autonomy switches off the heaviest instrument and the craft stays up', () => {
  // Moon orbit with a 2 m² array: about 279 W in, 160 W for the bus. A 400 W radar cannot fit; a 40 W spectrometer can.
  const d = { ...start('m2'), launcher: 'medium', power: { type: 'solar', areaM2: 2, units: 1 }, instruments: ['sar', 'irspec'] };
  const s = createFlight(d, 1);
  assert.equal(s.m.powerSupply >= s.m.busLoad, true, 'launch power check passes');
  while (!s.finished && s.day < s.arrive + 5) stepDay(s);
  const snap = snapshot(s);
  assert.equal(snap.instrs[0].shed, true);
  assert.equal(snap.instrs[1].eff, true);
  while (!s.finished) stepDay(s);
  assert.equal(s.alive, true);
});

test('switching the only instrument off collects no science', () => {
  const r = runFlight(start('m1'), 3, (snap) => (snap.day === 0 ? { type: 'instr', i: 0 } : null));
  assert.equal(r.tally.gbGen, 0);
  assert.equal(r.science, 0);
  assert.equal(starsFor(r), 0);
});

test('safe mode stops the science and is logged as a command', () => {
  const r = runFlight(start('m1'), 3, (snap) => (snap.day === 0 ? { type: 'safe' } : null));
  assert.equal(r.tally.gbGen, 0);
  assert.match(r.log.map((l) => l.text).join(' '), /Safe mode on/);
});

test('a storm can upset a single computer; the reboot can fail and end the mission', () => {
  const d = { ...start('m1'), redundancy: 'single', shielding: 's0' };
  let resets = 0, lost = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const r = runFlight(d, seed);
    resets += r.tally.resets;
    if (!r.alive) { lost++; assert.match(r.log.at(-1).text, /never completes/); }
  }
  assert.ok(resets > 0, 'some storms upset the computer');
  assert.ok(lost > 0, 'some reboots never complete');
});

test('safe mode during storms lowers the number of upsets', () => {
  const d = { ...start('m1'), redundancy: 'single', shielding: 's0' };
  let plain = 0, safe = 0;
  for (let seed = 1; seed <= 200; seed++) {
    plain += runFlight(d, seed).tally.upsets;
    safe += runFlight(d, seed, (snap) => (snap.day === 0 ? { type: 'safe' } : null)).tally.upsets;
  }
  assert.ok(safe < plain / 2, `safe ${safe} vs plain ${plain}`);
});

test('data the link cannot carry piles up in the recorder and overflows', () => {
  let lost = 0;
  for (let seed = 1; seed <= 20; seed++) lost += runFlight(start('m1'), seed).tally.gbLost;
  assert.ok(lost > 0);
});

test('Mars conjunction blocks commands and downlink for its window, then lifts', () => {
  const s = createFlight(start('m3'), 1);
  const w = s.sched.conj[0];
  assert.ok(w, 'Mars missions have a conjunction');
  while (s.day < w.start) stepDay(s);
  stepDay(s);
  const blocked = command(s, { type: 'safe' });
  assert.equal(blocked.ok, false);
  assert.match(blocked.msg, /behind the Sun/);
  assert.equal(snapshot(s).capToday, 0);
  while (s.day < w.start + w.days) stepDay(s);
  assert.equal(command(s, { type: 'safe' }).ok, true);
});

test('storms are forecast two days ahead and not earlier', () => {
  const s = createFlight(start('m4'), 1);
  const st = s.sched.storms[0];
  assert.ok(st && st.day >= 4, 'the Jupiter flight has a storm after day 3');
  while (s.day < st.day - 3) stepDay(s);
  assert.doesNotMatch(snapshot(s).stormLabel, /forecast/);
  stepDay(s);
  assert.match(snapshot(s).stormLabel, /forecast in 2 days/);
});

test('a finished flight reports the same shape the debrief and star rule use', () => {
  const r = runFlight(start('m1'), 1);
  assert.equal(typeof r.score.total, 'number');
  assert.ok(r.lessons.length > 0);
  assert.ok(['Full success', 'Success', 'Partial return', 'Mission lost'].includes(r.outcome));
});
