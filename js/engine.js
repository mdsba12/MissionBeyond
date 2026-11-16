// Deep Run — design evaluation, mission simulation and scoring.
// All departure Δv is measured from one frame: a 300 km circular parking orbit around Earth.
import * as D from './data.js';
import * as P from './physics.js';

const C = Object.fromEntries(Object.entries(D.CONST).map(([k, v]) => [k, v.value]));
const AU = C.aEarth;
const find = (list, id) => list.find((x) => x.id === id);

export const getObjective = (d) => find(D.OBJECTIVES, d.objective);
export const getClass = (d) => ({ ...find(D.CLASSES, d.klass), budget: getObjective(d).budget[d.klass] });
export const getOrbit = (d) => find(D.ORBITS[getObjective(d).dest], d.orbit) || D.ORBITS[getObjective(d).dest][0];

export function defaultDesign(objective = 'earth', klass = 'small') {
  const dest = find(D.OBJECTIVES, objective).dest;
  return {
    name: 'Untitled mission', objective, klass,
    orbit: D.ORBITS[dest][0].id, launcher: 'small', propulsion: 'mono',
    instruments: [], power: { type: 'solar', areaM2: 2, units: 1 },
    antenna: 'patch', tx: 'tx10', shielding: 's0', redundancy: 'single',
    ground: 'uni', tracking: 'light', team: 'small', pipeline: 'manual', policy: 'closed',
  };
}

// Trajectory figures for the chosen destination and orbit. Pure patched-conic physics plus labelled allowances.
export function trajectory(d) {
  const obj = getObjective(d), orb = getOrbit(d);
  const rPark = C.rEarth + C.parkAltKm;
  const t = { dvDep: 0, dvArr: 0, transitDays: 0, extraDays: 0, sunAU: 1, maxDistKm: 0, minDistKm: 0, notes: [] };
  if (obj.dest === 'earth') {
    const h = P.hohmann(C.muEarth, rPark, C.rEarth + orb.altKm);
    t.dvDep = h.dv1 + h.dv2; t.transitDays = h.tofS / 86400;
    t.maxDistKm = t.minDistKm = C.leoSlantKm;
    t.notes.push('Hohmann raise from the 300 km parking orbit, flown by the launcher\'s upper stage.');
  } else if (obj.dest === 'moon') {
    const h = P.hohmann(C.muEarth, rPark, C.aMoon);
    const vInf = h.dv2; // Moon's speed minus the transfer's apogee speed
    t.dvDep = h.dv1; t.transitDays = h.tofS / 86400;
    t.dvArr = P.captureDv(vInf, C.muMoon, C.rMoon + orb.periAltKm, C.rMoon + orb.apoAltKm);
    t.maxDistKm = t.minDistKm = C.aMoon;
  } else if (obj.dest === 'l2') {
    t.dvDep = P.vEsc(C.muEarth, rPark) - P.vCirc(C.muEarth, rPark);
    t.dvArr = C.l2InsertKmS; t.transitDays = C.l2TransitDays;
    t.maxDistKm = t.minDistKm = C.l2Dist;
    t.notes.push('Departure approximated as just reaching escape speed; the true figure is slightly lower.');
  } else {
    const mars = obj.dest === 'mars';
    const aP = mars ? C.aMars : C.aJupiter, muP = mars ? C.muMars : C.muJupiter, rP = mars ? C.rMars : C.rJupiter;
    const h = P.hohmann(C.muSun, AU, aP);
    t.dvDep = P.departureDv(h.dv1, C.muEarth, rPark);
    t.transitDays = h.tofS / 86400;
    t.sunAU = aP / AU; t.maxDistKm = aP + AU; t.minDistKm = aP - AU;
    const vInfArr = h.dv2;
    if (mars) {
      const rp = rP + orb.periAltKm;
      if (orb.aerobrake) {
        const ra = P.apoapsisFromPeriod(muP, rp, orb.capturePeriodH * 3600);
        t.dvArr = P.captureDv(vInfArr, muP, rp, ra) + C.aerobrakeKmS; t.extraDays = C.aerobrakeDays;
        t.notes.push('Capture into a ' + orb.capturePeriodH + '-hour orbit, then aerobrake down to the science orbit.');
      } else t.dvArr = P.captureDv(vInfArr, muP, rp);
    } else {
      const rp = rP * orb.periRj;
      t.dvArr = P.captureDv(vInfArr, muP, rp, P.apoapsisFromPeriod(muP, rp, orb.periodDays * 86400));
    }
    t.notes.push('Hohmann transfer between circular, coplanar orbits. Real launch windows shift these figures.');
  }
  t.lightMaxMin = P.lightTimeMin(t.maxDistKm, C.c);
  t.lightMinMin = P.lightTimeMin(t.minDistKm, C.c);
  t.fluxWm2 = P.solarFlux(C.tsi, t.sunAU);
  return t;
}

export function evaluate(d) {
  const obj = getObjective(d), klass = getClass(d), orb = getOrbit(d), t = trajectory(d);
  const launcher = find(D.LAUNCHERS, d.launcher), prop = find(D.PROPULSION, d.propulsion);
  const ant = find(D.ANTENNAS, d.antenna), tx = find(D.TRANSMITTERS, d.tx);
  const shield = find(D.SHIELDING, d.shielding), red = find(D.REDUNDANCY, d.redundancy);
  const gnd = find(D.GROUND, d.ground), trk = find(D.TRACKING, d.tracking);
  const team = find(D.TEAMS, d.team), pipe = find(D.PIPELINES, d.pipeline), pol = find(D.POLICIES, d.policy);
  const insts = d.instruments.map((id) => find(D.INSTRUMENTS, id)).filter(Boolean);
  const active = insts.filter((i) => !i.needs || d.instruments.includes(i.needs));

  // Power
  const solar = d.power.type === 'solar';
  const powerSupply = solar ? d.power.areaM2 * t.fluxWm2 * C.arrayEff * orb.sunFrac : d.power.units * C.rtgW;
  const powerMass = solar ? d.power.areaM2 * C.arrayKgM2 : d.power.units * C.rtgKg;
  const busLoad = C.busPowerW + red.powerW + tx.rfW / C.txEff;
  const instLoad = insts.reduce((s, i) => s + i.powerW, 0);
  const powerLoad = busLoad + instLoad;
  const powerMargin = powerSupply > 0 ? (powerSupply - powerLoad) / powerSupply : -1;

  // Mass
  const payloadKg = insts.reduce((s, i) => s + i.massKg, 0);
  const dryKg = (payloadKg + C.busBaseKg + C.busPerPayload * payloadKg + powerMass + ant.massKg + tx.massKg + shield.massKg) * (1 + red.massFrac);
  const R = P.massRatio(t.dvArr, prop.isp, C.g0);
  const denom = 1 - C.tankFrac * (R - 1);
  const propKg = denom > 0.02 ? dryKg * (R - 1) / denom : Infinity;
  const wetKg = dryKg + propKg * (1 + C.tankFrac);
  const throwKg = launcher.leoKg * Math.exp(-(t.dvDep * 1000) / (C.upperIsp * C.g0)) * (1 - C.upperLoss);
  const massMargin = (throwKg - wetKg) / throwKg;

  // Link, at the farthest Earth distance
  const lambdaM = (C.c * 1000) / C.freqHz;
  const linkBps = P.linkRateBps({
    ptW: tx.rfW, gt: P.dishGain(ant.dishM, lambdaM, C.dishEff), gr: P.dishGain(gnd.dishM, lambdaM, C.dishEff),
    lambdaM, distM: t.maxDistKm * 1000, tsK: gnd.tsK, ebn0: C.ebn0, kB: C.kB,
  });
  const rateBps = Math.min(C.rateCapBps, linkBps);
  const hoursPerSite = obj.dest === 'earth' ? gnd.leoHoursPerSite : C.deepHoursPerSite;
  const contactH = Math.min(24, hoursPerSite * gnd.sites) * trk.frac;
  const dataCapGb = rateBps * contactH * 3600 / 1e9;
  const dataNeedGb = active.reduce((s, i) => s + i.gbDay, 0);
  const dataFrac = dataNeedGb > 0 ? Math.min(1, dataCapGb / dataNeedGb) : 0;
  const linkMargin = dataNeedGb > 0 ? dataCapGb / dataNeedGb : 0;

  // Science
  const fitSum = active.reduce((s, i) => s + (i.fit[obj.id] || 0), 0);
  const sciencePotential = fitSum * orb.sciMult * team.mult * pol.mult * pipe.frac * dataFrac;

  // Cost
  const years = (t.transitDays + t.extraDays) / 365.25 + klass.scienceYears;
  const scCost = (C.costPerDryKg * dryKg + insts.reduce((s, i) => s + i.cost, 0) + (solar ? C.solarCostM2 * d.power.areaM2 : C.rtgCost * d.power.units)
    + ant.cost + tx.cost + shield.cost + prop.cost) * (1 + red.costFrac);
  const groundCost = gnd.costPerYear * trk.costMult * years;
  const userCost = team.cost + pipe.cost + pol.cost;
  const cost = launcher.cost + scCost + groundCost + userCost;

  const radNeed = Math.max(0, obj.radiation - 1);
  const checks = [
    { id: 'payload', label: 'Payload', ok: fitSum > 0 ? (insts.length <= klass.maxInstruments ? 'pass' : 'fail') : 'fail',
      text: fitSum === 0 ? 'No instrument on board can answer the science question.' : insts.length > klass.maxInstruments ? `A ${klass.name} mission carries at most ${klass.maxInstruments} instrument(s).` : `${active.length} working instrument(s), science fit ${fitSum.toFixed(1)}.` },
    { id: 'mass', label: 'Launch mass', ok: massMargin < 0 ? 'fail' : massMargin < 0.1 ? 'warn' : 'pass',
      text: !isFinite(wetKg) ? 'This engine cannot deliver the braking burn at any propellant load.' : `Spacecraft ${fmt(wetKg)} kg fuelled; launcher delivers ${fmt(throwKg)} kg. Margin ${pct(massMargin)}.` },
    { id: 'power', label: 'Power', ok: powerMargin < 0 ? 'fail' : powerMargin < 0.2 ? 'warn' : 'pass',
      text: `Supply ${fmt(powerSupply)} W, load ${fmt(powerLoad)} W. Margin ${pct(powerMargin)}.` },
    { id: 'link', label: 'Data return', ok: linkMargin < 0.5 ? 'fail' : linkMargin < 1.25 ? 'warn' : 'pass',
      text: `Can downlink ${fmtGb(dataCapGb)} per day; instruments make ${fmtGb(dataNeedGb)}.` },
    { id: 'rad', label: 'Radiation', ok: shield.level < radNeed ? 'fail' : shield.level < Math.min(2, obj.radiation) ? 'warn' : 'pass',
      text: shield.level < radNeed ? 'Electronics will not survive this radiation environment.' : shield.level < Math.min(2, obj.radiation) ? 'Fine on a quiet day; a solar storm would hurt.' : 'Protected, storms included.' },
    { id: 'budget', label: 'Budget', ok: cost > klass.budget ? 'fail' : cost > 0.95 * klass.budget ? 'warn' : 'pass',
      text: `Cost ${fmt(cost)} of ${klass.budget} points.` },
  ];
  return { t, obj, klass, orb, insts, active, powerSupply, powerLoad, busLoad, instLoad, powerMargin, payloadKg, dryKg, propKg, wetKg, throwKg, massMargin,
    linkBps, rateBps, contactH, dataCapGb, dataNeedGb, dataFrac, linkMargin, fitSum, sciencePotential, years, cost, scCost, groundCost, userCost,
    launcherCost: launcher.cost, shieldLevel: shield.level, redLevel: red.level, radNeed, checks };
}

export const fmt = (x) => !isFinite(x) ? '∞' : Math.abs(x) >= 100 ? Math.round(x).toLocaleString('en-US') : Math.abs(x) >= 10 ? x.toFixed(1) : x.toFixed(2);
export const pct = (x) => !isFinite(x) ? '−∞' : Math.round(x * 100) + '%';
export const fmtGb = (x) => x >= 1 ? fmt(x) + ' Gb' : fmt(x * 1000) + ' Mb';
export const fmtRate = (b) => b >= 1e6 ? fmt(b / 1e6) + ' Mbit/s' : b >= 1e3 ? fmt(b / 1e3) + ' kbit/s' : fmt(b) + ' bit/s';

export function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// 0 to 3 stars: a lost mission earns none; the 3-star bar is a clean, well-balanced flight.
export function starsFor(r) {
  if (!r.alive) return 0;
  if (r.score.total >= 85) return 3;
  if (r.score.total >= 60) return 2;
  return r.science >= r.m.klass.sciMin ? 1 : 0;
}
