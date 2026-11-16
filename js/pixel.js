// Deep Run — pixel art. Every sprite is an 8×8 bitmap written as text. Each character is a colour from PAL ('.' is transparent).
// Sprites render as crisp SVG for the menus and as pixels on a canvas for the spacecraft and the flight view.
// All art here is drawn by hand for this project; no external image or font files are used.
export const PAL = {
  '.': null, k: '#0b0c0f', w: '#efe7d6', g: '#a39d8f', d: '#4a5160', o: '#ff7a2f', c: '#6fd2e0', C: '#2f7f8c',
  y: '#ffc247', Y: '#b38a1f', r: '#ff5d4f', n: '#8fd694', b: '#3a6ea5', B: '#1b3d61', s: '#c0633c', t: '#c9a27a', e: '#2c313b',
};

export const SPR = {
  rocket: ['...kk...', '..kwwk..', '..kwck..', '..kwwk..', '.kkwwkk.', '.kwwwwk.', 'kk.oo.kk', '...yy...'],
  engine: ['........', '.kkkkkk.', '.kddddk.', 'kkddddkk', '.kdddk..', '..kok...', '..kyk...', '........'],
  camera: ['........', '.kkkk...', 'kkkkkkk.', 'kdddddk.', 'kdcccdk.', 'kdcccdk.', 'kdddddk.', 'kkkkkkk.'],
  radar: ['........', '.kkkkkk.', 'kwwwwwwk', '.kwwwwk.', '..kwwk..', '...kk...', '..kkkk..', '.kkkkkk.'],
  spec: ['...kk...', '..kyyk..', '.kyyyyk.', 'kyyyyyyk', 'kkkkkkkk', '........', '........', '........'],
  sounder: ['........', '.c....c.', '..c..c..', 'cccccccc', '..c..c..', '.c....c.', '........', '........'],
  mag: ['........', '.rrr.ccc', '.rrk.kcc', '.rrk.kcc', '.rrkkkcc', '..kkkkk.', '........', '........'],
  telescope: ['...kk...', '..kwwk..', '.kkwwkk.', 'kkkkkkk.', '.kwwk...', 'kk.kk...', '........', '........'],
  panel: ['........', 'kkkkkkkk', 'kcccccck', 'kkkkkkkk', 'kcccccck', 'kkkkkkkk', '...kk...', '..kkkk..'],
  rtg: ['........', '..kkkk..', '.kyyyyk.', 'kyyyyyyk', 'kkkkkkkk', 'kyyyyyyk', '.kyyyyk.', '..kkkk..'],
  dish: ['........', 'kkkkkkkk', '.kwwwwk.', '..kwwk..', '...kk...', '...kk...', '..kkkk..', '.kkkkkk.'],
  tx: ['......k.', '.....kk.', '....kk..', '...kk...', '..kkkk..', '.kbbbbk.', '.kbbbbk.', '.kkkkkk.'],
  shield: ['........', '.kkkkkk.', 'kbbbbbbk', 'kbbwbbbk', '.kbbbbk.', '..kbbk..', '...kk...', '........'],
  backup: ['kkkk.kkk', 'kwwk.kwk', 'kwwk.kwk', 'kkkk.kkk', '........', '........', '........', '........'],
  ground: ['..kwwk..', '.kwwwwk.', '...kk...', '...kk...', 'kkkkkkkk', 'gggggggg', 'gggggggg', '........'],
  orbit: ['...kk...', '..k..k..', '.k.oo.k.', 'k..oo..k', 'k..oo..k', '.k....k.', '..k..k..', '...kk...'],
  team: ['...kk...', '..kwwk..', '..kwwk..', '...kk...', '..kwwk..', '.kwwwwk.', '.kkkkkk.', '........'],
  pipe: ['........', '...nn...', '...nn.n.', '.n.nn.n.', '.n.nn.n.', 'gggggggg', '........', '........'],
  policy: ['...kk...', '..k..k..', '..k..k..', '.kkkkkk.', '.kyyyyk.', '.kyyyyk.', '.kkkkkk.', '........'],
  storm: ['...yy...', '..yy....', '.yyy....', 'yyyyyy..', '...yy...', '..yy....', '.yy.....', 'y.......'],
  computer: ['........', '.kkkkkk.', '.kcccck.', '.kcccck.', '.kkkkkk.', '...kk...', '..kkkk..', '........'],
  wheel: ['..kkkk..', '.kggggk.', 'kgdkkdgk', 'kgkwwkgk', 'kgdkkdgk', '.kggggk.', '..kkkk..', '........'],
  sun: ['...yy...', '.y.yy.y.', '..yyyy..', 'yyyyyyyy', '..yyyy..', '.y.yy.y.', '...yy...', '........'],
  planet: ['..kkkk..', '.kbbbbk.', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', '.kbbbbk.', '..kkkk..'],
  star: ['...w....', '...w....', '..www...', 'wwwwwwww', '..www...', '.w...w..', '.w...w..', '........'],
  coin: ['..kkkk..', '.kyyyyk.', 'kyYyyyyk', 'kyYyyyyk', 'kyyyyyyk', 'kyyyyyyk', '.kyyyyk.', '..kkkk..'],
  // The walking commander, two frames for a simple left/right step. Facing down; flipped horizontally for "left".
  hero0: ['..kkkk..', '.kwwwwk.', '.kwddwk.', '.kwwwwk.', '.kcccck.', '.kcccck.', '.k.kk.k.', 'kk....kk'],
  hero1: ['..kkkk..', '.kwwwwk.', '.kwddwk.', '.kwwwwk.', '.kcccck.', '.kcccck.', 'k..kk..k', '.kk..kk.'],
  check: ['........', '......n.', '.....nn.', 'n...nn..', 'nn.nn...', '.nnn....', '..n.....', '........'],
  warn: ['...yy...', '...yy...', '...yy...', '...yy...', '........', '...yy...', '........', '........'],
  cross: ['........', 'rr....rr', '.rr..rr.', '..rrrr..', '..rrrr..', '.rr..rr.', 'rr....rr', '........'],
};

// Which sprite stands for each part.
export const PART_SPRITE = {
  launcher: 'rocket', orbit: 'orbit', propulsion: 'engine', power: 'panel', antenna: 'dish', tx: 'tx', shielding: 'shield',
  redundancy: 'backup', ground: 'ground', tracking: 'radar', team: 'team', pipeline: 'pipe', policy: 'policy',
};
export const INSTRUMENT_SPRITE = {
  imager: 'camera', sar: 'radar', neutron: 'spec', irspec: 'spec', sounder: 'sounder', mag: 'mag', iceradar: 'radar',
  camera: 'camera', telescope: 'telescope', nirspec: 'spec', fgs: 'camera',
};

// Crisp SVG of a sprite, for menus and cards. `over` replaces colours (e.g. a planet's colour).
export function sprite(name, scale = 4, over = {}) {
  const rows = SPR[name];
  if (!rows) return '';
  const pal = { ...PAL, ...over };
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < 8) {
      const ch = row[x], col = pal[ch];
      let n = 1;
      while (x + n < 8 && row[x + n] === ch) n++;
      if (col) rects += `<rect x="${x}" y="${y}" width="${n}" height="1" fill="${col}"/>`;
      x += n;
    }
  });
  return `<svg class="px" viewBox="0 0 8 8" width="${8 * scale}" height="${8 * scale}" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}

// Draws a sprite onto a canvas context at pixel position (x, y), one canvas pixel per sprite pixel.
export function drawSprite(g, name, x, y, over = {}) {
  const rows = SPR[name];
  if (!rows) return;
  const pal = { ...PAL, ...over };
  rows.forEach((row, j) => {
    for (let i = 0; i < 8; i++) {
      const col = pal[row[i]];
      if (col) { g.fillStyle = col; g.fillRect(x + i, y + j, 1, 1); }
    }
  });
}

// Draws the spacecraft as it is built: body, solar wings or generators, dish, transmitter, nozzle, instruments and shielding.
// Works on a canvas of 96 × 64 pixels; the CSS scales it up with pixelated rendering.
export function paintAssembly(cv, d, m) {
  const W = 96, H = 64;
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  g.fillStyle = '#0b0c0f'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) R((i * 37) % W, (i * 23) % H, 1, 1, i % 5 ? '#2a3140' : '#4a5160');

  const cx = 48, payloadKg = m.payloadKg || 0;
  const bw = Math.min(26, Math.max(10, 8 + Math.round(payloadKg / 25)));
  const bh = 14, by = 28, left = cx - bw / 2, right = cx + bw / 2;

  // Power: solar wings scale with area; radioisotope generators sit on the sides.
  if (d.power.type === 'solar') {
    const span = Math.min(30, Math.max(4, Math.round(d.power.areaM2 * 0.9)));
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? left - span - 1 : right + 1;
      R(side < 0 ? left - 1 : right, by + 2, 1, 2, '#4a5160');
      for (let x = 0; x < span; x++) R(x0 + x, by + 4, 1, 7, x % 3 === 2 ? '#2c313b' : '#2f7f8c');
    }
  } else {
    // Units alternate sides and step outward, so each one stays visible.
    for (let k = 0; k < d.power.units; k++) {
      const col = Math.floor(k / 2), x = k % 2 === 0 ? left - 5 - col * 5 : right + 1 + col * 5;
      R(x, by + 3, 4, 8, '#b38a1f'); R(x, by + 2, 4, 1, '#ffc247'); R(x, by + 11, 4, 1, '#4a5160');
    }
  }

  // Engine nozzle and flame.
  const nw = d.propulsion === 'biprop' ? 10 : 6;
  R(cx - nw / 2, by + bh, nw, 3, '#4a5160');
  R(cx - 2, by + bh + 3, 4, 4, '#ff7a2f'); R(cx - 1, by + bh + 6, 2, 2, '#ffc247');

  // Body and its panels.
  R(left, by, bw, bh, '#efe7d6');
  R(left, by + bh - 3, bw, 3, '#a39d8f');
  R(left, by, bw, 1, '#0b0c0f'); R(left, by + bh - 1, bw, 1, '#0b0c0f');
  R(left, by, 1, bh, '#0b0c0f'); R(right - 1, by, 1, bh, '#0b0c0f');
  const colours = ['#6fd2e0', '#ffc247', '#8fd694'];
  const instruments = d.instruments.filter(Boolean);
  instruments.forEach((_, i) => R(left + 3 + i * 6, by + 4, 4, 4, colours[i % colours.length]));

  // Backup computer block.
  if (d.redundancy !== 'single') R(right + 1, by + 1, 3, 3, '#a39d8f');

  // Shielding glow.
  const shield = d.shielding === 's2' ? 2 : d.shielding === 's1' ? 1 : 0;
  if (shield) {
    const sc = shield === 2 ? '#6fd2e0' : '#3a6ea5', x0 = left - 3, y0 = by - 3, x1 = right + 2, y1 = by + bh + 1;
    R(x0, y0, x1 - x0, 1, sc); R(x0, y1, x1 - x0, 1, sc); R(x0, y0, 1, y1 - y0, sc); R(x1, y0, 1, y1 - y0, sc);
  }

  // Antenna: a dish on a mast, sized by the dish. Its widest row is at the top. Transmitter whip on the left.
  const dishR = { patch: 0, hga1: 3, hga3: 6 }[d.antenna] ?? 0;
  R(cx, by - 4, 1, 4, '#a39d8f');
  if (dishR) {
    for (let k = 0; k < dishR; k++) R(cx - (dishR - k), by - 4 - dishR + k, 2 * (dishR - k) + 1, 1, '#efe7d6');
  } else R(cx - 1, by - 5, 3, 1, '#efe7d6');
  R(left + 2, by - 6, 1, 6, '#ff5d4f');
  R(left + 1, by - 6, 1, 1, '#ff5d4f');

  // Off-nominal: a launch that cannot reach orbit shows as a faint red frame.
  if (m.massMargin < 0) { R(0, 0, W, 1, '#ff5d4f'); R(0, H - 1, W, 1, '#ff5d4f'); R(0, 0, 1, H, '#ff5d4f'); R(W - 1, 0, 1, H, '#ff5d4f'); }
}

// Pixel planets for the schematic view. Returns the colours used for each body.
export const PLANET = {
  earth: { b: '#3a6ea5', B: '#1b3d61', w: '#efe7d6' },
  moon: { b: '#b9b2a4', B: '#4a5160', w: '#a39d8f' },
  mars: { b: '#c0633c', B: '#6b2f18', w: '#efe7d6' },
  jupiter: { b: '#c9a27a', B: '#7a5a3a', w: '#efe7d6' },
};

// Draws a filled pixel disc with a shaded lower-right edge.
export function discPx(g, cx, cy, r, base, shade) {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y + 0.25));
    for (let x = -half; x <= half; x++) {
      const edge = x + y > r * 0.5;
      g.fillStyle = edge ? shade : base;
      g.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
    }
  }
}
