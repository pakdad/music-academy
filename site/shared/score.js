// Engraves a piece: one or two hands, in bars with real rhythm, over as many lines as it needs.
//
// A hand is written as text, bar by bar:
//   'E4:4 E4 F4 G4 | G4:4. F4:8 E4:2 | C3+E3+G3:1 | r:2 C4'
//   pitch     C4 (middle C), F#4, Bb3, Ebb4, Fx4; a chord joins pitches with +; r is a rest
//   :length   1 whole, 2 half, 4 quarter, 8 eighth, with a dot for dotted (2. = dotted half).
//             The length carries on until the next one is given.
//   |         a bar line (tools/check.mjs checks every bar adds up)
//
//   const L = Score.layout(piece, { width: 90 })   piece: { rh, lh, key, time: [3, 4], clef }
//   el.innerHTML = L.svg
//   L.events  [{ i, voice: 'rh' | 'lh', t (in quarter notes), d, midis, rest, m (bar) }]; drawn as <g class="ev" data-i>
//   L.marks   [{ t, sys, x }] where the playhead is at time t;  L.systems [{ top, bottom }]  (SVG units)
(function () {
  const T = self.Theory, GL = self.GLYPHS;
  const S = 10, k = S / 250;
  const TOP = { treble: 38, bass: 26 }, MID = { treble: 34, bass: 22 };
  const ACC_GLYPH = { '-2': 'accidentalDoubleFlat', '-1': 'accidentalFlat', 0: 'accidentalNatural', 1: 'accidentalSharp', 2: 'accidentalDoubleSharp' };
  const SHARP_POS = ['F5', 'C5', 'G5', 'D5', 'A4', 'E5', 'B4'].map(s => T.dia(T.parse(s)));
  const FLAT_POS = ['B4', 'E5', 'A4', 'D5', 'G4', 'C5', 'F4'].map(s => T.dia(T.parse(s)));
  const HEAD = { 1: 'noteheadWhole', 2: 'noteheadHalf', 4: 'noteheadBlack', 8: 'noteheadBlack', 16: 'noteheadBlack' };
  const REST = { 1: 'restWhole', 2: 'restHalf', 4: 'restQuarter', 8: 'rest8th' };
  const f = v => Math.round(v * S * 100) / 100; // spaces → SVG units

  const use = (n, x, y, attrs = '', sx = 1, sy = 1) =>
    `<use href="#g-${n}" transform="translate(${f(x)} ${f(y)}) scale(${Math.round(k * sx * 1e5) / 1e5} ${Math.round(-k * sy * 1e5) / 1e5})"${attrs}/>`;
  const line = (x1, y1, x2, y2, w) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="currentColor" stroke-width="${f(w)}"/>`;

  // ---------- reading the text ----------
  const TOKEN = /^(r|[A-G](?:bb|b|##|#|x)?-?\d(?:\+[A-G](?:bb|b|##|#|x)?-?\d)*)(?::(1|2|4|8|16)(\.)?)?$/;
  function parseVoice(src, voice) {
    const events = [], bars = [];
    let t = 0, type = 4, dotted = false, barStart = 0;
    for (const tok of src.trim().split(/\s+/)) {
      if (tok === '|') { bars.push(t - barStart); barStart = t; continue; }
      const m = TOKEN.exec(tok);
      if (!m) throw new Error(`${voice}: can't read "${tok}"`);
      if (m[2]) { type = +m[2]; dotted = !!m[3]; }
      const d = (4 / type) * (dotted ? 1.5 : 1);
      events.push({ voice, t, d, type, dotted, rest: m[1] === 'r', notes: m[1] === 'r' ? [] : m[1].split('+').map(T.parse) });
      t += d;
    }
    if (t > barStart + 1e-9) bars.push(t - barStart);
    return { events, bars, length: t };
  }

  function layout(piece, { width = 90 } = {}) {
    if (typeof document !== 'undefined' && self.Staff) Staff.ensureDefs();
    const [num, den] = piece.time;
    const L = num * 4 / den;
    const key = piece.key || 0;
    const voices = ['rh', 'lh'].filter(v => piece[v]).map(v => parseVoice(piece[v], v));
    const grand = voices.length === 2;
    const staffOf = v => grand ? (v === 'rh' ? 'treble' : 'bass') : (piece.clef || (v === 'rh' ? 'treble' : 'bass'));
    const staves = grand ? ['treble', 'bass'] : [staffOf(voices[0].events[0].voice)];
    const events = voices.flatMap(v => v.events).sort((a, b) => a.t - b.t || (a.voice === 'rh' ? -1 : 1));
    events.forEach((e, i) => { e.i = i; e.staff = staffOf(e.voice); e.m = Math.floor(e.t / L + 1e-9); e.midis = e.notes.map(T.midi); });
    const length = Math.max(...voices.map(v => v.length));
    const nBars = Math.ceil(length / L - 1e-9);

    // accidentals: against the key signature, and against earlier notes in the bar
    let carry = {}, bar = -1;
    for (const e of events) {
      if (e.m !== bar) { carry = {}; bar = e.m; }
      for (const n of e.notes) {
        const pos = e.staff + T.dia(n);
        const inForce = pos in carry ? carry[pos] : T.keyAlter(key, n.step);
        n.showAcc = n.alter !== inForce ? n.alter : null;
        carry[pos] = n.alter;
      }
      // seconds: the upper note steps right; accidentals in columns from the top down
      const sorted = [...e.notes].sort((a, b) => T.dia(a) - T.dia(b));
      for (let i = 1; i < sorted.length; i++) if (T.dia(sorted[i]) - T.dia(sorted[i - 1]) <= 1 && !sorted[i - 1].right) sorted[i].right = true;
      const placed = [];
      for (const n of [...sorted].reverse().filter(n => n.showAcc !== null)) {
        let col = 0;
        while (placed.some(p => p.col === col && Math.abs(T.dia(p) - T.dia(n)) < 6)) col++;
        n.col = col; placed.push(n);
      }
      e.accCols = placed.length ? Math.max(...placed.map(p => p.col)) + 1 : 0;
    }

    // horizontal: each column as wide as the time until the next one (square root, like engravers do)
    const bars = [];
    for (let m = 0; m < nBars; m++) {
      const evs = events.filter(e => e.m === m);
      const onsets = [...new Set(evs.map(e => e.t))].sort((a, b) => a - b);
      const cols = onsets.map((t, j) => {
        const next = j + 1 < onsets.length ? onsets[j + 1] : (m + 1) * L;
        const at = evs.filter(e => e.t === t);
        const acc = Math.max(0, ...at.map(e => e.accCols));
        const right = at.some(e => e.notes.some(n => n.right));
        const dot = at.some(e => e.dotted);
        return { t, acc, w: 1.6 + 3.1 * Math.sqrt(next - t) + acc * 1.2 + (right ? 1.2 : 0) + (dot ? 0.5 : 0) };
      });
      bars.push({ m, cols, w: 1.2 + cols.reduce((a, c) => a + c.w, 0) });
    }

    // lines of music
    const sig = T.keySignature(key);
    const x0 = grand ? 2.4 : 0.8;
    const keyW = sig.reduce((a, s) => a + (s.alter > 0 ? 1.15 : 1.05), 0) + (sig.length ? 0.7 : 0);
    const headOther = x0 + 3.7 + keyW + 0.4;
    const headFirst = headOther + 2.6;
    const systems = [];
    let cur = { bars: [], head: headFirst, w: 0 };
    for (const b of bars) {
      if (cur.bars.length && cur.head + cur.w + b.w > width - 0.5) { systems.push(cur); cur = { bars: [], head: headOther, w: 0 }; }
      cur.bars.push(b); cur.w += b.w;
    }
    systems.push(cur);
    const margin = 4.6, gap = 8;
    let y0 = 0.4;
    systems.forEach((s, si) => {
      const avail = width - 0.5 - s.head;
      let scale = avail / s.w;
      if (si === systems.length - 1 && systems.length > 1 && scale > 1.25) scale = 1.25;
      if (systems.length === 1 && scale > 1.6) scale = 1.6;
      let x = s.head;
      for (const b of s.bars) {
        b.x = x; b.sys = si;
        let cx = x + 1.2 * scale;
        for (const c of b.cols) { c.x = cx; cx += c.w * scale; }
        b.w2 = b.w * scale;
        x += b.w2;
      }
      s.right = x;
      s.tops = {};
      s.tops[staves[0]] = y0 + margin;
      if (grand) s.tops.bass = s.tops.treble + 4 + gap;
      s.bottom = s.tops[staves[staves.length - 1]] + 4;
      s.y0 = y0;
      y0 = s.bottom + margin;
    });
    const height = y0 + 0.2;
    const Y = (s, staff, d) => s.tops[staff] + (TOP[staff] - d) / 2;

    // ---------- drawing ----------
    const out = [];
    systems.forEach((s, si) => {
      for (const st of staves) {
        for (let i = 0; i < 5; i++) out.push(line(x0, s.tops[st] + i, s.right, s.tops[st] + i, 0.13));
        out.push(st === 'treble' ? use('gClef', x0 + 0.9, Y(s, st, 32)) : use('fClef', x0 + 0.9, Y(s, st, 24)));
        let sx = x0 + 4.4;
        sig.forEach((a, i) => {
          out.push(use(ACC_GLYPH[a.alter], sx, Y(s, st, (a.alter > 0 ? SHARP_POS : FLAT_POS)[i] - (st === 'bass' ? 14 : 0))));
          sx += a.alter > 0 ? 1.15 : 1.05;
        });
        if (si === 0) {
          const tx = sx + (sig.length ? 0.5 : 0.1);
          out.push(use('timeSig' + num, tx, s.tops[st] + 1), use('timeSig' + den, tx, s.tops[st] + 3));
        }
      }
      const top = s.tops[staves[0]], bottom = s.bottom;
      out.push(line(x0, top, x0, bottom, 0.16));
      if (grand) out.push(use('brace', x0 - 1.7, bottom, '', (bottom - top) / 4 * 1.25, (bottom - top) / 4));
      if (si > 0) out.push(`<text class="barno" x="${f(x0)}" y="${f(top - 1.6)}">${s.bars[0].m + 1}</text>`);
      s.bars.forEach(b => {
        const bx = b.x + b.w2, last = b.m === nBars - 1;
        if (last) {
          out.push(line(bx - 0.9, top, bx - 0.9, bottom, 0.16), line(bx - 0.25, top, bx - 0.25, bottom, 0.5));
        } else out.push(line(bx, top, bx, bottom, 0.16)); // piano bar lines run through both staves
      });
    });

    // where each event's noteheads go
    for (const e of events) {
      const b = bars[e.m], s = systems[b.sys], c = b.cols.find(c => c.t === e.t);
      e.sys = b.sys; e.x = c.x + c.acc * 1.2; e.colX = c.x;
      e.ys = e.notes.map(n => Y(s, e.staff, T.dia(n)));
    }

    // beams: eighths together within a beat (in 4/4: within half a bar), same hand, no rests between
    const G = L === 4 ? 2 : 1;
    const groups = [];
    for (const v of ['rh', 'lh']) {
      let g = null;
      for (const e of events.filter(e => e.voice === v)) {
        const ok = e.type === 8 && !e.rest;
        const slot = e.m * 100 + Math.floor((e.t - e.m * L) / G + 1e-9);
        if (ok && g && g.slot === slot && Math.abs(g.evs[g.evs.length - 1].t + g.evs[g.evs.length - 1].d - e.t) < 1e-9) g.evs.push(e);
        else { if (g && g.evs.length > 1) groups.push(g); g = ok ? { slot, evs: [e] } : null; }
      }
      if (g && g.evs.length > 1) groups.push(g);
    }
    for (const g of groups) {
      const st = g.evs[0].staff;
      const ds = g.evs.flatMap(e => e.notes.map(T.dia));
      const hi = Math.max(...ds), lo = Math.min(...ds);
      g.dir = hi - MID[st] > MID[st] - lo ? 'down' : 'up';
      for (const e of g.evs) { e.beam = g; e.dir = g.dir; }
    }

    // stems
    for (const e of events) {
      if (e.rest || e.type === 1) continue;
      const s = systems[e.sys];
      const yMid = Y(s, e.staff, MID[e.staff]);
      const ds = e.notes.map(T.dia);
      if (!e.dir) e.dir = (Math.max(...ds) + Math.min(...ds)) / 2 >= MID[e.staff] ? 'down' : 'up';
      const yHigh = Math.min(...e.ys), yLow = Math.max(...e.ys);
      if (e.dir === 'up') { e.stemX = e.x + 1.18 - 0.06; e.stemFrom = yLow - 0.168; e.stemTo = Math.min(yHigh - 3.5, yMid); }
      else { e.stemX = e.x + 0.06; e.stemFrom = yHigh + 0.168; e.stemTo = Math.max(yLow + 3.5, yMid); }
    }
    const beamParts = [];
    for (const g of groups) {
      const a = g.evs[0], z = g.evs[g.evs.length - 1];
      const up = g.dir === 'up';
      const end = e => up ? Math.min(...e.ys) - 3.5 : Math.max(...e.ys) + 3.5;
      const slope = Math.max(-0.12, Math.min(0.12, (end(z) - end(a)) / Math.max(1, z.stemX - a.stemX)));
      let at = x => end(a) + slope * (x - a.stemX);
      const need = g.evs.map(e => (up ? Math.min(...e.ys) - 2.8 : Math.max(...e.ys) + 2.8) - at(e.stemX));
      const shift = up ? Math.min(0, ...need) : Math.max(0, ...need);
      const base = at; at = x => base(x) + shift;
      for (const e of g.evs) e.stemTo = at(e.stemX);
      const xa = a.stemX - 0.06, xb = z.stemX + 0.06, t = up ? 0.5 : -0.5;
      beamParts.push(`<polygon points="${f(xa)},${f(at(xa))} ${f(xb)},${f(at(xb))} ${f(xb)},${f(at(xb) + t)} ${f(xa)},${f(at(xa) + t)}"/>`);
    }

    // events
    for (const e of events) {
      const s = systems[e.sys];
      const g = [];
      if (e.rest) {
        const top = s.tops[e.staff];
        const b = bars[e.m];
        if (e.d === L && e.t === e.m * L) g.push(use('restWhole', b.x + b.w2 / 2 - 0.56, top + 1));
        else {
          const glyph = REST[e.type] || 'rest8th';
          g.push(use(glyph, e.x, e.type === 1 ? top + 1 : top + 2));
          if (e.dotted) g.push(use('augmentationDot', e.x + GL[glyph].w + 0.35, top + 1.5));
        }
        out.push(`<g class="ev rest" data-i="${e.i}">${g.join('')}</g>`);
        continue;
      }
      const top = TOP[e.staff], bottom = top - 8;
      const headW = GL[HEAD[e.type]].w;
      // ledger lines
      const ledgers = new Map();
      for (const n of e.notes) {
        const d = T.dia(n);
        if (d > top) for (let l = top + 2; l <= d; l += 2) ledgers.set(l, (ledgers.get(l) || 0) | (n.right ? 2 : 1));
        if (d < bottom) for (let l = bottom - 2; l >= d; l -= 2) ledgers.set(l, (ledgers.get(l) || 0) | (n.right ? 2 : 1));
      }
      for (const [l, sides] of ledgers) g.push(line(e.x - 0.4, Y(s, e.staff, l), e.x + headW * (sides & 2 ? 2 : 1) + 0.4, Y(s, e.staff, l), 0.16));
      e.notes.forEach((n, i) => {
        const nx = e.x + (n.right ? headW : 0), ny = e.ys[i];
        g.push(use(HEAD[e.type], nx, ny));
        if (n.showAcc !== null) { const ag = ACC_GLYPH[n.showAcc]; g.push(use(ag, e.x - 0.3 - n.col * 1.2 - GL[ag].w, ny)); }
        if (e.dotted) g.push(use('augmentationDot', e.x + headW * (e.notes.some(m => m.right) ? 2 : 1) + 0.35, ny - (T.dia(n) % 2 === 0 ? 0.5 : 0)));
      });
      if (e.stemX !== undefined) {
        g.push(line(e.stemX, e.stemFrom, e.stemX, e.stemTo, 0.12));
        if (e.type === 8 && !e.beam) g.push(use(e.dir === 'up' ? 'flag8thUp' : 'flag8thDown', e.stemX - 0.06, e.stemTo));
      }
      out.push(`<g class="ev" data-i="${e.i}">${g.join('')}</g>`);
    }
    out.push(`<g class="beams">${beamParts.join('')}</g>`);

    // the playhead's path: each column, and the end of each line
    const marks = [];
    for (const b of bars) for (const c of b.cols) marks.push({ t: c.t, sys: b.sys, x: f(c.x + c.acc * 1.2 + 0.6) });
    systems.forEach((s, si) => {
      const lastBar = s.bars[s.bars.length - 1];
      marks.push({ t: (lastBar.m + 1) * L - 1e-6, sys: si, x: f(s.right - 0.6) });
    });
    marks.sort((a, b) => a.t - b.t);
    const sysBoxes = systems.map(s => ({ top: f(s.tops[staves[0]] - 2), bottom: f(s.bottom + 2) }));

    const W = width;
    const svg = `<svg class="staff score" viewBox="0 0 ${f(W)} ${f(height)}" role="img" aria-label="${(piece.title || 'Score').replace(/"/g, '')}">` +
      `<rect class="playhead" x="0" y="0" width="${f(1.6)}" height="0" rx="${f(0.5)}"/>` + out.join('') + '</svg>';
    return { svg, events, marks, systems: sysBoxes, L, length, bars: nBars, width: f(W), height: f(height), grand };
  }

  self.Score = { layout, parseVoice };
})();
