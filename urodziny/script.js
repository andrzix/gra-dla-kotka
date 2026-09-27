'use strict';

// Ustawienia niespodzianki: tu zmieniasz imię, wiek, trasę, termin i podpis.
const CONFIG = {
  imie: 'Zuzia',
  wolacz: 'Zuziu',
  zKim: 'z Zuzią',
  wiek: 22,
  skad: 'Wrocław',
  dokad: 'Zator',
  dystans: 'ok. 270 km',
  termin: '',
  dedykacja: 'Wszystkiego najlepszego, Zuziu. Kocham Cię!',
  podpis: 'Twój kierowca, Lampart i Emi',
};

// Pieczątki w paszporcie Lamparta. together: true = wspólna przygoda z nią.
const STAMPS = [
  { place: 'Warszawa', sub: 'Lotnisko', icon: 'plane', color: '#2F55C4', shape: 'rect' },
  { place: 'Afryka', sub: 'Safari', icon: 'sun', color: '#CF3F37', shape: 'circle' },
  { place: 'Amazonia', sub: 'Skok w dżunglę', icon: 'chute', color: '#23855A', shape: 'oval' },
  { place: 'Teneryfa', sub: 'Park wodny', icon: 'wave', color: '#1C7FA3', shape: 'circle', together: true },
  { place: 'Turcja', sub: 'Land of Legends', icon: 'castle', color: '#7447B5', shape: 'rect', together: true },
];
const FINAL_STAMP = { place: 'Zator', sub: 'Energylandia', icon: 'coaster', color: '#E0561B', shape: 'circle', together: true };

const C = {
  ink: '#2A1E3F',
  paper: '#FFF8EC',
  tangerine: '#FF8A3D',
  bubblegum: '#FF7EAD',
  butter: '#FFD45C',
  inner: '#FFA3C4',
  grass: '#86D6AB',
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const esc = (str) => String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function lata(n) {
  if (n === 1) return 'rok';
  const d = n % 10, dd = n % 100;
  return d >= 2 && d <= 4 && (dd < 12 || dd > 14) ? 'lata' : 'lat';
}

const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* prywatne okno */ }
  },
};

/* =========================================================
   Dźwięk (syntezowany, bez plików)
   ========================================================= */

const Sound = {
  ctx: null,
  master: null,
  on: store.get('kotek-sound', true),

  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  },

  tone({ f = 440, to = null, t = 0, d = 0.15, type = 'sine', v = 0.25 }) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, now = c.currentTime + t;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, now);
    if (to) o.frequency.exponentialRampToValueAtTime(to, now + d);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(v, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + d);
    o.connect(g).connect(this.master);
    o.start(now);
    o.stop(now + d + 0.05);
  },

  noise({ t = 0, d = 0.3, v = 0.2, f = 1200, q = 0.8 }) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, now = c.currentTime + t;
    const len = Math.floor(c.sampleRate * d);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.value = v;
    src.connect(bp).connect(g).connect(this.master);
    src.start(now);
  },

  meow() {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, now = c.currentTime, pitch = rand(0.9, 1.15);
    const o = c.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(430 * pitch, now);
    o.frequency.linearRampToValueAtTime(760 * pitch, now + 0.16);
    o.frequency.linearRampToValueAtTime(500 * pitch, now + 0.5);
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 3;
    bp.frequency.setValueAtTime(900, now);
    bp.frequency.linearRampToValueAtTime(1900, now + 0.18);
    bp.frequency.linearRampToValueAtTime(800, now + 0.5);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.4, now + 0.05);
    g.gain.setValueAtTime(0.4, now + 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    o.connect(bp).connect(g).connect(this.master);
    o.start(now);
    o.stop(now + 0.6);
  },

  play(name) {
    const fx = SFX[name];
    if (fx) fx(this);
  },
};

const NOTE = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, C6: 1046.5 };

const SFX = {
  pop: (s) => s.tone({ f: 520, to: 900, d: 0.09, v: 0.22 }),
  tap: (s) => s.tone({ f: 420, to: 330, d: 0.06, type: 'triangle', v: 0.12 }),
  flip: (s) => s.tone({ f: 760, to: 520, d: 0.05, type: 'triangle', v: 0.12 }),
  squeak: (s) => {
    s.tone({ f: 1900, to: 2700, d: 0.07, v: 0.15 });
    s.tone({ f: 2100, to: 3000, t: 0.09, d: 0.08, v: 0.13 });
  },
  meow: (s) => s.meow(),
  blow: (s) => s.noise({ d: 0.55, v: 0.4, f: 900, q: 0.6 }),
  swoosh: (s) => s.noise({ d: 0.18, v: 0.14, f: 1800, q: 1.2 }),
  thud: (s) => {
    s.tone({ f: 150, to: 50, d: 0.2, v: 0.55 });
    s.noise({ d: 0.09, v: 0.3, f: 500, q: 0.7 });
  },
  coin: (s) => {
    s.tone({ f: 988, d: 0.08, type: 'square', v: 0.05 });
    s.tone({ f: 1319, t: 0.07, d: 0.16, type: 'square', v: 0.05 });
  },
  bump: (s) => s.tone({ f: 220, to: 110, d: 0.25, type: 'triangle', v: 0.3 }),
  win: (s) => [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => s.tone({ f, t: i * 0.09, d: 0.3, type: 'triangle', v: 0.2 })),
  clue: (s) => [NOTE.G5, NOTE.C6, 1318.5].forEach((f, i) => s.tone({ f, t: i * 0.07, d: 0.4, v: 0.16 })),
  birthday: (s) => {
    const song = [
      ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
      ['G4', 0.75], ['G4', 0.25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
      ['G4', 0.75], ['G4', 0.25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 2],
      ['F5', 0.75], ['F5', 0.25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2.5],
    ];
    const beat = 0.3;
    let t = 0.05;
    for (const [n, len] of song) {
      s.tone({ f: NOTE[n], t, d: len * beat * 0.95 + 0.1, type: 'triangle', v: 0.2 });
      s.tone({ f: NOTE[n] * 2, t, d: 0.2, v: 0.05 });
      t += len * beat;
    }
  },
  fanfare: (s) => {
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f, i) => s.tone({ f, t: i * 0.12, d: 0.2, type: 'square', v: 0.07 }));
    [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach((f) => s.tone({ f, t: 0.5, d: 1.5, type: 'triangle', v: 0.12 }));
  },
};

/* =========================================================
   Rysunki (SVG)
   ========================================================= */

function cat(opts = {}) {
  const p = {
    fur: '#FF9A4D', stripe: '#E46F24', belly: '#FFE9D2', inner: C.inner,
    eyes: 'dot', hat: null, prop: null, collar: null,
    patches: [], bodyPatches: [], stripes: true, wide: 1, crop: false,
    pawFill: null, muzzle: false, scarf: null, attrs: '',
    ...opts,
  };
  const ink = C.ink, w = p.wide;
  const s = `stroke="${ink}" stroke-width="4" stroke-linejoin="round"`;
  const bx = 100 + 40 * w;
  const tailPath = `M${bx} 196 C ${bx + 42} 194, ${bx + 48} 150, ${bx + 26} 128`;
  const tail = `<g class="tail">
    <path d="${tailPath}" fill="none" stroke="${ink}" stroke-width="20" stroke-linecap="round"/>
    <path d="${tailPath}" fill="none" stroke="${p.fur}" stroke-width="12" stroke-linecap="round"/>
    ${p.stripes ? `<path d="${tailPath}" fill="none" stroke="${p.stripe}" stroke-width="12" stroke-dasharray="5 13"/>` : ''}
  </g>`;

  const ellipses = (list) => list.map((e) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${e.fill}"/>`).join('');

  const collar = p.collar ? `
    <path d="M64 146 Q100 166 136 146" fill="none" stroke="${ink}" stroke-width="11" stroke-linecap="round"/>
    <path d="M64 146 Q100 166 136 146" fill="none" stroke="${p.collar}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="100" cy="161" r="7" fill="${C.butter}" stroke="${ink}" stroke-width="3"/>` : '';

  const scarf = p.scarf ? `
    <path d="M64 146 Q100 168 136 146" fill="none" stroke="${ink}" stroke-width="14" stroke-linecap="round"/>
    <path d="M64 146 Q100 168 136 146" fill="none" stroke="${p.scarf}" stroke-width="9" stroke-linecap="round"/>
    <path d="M116 156 Q126 170 122 186 L110 183 Q113 170 106 159 Z" fill="${p.scarf}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>` : '';

  const pawAt = (x) => `<ellipse cx="${x}" cy="209" rx="14" ry="9" fill="${p.pawFill || p.fur}" ${s}/>
    <path d="M${x - 4} 213 v-4 M${x + 4} 213 v-4" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;

  const body = `<g class="body">
    <ellipse cx="100" cy="168" rx="${46 * w}" ry="44" fill="${p.fur}" ${s}/>
    ${ellipses(p.bodyPatches)}
    <ellipse cx="100" cy="178" rx="${24 * w}" ry="28" fill="${p.belly}"/>
    ${p.stripes ? `<path d="M${100 - 42 * w} 162 h10 M${100 - 44 * w} 176 h9 M${100 + 42 * w} 162 h-10 M${100 + 44 * w} 176 h-9" stroke="${p.stripe}" stroke-width="5" stroke-linecap="round"/>` : ''}
    ${collar}${scarf}
    ${pawAt(100 - 18 * w)}${pawAt(100 + 18 * w)}
  </g>`;

  const ears = `
    <g class="ear-l"><path d="M46 82 L50 26 L90 52 Z" fill="${p.fur}" ${s}/><path d="M55 70 L57 40 L80 55 Z" fill="${p.inner}"/></g>
    <g class="ear-r"><path d="M154 82 L150 26 L110 52 Z" fill="${p.fur}" ${s}/><path d="M145 70 L143 40 L120 55 Z" fill="${p.inner}"/></g>`;

  const eyes = {
    dot: `<g class="eyes">
      <ellipse cx="78" cy="100" rx="9" ry="11.5" fill="${ink}"/><ellipse cx="122" cy="100" rx="9" ry="11.5" fill="${ink}"/>
      <circle cx="81.5" cy="95" r="3.6" fill="#fff"/><circle cx="125.5" cy="95" r="3.6" fill="#fff"/>
      <circle cx="75.5" cy="104.5" r="1.7" fill="#fff"/><circle cx="119.5" cy="104.5" r="1.7" fill="#fff"/></g>`,
    glow: `<g class="eyes">
      <ellipse cx="78" cy="100" rx="11" ry="12" fill="#D6F36B" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="122" cy="100" rx="11" ry="12" fill="#D6F36B" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="78" cy="100" rx="3.4" ry="9" fill="${ink}"/><ellipse cx="122" cy="100" rx="3.4" ry="9" fill="${ink}"/>
      <circle cx="82" cy="95" r="2.6" fill="#fff"/><circle cx="126" cy="95" r="2.6" fill="#fff"/></g>`,
    green: `<g class="eyes">
      <ellipse cx="78" cy="100" rx="10" ry="12" fill="#7FD47E" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="122" cy="100" rx="10" ry="12" fill="#7FD47E" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="78" cy="101" rx="4.6" ry="8.5" fill="${ink}"/><ellipse cx="122" cy="101" rx="4.6" ry="8.5" fill="${ink}"/>
      <circle cx="81.5" cy="95" r="3" fill="#fff"/><circle cx="125.5" cy="95" r="3" fill="#fff"/></g>`,
    sleepy: `<g class="eyes still"><path d="M68 100 Q78 107 88 100 M112 100 Q122 107 132 100" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/></g>`,
    happy: `<g class="eyes still"><path d="M69 104 Q78 93 87 104 M113 104 Q122 93 131 104" fill="none" stroke="${ink}" stroke-width="4.5" stroke-linecap="round"/></g>`,
  };

  const face = `${p.muzzle ? '<ellipse cx="100" cy="120" rx="19" ry="12" fill="#FFFFFF"/>' : ''}
    <ellipse cx="63" cy="117" rx="9" ry="5.5" fill="${C.bubblegum}" opacity=".5"/>
    <ellipse cx="137" cy="117" rx="9" ry="5.5" fill="${C.bubblegum}" opacity=".5"/>
    <path d="M94 113 Q100 110.5 106 113 L100 119.5 Z" fill="${C.bubblegum}" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M100 119.5 q0 7 -8 7 M100 119.5 q0 7 8 7" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M58 110 L30 104 M58 117 L29 120 M142 110 L170 104 M142 117 L171 120" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;

  const hats = {
    goggles: `<g>
      <path d="M40 72 Q100 46 160 72" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
      <path d="M40 72 Q100 46 160 72" fill="none" stroke="#7A5234" stroke-width="5" stroke-linecap="round"/>
      <circle cx="82" cy="62" r="14" fill="#BFE6FA" stroke="${ink}" stroke-width="4"/>
      <circle cx="118" cy="62" r="14" fill="#BFE6FA" stroke="${ink}" stroke-width="4"/>
      <circle cx="82" cy="62" r="9" fill="none" stroke="#D7AE55" stroke-width="3"/>
      <circle cx="118" cy="62" r="9" fill="none" stroke="#D7AE55" stroke-width="3"/>
      <path d="M76 57 q3 -4 8 -4 M112 57 q3 -4 8 -4" stroke="#fff" stroke-width="2.5" stroke-linecap="round" fill="none"/></g>`,
    detective: `<g>
      <path d="M50 66 Q52 26 100 24 Q148 26 150 66 Q100 50 50 66 Z" fill="#C08A55" ${s}/>
      <path d="M66 36 L74 58 M100 26 V52 M134 36 L126 58 M56 50 Q100 36 144 50" stroke="#8C5B2E" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M66 60 Q100 80 134 60 Q100 64 66 60 Z" fill="#8C5B2E" ${s}/></g>`,
  };

  const props = {
    magnifier: `<g>
      <path d="M48 198 L30 170" stroke="${ink}" stroke-width="11" stroke-linecap="round"/>
      <path d="M48 198 L30 170" stroke="#8C5B2E" stroke-width="5" stroke-linecap="round"/>
      <circle cx="24" cy="156" r="20" fill="#D8F1FF" fill-opacity=".75" stroke="${ink}" stroke-width="5"/>
      <path d="M14 150 q3 -9 12 -10" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></g>`,
  };

  const headStripes = p.stripes
    ? `<path d="M100 50 v13 M86 52 l2 11 M114 52 l-2 11 M42 94 h11 M44 105 h9 M158 94 h-11 M156 105 h-9" stroke="${p.stripe}" stroke-width="5" stroke-linecap="round"/>`
    : '';

  const head = `<g class="head">${ears}
    <ellipse cx="100" cy="96" rx="62" ry="50" fill="${p.fur}" ${s}/>
    ${ellipses(p.patches)}${headStripes}${eyes[p.eyes]}${face}${p.hat ? hats[p.hat] : ''}</g>`;

  const viewBox = p.crop ? '22 0 156 156' : '0 0 200 220';
  const blink = (-Math.random() * 5).toFixed(2);
  return `<svg class="cat" viewBox="${viewBox}" ${p.attrs} aria-hidden="true" style="--blink:${blink}s">${p.crop ? '' : tail}${body}${head}${p.prop && !p.crop ? props[p.prop] : ''}</svg>`;
}

const rosette = (cx, cy) => [
  { cx, cy, rx: 7, ry: 5.5, fill: '#5A3317' },
  { cx, cy, rx: 3.4, ry: 2.5, fill: '#D0913F' },
];

const CATS = {
  lampart: (o) => cat({
    fur: '#A8A5B8', belly: '#FFFFFF', pawFill: '#FFFFFF', stripes: false, eyes: 'green',
    muzzle: true, hat: 'goggles', scarf: C.tangerine, ...o,
  }),
  emi: (o) => cat({
    fur: '#E7A650', stripe: '#6B3F1D', belly: '#FFF1DC', eyes: 'green',
    patches: [...rosette(64, 76), ...rosette(136, 76), ...rosette(58, 124), ...rosette(142, 124)],
    bodyPatches: [...rosette(72, 150), ...rosette(128, 150), ...rosette(64, 188), ...rosette(136, 188)],
    ...o,
  }),
  pazur: (o) => cat({ fur: '#A9A3BE', stripe: '#7C7596', belly: '#ECE9F4', hat: 'detective', prop: 'magnifier', ...o }),
  luna: (o) => cat({ fur: '#3E3756', belly: '#4C4466', inner: '#C77BA0', stripes: false, eyes: 'glow', collar: C.bubblegum, ...o }),
};

const KITTENS = [
  () => cat({ fur: '#C9C4D6', stripe: '#9C95B3', crop: true }),
  () => cat({ fur: '#FFFFFF', belly: '#FFFFFF', stripes: false, patches: [{ cx: 126, cy: 72, rx: 20, ry: 15, fill: '#3E3756' }], crop: true }),
  () => cat({ fur: '#FFB36B', stripe: '#F08A3A', eyes: 'happy', crop: true }),
];

function mouse({ envelope = false, crop = false } = {}) {
  const ink = C.ink, fur = '#BDB7CE', pink = '#FFB1CA';
  const s = `stroke="${ink}" stroke-width="4" stroke-linejoin="round"`;
  const env = envelope ? `<g transform="rotate(-8 116 81)">
      <rect x="100" y="70" width="32" height="22" rx="3" fill="${C.paper}" stroke="${ink}" stroke-width="3"/>
      <path d="M101 72 L116 83 L131 72" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="116" cy="84" r="3.2" fill="${C.bubblegum}"/></g>` : '';
  const tail = 'M30 76 C 12 78, 4 62, 14 54 C 22 48, 31 54, 24 60';
  return `<svg class="mouse" viewBox="${crop ? '58 10 86 86' : '0 0 140 100'}" aria-hidden="true"><g class="m-all">
    <g class="m-tail"><path d="${tail}" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><path d="${tail}" fill="none" stroke="${pink}" stroke-width="3" stroke-linecap="round"/></g>
    <ellipse cx="46" cy="86" rx="10" ry="5" fill="${pink}" stroke="${ink}" stroke-width="3"/>
    <circle cx="78" cy="36" r="16" fill="${fur}" ${s}/><circle cx="78" cy="36" r="9" fill="${pink}"/>
    <path d="M28 78 C 26 52, 52 36, 80 40 C 102 43, 118 56, 124 68 C 127 77, 118 84, 106 84 L 42 86 C 33 86, 28 83, 28 78 Z" fill="${fur}" ${s}/>
    <path d="M50 84 C 60 73, 86 71, 100 83 Z" fill="#E8E4F1"/>
    <circle cx="100" cy="40" r="14" fill="${fur}" ${s}/><circle cx="100" cy="40" r="8" fill="${pink}"/>
    <ellipse cx="108" cy="72" rx="6" ry="3.5" fill="${C.bubblegum}" opacity=".55"/>
    <ellipse cx="106" cy="59" rx="4.5" ry="6" fill="${ink}"/><circle cx="107.6" cy="56.5" r="1.8" fill="#fff"/>
    ${env}
    <circle cx="125" cy="69" r="4.6" fill="${C.bubblegum}" stroke="${ink}" stroke-width="2.5"/>
    <path d="M118 73 l14 -5 M119 76 l15 1" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="98" cy="87" rx="9" ry="5" fill="${pink}" stroke="${ink}" stroke-width="3"/>
  </g></svg>`;
}

function face(p) {
  const ink = C.ink;
  const s = `stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"`;
  let back = '', mid = '', front = '';
  switch (p.kind) {
    case 'kot':
      back = `<path d="M20 48 L22 12 L48 30 Z" fill="${p.fur}" ${s}/><path d="M80 48 L78 12 L52 30 Z" fill="${p.fur}" ${s}/>
        <path d="M26 40 L27 22 L41 32 Z M74 40 L73 22 L59 32 Z" fill="${C.inner}"/>`;
      mid = `${p.stripe ? `<path d="M50 29 v7 M42 31 l1 6 M58 31 l-1 6" stroke="${p.stripe}" stroke-width="3.5" stroke-linecap="round"/>` : ''}
        ${p.spots ? `<g fill="#5A3317"><ellipse cx="30" cy="50" rx="4" ry="3"/><ellipse cx="70" cy="50" rx="4" ry="3"/><ellipse cx="26" cy="72" rx="3.5" ry="2.8"/><ellipse cx="74" cy="72" rx="3.5" ry="2.8"/></g>` : ''}
        ${p.muzzle ? '<ellipse cx="50" cy="70" rx="12" ry="8" fill="#fff"/>' : ''}`;
      front = `<path d="M31 64 l-11 -2 M31 69 l-11 3 M69 64 l11 -2 M69 69 l11 3" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
      break;
    case 'lis':
      back = `<path d="M18 50 L16 8 L48 30 Z" fill="${p.fur}" ${s}/><path d="M82 50 L84 8 L52 30 Z" fill="${p.fur}" ${s}/>
        <path d="M17 20 L16 8 L27 16 Z M83 20 L84 8 L73 16 Z" fill="${ink}"/>`;
      mid = `<path d="M20 64 Q50 56 80 64 Q76 90 50 90 Q24 90 20 64 Z" fill="${C.paper}"/>`;
      break;
    case 'krolik':
      back = `<ellipse cx="37" cy="22" rx="9" ry="22" fill="${p.fur}" ${s} transform="rotate(-10 37 22)"/>
        <ellipse cx="63" cy="22" rx="9" ry="22" fill="${p.fur}" ${s} transform="rotate(10 63 22)"/>
        <ellipse cx="37" cy="22" rx="4" ry="14" fill="${C.inner}" transform="rotate(-10 37 22)"/>
        <ellipse cx="63" cy="22" rx="4" ry="14" fill="${C.inner}" transform="rotate(10 63 22)"/>`;
      front = `<path d="M46 72 h8 v5 h-8 Z" fill="#fff" stroke="${ink}" stroke-width="2"/>`;
      break;
    case 'mis':
      back = `<circle cx="24" cy="32" r="12" fill="${p.fur}" ${s}/><circle cx="76" cy="32" r="12" fill="${p.fur}" ${s}/>
        <circle cx="24" cy="32" r="6" fill="#E3B38A"/><circle cx="76" cy="32" r="6" fill="#E3B38A"/>`;
      mid = `<ellipse cx="50" cy="70" rx="14" ry="10" fill="#EBCBA6" stroke="${ink}" stroke-width="2.5"/>`;
      break;
    case 'pies':
      mid = `<ellipse cx="62" cy="54" rx="11" ry="12" fill="#C98E55"/><ellipse cx="50" cy="70" rx="13" ry="9.5" fill="#F4DDBF" stroke="${ink}" stroke-width="2.5"/>`;
      front = `<ellipse cx="20" cy="56" rx="10" ry="21" fill="#9C6B3E" ${s} transform="rotate(18 20 56)"/>
        <ellipse cx="80" cy="56" rx="10" ry="21" fill="#9C6B3E" ${s} transform="rotate(-18 80 56)"/>
        <path d="M47 76 q3 8 6 0 Z" fill="${C.bubblegum}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
      break;
    case 'lew': {
      const mane = Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return `<circle cx="${(50 + 33 * Math.cos(a)).toFixed(1)}" cy="${(58 + 33 * Math.sin(a)).toFixed(1)}" r="12" fill="#C8702A" ${s}/>`;
      }).join('');
      back = `${mane}<circle cx="27" cy="33" r="7" fill="${p.fur}" ${s}/><circle cx="73" cy="33" r="7" fill="${p.fur}" ${s}/>`;
      mid = '<ellipse cx="50" cy="70" rx="12" ry="8" fill="#FFE3B3"/>';
      break;
    }
    case 'malpka':
      back = `<circle cx="16" cy="58" r="11" fill="${p.fur}" ${s}/><circle cx="84" cy="58" r="11" fill="${p.fur}" ${s}/>
        <circle cx="16" cy="58" r="5.5" fill="#E9C39B"/><circle cx="84" cy="58" r="5.5" fill="#E9C39B"/>`;
      mid = '<g fill="#E9C39B"><circle cx="39" cy="55" r="12"/><circle cx="61" cy="55" r="12"/><ellipse cx="50" cy="71" rx="18" ry="13"/></g>';
      break;
    case 'zabka':
      back = `<circle cx="34" cy="32" r="12" fill="${p.fur}" ${s}/><circle cx="66" cy="32" r="12" fill="${p.fur}" ${s}/>`;
      break;
    case 'hipcio':
      back = `<circle cx="28" cy="31" r="7" fill="${p.fur}" ${s}/><circle cx="72" cy="31" r="7" fill="${p.fur}" ${s}/>`;
      front = `<ellipse cx="50" cy="73" rx="20" ry="13" fill="#CDBDEA" stroke="${ink}" stroke-width="2.5"/>
        <ellipse cx="43" cy="71" rx="2.5" ry="3.5" fill="${ink}"/><ellipse cx="57" cy="71" rx="2.5" ry="3.5" fill="${ink}"/>`;
      break;
    case 'panda':
      back = `<circle cx="26" cy="32" r="12" fill="${ink}"/><circle cx="74" cy="32" r="12" fill="${ink}"/>`;
      mid = `<ellipse cx="37" cy="57" rx="9" ry="11" transform="rotate(25 37 57)" fill="${ink}"/>
        <ellipse cx="63" cy="57" rx="9" ry="11" transform="rotate(-25 63 57)" fill="${ink}"/>`;
      break;
    default:
      break;
  }
  const [ex, ey] = p.kind === 'zabka' ? [16, 32] : [11, 57];
  const L = 50 - ex, Rt = 50 + ex;
  let eyes;
  if (p.kind === 'zabka') {
    eyes = `<circle cx="${L}" cy="${ey}" r="6.5" fill="#fff"/><circle cx="${Rt}" cy="${ey}" r="6.5" fill="#fff"/>
      <circle cx="${L}" cy="${ey + 1}" r="3.6" fill="${ink}"/><circle cx="${Rt}" cy="${ey + 1}" r="3.6" fill="${ink}"/>`;
  } else if (p.green) {
    eyes = `<circle cx="${L}" cy="${ey}" r="5.4" fill="#7FD47E" stroke="${ink}" stroke-width="1.6"/><circle cx="${Rt}" cy="${ey}" r="5.4" fill="#7FD47E" stroke="${ink}" stroke-width="1.6"/>
      <ellipse cx="${L}" cy="${ey}" rx="1.9" ry="4" fill="${ink}"/><ellipse cx="${Rt}" cy="${ey}" rx="1.9" ry="4" fill="${ink}"/>
      <circle cx="${L + 1.8}" cy="${ey - 2}" r="1.3" fill="#fff"/><circle cx="${Rt + 1.8}" cy="${ey - 2}" r="1.3" fill="#fff"/>`;
  } else if (p.kind === 'panda') {
    eyes = `<circle cx="${L}" cy="${ey}" r="4.4" fill="#fff"/><circle cx="${Rt}" cy="${ey}" r="4.4" fill="#fff"/>
      <circle cx="${L}" cy="${ey}" r="2.2" fill="${ink}"/><circle cx="${Rt}" cy="${ey}" r="2.2" fill="${ink}"/>`;
  } else {
    eyes = `<circle cx="${L}" cy="${ey}" r="4.4" fill="${ink}"/><circle cx="${Rt}" cy="${ey}" r="4.4" fill="${ink}"/>
      <circle cx="${L + 1.5}" cy="${ey - 1.5}" r="1.5" fill="#fff"/><circle cx="${Rt + 1.5}" cy="${ey - 1.5}" r="1.5" fill="#fff"/>`;
  }
  const noseFill = p.kind === 'kot' || p.kind === 'krolik' ? C.bubblegum : ink;
  let mouth = `<ellipse cx="50" cy="66" rx="4.5" ry="3.2" fill="${noseFill}" stroke="${ink}" stroke-width="1.5"/>
    <path d="M50 69.5 q-1 5.5 -6 5.5 M50 69.5 q1 5.5 6 5.5" fill="none" stroke="${ink}" stroke-width="2.3" stroke-linecap="round"/>`;
  if (p.kind === 'zabka') mouth = `<path d="M32 68 Q50 82 68 68" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
  if (p.kind === 'hipcio') mouth = '';
  const features = `${eyes}
    <ellipse cx="29" cy="68" rx="5" ry="3.2" fill="${C.bubblegum}" opacity=".5"/><ellipse cx="71" cy="68" rx="5" ry="3.2" fill="${C.bubblegum}" opacity=".5"/>
    ${mouth}`;
  return `<svg class="face" viewBox="0 0 100 100" aria-hidden="true">${back}<circle cx="50" cy="58" r="32" fill="${p.fur}"/>${mid}<circle cx="50" cy="58" r="32" fill="none" ${s}/>${features}${front}</svg>`;
}

const paw = () => `<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">
  <path d="M20 21c-6.2 0-11 5.3-11 9.8 0 3 2.4 4.7 5.3 4.7 2.2 0 3.7-1.2 5.7-1.2s3.5 1.2 5.7 1.2c2.9 0 5.3-1.7 5.3-4.7C31 26.3 26.2 21 20 21z"/>
  <ellipse cx="8.5" cy="17" rx="3.6" ry="4.6" transform="rotate(-24 8.5 17)"/>
  <ellipse cx="15.2" cy="10" rx="3.8" ry="5" transform="rotate(-8 15.2 10)"/>
  <ellipse cx="24.8" cy="10" rx="3.8" ry="5" transform="rotate(8 24.8 10)"/>
  <ellipse cx="31.5" cy="17" rx="3.6" ry="4.6" transform="rotate(24 31.5 17)"/></svg>`;

function balloons() {
  const ink = C.ink;
  const one = (cx, cy, fill, delay) => `<g class="balloon" style="animation-delay:${delay}s">
    <path d="M${cx} ${cy + 32} C ${cx - 6} ${cy + 70}, ${cx + 10} ${cy + 110}, 40 196" fill="none" stroke="${ink}" stroke-width="2.5"/>
    <ellipse cx="${cx}" cy="${cy}" rx="24" ry="29" fill="${fill}" stroke="${ink}" stroke-width="4"/>
    <path d="M${cx - 4} ${cy + 34} l4 -6 l4 6 Z" fill="${fill}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    <ellipse cx="${cx - 9}" cy="${cy - 11}" rx="5" ry="8" fill="#fff" opacity=".6" transform="rotate(20 ${cx - 9} ${cy - 11})"/></g>`;
  return `<svg viewBox="0 0 120 200" aria-hidden="true">${one(34, 44, C.bubblegum, 0)}${one(86, 34, C.butter, -1.1)}${one(60, 94, C.tangerine, -2.2)}</svg>`;
}

function gift() {
  const ink = C.ink;
  return `<svg class="gift" viewBox="0 0 140 150" aria-hidden="true">
    <g class="envelope-in"><g transform="rotate(-24 104 50)">
      <rect x="76" y="32" width="56" height="38" rx="4" fill="${C.paper}" stroke="${ink}" stroke-width="3.5"/>
      <path d="M77 34 L104 53 L131 34" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <circle cx="104" cy="55" r="5" fill="${C.bubblegum}" stroke="${ink}" stroke-width="2"/></g></g>
    <rect x="16" y="70" width="108" height="72" rx="6" fill="${C.bubblegum}"/>
    <rect x="62" y="70" width="16" height="72" fill="${C.butter}" stroke="${ink}" stroke-width="3"/>
    <rect x="16" y="70" width="108" height="72" rx="6" fill="none" stroke="${ink}" stroke-width="4"/>
    <g transform="rotate(-16 12 70)">
      <rect x="8" y="52" width="124" height="22" rx="6" fill="#FF9CC0" stroke="${ink}" stroke-width="4"/>
      <rect x="62" y="52" width="16" height="22" fill="${C.butter}" stroke="${ink}" stroke-width="3"/>
      <ellipse cx="56" cy="44" rx="15" ry="10" fill="${C.butter}" stroke="${ink}" stroke-width="3.5"/>
      <ellipse cx="84" cy="44" rx="15" ry="10" fill="${C.butter}" stroke="${ink}" stroke-width="3.5"/>
      <circle cx="70" cy="48" r="6.5" fill="${C.tangerine}" stroke="${ink}" stroke-width="3"/>
    </g></svg>`;
}

function cake() {
  const ink = C.ink;
  const digits = String(CONFIG.wiek).split('');
  const gap = 30, x0 = 110 - ((digits.length - 1) * gap) / 2;
  const candles = digits.map((d, i) => {
    const x = x0 + i * gap;
    return `<g>
      <ellipse class="glow" cx="${x}" cy="37" rx="15" ry="17" fill="${C.butter}" opacity=".35"/>
      <path d="M${x} 58 V50" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
      <path class="flame" d="M${x} 27 C ${x + 7} 35, ${x + 8} 43, ${x} 50 C ${x - 8} 43, ${x - 7} 35, ${x} 27 Z" fill="${C.butter}" stroke="${C.tangerine}" stroke-width="2.5" stroke-linejoin="round"/>
      <g><circle class="puff" cx="${x}" cy="41" r="5" fill="#BDB7CE"/><circle class="puff" cx="${x + 5}" cy="33" r="4" fill="#BDB7CE"/><circle class="puff" cx="${x - 3}" cy="25" r="3.5" fill="#BDB7CE"/></g>
      <text class="candle-digit" x="${x}" y="92" text-anchor="middle" fill="${C.tangerine}" stroke="${ink}" stroke-width="4" stroke-linejoin="round" paint-order="stroke">${esc(d)}</text>
    </g>`;
  }).join('');

  const depths = [10, 18, 8, 22, 12, 16, 9, 20];
  let drips = 'M30 150 V142 Q30 128 44 128 H176 Q190 128 190 142 V150';
  depths.forEach((dep, i) => {
    const xa = 190 - i * 20, xb = xa - 20;
    drips += ` C ${xa - 2} ${150 + dep}, ${xb + 2} ${150 + dep}, ${xb} 150`;
  });
  drips += ' Z';

  const sprinkles = [[52, 176, 30, C.butter], [74, 186, -20, '#5FBF8C'], [98, 174, 60, C.tangerine], [122, 184, 10, '#7AA7F0'], [146, 176, -40, C.butter], [168, 186, 20, C.tangerine], [110, 188, -60, C.paper], [62, 188, 70, '#7AA7F0']]
    .map(([x, y, r, f]) => `<rect x="${x - 4.5}" y="${y - 1.75}" width="9" height="3.5" rx="1.75" fill="${f}" transform="rotate(${r} ${x} ${y})"/>`).join('');

  return `<svg class="cake" viewBox="0 0 220 212" aria-hidden="true">
    <ellipse cx="110" cy="198" rx="100" ry="11" fill="${C.paper}" stroke="${ink}" stroke-width="4"/>
    <rect x="30" y="128" width="160" height="66" rx="14" fill="#FFB3CE" stroke="${ink}" stroke-width="4"/>
    <path d="${drips}" fill="${C.paper}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
    ${sprinkles}
    <path d="M60 102 L58 64 L86 88 Z" fill="#FFE3A8" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M160 102 L162 64 L134 88 Z" fill="#FFE3A8" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M64 92 L63 72 L78 86 Z M156 92 L157 72 L142 86 Z" fill="${C.inner}"/>
    <rect x="58" y="84" width="104" height="50" rx="14" fill="#FFE3A8" stroke="${ink}" stroke-width="4"/>
    <path d="M84 112 Q92 103 100 112 M120 112 Q128 103 136 112" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>
    <ellipse cx="78" cy="120" rx="7" ry="4" fill="${C.bubblegum}" opacity=".55"/><ellipse cx="142" cy="120" rx="7" ry="4" fill="${C.bubblegum}" opacity=".55"/>
    <path d="M106 117 h8 l-4 5 Z" fill="${C.bubblegum}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M110 122 q0 5 -6 5 M110 122 q0 5 6 5" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M62 116 h-15 M62 123 l-14 4 M158 116 h15 M158 123 l14 4" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
    ${candles}
  </svg>`;
}

function boxArt() {
  const ink = C.ink, card = '#E0A96C', dark = '#9A6333';
  const back = `<svg class="box-back" viewBox="-8 0 136 110" aria-hidden="true">
    <path d="M10 40 L22 26 L98 26 L110 40 Z" fill="${dark}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
    <g class="flaps-open">
      <path d="M22 26 L10 4 L60 2 L64 26 Z" fill="${card}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M98 26 L110 4 L60 2 L56 26 Z" fill="#D59A5C" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
    </g></svg>`;
  const front = `<svg class="box-front" viewBox="-8 0 136 110" aria-hidden="true">
    <g class="flaps-closed">
      <path d="M10 40 L22 26 L98 26 L110 40 Z" fill="#EAB57A" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M60 26 V40" stroke="${ink}" stroke-width="2.5"/>
    </g>
    <g class="flaps-open">
      <path d="M10 40 L-6 22 L14 16 L22 26 Z" fill="${card}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M110 40 L126 22 L106 16 L98 26 Z" fill="${card}" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>
    </g>
    <rect x="10" y="40" width="100" height="66" rx="4" fill="${card}" stroke="${ink}" stroke-width="4"/>
    <path d="M22 70 V56 M18 60 L22 55 L26 60 M32 70 V56 M28 60 L32 55 L36 60" fill="none" stroke="${dark}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(76 66) scale(.7)" fill="${dark}" opacity=".7">
      <path d="M20 21c-6.2 0-11 5.3-11 9.8 0 3 2.4 4.7 5.3 4.7 2.2 0 3.7-1.2 5.7-1.2s3.5 1.2 5.7 1.2c2.9 0 5.3-1.7 5.3-4.7C31 26.3 26.2 21 20 21z"/>
      <ellipse cx="8.5" cy="17" rx="3.6" ry="4.6"/><ellipse cx="15.2" cy="10" rx="3.8" ry="5"/><ellipse cx="24.8" cy="10" rx="3.8" ry="5"/><ellipse cx="31.5" cy="17" rx="3.6" ry="4.6"/>
    </g></svg>`;
  return `${back}<span class="peek"></span>${front}`;
}

function flower(fill) {
  const ink = C.ink;
  const petals = [0, 72, 144, 216, 288].map((a) => {
    const r = (a * Math.PI) / 180;
    return `<circle cx="${(20 + 9 * Math.cos(r)).toFixed(1)}" cy="${(20 + 9 * Math.sin(r)).toFixed(1)}" r="7"/>`;
  }).join('');
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="${fill}" stroke="${ink}" stroke-width="2.5">${petals}</g><circle cx="20" cy="20" r="5.5" fill="${C.butter}" stroke="${ink}" stroke-width="2.5"/></svg>`;
}

const DECOR = {
  yarn: () => `<svg viewBox="0 0 56 50" aria-hidden="true"><path d="M40 36 q10 6 4 12" fill="none" stroke="${C.ink}" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="25" cy="25" r="18" fill="${C.bubblegum}" stroke="${C.ink}" stroke-width="3"/>
    <path d="M10 18 Q25 30 38 10 M9 28 Q26 40 42 16 M14 38 Q28 44 43 28" fill="none" stroke="${C.ink}" stroke-width="2" opacity=".55"/></svg>`,
  cheese: () => `<svg viewBox="0 0 50 40" aria-hidden="true"><path d="M4 26 L42 10 L46 22 L46 34 L4 36 Z" fill="${C.butter}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M4 26 L46 22" stroke="${C.ink}" stroke-width="2"/><circle cx="16" cy="31" r="3" fill="#E5B53A"/><circle cx="30" cy="28" r="2.5" fill="#E5B53A"/><circle cx="38" cy="31" r="2" fill="#E5B53A"/></svg>`,
};

function envelopeArt() {
  const ink = C.ink, pink = '#FF9FC2', light = '#FFB8D2';
  const s = `stroke="${ink}" stroke-width="4" stroke-linejoin="round"`;
  return `<svg viewBox="0 -90 300 290" aria-hidden="true">
    <rect x="10" y="40" width="280" height="150" rx="12" fill="${pink}" ${s}/>
    <path class="env-flap-open" d="M10 42 L150 -58 L290 42 Z" fill="${light}" ${s}/>
    <g class="env-ticket">
      <rect x="40" y="56" width="220" height="120" rx="8" fill="${C.butter}" stroke="${ink}" stroke-width="3.5"/>
      <rect x="40" y="56" width="42" height="120" rx="8" fill="${C.tangerine}" stroke="${ink}" stroke-width="3.5"/>
      <path d="M82 60 V172" stroke="${ink}" stroke-width="3" stroke-dasharray="6 5"/>
      <text x="170" y="98" text-anchor="middle" font-family="Grandstander, ui-rounded, sans-serif" font-weight="900" font-size="30" fill="${ink}">BILET</text>
      <path d="M112 116 H228 M122 130 H218" stroke="${ink}" stroke-width="3" stroke-linecap="round" opacity=".35"/>
    </g>
    <path d="M10 64 L150 144 L290 64 V178 Q290 190 278 190 H22 Q10 190 10 178 Z" fill="${pink}" ${s}/>
    <path d="M14 186 L118 122 M286 186 L182 122" stroke="${ink}" stroke-width="3" opacity=".35"/>
    <path class="env-flap-closed" d="M10 42 L150 134 L290 42 Z" fill="${light}" ${s}/>
    <g class="env-seal">
      <circle cx="150" cy="128" r="21" fill="#F0508A" stroke="${ink}" stroke-width="3.5"/>
      <g transform="translate(137 115) scale(.65)" fill="#FFE0EC">
        <path d="M20 21c-6.2 0-11 5.3-11 9.8 0 3 2.4 4.7 5.3 4.7 2.2 0 3.7-1.2 5.7-1.2s3.5 1.2 5.7 1.2c2.9 0 5.3-1.7 5.3-4.7C31 26.3 26.2 21 20 21z"/>
        <ellipse cx="8.5" cy="17" rx="3.6" ry="4.6"/><ellipse cx="15.2" cy="10" rx="3.8" ry="5"/><ellipse cx="24.8" cy="10" rx="3.8" ry="5"/><ellipse cx="31.5" cy="17" rx="3.6" ry="4.6"/>
      </g>
    </g>
  </svg>`;
}

const TRACK = 'M-20 150 L30 150 C60 150 80 30 115 30 C150 30 165 150 205 150 L245 150 A35 35 0 0 0 245 80 A35 35 0 0 0 245 150 L380 150';

function coasterArt() {
  const ink = C.ink;
  const riders = [[-12, '#FF9A4D', ink], [0, '#3E3756', '#fff'], [12, '#FFF6EA', ink]].map(([x, fur, eye]) => `
    <path d="M${x - 6} -21 l-4 -12 M${x + 6} -21 l4 -12" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M${x - 7} -26 l1 -9 l5 5 Z M${x + 7} -26 l-1 -9 l-5 5 Z" fill="${fur}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${x}" cy="-25" r="7" fill="${fur}" stroke="${ink}" stroke-width="2.5"/>
    <circle cx="${x - 2.5}" cy="-25.5" r="1.3" fill="${eye}"/><circle cx="${x + 2.5}" cy="-25.5" r="1.3" fill="${eye}"/>`).join('');
  const cloud = (x, y) => `<path class="cloud" transform="translate(${x} ${y})" d="M-28 10 Q-31 -4 -16 -4 Q-12 -18 4 -16 Q16 -24 25 -8 Q35 -6 32 10 Z" fill="${C.paper}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`;
  return `<svg viewBox="0 0 360 180" aria-hidden="true">
    ${cloud(44, 36)}${cloud(318, 42)}
    <g class="supports" stroke="#8B7FA8" stroke-width="3" stroke-linecap="round"></g>
    <path class="track-base" d="${TRACK}" fill="none" stroke="${ink}" stroke-width="9" stroke-linecap="round"/>
    <path d="${TRACK}" fill="none" stroke="${C.bubblegum}" stroke-width="3.5" stroke-linecap="round"/>
    <rect x="-10" y="168" width="380" height="20" fill="${C.grass}" stroke="${ink}" stroke-width="3"/>
    <g class="cart" transform="translate(115 30)">${riders}
      <rect x="-22" y="-20" width="44" height="15" rx="5" fill="${C.tangerine}" stroke="${ink}" stroke-width="3"/>
      <circle cx="-12" cy="-4" r="4" fill="${ink}"/><circle cx="12" cy="-4" r="4" fill="${ink}"/>
    </g></svg>`;
}

const ICONS = {
  speed: () => `<svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M8 46 A24 24 0 0 1 56 46 Z" fill="${C.butter}" stroke="${C.ink}" stroke-width="4.5" stroke-linejoin="round"/>
    <path d="M11 46 H16 M17.2 31.2 L20.7 34.7 M32 25 V30 M46.8 31.2 L43.3 34.7 M53 46 H48" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M32 46 L46 29" stroke="${C.tangerine}" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="32" cy="46" r="4.5" fill="${C.ink}"/></svg>`,
  height: () => `<svg viewBox="0 0 64 64" aria-hidden="true">
    <path d="M4 56 H46" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M6 54 C18 54 20 14 28 14 C36 14 38 54 46 54" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 54 C18 54 20 14 28 14 C36 14 38 54 46 54" fill="none" stroke="${C.bubblegum}" stroke-width="2"/>
    <path d="M56 54 V14 M51 20 L56 13 L61 20" fill="none" stroke="${C.tangerine}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  fuel: () => `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="12" y="10" width="26" height="44" rx="5" fill="${C.butter}" stroke="${C.ink}" stroke-width="4"/>
    <rect x="17" y="16" width="16" height="11" rx="2" fill="${C.paper}" stroke="${C.ink}" stroke-width="3"/>
    <path d="M25 33 q5 7 0 11 q-5 -4 0 -11 Z" fill="${C.tangerine}"/>
    <path d="M38 22 H44 Q48 22 48 26 V42 Q48 46 52 46 Q56 46 56 42 V20 L50 14" fill="none" stroke="${C.ink}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 56 H42" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/></svg>`,
};

ICONS.passport = () => `<svg viewBox="0 0 64 64" aria-hidden="true">
    <rect x="14" y="8" width="36" height="48" rx="5" fill="#2B3A67" stroke="${C.ink}" stroke-width="4"/>
    <circle cx="32" cy="28" r="9" fill="none" stroke="#F2CF75" stroke-width="3"/>
    <path d="M23 28 H41 M32 19 Q27 28 32 37 Q37 28 32 19" fill="none" stroke="#F2CF75" stroke-width="2"/>
    <path d="M24 45 H40" stroke="#F2CF75" stroke-width="3" stroke-linecap="round"/>
    <path d="M8 56 L56 8" stroke="${C.bubblegum}" stroke-width="6" stroke-linecap="round"/>
    <path d="M8 56 L56 8" stroke="${C.ink}" stroke-width="2" stroke-linecap="round" opacity=".4"/></svg>`;

const STAMP_ICONS = {
  plane: () => '<path d="M4 18 L30 12 L40 4 Q44 2 43 6 L36 14 L40 30 L36 31 L28 18 L16 21 L14 27 L11 28 L10 20 L4 20 Z"/>',
  sun: () => '<circle cx="24" cy="18" r="8"/><path d="M24 2 V6 M24 30 V34 M8 18 H12 M36 18 H40 M13 7 L16 10 M32 26 L35 29 M35 7 L32 10 M16 26 L13 29" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  chute: () => '<path d="M6 16 Q6 2 24 2 Q42 2 42 16 Z"/><path d="M6 16 L22 30 M42 16 L26 30 M24 16 V29" stroke="currentColor" stroke-width="2"/><rect x="20" y="28" width="8" height="7" rx="2"/>',
  wave: () => '<path d="M2 18 Q8 10 14 18 T26 18 T38 18 T50 18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M2 28 Q8 20 14 28 T26 28 T38 28 T50 28" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>',
  castle: () => '<path d="M6 34 V12 H11 V17 H16 V12 H21 V4 L24 1 L27 4 V12 H32 V17 H37 V12 H42 V34 Z"/><rect x="20" y="24" width="8" height="10" rx="4" fill="#F4EEDF"/>',
  coaster: () => '<path d="M2 32 C10 32 12 4 20 4 C28 4 28 32 34 32 A7 7 0 1 0 34 18 A7 7 0 1 0 34 32 L48 32" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>',
};

function stampHTML(st, i, extra = '') {
  const rot = [-8, 5, -4, 7, -6, 3][i % 6];
  return `<div class="stamp stamp-${st.shape} ${extra}" style="--c:${st.color};--r:${rot}deg;--i:${i}">
    <svg class="stamp-icon" viewBox="0 0 48 36" fill="currentColor" aria-hidden="true">${STAMP_ICONS[st.icon]()}</svg>
    <span class="stamp-place">${esc(st.place)}</span>
    <span class="stamp-sub">${esc(st.sub)}</span>
    ${st.together ? `<span class="stamp-with">${esc(CONFIG.zKim)}</span>` : ''}
  </div>`;
}

function passportHTML(final) {
  const stamps = STAMPS.map((st, i) => stampHTML(st, i)).join('');
  const last = final
    ? stampHTML(FINAL_STAMP, STAMPS.length, 'slam')
    : '<div class="stamp-empty" aria-label="Pusta strona"><span>?</span></div>';
  return `<div class="passport">
    <div class="passport-head"><span>Paszport</span><span>Kot podróżnik</span></div>
    <div class="passport-id">
      <div class="passport-photo">${CATS.lampart({ crop: true })}</div>
      <dl class="passport-data">
        <div><dt>Imię</dt><dd>Lampart</dd></div>
        <div><dt>Umaszczenie</dt><dd>szare, białe łapki</dd></div>
        <div><dt>Oczy</dt><dd>zielone</dd></div>
      </dl>
    </div>
    <div class="passport-stamps">${stamps}${last}</div>
  </div>`;
}

function parachuteArt() {
  const ink = C.ink;
  const canopy = 'M8 52 Q8 6 60 6 Q112 6 112 52 Q99 44 86 52 Q73 44 60 52 Q47 44 34 52 Q21 44 8 52 Z';
  return `<svg viewBox="0 0 120 172" aria-hidden="true">
    <path d="M10 52 L54 104 M34 51 L56 102 M60 51 V100 M86 51 L64 102 M110 52 L66 104" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>
    <path d="${canopy}" fill="${C.tangerine}"/>
    <path d="M34 51 Q34 16 60 6 Q45 22 47 48 Z M86 51 Q86 16 60 6 Q75 22 73 48 Z" fill="${C.paper}"/>
    <path d="${canopy}" fill="none" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
    ${CATS.lampart({ attrs: 'x="24" y="92" width="72" height="80"' })}
  </svg>`;
}

const fishArt = () => `<svg viewBox="0 0 56 34" aria-hidden="true">
  <path d="M40 17 L54 5 L51 17 L54 29 Z" fill="${C.butter}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>
  <ellipse cx="24" cy="17" rx="19" ry="12" fill="${C.tangerine}" stroke="${C.ink}" stroke-width="3"/>
  <path d="M26 9 q5 8 0 16 M33 10 q4 7 0 14" fill="none" stroke="${C.ink}" stroke-width="1.8" opacity=".45"/>
  <circle cx="13" cy="14" r="3.2" fill="${C.ink}"/><circle cx="14" cy="13" r="1.1" fill="#fff"/></svg>`;

const toucanArt = () => `<svg viewBox="0 0 70 50" aria-hidden="true">
  <path d="M12 30 L2 42 L16 37 Z" fill="${C.ink}"/>
  <ellipse cx="26" cy="28" rx="16" ry="13" fill="#2F2947" stroke="${C.ink}" stroke-width="3"/>
  <ellipse cx="33" cy="31" rx="8" ry="9" fill="${C.paper}"/>
  <path class="wing" d="M14 24 Q24 10 32 25 Q22 30 14 24 Z" fill="#4A4266" stroke="${C.ink}" stroke-width="2"/>
  <path d="M38 20 Q64 15 66 28 Q52 32 38 29 Z" fill="${C.tangerine}" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M41 21 Q58 17 63 22" fill="none" stroke="${C.butter}" stroke-width="3" stroke-linecap="round"/>
  <circle cx="35" cy="22" r="4" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/><circle cx="36" cy="22" r="1.9" fill="${C.ink}"/></svg>`;

const cloudArt = () => `<svg viewBox="-34 -26 70 40" aria-hidden="true"><path d="M-28 10 Q-31 -4 -16 -4 Q-12 -18 4 -16 Q16 -24 25 -8 Q35 -6 32 10 Z" fill="#fff" stroke="${C.ink}" stroke-width="2.5" stroke-linejoin="round" opacity=".9"/></svg>`;

function jungleArt() {
  const tops = [[10, 40, 26], [44, 30, 28], [80, 42, 24], [112, 28, 30], [150, 40, 26], [186, 30, 28], [222, 44, 24], [256, 28, 30], [294, 40, 26], [330, 32, 28], [360, 42, 22]];
  const trees = tops.map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${i % 2 ? '#3E9E6E' : '#5FBF8C'}" stroke="${C.ink}" stroke-width="3"/>`).join('');
  return `<svg viewBox="0 0 360 110" preserveAspectRatio="none" aria-hidden="true">${trees}<rect x="-5" y="52" width="370" height="60" fill="#3E9E6E"/>
    <path d="M150 70 h60" stroke="${C.butter}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 12"/></svg>`;
}

const SOUND_ICON = {
  on: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  off: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 9.5l5 5M21 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
};

/* =========================================================
   Postacie i treść
   ========================================================= */

const ANIMALS = {
  lampart: { name: 'Lampart', line: 'Moja najlepsza podróż? Każda, w którą jadę z Tobą.', art: () => face({ kind: 'kot', fur: '#A8A5B8', green: true, muzzle: true }) },
  emi: { name: 'Emi', line: 'Mrau! To ja nauczyłam Pestkę tak szybko uciekać. Przepraszam!', art: () => face({ kind: 'kot', fur: '#E7A650', stripe: '#6B3F1D', green: true, spots: true }) },
  lew: { name: 'Lew z Afryki', line: '„Pestka mówiła, że tym razem nie leci do Afryki.”', art: () => face({ kind: 'lew', fur: '#F2B14C' }) },
  malpka: { name: 'Małpka z Amazonii', line: '„U-u-a! Do dżungli też nie. Podobno za daleko!”', art: () => face({ kind: 'malpka', fur: '#9C6B3E' }) },
  zabka: { name: 'Żabka z Amazonii', line: '„Kum! Słyszałam, że paszport może zostać w domu.”', art: () => face({ kind: 'zabka', fur: '#7ED36A' }) },
  hipcio: { name: 'Hipcio', line: '„Parku wodnego nie będzie. Będzie coś szybszego!”', art: () => face({ kind: 'hipcio', fur: '#B8A6D9' }) },
};

const CAST = {
  ...Object.fromEntries(Object.entries(ANIMALS).map(([k, a]) => [k, { name: a.name, voice: null, art: a.art }])),
  lampart: { name: 'Lampart', voice: 'meow', art: () => CATS.lampart({ crop: true }) },
  emi: { name: 'Emi', voice: 'meow', art: () => CATS.emi({ crop: true }) },
  pazur: { name: 'Detektyw Pazur', voice: 'meow', art: () => CATS.pazur({ crop: true }) },
  luna: { name: 'Luna', voice: 'meow', art: () => CATS.luna({ crop: true }) },
  pestka: { name: 'Myszka Pestka', voice: 'squeak', art: () => mouse({ crop: true }) },
  kociak: { name: 'Kociak z pudełka', voice: 'meow', art: () => KITTENS[0]() },
};

const CLUES = [
  { icon: 'speed', value: '142 km/h', note: 'Karteczka zgubiona w pudełku' },
  { icon: 'height', value: '77 metrów w górę', note: 'Wysokościomierz Pestki' },
  { icon: 'passport', value: 'Tym razem bez paszportu', note: 'Plotki zwierzaków z podróży' },
  { icon: 'fuel', value: `Pełny bak, ${CONFIG.dystans}`, note: 'Kluczyki i paragon ze stacji' },
];

/* =========================================================
   Konfetti
   ========================================================= */

const Confetti = {
  colors: [C.tangerine, C.bubblegum, C.butter, '#5FBF8C', '#7AA7F0', C.paper],
  parts: [],
  running: false,

  init() {
    this.cv = $('#confetti');
    this.cx = this.cv.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cv.width = Math.round(window.innerWidth * this.dpr);
    this.cv.height = Math.round(window.innerHeight * this.dpr);
  },

  burst({ x = window.innerWidth / 2, y = window.innerHeight / 3, n = 120, angle = -Math.PI / 2, spread = Math.PI * 0.85, power = 1 } = {}) {
    const count = reduceMotion ? Math.min(n, 20) : n;
    for (let i = 0; i < count; i++) {
      const a = angle + rand(-spread / 2, spread / 2);
      const v = rand(5, 13) * power;
      this.parts.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        rot: rand(0, Math.PI * 2), vr: rand(-0.3, 0.3),
        w: rand(7, 12), h: rand(4, 7), color: pick(this.colors),
        shape: pick(['r', 'r', 'c', 'h']), t: 0, life: rand(110, 170),
      });
    }
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame((t) => this.tick(t));
    }
  },

  tick(now) {
    const k = Math.min(3, (now - this.last) / 16.67);
    this.last = now;
    const { cx, dpr } = this;
    const W = window.innerWidth, H = window.innerHeight;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    this.parts = this.parts.filter((p) => p.t < p.life && p.y < H + 40);
    for (const p of this.parts) {
      p.t += k;
      p.vy += 0.22 * k;
      p.vx *= Math.pow(0.985, k);
      p.vy *= Math.pow(0.985, k);
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.rot += p.vr * k;
      cx.save();
      cx.globalAlpha = Math.max(0, Math.min(1, (p.life - p.t) / 30));
      cx.translate(p.x, p.y);
      cx.rotate(p.rot);
      cx.fillStyle = p.color;
      if (p.shape === 'r') {
        cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      } else if (p.shape === 'c') {
        cx.beginPath();
        cx.arc(0, 0, p.h * 0.8, 0, Math.PI * 2);
        cx.fill();
      } else {
        const s = p.w / 10;
        cx.beginPath();
        cx.moveTo(0, 3 * s);
        cx.bezierCurveTo(-6 * s, -1 * s, -3 * s, -6 * s, 0, -3 * s);
        cx.bezierCurveTo(3 * s, -6 * s, 6 * s, -1 * s, 0, 3 * s);
        cx.fill();
      }
      cx.restore();
    }
    if (this.parts.length) {
      requestAnimationFrame((t) => this.tick(t));
    } else {
      this.running = false;
      cx.clearRect(0, 0, W, H);
    }
  },
};

/* =========================================================
   Silnik scen
   ========================================================= */

const SCENES = ['start', 'cake', 'story', 'passport', 'boxes', 'jump', 'memory', 'chase', 'guess', 'reveal'];
const CLUE_FROM = ['boxes', 'jump', 'memory', 'chase'];
let scope = null;

function newScope() {
  const s = { alive: true, timers: new Set(), cleanups: [] };
  s.after = (ms, fn) => {
    const id = setTimeout(() => {
      s.timers.delete(id);
      if (s.alive) fn();
    }, ms);
    s.timers.add(id);
    return id;
  };
  s.wait = (ms) => new Promise((resolve) => s.after(ms, resolve));
  s.every = (ms, fn) => {
    const id = setInterval(() => s.alive && fn(), ms);
    s.timers.add(id);
    return id;
  };
  s.clear = (id) => {
    clearTimeout(id);
    clearInterval(id);
    s.timers.delete(id);
  };
  s.on = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts);
    s.cleanups.push(() => el.removeEventListener(type, fn, opts));
  };
  s.kill = () => {
    s.alive = false;
    s.timers.forEach((id) => { clearTimeout(id); clearInterval(id); });
    s.cleanups.forEach((fn) => fn());
  };
  return s;
}

function go(id) {
  if (scope) scope.kill();
  scope = newScope();
  $$('.modal').forEach((m) => m.remove());
  $$('.scene').forEach((el) => { el.hidden = el.id !== id; });
  const el = $(`#${id}`);
  document.body.dataset.bg = el.dataset.bg;
  document.body.dataset.scene = id;
  el.scrollTop = 0;
  SETUP[id](el, scope);
}

function clickOnce(s, el) {
  return new Promise((resolve) => s.on(el, 'click', resolve, { once: true }));
}

function showBtn(btn) {
  btn.hidden = false;
  requestAnimationFrame(() => btn.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' }));
}

function setClue(i, found) {
  $(`.clue-slot[data-slot="${i}"]`).classList.toggle('found', found);
}

function showClue(i) {
  return new Promise((resolve) => {
    const c = CLUES[i];
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<div class="clue-card" role="dialog" aria-modal="true" aria-labelledby="clue-kicker">
      <span class="tape" aria-hidden="true"></span>
      <div class="clue-icon">${ICONS[c.icon]()}</div>
      <p class="clue-kicker" id="clue-kicker">Trop nr ${i + 1} z ${CLUES.length}</p>
      <p class="clue-value">${esc(c.value)}</p>
      <p class="clue-note">${esc(c.note)}</p>
      <button class="btn" type="button">Zapisuję</button>
    </div>`;
    document.body.append(m);
    Sound.play('clue');
    const btn = $('button', m);
    btn.focus({ preventScroll: true });
    btn.addEventListener('click', () => {
      m.classList.add('closing');
      setClue(i, true);
      Sound.play('pop');
      setTimeout(() => { m.remove(); resolve(); }, 220);
    }, { once: true });
  });
}

/* ---------- Dymki rozmów ---------- */

function bubble(sceneEl) {
  const host = $('[data-talk]', sceneEl);
  host.innerHTML = `<button class="bubble" type="button">
    <span class="portrait"></span>
    <span class="bubble-text">
      <span class="who"></span>
      <span class="line"><span class="ghost" aria-hidden="true"></span><span class="typed" aria-hidden="true"></span><span class="sr-only" aria-live="polite"></span></span>
    </span>
    <span class="next" aria-hidden="true"></span>
  </button>`;
  return $('.bubble', host);
}

function sayLine(s, b, line, wait) {
  return new Promise((resolve) => {
    const who = CAST[line.who];
    if (b.dataset.who !== line.who || line.art) {
      $('.portrait', b).innerHTML = (line.art || who.art)();
      $('.who', b).textContent = who.name;
      b.dataset.who = line.who;
      if (who.voice) Sound.play(who.voice);
    }
    const text = line.text;
    const typed = $('.typed', b);
    $('.ghost', b).textContent = text;
    $('.sr-only', b).textContent = `${who.name}: ${text}`;
    b.classList.remove('waiting');
    if (b.typingTimer) s.clear(b.typingTimer);
    let i = 0, typing = true, timer = null;

    const finish = () => {
      typing = false;
      if (timer) s.clear(timer);
      b.typingTimer = null;
      typed.textContent = text;
      if (wait) b.classList.add('waiting');
      else resolve();
    };

    b.onclick = () => {
      if (!s.alive) return;
      if (typing) { finish(); return; }
      if (wait) {
        b.onclick = null;
        b.classList.remove('waiting');
        Sound.play('tap');
        resolve();
      }
    };

    if (reduceMotion) { finish(); return; }
    typed.textContent = '';
    timer = s.every(24, () => {
      i += 1;
      typed.textContent = text.slice(0, i);
      if (i >= text.length) finish();
    });
    b.typingTimer = timer;
  });
}

async function talk(s, b, lines) {
  for (const line of lines) await sayLine(s, b, line, true);
}

const say = (s, b, line) => sayLine(s, b, line, false);

/* =========================================================
   Sceny
   ========================================================= */

const SETUP = {};

SETUP.start = () => {};

SETUP.cake = (el, s) => {
  const btn = $('#cake-btn'), hint = $('#cake-hint'), next = $('#btn-cake-next');
  btn.innerHTML = cake();
  btn.disabled = false;
  btn.classList.remove('blown');
  next.hidden = true;
  hint.textContent = 'Pomyśl życzenie i dotknij tortu, żeby zdmuchnąć świeczki.';

  s.on(btn, 'click', async () => {
    btn.disabled = true;
    btn.classList.add('blown');
    Sound.play('blow');
    await s.wait(380);
    const r = btn.getBoundingClientRect();
    Confetti.burst({ x: r.left + r.width / 2, y: r.top + r.height * 0.2, n: 150 });
    Sound.play('birthday');
    hint.textContent = 'Sto lat, sto lat! Życzenie zapisane.';
    await s.wait(900);
    showBtn(next);
  }, { once: true });
};

SETUP.story = async (el, s) => {
  const runner = $('#story-mouse'), giftBox = $('.gift-box', el), next = $('#btn-story-next');
  next.hidden = true;
  giftBox.classList.remove('empty');
  runner.hidden = true;
  runner.className = 'runner flip';
  runner.innerHTML = mouse();

  const b = bubble(el);
  await talk(s, b, [
    { who: 'lampart', text: `Wszystkiego najlepszego, ${CONFIG.wolacz}! To ja, Lampart. Wróciłem z podróży specjalnie na Twoje urodziny.` },
    { who: 'lampart', text: 'Razem z Emi przygotowaliśmy dla Ciebie prezent. Schowałem go w kopercie, w najbezpieczniejszym miejscu na świecie: w pudełku.' },
  ]);

  runner.hidden = false;
  void runner.offsetWidth;
  runner.classList.add('running', 'at-gift');
  Sound.play('squeak');
  await s.wait(1000);
  runner.classList.remove('running');
  giftBox.classList.add('empty');
  runner.innerHTML = mouse({ envelope: true });
  Sound.play('pop');
  await s.wait(350);

  await talk(s, b, [{ who: 'pestka', text: 'Hi hi hi! Teraz prezent jest mój! Pa, pa!' }]);
  runner.classList.add('running', 'exit');
  Sound.play('squeak');
  await s.wait(800);

  await talk(s, b, [
    { who: 'lampart', text: 'O nie! Myszka Pestka zwinęła kopertę z Twoim prezentem!' },
    { who: 'lampart', text: 'Żeby zobaczyć prezent, musisz ją złapać. Po drodze zbieraj tropy, które gubi. Pomogą nam Emi i koty z osiedla.' },
    { who: 'lampart', text: 'Ale zanim ruszymy, pokażę Ci coś ważnego.' },
  ]);
  showBtn(next);
};

SETUP.passport = async (el, s) => {
  const next = $('#btn-passport-next');
  next.hidden = true;
  $('.passport-wrap', el).innerHTML = passportHTML(false);
  STAMPS.forEach((_, i) => s.after(350 + i * 450, () => Sound.play('thud')));

  const b = bubble(el);
  await talk(s, b, [
    { who: 'lampart', text: 'To mój paszport. Pierwsza pieczątka: lotnisko w Warszawie, gdzie wsiadłem do mojego pierwszego samolotu.' },
    { who: 'lampart', text: 'Potem była Afryka, a nad Amazonią skoczyłem ze spadochronem i przedzierałem się przez dżunglę.' },
    { who: 'lampart', text: `Ale te dwie są najważniejsze, bo zbierałem je ${CONFIG.zKim}: park wodny na Teneryfie i Land of Legends w Turcji.` },
    { who: 'lampart', text: 'Została jedna pusta strona. W kopercie Pestki jest coś, co ją wypełni. Łapiemy ją!' },
  ]);
  showBtn(next);
};

SETUP.boxes = async (el, s) => {
  const shell = $('#shell'), boxes = $$('.box', shell);
  const btnShuffle = $('#btn-shuffle'), next = $('#btn-boxes-next');
  btnShuffle.hidden = true;
  next.hidden = true;
  shell.classList.remove('picking');
  shell.style.removeProperty('--speed');
  const slotOf = [0, 1, 2];
  boxes.forEach((bx, i) => {
    bx.className = 'box';
    bx.disabled = true;
    bx.innerHTML = boxArt();
    bx.style.setProperty('--slot', i);
    bx.style.removeProperty('--lift');
  });

  const target = Math.floor(Math.random() * 3);
  const tb = boxes[target];
  $('.peek', tb).innerHTML = mouse();

  const b = bubble(el);
  await talk(s, b, [{ who: 'pazur', text: 'Detektyw Pazur, do usług. Pestka kocha pudełka. Prawie tak mocno jak my.' }]);
  tb.classList.add('open');
  Sound.play('squeak');
  await talk(s, b, [{ who: 'pazur', text: `Widzisz? Siedzi w ${['lewym', 'środkowym', 'prawym'][target]} pudełku. Zaraz je przestawię, a Ty pokażesz, gdzie jest.` }]);

  showBtn(btnShuffle);
  await clickOnce(s, btnShuffle);
  btnShuffle.hidden = true;
  tb.classList.remove('open');
  say(s, b, { who: 'pazur', text: 'Uwaga… przestawiam!' });
  await s.wait(550);

  let dur = 540;
  for (let k = 0; k < 9; k++) {
    const i = Math.floor(Math.random() * 3);
    let j = Math.floor(Math.random() * 2);
    if (j >= i) j += 1;
    [slotOf[i], slotOf[j]] = [slotOf[j], slotOf[i]];
    shell.style.setProperty('--speed', `${dur}ms`);
    boxes[i].style.setProperty('--slot', slotOf[i]);
    boxes[j].style.setProperty('--slot', slotOf[j]);
    boxes[i].style.setProperty('--lift', '-26px');
    boxes[j].style.setProperty('--lift', '8px');
    Sound.play('swoosh');
    await s.wait(dur / 2);
    boxes[i].style.setProperty('--lift', '0px');
    boxes[j].style.setProperty('--lift', '0px');
    await s.wait(dur / 2 + 40);
    dur = Math.max(250, dur * 0.88);
  }

  await s.wait(250);
  shell.classList.add('picking');
  boxes.forEach((bx) => { bx.disabled = false; });
  say(s, b, { who: 'pazur', text: 'No to w którym pudełku jest Pestka?' });

  const kittenLines = shuffle(['Miau! Tu tylko ja.', 'Zajęte! To moje pudełko.', 'Nie ma myszy. Jest drzemka.']);
  let misses = 0;
  await new Promise((resolve) => {
    boxes.forEach((bx, i) => s.on(bx, 'click', () => {
      if (bx.disabled) return;
      bx.disabled = true;
      if (i === target) {
        boxes.forEach((o) => { o.disabled = true; });
        shell.classList.remove('picking');
        bx.classList.add('open');
        Sound.play('squeak');
        resolve();
        return;
      }
      const kitten = pick(KITTENS);
      $('.peek', bx).innerHTML = kitten();
      bx.classList.add('open');
      say(s, b, { who: 'kociak', text: kittenLines[misses % kittenLines.length], art: kitten });
      misses += 1;
    }));
  });

  await talk(s, b, [{ who: 'pestka', text: 'Pi! Znalazłaś mnie! Ale i tak mnie nie złapiesz!' }]);
  tb.classList.add('escape');
  Sound.play('squeak');
  await s.wait(700);
  await showClue(0);
  await talk(s, b, [
    { who: 'pazur', text: '142 km/h? Tak szybko nie biega nawet Pestka. Ktoś tu się będzie bardzo szybko przemieszczać…' },
    { who: 'pazur', text: 'Patrzcie, wskakuje do samolotu! Lampart, to Twój teren.' },
  ]);
  showBtn(next);
};

SETUP.jump = async (el, s) => {
  const sky = $('#sky'), countEl = $('#fish-count'), altEl = $('#altitude');
  const btnStart = $('#btn-jump-start'), next = $('#btn-jump-next');
  const NEED = 10;
  btnStart.hidden = true;
  next.hidden = true;
  sky.className = 'sky';
  sky.innerHTML = `<div class="sky-clouds"></div><div class="jungle">${jungleArt()}</div><div class="jumper">${parachuteArt()}</div>`;
  const jumper = $('.jumper', sky), cloudsLayer = $('.sky-clouds', sky);
  let fish = 0;
  const render = () => {
    countEl.textContent = `Rybki: ${fish}/${NEED}`;
    altEl.textContent = `${Math.max(0, 3000 - fish * 300)} m`;
  };
  render();

  const W = () => sky.clientWidth, H = () => sky.clientHeight;
  const PW = jumper.offsetWidth, PH = jumper.offsetHeight;
  let x = W() / 2, tx = x;
  const y0 = 6;
  const place = (tilt = 0) => { jumper.style.transform = `translate(${(x - PW / 2).toFixed(1)}px, ${y0}px) rotate(${tilt.toFixed(1)}deg)`; };
  place();

  const b = bubble(el);
  await talk(s, b, [
    { who: 'lampart', text: 'Pestka odleciała nad Amazonię. Znam te okolice: kiedyś skoczyłem tu ze spadochronem prosto w dżunglę.' },
    { who: 'lampart', text: `Skaczemy za nią! Przesuwaj palcem w lewo i w prawo, łap rybki i omijaj tukany. Potrzebujemy ${NEED} rybek na drogę.` },
  ]);
  showBtn(btnStart);
  await clickOnce(s, btnStart);
  btnStart.hidden = true;
  sky.classList.add('playing');
  say(s, b, { who: 'lampart', text: 'Trzymaj się! Wiatr we wąsach!' });

  const setTarget = (clientX) => {
    const r = sky.getBoundingClientRect();
    tx = Math.max(PW * 0.4, Math.min(W() - PW * 0.4, clientX - r.left));
  };
  s.on(sky, 'pointerdown', (e) => setTarget(e.clientX));
  s.on(sky, 'pointermove', (e) => setTarget(e.clientX));
  s.on(document, 'keydown', (e) => {
    if (e.key === 'ArrowLeft') tx = Math.max(PW * 0.4, tx - 50);
    if (e.key === 'ArrowRight') tx = Math.min(W() - PW * 0.4, tx + 50);
  });

  const items = [];
  const ouch = ['Au! Tukan!', 'Ej, to mój spadochron!', 'Tukany nie mają pierwszeństwa!'];
  let spawnIn = 0.3, cloudIn = 0, stunned = 0, elapsed = 0, ended = false, last = performance.now(), ouchIdx = 0;
  let landed;
  const finished = new Promise((resolve) => { landed = resolve; });

  const spawn = () => {
    const isFish = Math.random() < 0.66;
    const size = isFish ? 46 : 58;
    const node = document.createElement('div');
    node.className = `drop ${isFish ? 'fish' : 'bird'}`;
    node.style.width = `${size}px`;
    node.innerHTML = isFish ? fishArt() : toucanArt();
    sky.append(node);
    const vx = isFish ? 0 : rand(-45, 45);
    if (vx < 0) node.classList.add('flip');
    items.push({ node, isFish, size, vx, x: rand(size / 2 + 4, W() - size / 2 - 4), y: H() + 30, speed: rand(125, 155) + elapsed * 2.2, r: size * (isFish ? 0.38 : 0.28), hit: false });
  };

  const cloud = () => {
    const c = document.createElement('div');
    c.className = 'sky-cloud';
    c.style.left = `${rand(-8, 78)}%`;
    c.style.width = `${Math.round(rand(60, 110))}px`;
    c.innerHTML = cloudArt();
    cloudsLayer.append(c);
    const anim = c.animate([{ transform: `translateY(${H() + 40}px)` }, { transform: 'translateY(-90px)' }], { duration: rand(2600, 4200), easing: 'linear' });
    anim.onfinish = () => c.remove();
  };

  const frame = (now) => {
    if (!s.alive || ended) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    elapsed += dt;
    spawnIn -= dt;
    cloudIn -= dt;
    if (spawnIn <= 0) { spawn(); spawnIn = rand(0.5, 0.8); }
    if (cloudIn <= 0) { cloud(); cloudIn = rand(0.7, 1.2); }

    const prevX = x;
    if (stunned > 0) stunned -= dt;
    else x += (tx - x) * Math.min(1, dt * 9);
    const vx = (x - prevX) / Math.max(dt, 0.001);
    const wobble = stunned > 0 ? Math.sin(now / 45) * 14 : 0;
    place(Math.max(-16, Math.min(16, -vx * 0.04)) + wobble);

    const cx = x, cy = y0 + PH * 0.78;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y -= it.speed * dt;
      it.x += it.vx * dt;
      if (it.x < it.size / 2 || it.x > W() - it.size / 2) {
        it.vx *= -1;
        it.node.classList.toggle('flip', it.vx < 0);
      }
      it.node.style.transform = `translate(${(it.x - it.size / 2).toFixed(1)}px, ${(it.y - it.size / 2).toFixed(1)}px)`;
      if (!it.hit && Math.hypot(it.x - cx, it.y - cy) < it.r + PW * 0.24) {
        it.hit = true;
        if (it.isFish) {
          fish += 1;
          render();
          Sound.play('coin');
          it.node.classList.add('got');
          items.splice(i, 1);
          setTimeout(() => it.node.remove(), 320);
          if (fish >= NEED) {
            ended = true;
            landed();
            return;
          }
          continue;
        }
        if (stunned <= 0) {
          stunned = 0.8;
          Sound.play('bump');
          if (navigator.vibrate) navigator.vibrate(60);
          say(s, b, { who: 'lampart', text: ouch[ouchIdx++ % ouch.length] });
        }
      }
      if (it.y < -it.size) {
        it.node.remove();
        items.splice(i, 1);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  await finished;

  items.forEach((it) => it.node.classList.add('gone'));
  sky.classList.remove('playing');
  sky.classList.add('landed');
  jumper.style.transition = 'transform 1.8s cubic-bezier(.3, .6, .3, 1)';
  jumper.style.transform = `translate(${(W() - PW) / 2}px, ${H() - PH - 18}px) rotate(0deg)`;
  await s.wait(1800);
  Sound.play('win');
  const r = sky.getBoundingClientRect();
  Confetti.burst({ x: r.left + r.width / 2, y: r.top + r.height * 0.7, n: 90 });
  await talk(s, b, [
    { who: 'lampart', text: 'Wylądowaliśmy! Idealnie w dżungli, zupełnie jak za dawnych czasów.' },
    { who: 'pestka', text: 'Pi! 3000 metrów to dla mnie za wysoko! Mnie wystarczy 77… Pa!' },
  ]);
  await showClue(1);
  await talk(s, b, [
    { who: 'lampart', text: '77 metrów w górę, a potem w dół? To brzmi jak coś szybszego niż spadochron. Luna zna wszystkie nocne plotki, chodźmy do niej.' },
  ]);
  showBtn(next);
};

SETUP.memory = async (el, s) => {
  const grid = $('#memory-grid'), movesEl = $('#moves'), next = $('#btn-memory-next');
  next.hidden = true;
  const keys = Object.keys(ANIMALS);
  const deck = shuffle([...keys, ...keys]);
  grid.innerHTML = deck.map((k, i) => `<button class="card" type="button" data-animal="${k}" aria-label="Karta ${i + 1}, zakryta">
    <span class="card-inner"><span class="card-back">${paw()}</span><span class="card-face">${ANIMALS[k].art()}</span></span></button>`).join('');
  movesEl.textContent = 'Ruchy: 0';

  let moves = 0, pairs = 0, first = null, locked = true, allFound;
  const done = new Promise((resolve) => { allFound = resolve; });
  const b = bubble(el);

  s.on(grid, 'click', (e) => {
    const card = e.target.closest('.card');
    if (!card || locked || card.classList.contains('flipped')) return;
    const k = card.dataset.animal;
    card.classList.add('flipped');
    card.setAttribute('aria-label', ANIMALS[k].name);
    Sound.play('flip');
    if (!first) { first = card; return; }

    moves += 1;
    movesEl.textContent = `Ruchy: ${moves}`;
    const a = first;
    first = null;
    if (a.dataset.animal === k) {
      [a, card].forEach((c) => {
        c.classList.add('matched');
        c.disabled = true;
        c.setAttribute('aria-label', `${ANIMALS[k].name}, para znaleziona`);
      });
      pairs += 1;
      Sound.play('pop');
      say(s, b, { who: k, text: ANIMALS[k].line });
      if (pairs === keys.length) allFound();
    } else {
      locked = true;
      s.after(800, () => {
        [a, card].forEach((c, n) => {
          c.classList.remove('flipped');
          c.setAttribute('aria-label', `Karta ${[...grid.children].indexOf(c) + 1}, zakryta`);
          if (n === 0) Sound.play('flip');
        });
        locked = false;
      });
    }
  });

  await talk(s, b, [{ who: 'luna', text: 'Jestem Luna. Nocą zbierają się tu zwierzaki, które Lampart poznał w podróżach. Wszystkie widziały Pestkę.' }]);
  locked = false;
  say(s, b, { who: 'luna', text: 'Odkrywaj karty i dobieraj pary. Każda para coś Ci powie.' });
  await done;

  await s.wait(900);
  Sound.play('win');
  const r = grid.getBoundingClientRect();
  Confetti.burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 80, spread: Math.PI * 1.4 });
  await talk(s, b, [{ who: 'luna', text: `Brawo, ${moves} ruchów! Wszyscy mówią to samo: tym razem Pestka nie leci za granicę. Paszport zostaje w domu.` }]);
  await showClue(2);
  await talk(s, b, [{ who: 'luna', text: 'Czyli przygoda gdzieś w Polsce… Pestka wróciła do ogrodu. Tam czeka Emi, najlepsza łowczyni w okolicy.' }]);
  showBtn(next);
};

SETUP.chase = async (el, s) => {
  const garden = $('#garden'), mouseBtn = $('#garden-mouse'), meter = $('#catch-meter');
  const btnStart = $('#btn-chase-start'), next = $('#btn-chase-next');
  const NEED = 5;
  btnStart.hidden = true;
  next.hidden = true;
  $$('.paw-stamp, .decor', garden).forEach((n) => n.remove());
  [
    ['6%', '8%', '38px', flower(C.bubblegum)], ['80%', '64%', '42px', flower('#FFFFFF')],
    ['46%', '38%', '28px', flower(C.butter)], ['78%', '6%', '46px', DECOR.yarn()], ['8%', '70%', '46px', DECOR.cheese()],
  ].forEach(([left, top, size, svg]) => {
    const d = document.createElement('span');
    d.className = 'decor';
    Object.assign(d.style, { left, top, width: size });
    d.innerHTML = svg;
    garden.append(d);
  });
  meter.innerHTML = Array.from({ length: NEED }, () => `<span class="pip">${paw()}</span>`).join('');
  meter.setAttribute('aria-label', `Złapana 0 z ${NEED}`);
  mouseBtn.hidden = true;
  mouseBtn.disabled = false;
  mouseBtn.className = 'garden-mouse';
  mouseBtn.innerHTML = mouse();
  mouseBtn.style.transitionDuration = '0ms';

  const b = bubble(el);
  await talk(s, b, [
    { who: 'emi', text: 'Mrau! Jestem Emi, bengalska łowczyni. Myszy to moja specjalność, ale dziś polujesz Ty.' },
    { who: 'emi', text: `Pestka biega po ogrodzie. Złap ją ${NEED} razy, to się podda. Ja kibicuję!` },
  ]);
  showBtn(btnStart);
  await clickOnce(s, btnStart);
  btnStart.hidden = true;

  let caught = 0, period = 1250, cooldown = false, running = true, timer = null;
  let pos = { x: 0, y: 0 };

  const stamp = (x, y, hit) => {
    const st = document.createElement('span');
    st.className = `paw-stamp${hit ? ' hit' : ''}`;
    st.style.left = `${x}px`;
    st.style.top = `${y}px`;
    st.style.setProperty('--r', `${Math.round(rand(-30, 30))}deg`);
    st.innerHTML = paw();
    garden.append(st);
    setTimeout(() => st.remove(), 950);
  };

  const move = (instant = false) => {
    const W = garden.clientWidth, H = garden.clientHeight;
    const mw = mouseBtn.offsetWidth, mh = mouseBtn.offsetHeight;
    let x, y, tries = 0;
    do {
      x = rand(6, W - mw - 6);
      y = rand(6, H - mh - 6);
      tries += 1;
    } while (tries < 14 && Math.hypot(x - pos.x, y - pos.y) < W * 0.35);
    mouseBtn.classList.toggle('flip', x < pos.x);
    pos = { x, y };
    mouseBtn.style.transitionDuration = instant ? '0ms' : `${Math.round(period * 0.42)}ms`;
    mouseBtn.style.transform = `translate(${x}px, ${y}px)`;
  };

  const schedule = () => {
    if (timer) s.clear(timer);
    timer = s.after(period, () => {
      if (!running) return;
      move();
      schedule();
    });
  };

  let finished;
  const over = new Promise((resolve) => { finished = resolve; });
  const taunts = ['Pi! To był fart!', 'Pi-pi! Nie złapiesz mnie!', 'Ojej, prawie! Szybciej, łapki!', 'Pi… zaczynam się męczyć.'];

  const onCatch = (clientX, clientY) => {
    if (!running || cooldown) return;
    cooldown = true;
    caught += 1;
    const g = garden.getBoundingClientRect();
    stamp(clientX - g.left, clientY - g.top, true);
    Sound.play('squeak');
    if (navigator.vibrate) navigator.vibrate(35);
    $$('.pip', meter).forEach((p, i) => p.classList.toggle('on', i < caught));
    meter.setAttribute('aria-label', `Złapana ${caught} z ${NEED}`);
    mouseBtn.classList.add('hit');
    s.after(220, () => { mouseBtn.classList.remove('hit'); cooldown = false; });
    if (caught >= NEED) {
      running = false;
      if (timer) s.clear(timer);
      finished();
      return;
    }
    say(s, b, { who: 'pestka', text: taunts[caught - 1] });
    period = Math.max(620, period - 150);
    s.after(160, () => { move(); schedule(); });
  };

  s.on(mouseBtn, 'pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onCatch(e.clientX, e.clientY);
  });
  s.on(mouseBtn, 'click', (e) => {
    if (e.detail !== 0) return;
    const r = mouseBtn.getBoundingClientRect();
    onCatch(r.left + r.width / 2, r.top + r.height / 2);
  });
  s.on(garden, 'pointerdown', (e) => {
    if (!running || e.target.closest('.garden-mouse')) return;
    const g = garden.getBoundingClientRect();
    stamp(e.clientX - g.left, e.clientY - g.top, false);
    Sound.play('tap');
  });

  mouseBtn.hidden = false;
  move(true);
  say(s, b, { who: 'emi', text: 'Dotknij myszki, zanim ucieknie!' });
  schedule();
  await over;

  const W = garden.clientWidth, H = garden.clientHeight;
  mouseBtn.style.transitionDuration = '500ms';
  mouseBtn.style.transform = `translate(${(W - mouseBtn.offsetWidth) / 2}px, ${(H - mouseBtn.offsetHeight) / 2}px)`;
  mouseBtn.classList.add('dizzy');
  mouseBtn.disabled = true;
  Sound.play('win');
  const g = garden.getBoundingClientRect();
  Confetti.burst({ x: g.left + g.width / 2, y: g.top + g.height / 2, n: 90, spread: Math.PI * 1.5 });
  await s.wait(600);
  await talk(s, b, [
    { who: 'pestka', text: 'Dobra, dobra, wygrałaś! Poddaję się!' },
    { who: 'pestka', text: 'Ojej… zgubiłam kluczyki do auta. I paragon ze stacji.' },
  ]);
  await showClue(3);
  await talk(s, b, [{ who: 'emi', text: 'Pełny bak i tyle kilometrów… Mrau, czuję wycieczkę autem!' }]);
  showBtn(next);
};

SETUP.guess = async (el, s) => {
  const next = $('#btn-guess-next');
  next.hidden = true;
  $('#clue-list').innerHTML = CLUES.map((c, i) => `<li class="clue-item" style="--i:${i}">${ICONS[c.icon]()}<div><strong>${esc(c.value)}</strong><span>${esc(c.note)}</span></div></li>`).join('');
  CLUES.forEach((_, i) => setClue(i, true));

  const b = bubble(el);
  await talk(s, b, [
    { who: 'pestka', text: 'Masz, oddaję kopertę. I tak była dla Ciebie. Koty kazały mi tylko trochę pobiegać.' },
    { who: 'lampart', text: 'Szybko, wysoko, bez paszportu i autem. Masz już pomysł?' },
    { who: 'lampart', text: 'Powiedz głośno, co myślisz. A potem otwórz kopertę.' },
  ]);
  showBtn(next);
};

SETUP.reveal = (el, s) => {
  const env = $('#envelope'), hint = $('#envelope-hint'), fin = $('#finale');
  env.hidden = false;
  env.disabled = false;
  env.className = 'envelope';
  env.innerHTML = envelopeArt();
  hint.hidden = false;
  fin.hidden = true;
  $('.coaster', el).innerHTML = coasterArt();
  $('.crew', el).innerHTML = [CATS.lampart(), CATS.emi(), CATS.pazur(), CATS.luna(), mouse()]
    .map((svg, i) => `<div style="--i:${i}">${svg}</div>`).join('');

  const invite = $('#invite'), afterYes = $('#after-yes'), yes = $('#btn-yes'), no = $('#btn-no');
  invite.hidden = false;
  afterYes.hidden = true;
  $('#passport-final').innerHTML = '';
  no.className = 'btn btn-quiet btn-no';
  no.textContent = 'Nie';
  no.style.transform = '';
  const noTexts = ['Na pewno?', 'Pomyśl jeszcze', 'Nie da się', 'Jadę!'];
  let dodges = 0, lastDodge = 0;

  const accept = async () => {
    invite.hidden = true;
    afterYes.hidden = false;
    $('#passport-final').innerHTML = passportHTML(true);
    requestAnimationFrame(() => $('#passport-final').scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' }));
    await s.wait(1100);
    Sound.play('thud');
    Sound.play('fanfare');
    if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
    const st = $('#passport-final .slam');
    const r = st ? st.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    Confetti.burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, n: 120, spread: Math.PI * 2, power: 0.9 });
    for (let k = 0; k < 4; k++) {
      await s.wait(550);
      Confetti.burst({ x: window.innerWidth * rand(0.15, 0.85), y: window.innerHeight * rand(0.2, 0.5), n: 70, spread: Math.PI * 2, power: 0.8 });
      Sound.play('pop');
    }
  };

  const dodge = () => {
    if (dodges >= noTexts.length - 1) return;
    const box = $('#invite-btns').getBoundingClientRect();
    const rb = no.getBoundingClientRect();
    const dx = rand(-box.width / 2 + rb.width / 2, box.width / 2 - rb.width / 2);
    const dy = rand(-30, 40);
    no.style.transform = `translate(${dx.toFixed(0)}px, ${dy.toFixed(0)}px) rotate(${rand(-12, 12).toFixed(0)}deg)`;
    no.textContent = noTexts[dodges];
    dodges += 1;
    lastDodge = performance.now();
    Sound.play('squeak');
    if (dodges === noTexts.length - 1) {
      no.classList.remove('btn-quiet');
      no.style.transform = '';
    }
  };

  s.on(yes, 'click', accept, { once: true });
  s.on(no, 'pointerdown', (e) => {
    if (dodges < noTexts.length - 1) { e.preventDefault(); dodge(); }
  });
  s.on(no, 'pointerenter', (e) => { if (e.pointerType === 'mouse') dodge(); });
  s.on(no, 'click', () => {
    if (performance.now() - lastDodge < 500) return;
    if (dodges >= noTexts.length - 1) accept();
    else dodge();
  });

  s.on(env, 'click', async () => {
    env.disabled = true;
    env.classList.add('open');
    hint.hidden = true;
    Sound.play('pop');
    await s.wait(1350);
    Sound.play('fanfare');
    env.classList.add('gone');
    Confetti.burst({ x: window.innerWidth * 0.1, y: window.innerHeight * 0.75, n: 110, angle: -Math.PI * 0.35, spread: Math.PI * 0.4, power: 1.3 });
    Confetti.burst({ x: window.innerWidth * 0.9, y: window.innerHeight * 0.75, n: 110, angle: -Math.PI * 0.65, spread: Math.PI * 0.4, power: 1.3 });
    await s.wait(420);
    env.hidden = true;
    fin.hidden = false;
    el.scrollTop = 0;
    runCoaster(s, $('.coaster', el));
    await s.wait(1800);
    Confetti.burst({ x: window.innerWidth / 2, y: window.innerHeight * 0.3, n: 90 });
  }, { once: true });
};

function runCoaster(s, root) {
  const svg = $('svg', root), track = $('.track-base', svg), cart = $('.cart', svg), supports = $('.supports', svg);
  const L = track.getTotalLength();
  let lines = '';
  for (let d = 0; d < L; d += 15) {
    const p = track.getPointAtLength(d);
    if (p.y < 146 && p.x > 0 && p.x < 360 && (p.x < 205 || p.x > 285)) {
      lines += `<line x1="${p.x.toFixed(1)}" y1="${(p.y + 4).toFixed(1)}" x2="${p.x.toFixed(1)}" y2="168"/>`;
    }
  }
  supports.innerHTML = lines;

  let d = L * 0.2, last = performance.now();
  const place = () => {
    const p = track.getPointAtLength(d);
    const q = track.getPointAtLength(Math.min(L, d + 1));
    const a = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    cart.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${a.toFixed(2)}) translate(0 -4.5)`);
    return p;
  };

  if (reduceMotion) {
    d = L * 0.24;
    place();
    return;
  }

  const frame = (now) => {
    if (!s.alive) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const p = place();
    d += (70 + (p.y - 30) * 1.35) * dt;
    if (d > L) d = 0;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* =========================================================
   Start
   ========================================================= */

function renderSoundToggle() {
  const btn = $('#sound-toggle');
  btn.innerHTML = Sound.on ? SOUND_ICON.on : SOUND_ICON.off;
  btn.setAttribute('aria-pressed', String(Sound.on));
  btn.setAttribute('aria-label', 'Dźwięk');
}

function fillStatic() {
  const fills = {
    'start-title': `Psst… ${esc(CONFIG.wolacz)}!`,
    'cake-title': `Kończysz <span class="age">${esc(CONFIG.wiek)}</span> ${lata(CONFIG.wiek)}!`,
    'finale-lead': '142 km/h i 77 metrów w górę to Hyperion, najwyższa kolejka w Energylandii. Tym razem bez paszportu: jedziemy autem, bilet kupiony, bak zatankowany. Ty weź tylko dobry humor i gumkę do włosów.',
    'invite-q': `Jedziesz ze mną, ${esc(CONFIG.wolacz)}?`,
    signoff: `${esc(CONFIG.dedykacja)}<small>${esc(CONFIG.podpis)}</small>`,
    ticket: ticketHTML(),
  };
  $$('[data-fill]').forEach((el) => {
    const html = fills[el.dataset.fill];
    if (html !== undefined) el.innerHTML = html;
  });

  $('[data-art="start"]').innerHTML = `<div class="actor">${CATS.lampart()}</div><div class="actor">${CATS.emi()}</div><div class="balloons-wrap">${balloons()}</div>`;
  $$('[data-art="lampart"]').forEach((n) => { n.innerHTML = CATS.lampart(); });
  $$('[data-art="emi"]').forEach((n) => { n.innerHTML = CATS.emi(); });
  $$('[data-art="pazur"]').forEach((n) => { n.innerHTML = CATS.pazur(); });
  $$('[data-art="luna"]').forEach((n) => { n.innerHTML = CATS.luna(); });
  $$('[data-art="gift"]').forEach((n) => { n.innerHTML = gift(); });
  $$('[data-art="mouse-envelope"]').forEach((n) => { n.innerHTML = mouse({ envelope: true }); });
  $$('.clue-slot').forEach((n) => { n.innerHTML = paw(); });
}

function ticketHTML() {
  const nbsp = (str) => String(str).replace(/ /g, ' ');
  const rows = [
    ['Dla', `${CONFIG.imie} · ${CONFIG.wiek} ${lata(CONFIG.wiek)}`],
    ['Trasa', `${CONFIG.skad} → ${CONFIG.dokad}, ${nbsp(CONFIG.dystans)}`],
    ['Bilet', 'kupiony', true],
    ['Paliwo', 'pełny bak', true],
    ['Termin', CONFIG.termin || 'zdradzę już wkrótce'],
  ];
  return `<div class="ticket-stub" aria-hidden="true"><span>Bilet wstępu</span></div>
    <div class="ticket-main">
      <p class="ticket-kicker">Park rozrywki</p>
      <p class="ticket-name">Energylandia</p>
      <p class="ticket-place">Zator · Małopolska</p>
      <dl class="ticket-rows">${rows.map(([k, v, ok]) => `<div class="ticket-row"><dt>${k}</dt><dd>${ok ? '<span class="ok" aria-hidden="true"></span>' : ''}${esc(v)}</dd></div>`).join('')}</dl>
      <div class="barcode" aria-hidden="true"></div>
      <p class="ticket-code">${esc(CONFIG.imie.toUpperCase())}-${esc(CONFIG.wiek)}-ZATOR</p>
    </div>`;
}

function init() {
  fillStatic();
  Confetti.init();
  renderSoundToggle();

  document.addEventListener('pointerdown', () => Sound.unlock(), { passive: true });

  $('#sound-toggle').addEventListener('click', () => {
    Sound.on = !Sound.on;
    store.set('kotek-sound', Sound.on);
    if (Sound.on) {
      Sound.unlock();
      Sound.play('pop');
    }
    renderSoundToggle();
  });

  $('#btn-start').addEventListener('click', () => {
    Sound.unlock();
    Sound.play('meow');
    go('cake');
  });

  const NEXT = {
    'btn-cake-next': 'story',
    'btn-story-next': 'passport',
    'btn-passport-next': 'boxes',
    'btn-boxes-next': 'jump',
    'btn-jump-next': 'memory',
    'btn-memory-next': 'chase',
    'btn-chase-next': 'guess',
    'btn-guess-next': 'reveal',
  };
  Object.entries(NEXT).forEach(([id, to]) => {
    $(`#${id}`).addEventListener('click', () => {
      Sound.play('pop');
      go(to);
    });
  });

  $('#btn-replay').addEventListener('click', () => {
    CLUES.forEach((_, i) => setClue(i, false));
    go('start');
  });

  // Skrót do testów: dopisz do adresu np. #chase, żeby od razu wejść do sceny.
  const jump = location.hash.slice(1);
  const first = SCENES.includes(jump) ? jump : 'start';
  CLUE_FROM.forEach((sceneId, i) => setClue(i, SCENES.indexOf(sceneId) < SCENES.indexOf(first)));
  go(first);
}

init();
