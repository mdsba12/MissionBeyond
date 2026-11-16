// Physics checks against values worked by hand from the cited constants (see comments).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../js/physics.js';
import { CONST } from '../js/data.js';
import { trajectory, defaultDesign } from '../js/engine.js';

const C = Object.fromEntries(Object.entries(CONST).map(([k, v]) => [k, v.value]));
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b} ± ${tol}`);

test('Earth–Mars Hohmann: 258.9 days, v∞ 2.94 km/s out, 2.65 km/s in', () => {
  // a = (149.598 + 227.956)/2 = 188.777e6 km; T/2 = π·sqrt(a³/μ) = 2.2367e7 s = 258.9 d
  const h = P.hohmann(C.muSun, C.aEarth, C.aMars);
  near(h.tofS / 86400, 258.9, 0.5, 'transfer time');
  near(h.dv1, 2.945, 0.02, 'departure v∞');
  near(h.dv2, 2.650, 0.02, 'arrival v∞');
});

test('Trans-Mars injection from a 300 km parking orbit is about 3.59 km/s', () => {
  // sqrt(2.945² + 2·398600/6678.1) − sqrt(398600/6678.1) = 11.316 − 7.726
  near(P.departureDv(2.945, C.muEarth, C.rEarth + 300), 3.59, 0.02, 'TMI');
});

test('Mars orbit insertion into a 400 km circle is about 2.08 km/s', () => {
  // sqrt(2.65² + 2·42828/3796.2) − sqrt(42828/3796.2) = 5.439 − 3.359
  near(P.captureDv(2.65, C.muMars, C.rMars + 400), 2.08, 0.02, 'MOI');
});

test('Earth–Jupiter Hohmann: about 998 days, departure burn about 6.30 km/s', () => {
  const h = P.hohmann(C.muSun, C.aEarth, C.aJupiter);
  near(h.tofS / 86400, 997.7, 2, 'transfer time');
  near(h.dv1, 8.79, 0.03, 'departure v∞');
  near(h.dv2, 5.64, 0.03, 'arrival v∞');
  near(P.departureDv(h.dv1, C.muEarth, C.rEarth + 300), 6.30, 0.03, 'departure burn');
});

test('Jupiter capture into a 53-day orbit with periapsis at 1.06 Rj is about 0.55 km/s', () => {
  // v_hyp = sqrt(5.644² + 2μ/rp) = 58.10; v_ellipse = sqrt(μ(2/rp − 1/a)) = 57.55, a = 4.067e6 km
  const rp = 1.06 * C.rJupiter;
  const ra = P.apoapsisFromPeriod(C.muJupiter, rp, 53 * 86400);
  near((rp + ra) / 2, 4.067e6, 0.01e6, 'semi-major axis');
  near(P.captureDv(5.644, C.muJupiter, rp, ra), 0.55, 0.03, 'JOI');
});

test('Lunar transfer: about 3.11 km/s to leave, 5 days, about 0.82 km/s to enter a 100 km orbit', () => {
  const h = P.hohmann(C.muEarth, C.rEarth + 300, C.aMoon);
  near(h.dv1, 3.107, 0.02, 'TLI');
  near(h.tofS / 86400, 4.98, 0.05, 'transit');
  near(P.captureDv(h.dv2, C.muMoon, C.rMoon + 100), 0.82, 0.03, 'LOI');
});

test('Rocket equation: 2.08 km/s at 320 s needs a mass ratio of 1.94', () => {
  // exp(2080 / (320 × 9.80665)) = exp(0.6628)
  near(P.massRatio(2.08, 320), 1.940, 0.005, 'mass ratio');
});

test('Light time to Mars spans about 4.4 to 21.0 minutes for mean circular orbits', () => {
  near(P.lightTimeMin(C.aMars - C.aEarth), 4.36, 0.02, 'closest');
  near(P.lightTimeMin(C.aMars + C.aEarth), 20.99, 0.02, 'farthest');
});

test('Solar model reproduces Juno: about 14 kW at Earth and about 500 W at Jupiter from 60 m²', () => {
  near(60 * P.solarFlux(C.tsi, 1) * C.arrayEff, 14000, 300, 'at 1 AU');
  near(60 * P.solarFlux(C.tsi, C.aJupiter / C.aEarth) * C.arrayEff, 500, 30, 'at Jupiter');
});

test('Link budget: 100 W, 3 m dish to a 34 m dish at 2.52 AU gives roughly 1 Mbit/s', () => {
  // In dB: Pt 20 dBW + Gt 45.8 + Gr 66.9 − path loss 282.5 = −149.8 dBW; N0 = −213.8 dBW/Hz; C/N0 = 64.0 dB-Hz; −4 dB → 60 dB-bit/s
  const lambdaM = 299792458 / 8.4e9;
  const rate = P.linkRateBps({ ptW: 100, gt: P.dishGain(3, lambdaM, 0.55), gr: P.dishGain(34, lambdaM, 0.55), lambdaM, distM: (C.aMars + C.aEarth) * 1000, tsK: 30, ebn0: 2.5 });
  assert.ok(rate > 0.8e6 && rate < 1.3e6, `rate ${rate}`);
});

test('Engine trajectories use one frame and sane values per destination', () => {
  const tr = (objective, orbit) => trajectory({ ...defaultDesign(objective, 'medium'), ...(orbit ? { orbit } : {}) });
  near(tr('earth').dvDep, 0.114, 0.01, 'LEO raise to 500 km');
  near(tr('mars').dvDep, 3.59, 0.02, 'Mars departure');
  near(tr('mars').dvArr, 2.08, 0.02, 'Mars propulsive capture');
  assert.ok(tr('mars', 'maero').dvArr < 1.2, 'aerobraking needs far less Δv');
  near(tr('l2').dvDep, 3.20, 0.02, 'L2 departure');
  assert.ok(tr('jupiter', 'j14').dvArr > tr('jupiter', 'j53').dvArr, 'tighter Jupiter orbit costs more');
  near(tr('jupiter').fluxWm2, 50.3, 0.5, 'sunlight at Jupiter');
});
