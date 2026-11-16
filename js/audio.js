// Small synthesized sound effects (Web Audio). No audio files.
let ctx = null;
let enabled = true;

export function setSound(on) { enabled = on; }

function tone(freq, start, dur, type = 'sine', gain = 0.06) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, ctx.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ctx.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  o.connect(g).connect(ctx.destination);
  o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + dur + 0.02);
}

const SOUNDS = {
  click: () => tone(660, 0, 0.05, 'triangle', 0.04),
  step: () => { tone(440, 0, 0.08, 'triangle'); tone(660, 0.07, 0.1, 'triangle'); },
  info: () => tone(520, 0, 0.06, 'sine', 0.03),
  good: () => { tone(523, 0, 0.1); tone(784, 0.09, 0.16); },
  warn: () => { tone(330, 0, 0.12, 'square', 0.03); tone(294, 0.12, 0.16, 'square', 0.03); },
  fail: () => { tone(196, 0, 0.3, 'sawtooth', 0.05); tone(147, 0.25, 0.5, 'sawtooth', 0.05); },
  launch: () => { for (let i = 0; i < 8; i++) tone(110 + i * 35, i * 0.09, 0.14, 'sawtooth', 0.035); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.22)),
};

export function play(name) {
  if (!enabled) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    SOUNDS[name]?.();
  } catch { /* sound is optional */ }
}
