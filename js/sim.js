// Deep Run — the flight simulation.
// The clock runs one mission day at a time. Between days the crew can switch instruments and safe mode.
// Everything else (solar storms, reaction-wheel faults, ground outages, Mars conjunction) is drawn from the seed
// before launch, so the same seed and the same commands always replay the same flight.
// Power, mass and link come from engine.js. Hazard rates and upset chances are game assumptions tagged in data.js.
import * as D from './data.js';
import { evaluate, rng, fmt, pct } from './engine.js';

const C = Object.fromEntries(Object.entries(D.CONST).map(([k, v]) => [k, v.value]));
const YEAR = 365.25;
const find = (list, id) => list.find((x) => x.id === id);
const say = (s, text, kind = 'info', phase = 'Operations') => s.log.push({ t: s.day, phase, text, kind });
const stormRate = (level) => (D.STORM_RATE.find((r) => r.level === level) || D.STORM_RATE.at(-1)).perYear;
const upsetChance = (shield) => D.UPSET.find((u) => u.shield === shield).chance;
const conjAt = (s, day = s.day) => s.sched.conj.find((w) => day >= w.start && day < w.start + w.days);
const supplyAt = (s, day) => (s.solar ? Math.max(0, s.m.powerSupply * (1 - C.arrayDegPerYear * day / YEAR)) : s.m.powerSupply);

// Every random event for the whole mission is drawn before launch, in a fixed order, so player commands cannot change the dice.
function schedule(seed, end, arrive, radiation, mars) {
  const rand = rng(seed);
  const storms = [], wheels = [], outages = [], conj = [];
  const sRate = stormRate(radiation) / YEAR, wRate = C.wheelsPerYear / YEAR, oRate = C.outagesPerYear / YEAR;
  for (let day = 0; day < end; day++) {
    const a = rand(), b = rand(), c = rand();
    if (a < sRate) storms.push({ day, upsetRoll: rand(), rebootRoll: rand() });
    if (b < wRate) wheels.push(day);
    if (c < oRate) outages.push(day);
  }
  if (mars) for (let t = arrive + 0.5 * YEAR; t < end; t += C.conjEveryYears * YEAR) conj.push({ start: Math.round(t), days: C.conjDays });
  return { storms, wheels, outages, conj };
}

export function createFlight(design, seed = 1) {
  const m = evaluate(design), k = m.klass, obj = m.obj, orb = m.orb;
  const team = find(D.TEAMS, design.team), pol = find(D.POLICIES, design.policy), pipe = find(D.PIPELINES, design.pipeline);
  const gnd = find(D.GROUND, design.ground), trk = find(D.TRACKING, design.tracking);
  const red = find(D.REDUNDANCY, design.redundancy), shield = find(D.SHIELDING, design.shielding);
  const transit = m.t.transitDays, arrive = transit + m.t.extraDays;
  const sciDays = k.scienceYears * YEAR, end = Math.round(arrive + sciDays);
  // Science per instrument per day at full fit, using the same factors as the design score.
  const sciK = (orb.sciMult * team.mult * pol.mult * pipe.frac) / sciDays;
  const sched = schedule(seed, end, arrive, obj.radiation, obj.dest === 'mars');
  const instrs = design.instruments
    .map((id, slot) => ({ slot, inst: find(D.INSTRUMENTS, id) }))
    .filter((p) => p.inst && (!p.inst.needs || design.instruments.includes(p.inst.needs)))
    .map((p) => ({ ...p, on: true, eff: false, shed: false, sciPerDay: (p.inst.fit[obj.id] || 0) * sciK }));

  const s = {
    m, seed, dest: obj.dest, gnd, trk, solar: design.power.type === 'solar',
    day: 0, end, arrive, transit, sched, instrs,
    dose: m.shieldLevel < m.radNeed ? 0.2 : 1,           // electronics too weak for the radiation: most science is lost
    stress: orb.extraRisk ? C.stressUpsetFactor : 1,
    shieldLevel: shield.level, redLevel: red.level, spares: red.level, pointing: 1,
    safe: false, buffer: { gb: 0, sci: 0 }, bufferCap: C.bufferGb, overflowLogged: false,
    computer: { days: 0, kind: '', willFail: false }, outage: 0, brownout: 0, shedKey: '',
    contact: 0, capToday: 0,
    alive: true, finished: false, res: 15, lessons: [], log: [], marks: [],
    tally: { gbGen: 0, gbDown: 0, gbLost: 0, sciRet: 0, sciLost: 0, upsets: 0, resets: 0, storms: 0, wheelFails: 0, outages: 0, shedDays: 0 },
  };

  say(s, `${design.name} lifts off. Objective: ${obj.name}.`, 'good', 'Launch');
  if (m.massMargin < 0) {
    lose(s, `The upper stage runs dry ${fmt(m.wetKg - m.throwKg)} kg short. The spacecraft never reaches its transfer orbit.`, 'Launch',
      'The fuelled spacecraft was heavier than the launcher could deliver. Cut mass, lower the arrival Δv, or buy a bigger launcher.');
    return s;
  }
  if (m.massMargin < 0.1) {
    s.res -= 2; say(s, `Clean but tight: ${pct(m.massMargin)} mass margin, so nothing was left for growth.`, 'warn', 'Launch');
    s.lessons.push('Launch mass margin was under 10%. Real projects hold margin because designs get heavier as they mature.');
  } else say(s, `Clean ascent with ${pct(m.massMargin)} mass margin.`, 'good', 'Launch');
  if (m.powerSupply < m.busLoad) {
    lose(s, `Power supply (${fmt(m.powerSupply)} W) cannot even run the bus (${fmt(m.busLoad)} W). The spacecraft browns out and falls silent.`, 'Launch',
      'The power source could not keep the basic spacecraft alive. Far from the Sun, solar arrays need to be very large, or use a radioisotope generator.');
    return s;
  }
  if (s.dose < 1) {
    s.res -= 10; say(s, 'The shielding is too light for this radiation. Electronics degrade and most observations will be lost.', 'fail', 'Launch');
    s.lessons.push('Shielding was too light for this radiation environment.');
  }
  if (transit > 2) say(s, `${fmt(transit)} days in transit. A signal home takes up to ${fmt(m.t.lightMaxMin)} minutes one way.`, 'info', 'Cruise');
  return s;
}

function lose(s, text, phase, lesson) {
  s.alive = false; s.finished = true; say(s, text, 'fail', phase);
  if (lesson) s.lessons.push(lesson);
}

// Advances the flight by one mission day. Does nothing once the flight is over.
export function stepDay(s) {
  if (s.finished) return;
  const day = s.day, inSci = day >= s.arrive, conj = !!conjAt(s);

  for (const st of s.sched.storms) {
    if (st.day - C.forecastDays === day) say(s, `Forecast: a solar storm in ${C.forecastDays} days. Safe mode before it arrives lowers the risk to the computer.`, 'warn', 'Forecast');
    if (st.day === day) { storm(s, st); if (s.finished) return; }
  }
  for (const w of s.sched.wheels) if (w === day) { wheel(s); if (s.finished) return; }
  if (s.sched.outages.includes(day)) {
    s.outage = Math.max(s.outage, C.outageDays); s.tally.outages++; s.res -= 1;
    say(s, `A ground antenna goes offline for ${C.outageDays} days of repairs.`, 'warn', 'Ground');
  }
  for (const w of s.sched.conj) if (w.start === day) say(s, `Mars passes behind the Sun for ${w.days} days. Commands are blocked and no data goes down.`, 'warn', 'Event');

  if (s.computer.days > 0) {
    s.computer.days--;
    if (s.computer.days === 0) {
      if (s.computer.kind === 'reset' && s.computer.willFail) {
        lose(s, 'The reboot never completes. Contact is lost.', 'Storm',
          'A single flight computer that resets during a storm can take the whole mission with it.');
        return;
      }
      if (s.computer.kind === 'reset') say(s, 'The main computer is back online.', 'good', 'Storm');
      s.computer = { days: 0, kind: '', willFail: false };
    }
  }

  const supply = supplyAt(s, day), bus = s.m.busLoad;
  if (supply < bus) {
    s.brownout++;
    if (s.brownout === 1) say(s, 'Power is below what the bus needs. Instruments are shed first.', 'warn', 'Power');
    if (s.brownout >= C.brownoutDays) {
      lose(s, 'The bus has run short of power for three days. Contact is lost.', 'Power',
        'The power source could not keep the basic spacecraft alive. Far from the Sun, solar arrays need to be very large, or use a radioisotope generator.');
      return;
    }
  } else s.brownout = 0;

  // Instruments run only in the science phase, with the computer up and safe mode off.
  // If power is short, autonomy switches off the last instruments first.
  const canRun = inSci && s.computer.days === 0 && !s.safe;
  let budget = supply - bus, used = 0;
  for (const p of s.instrs) {
    p.eff = false; p.shed = false;
    if (!(p.on && canRun)) continue;
    if (used + p.inst.powerW <= budget) { p.eff = true; used += p.inst.powerW; } else p.shed = true;
  }
  const shedNames = s.instrs.filter((p) => p.shed).map((p) => p.inst.name).join(', ');
  if (shedNames !== s.shedKey) {
    if (shedNames) say(s, `Autonomy switches off ${shedNames} to keep the bus powered.`, 'warn', 'Power');
    else if (s.shedKey && canRun) say(s, 'Power is back. Instruments restored.', 'good', 'Power');
    s.shedKey = shedNames;
  }
  if (shedNames) s.tally.shedDays++;

  let gen = 0, sci = 0;
  for (const p of s.instrs) if (p.eff) { gen += p.inst.gbDay; sci += p.sciPerDay; }
  if (gen > 0) {
    s.buffer.gb += gen; s.buffer.sci += sci * s.pointing * s.dose; s.tally.gbGen += gen;
  }
  if (s.buffer.gb > s.bufferCap) {
    const over = s.buffer.gb - s.bufferCap, lost = s.buffer.sci * (over / s.buffer.gb);
    s.buffer.sci -= lost; s.buffer.gb = s.bufferCap; s.tally.gbLost += over; s.tally.sciLost += lost;
    if (!s.overflowLogged) {
      s.overflowLogged = true;
      say(s, 'The data recorder is full. The oldest data is overwritten.', 'warn', 'Data');
      s.lessons.push('Data piled up faster than the link could carry it. A bigger recorder, a bigger dish or more tracking time would have kept it.');
    }
  }

  // Downlink: only data that reaches the ground counts toward science.
  const sitesUp = Math.max(0, s.gnd.sites - (s.outage > 0 ? 1 : 0));
  const hours = (s.dest === 'earth' ? s.gnd.leoHoursPerSite : C.deepHoursPerSite) * sitesUp;
  s.contact = conj ? 0 : Math.min(24, hours) * s.trk.frac;
  s.capToday = s.computer.days > 0 ? 0 : s.m.rateBps * s.contact * 3600 / 1e9;
  const x = Math.min(s.buffer.gb, s.capToday);
  if (x > 0) {
    const ret = s.buffer.sci * (x / s.buffer.gb);
    s.tally.sciRet += ret; s.buffer.sci = Math.max(0, s.buffer.sci - ret);
    s.buffer.gb = Math.max(0, s.buffer.gb - x); s.tally.gbDown += x;
  }

  if (s.outage > 0) { s.outage--; if (s.outage === 0) say(s, 'The ground antenna is back online.', 'good', 'Ground'); }

  s.day++;
  if (s.day >= s.end) complete(s);
}

function storm(s, st) {
  s.tally.storms++; s.marks.push({ t: s.day, kind: 'storm' });
  if (s.computer.days > 0) { say(s, 'A solar storm arrives while the computer is rebooting.', 'warn', 'Storm'); return; }
  const p = upsetChance(s.shieldLevel) * (s.safe ? C.safeUpsetFactor : 1) * s.stress;
  if (st.upsetRoll >= p) {
    say(s, s.safe ? 'A solar storm passes while the craft waits in safe mode. Nothing is upset.' : 'A solar storm passes. The electronics hold.', 'good', 'Storm');
    return;
  }
  s.tally.upsets++;
  if (s.redLevel >= 1) {
    s.computer = { days: C.backupSwitchDays, kind: 'switch', willFail: false }; s.res -= 2;
    say(s, 'A solar storm upsets the main computer. The backup takes over within the day.', 'warn', 'Storm');
  } else {
    s.tally.resets++;
    s.computer = { days: C.rebootDays, kind: 'reset', willFail: st.rebootRoll < C.rebootFailChance }; s.res -= 10;
    say(s, `A solar storm upsets the only computer. It reboots, which takes ${C.rebootDays} days.`, 'fail', 'Storm');
    s.lessons.push('With one flight computer and standard parts, a single storm can take the spacecraft offline. Backup systems or radiation-hardened parts would have protected it.');
  }
}

function wheel(s) {
  s.tally.wheelFails++; s.marks.push({ t: s.day, kind: 'fault' });
  if (s.spares > 0) {
    s.spares--; s.res -= 1;
    say(s, `A reaction wheel stopped. The spare took over, with ${s.spares ? s.spares + ' spare left' : 'no spares left'}.`, 'warn', 'Fault');
  } else {
    s.pointing = Math.max(0.25, s.pointing * 0.5); s.res -= 6;
    say(s, 'A reaction wheel stopped with no spare. Pointing is less accurate for the rest of the mission.', 'fail', 'Fault');
    s.lessons.push('A reaction wheel failed with no spare. Redundancy costs mass and money, and this is what it buys.');
  }
}

function complete(s) {
  const left = s.buffer;
  s.tally.sciLost += left.sci; s.tally.gbLost += left.gb; s.buffer = { gb: 0, sci: 0 };
  s.finished = true;
  if (left.gb > 0.5) {
    say(s, `Mission complete. ${fmt(left.gb)} Gb still on board never reached the ground.`, 'warn', 'End');
    s.lessons.push('Data still on board when the mission ended was lost. Plan downlink time for the last weeks as well as the first.');
  } else say(s, 'Mission complete. The science period is over.', 'good', 'End');
}

// The crew's commands. They take effect on the next day. Returns whether the command was accepted, with a message.
export function command(s, cmd) {
  if (s.finished) return { ok: false, msg: 'The flight is over.' };
  if (s.computer.days > 0 && s.computer.kind === 'reset') return { ok: false, msg: 'The computer is rebooting. Commands wait for it.' };
  if (conjAt(s)) return { ok: false, msg: 'Mars is behind the Sun. Commands are blocked until the window closes.' };
  if (cmd.type === 'safe') {
    s.safe = !s.safe;
    const text = s.safe ? 'Safe mode on. Instruments power down, and a storm is less likely to upset the computer.' : 'Safe mode off. Instruments resume when power allows.';
    say(s, text, 'info', 'Command');
    return { ok: true, msg: text };
  }
  if (cmd.type === 'instr') {
    const p = s.instrs[cmd.i];
    if (!p) return { ok: false, msg: 'No such instrument.' };
    p.on = !p.on;
    const text = `${p.inst.name} switched ${p.on ? 'on' : 'off'}.` + (p.on && s.day < s.arrive ? ' It waits for arrival.' : '');
    say(s, text, 'info', 'Command');
    return { ok: true, msg: text };
  }
  return { ok: false, msg: 'Unknown command.' };
}

export function phaseOf(s) {
  if (s.finished) return s.alive ? 'Complete' : 'Contact lost';
  if (s.arrive < 1 && s.day < 1) return 'Ascent';
  if (s.day < s.arrive) return s.arrive - s.day < 30 ? 'Arrival' : 'Cruise';
  return conjAt(s) ? 'Conjunction' : 'Science';
}

// What the player can see right now. Nothing here reveals a future storm beyond the forecast window.
export function snapshot(s) {
  const day = s.day, supply = supplyAt(s, day);
  const load = s.m.busLoad + s.instrs.reduce((a, p) => a + (p.eff ? p.inst.powerW : 0), 0);
  const active = s.sched.storms.find((st) => day >= st.day && day < st.day + C.stormDays);
  const next = s.sched.storms.find((st) => st.day > day && st.day - day <= C.forecastDays);
  const sitesUp = Math.max(0, s.gnd.sites - (s.outage > 0 ? 1 : 0));
  const computerLabel = s.computer.kind === 'reset' ? `Rebooting, ${s.computer.days} day${s.computer.days === 1 ? '' : 's'} left`
    : s.computer.kind === 'switch' ? 'Backup computer in control'
      : s.redLevel >= 1 ? 'Main computer, backup ready' : 'Main computer, no backup';
  const stormLabel = active ? 'Solar storm in progress'
    : next ? `Storm forecast in ${next.day - day} day${next.day - day === 1 ? '' : 's'}` : 'Quiet';
  return {
    day, end: s.end, arrived: day >= s.arrive, phase: phaseOf(s),
    supply, bus: s.m.busLoad, load, buffer: s.buffer.gb, cap: s.bufferCap, capToday: s.capToday, rate: s.m.rateBps, contact: s.contact,
    conj: !!conjAt(s), conjWindows: s.sched.conj, computerDown: s.computer.days > 0, computerLabel, stormLabel, stormActive: !!active,
    spares: s.spares, pointing: s.pointing, outage: s.outage > 0, sites: sitesUp, gndSites: s.gnd.sites,
    safe: s.safe, finished: s.finished, alive: s.alive, marks: s.marks, sciSoFar: s.tally.sciRet,
    instrs: s.instrs.map((p) => ({ name: p.inst.name, W: p.inst.powerW, gbDay: p.inst.gbDay, on: p.on, eff: p.eff, shed: p.shed })),
  };
}

// The result of a finished flight, in the same shape the debrief and star rule use.
export function scoreFlight(s) {
  const m = s.m, k = m.klass, alive = s.alive;
  const science = alive ? s.tally.sciRet : 0;
  const part = (v, full) => Math.max(0, Math.min(1, v / full));
  const sScience = Math.round(45 * Math.min(1, science / k.sciFull));
  const sMargins = alive ? Math.round((20 / 3) * (part(m.massMargin, 0.1) + part(m.powerMargin, 0.2) + part(m.linkMargin - 1, 0.25))) : 0;
  const over = Math.max(0, m.cost / k.budget - 1);
  const sBudget = Math.max(0, Math.round(20 - 100 * over));
  const sRes = alive ? Math.max(0, Math.round(s.res)) : 0;
  const total = sScience + sMargins + sBudget + sRes;
  const outcome = !alive ? 'Mission lost' : science >= k.sciFull ? 'Full success' : science >= k.sciMin ? 'Success' : 'Partial return';
  const lessons = [...s.lessons];
  if (over > 0) lessons.push(`The mission cost ${fmt(m.cost)} points against a budget of ${k.budget}. Over-running the budget is how real missions get cancelled.`);
  if (alive && science < k.sciMin && m.fitSum < k.sciMin) lessons.push('The instruments were a weak match for the science question. Pick ones built for this objective.');
  if (!lessons.length) lessons.push('A balanced design: margins held, the budget held, and the data came home.');
  return {
    m, alive, science, outcome, lessons: [...new Set(lessons)],
    score: { science: sScience, margins: sMargins, budget: sBudget, resilience: sRes, total },
    log: [...s.log], tally: { ...s.tally },
  };
}

// Plays a whole flight without a screen. plan(snapshot) may return a command for that day, or null.
export function runFlight(design, seed = 1, plan = null) {
  const s = createFlight(design, seed);
  while (!s.finished) {
    if (plan) { const c = plan(snapshot(s)); if (c) command(s, c); }
    stepDay(s);
  }
  return scoreFlight(s);
}
