// Design checks: starter builds are sound, bad designs fail for the right reason, and the star rule is fixed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, starsFor, defaultDesign } from '../js/engine.js';
import { OBJECTIVES, CLASSES } from '../js/data.js';
import { MISSIONS } from '../js/missions.js';

const start = (id) => {
  const mis = MISSIONS.find((x) => x.id === id);
  return { ...defaultDesign(mis.objective, mis.klass), ...mis.design, name: mis.name };
};

for (const mis of MISSIONS) {
  test(`${mis.name}: starter build has no failed checks and fits its budget`, () => {
    const m = evaluate(start(mis.id));
    assert.deepEqual(m.checks.filter((c) => c.ok === 'fail').map((c) => c.id), []);
    assert.ok(m.cost <= m.klass.budget, `cost ${m.cost} over ${m.klass.budget}`);
  });
}

test('every objective and class has a budget', () => {
  for (const o of OBJECTIVES) for (const k of CLASSES) assert.ok(o.budget[k.id] > 0);
});

test('an overweight design fails the launch mass check', () => {
  const m = evaluate({ ...start('m3'), launcher: 'small', instruments: ['irspec', 'sounder'] });
  assert.equal(m.checks.find((c) => c.id === 'mass').ok, 'fail');
});

test('solar arrays too small for the Jupiter power load fail the power check', () => {
  assert.equal(evaluate({ ...start('m4'), power: { type: 'solar', areaM2: 4, units: 1 } }).checks.find((c) => c.id === 'power').ok, 'fail');
});

test('no radiation shielding at Jupiter fails the radiation check', () => {
  assert.equal(evaluate({ ...start('m4'), shielding: 's0' }).checks.find((c) => c.id === 'rad').ok, 'fail');
});

test('a patch antenna cannot return Mars data', () => {
  const m = evaluate({ ...start('m3'), antenna: 'patch', tx: 'tx10', ground: 'uni' });
  assert.equal(m.checks.find((c) => c.id === 'link').ok, 'fail');
});

test('an empty design fails the payload check', () => {
  assert.equal(evaluate(defaultDesign('earth', 'small')).checks.find((c) => c.id === 'payload').ok, 'fail');
});

test('stars: a lost mission earns none, and the score sets the rest', () => {
  const base = { alive: true, science: 1, m: { klass: { sciMin: 0.5 } } };
  assert.equal(starsFor({ ...base, alive: false, score: { total: 99 } }), 0);
  assert.equal(starsFor({ ...base, score: { total: 90 } }), 3);
  assert.equal(starsFor({ ...base, score: { total: 70 } }), 2);
  assert.equal(starsFor({ ...base, score: { total: 30 } }), 1);
  assert.equal(starsFor({ ...base, science: 0.2, score: { total: 30 } }), 0);
});
