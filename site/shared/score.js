// Engraves a piece: one or two hands, in bars with real rhythm, over as many lines as it needs.
//
// A hand is written as text, bar by bar:
//   'E4@3:4 E4 F4@4 G4@5 | G4:4. F4:8 E4:2 | C3@5+E3@3+G3@1:1 | r:2 C4:16 D4 E4 F4 G4:8. A4:16'
//   pitch     C4 (middle C), F#4, Bb3, Ebb4, Fx4; a chord joins pitches with +; r is a rest
//   @finger   optional fingering, 1 (thumb) to 5, per note
//   :length   1 whole, 2 half, 4 quarter, 8 eighth, 16 sixteenth, with a dot for dotted (2. = dotted half).
//             The length carries on until the next one is given.
//   |         a bar line (tools/check.mjs checks every bar adds up)
//
//   const L = Score.layout(piece, { width: 90, fingering: true })
//     piece: { rh, lh, key, time: [3, 4], pickup (quarter notes before the first full bar), clef }
//     clef 'rhythm' draws a one-line staff for rhythm reading (write the notes as B4)
//   el.innerHTML = L.svg
//   L.events  [{ i, voice: 'rh' | 'lh', t (in quarter notes), d, midis, rest, m (bar) }]; drawn as <g class="ev" data-i>
//   L.marks   [{ t, sys, x }] where the playhead is at time t;  L.systems [{ top, bottom }]  (SVG units)
//   L.barStart(m)  when bar m starts (bar 0 is the pickup, if there is one)
(function () {
  const T = self.Theory, GL = self.GLYPHS;
  const S = 10, k = S / 250;
  const TOP = { treble: 38, bass: 26, rhythm: 38 }, MID = { treble: 34, bass: 22, rhythm: 34 };
  const ACC_GLYPH = { '-2': 'accidentalDoubleFlat', '-1': 'accidentalFlat', 0: 'accidentalNatural', 1: 'accidentalSharp', 2: 'accidentalDoubleSharp' };
  const SHARP_POS = ['F5', 'C5', 'G5', 'D5', 'A4', 'E5', 'B4'].map(s => T.dia(T.parse(s)));
  const FLAT_POS = ['B4', 'E5', 'A4', 'D5', 'G4', 'C5', 'F4'].map(s => T.dia(T.parse(s)));
  const HEAD = { 1: 'noteheadWhole', 2: 'noteheadHalf', 4: 'noteheadBlack', 8: 'noteheadBlack', 16: 'noteheadBlack' };
  const REST = { 1: 'restWhole', 2: 'restHalf', 4: 'restQuarter', 8: 'rest8th', 16: 'rest16th' };
  const f = v => Math.round(v * S * 100) / 100; // spaces → SVG units

  const use = (n, x, y, attrs = '', sx = 1, sy = 1) =>
    `<use href="#g-${n}" transform="translate(${f(x)} ${f(y)}) scale(${Math.round(k * sx * 1e5) / 1e5} ${Math.round(-k * sy * 1e5) / 1e5})"${attrs}/>`;
  const line = (x1, y1, x2, y2, w) => `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="currentColor" stroke-width="${f(w)}"/>`;
  const poly = (xa, ya, xb, yb, t) => `<polygon points="${f(xa)},${f(ya)} ${f(xb)},${f(yb)} ${f(xb)},${f(yb + t)} ${f(xa)},${f(ya + t)}"/>`;

  // ---------- reading the text ----------
  const NOTE = '[A-G](?:bb|b|##|#|x)?-?\\d(?:@[1-5])?(?:\\^[1-6]\\.\\d{1,2})?';
  const TOKEN = new RegExp(`^(r|${NOTE}(?:\\+${NOTE})*)(?::(1|2|4|8|16)(\\.)?)?(?:=(\\S+))?$`);
  function parseVoice(src, voice) {
    const events = [], bars = [];
    let t = 0, type = 4, dotted = false, barStart = 0;
    for (const tok of src.trim().split(/\s+/)) {
      if (tok === '|') { bars.push(t - barStart); barStart = t; continue; }
      const m = TOKEN.exec(tok);
      if (!m) throw new Error(`${voice}: can't read "${tok}"`);
      if (m[2]) { type = +m[2]; dotted = !!m[3]; }
      const d = (4 / type) * (dotted ? 1.5 : 1);
      const notes = m[1] === 'r' ? [] : m[1].split('+').map(p => {
        const [, pitch, finger, string, fret] = /^([^@^]+)(?:@(\d))?(?:\^(\d)\.(\d+))?$/.exec(p);
        const n = T.parse(pitch);
        if (finger) n.finger = +finger;
        if (string) { n.string = +string; n.fret = +fret; }
        return n;
      });
      events.push({ voice, t, d, type, dotted, rest: m[1] === 'r', notes, label: m[4] || null });
      t += d;
    }
    if (t > barStart + 1e-9) bars.push(t - barStart);
    return { events, bars, length: t };
  }

  function layout(piece, { width = 90, fingering = false } = {}) {
    if (typeof document !== 'undefined' && self.Staff) Staff.ensureDefs();
    const [num, den] = piece.time;
    const L = num * 4 / den;
    const pickup = piece.pickup || 0;
    const rhythm = piece.clef === 'rhythm';
    const guitar = piece.clef === 'guitar'; // treble clef with an 8 below: sounds an octave lower than written
    const tabOn = !!piece.tab, notation = piece.notation !== false || !tabOn;
    const key = rhythm ? 0 : piece.key || 0;
    const voices = ['rh', 'lh'].filter(v => piece[v]).map(v => parseVoice(piece[v], v));
    const grand = voices.length === 2;
    const staffOf = v => grand ? (v === 'rh' ? 'treble' : 'bass') : guitar ? 'treble' : (piece.clef || (v === 'rh' ? 'treble' : 'bass'));
    const staves = grand ? ['treble', 'bass'] : [staffOf(voices[0].events[0].voice)];
    const drawn = [...(notation ? staves : []), ...(tabOn ? ['tab'] : [])]; // what is drawn, top to bottom
    const hasLabels = voices.some(v => v.events.some(e => e.label));
    const barStart = m => pickup ? (m === 0 ? 0 : pickup + (m - 1) * L) : m * L;
    const barOf = t => pickup ? (t < pickup - 1e-9 ? 0 : 1 + Math.floor((t - pickup) / L + 1e-9)) : Math.floor(t / L + 1e-9);
    const events = voices.flatMap(v => v.events).sort((a, b) => a.t - b.t || (a.voice === 'rh' ? -1 : 1));
    events.forEach((e, i) => { e.i = i; e.staff = staffOf(e.voice); e.m = barOf(e.t); e.midis = e.notes.map(n => T.midi(n) - (guitar ? 12 : 0)); });
    const length = Math.max(...voices.map(v => v.length));
    const nBars = barOf(length - 1e-6) + 1;

    // accidentals: against the key signature, and against earlier notes in the bar
    let carry = {}, bar = -1;
    for (const e of events) {
      if (e.m !== bar) { carry = {}; bar = e.m; }
      for (const n of e.notes) {
        const pos = e.staff + T.dia(n);
        const inForce = pos in carry ? carry[pos] : T.keyAlter(key, n.step);
        n.showAcc = rhythm || n.alter === inForce ? null : n.alter;
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
        const next = j + 1 < onsets.length ? onsets[j + 1] : barStart(m + 1);
        const at = evs.filter(e => e.t === t);
        const acc = Math.max(0, ...at.map(e => e.accCols));
        const right = at.some(e => e.notes.some(n => n.right));
        const dot = at.some(e => e.dotted);
        return { t, acc, w: 1.6 + 3.1 * Math.sqrt(next - t) + acc * 1.2 + (right ? 1.2 : 0) + (dot ? 0.5 : 0) };
      });
      bars.push({ m, cols, w: 1.2 + cols.reduce((a, c) => a + c.w, 0) });
    }

    // lines of music
    const sig = notation ? T.keySignature(key) : [];
    const x0 = grand ? 2.4 : 0.8;
    const keyW = sig.reduce((a, s) => a + (s.alter > 0 ? 1.15 : 1.05), 0) + (sig.length ? 0.7 : 0);
    const clefW = rhythm ? 2.6 : 3.7;
    const headOther = x0 + clefW + keyW + 0.4;
    const headFirst = headOther + 0.8 + Math.max(...[num, den].map(n => String(n).split('').reduce((w, d) => w + GL['timeSig' + d].w, 0)));
    const systems = [];
    let cur = { bars: [], head: headFirst, w: 0 };
    for (const b of bars) {
      if (cur.bars.length && cur.head + cur.w + b.w > width - 0.5) { systems.push(cur); cur = { bars: [], head: headOther, w: 0 }; }
      cur.bars.push(b); cur.w += b.w;
    }
    systems.push(cur);
    const margin = rhythm ? 3.6 : fingering ? 5.4 : 4.6, gap = fingering ? 9 : 8;
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
      let yy = y0 + margin + (hasLabels ? 1.6 : 0);
      drawn.forEach((st, i) => { if (i) yy += st === 'tab' ? 5.5 : gap; s.tops[st] = yy; yy += st === 'tab' ? 7.5 : 4; });
      if (!notation) s.tops.treble = s.tops.tab - 10; // not drawn: only for working out positions
      s.bottom = yy;
      s.y0 = y0;
      y0 = s.bottom + margin + (notation ? 0 : 2.5);
    });
    const height = y0 + 0.2;
    const Y = (s, staff, d) => s.tops[staff] + (TOP[staff] - d) / 2;

    // ---------- drawing ----------
    const out = [];
    systems.forEach((s, si) => {
      for (const st of drawn) {
        if (st === 'tab') {
          // six lines, string 1 (high e) on top; "TAB" instead of a clef; a time signature only without notation
          for (let i = 0; i < 6; i++) out.push(line(x0, s.tops.tab + i * 1.5, s.right, s.tops.tab + i * 1.5, 0.13));
          out.push(`<rect class="tabbg" x="${f(x0 + 0.35)}" y="${f(s.tops.tab + 0.4)}" width="${f(1.9)}" height="${f(6.7)}"/>`);
          ['T', 'A', 'B'].forEach((c, i) => out.push(`<text class="tabclef" x="${f(x0 + 1.3)}" y="${f(s.tops.tab + 2.25 + i * 2)}" text-anchor="middle">${c}</text>`));
          if (si === 0 && !notation) {
            const tx = x0 + clefW + 0.6;
            for (const [n, y] of [[num, s.tops.tab + 2.25], [den, s.tops.tab + 5.25]]) {
              let x = tx;
              for (const d of String(n)) { out.push(use('timeSig' + d, x, y)); x += GL['timeSig' + d].w; }
            }
          }
          continue;
        }
        if (st === 'rhythm') out.push(line(x0, s.tops[st] + 2, s.right, s.tops[st] + 2, 0.13));
        else for (let i = 0; i < 5; i++) out.push(line(x0, s.tops[st] + i, s.right, s.tops[st] + i, 0.13));
        out.push(st === 'treble' ? use(guitar ? 'gClef8vb' : 'gClef', x0 + 0.9, Y(s, st, 32)) : st === 'bass' ? use('fClef', x0 + 0.9, Y(s, st, 24)) : use('unpitchedPercussionClef1', x0 + 0.5, s.tops[st] + 2));
        let sx = x0 + clefW + 0.7;
        sig.forEach((a, i) => {
          out.push(use(ACC_GLYPH[a.alter], sx, Y(s, st, (a.alter > 0 ? SHARP_POS : FLAT_POS)[i] - (st === 'bass' ? 14 : 0))));
          sx += a.alter > 0 ? 1.15 : 1.05;
        });
        if (si === 0) {
          // digits side by side (12/8), the shorter number centred over the longer
          const tx = sx + (sig.length ? 0.5 : 0.1);
          const width = n => String(n).split('').reduce((w, d) => w + GL['timeSig' + d].w, 0);
          const wMax = Math.max(width(num), width(den));
          for (const [n, y] of [[num, s.tops[st] + 1], [den, s.tops[st] + 3]]) {
            let x = tx + (wMax - width(n)) / 2;
            for (const d of String(n)) { out.push(use('timeSig' + d, x, y)); x += GL['timeSig' + d].w; }
          }
        }
      }
      const top = rhythm ? s.tops.rhythm + 1 : s.tops[drawn[0]], bottom = rhythm ? s.tops.rhythm + 3 : s.bottom;
      if (!rhythm) out.push(line(x0, top, x0, bottom, 0.16));
      if (grand) out.push(use('brace', x0 - 1.7, bottom, '', (bottom - top) / 4 * 1.25, (bottom - top) / 4));
      if (si > 0) out.push(`<text class="barno" x="${f(x0)}" y="${f(s.tops[drawn[0]] - 1.6)}">${pickup ? s.bars[0].m : s.bars[0].m + 1}</text>`);
      s.bars.forEach(b => {
        const bx = b.x + b.w2, last = b.m === nBars - 1;
        if (last) out.push(line(bx - 0.9, top, bx - 0.9, bottom, 0.16), line(bx - 0.25, top, bx - 0.25, bottom, 0.5));
        else out.push(line(bx, top, bx, bottom, 0.16)); // piano bar lines run through both staves
      });
    });

    // where each event's noteheads go
    for (const e of events) {
      const b = bars[e.m], s = systems[b.sys], c = b.cols.find(c => c.t === e.t);
      e.sys = b.sys; e.x = c.x + c.acc * 1.2;
      e.ys = e.notes.map(n => Y(s, e.staff, T.dia(n)));
    }

    // beams: eighths and sixteenths together within a beat group, same hand, no rests between.
    // Groups: 6/8 and 3/8 in dotted quarters, 4/4 in half bars (in beats when there are sixteenths), else beats.
    const groups = [];
    for (const v of ['rh', 'lh']) {
      const mine = events.filter(e => e.voice === v);
      const sixteenthBars = new Set(mine.filter(e => e.type === 16).map(e => e.m));
      let g = null;
      for (const e of mine) {
        const G = den === 8 ? 1.5 : L === 4 && !sixteenthBars.has(e.m) ? 2 : 1;
        const ok = e.type >= 8 && !e.rest;
        const rel = e.t - barStart(e.m) + (e.m === 0 && pickup ? L - pickup : 0);
        const slot = e.m * 100 + Math.floor(rel / G + 1e-9);
        const prev = g && g.evs[g.evs.length - 1];
        if (ok && g && g.slot === slot && Math.abs(prev.t + prev.d - e.t) < 1e-9) g.evs.push(e);
        else { if (g && g.evs.length > 1) groups.push(g); g = ok ? { slot, evs: [e] } : null; }
      }
      if (g && g.evs.length > 1) groups.push(g);
    }
    for (const g of groups) {
      const st = g.evs[0].staff;
      const ds = g.evs.flatMap(e => e.notes.map(T.dia));
      const hi = Math.max(...ds), lo = Math.min(...ds);
      g.dir = rhythm ? 'up' : hi - MID[st] > MID[st] - lo ? 'down' : 'up';
      for (const e of g.evs) { e.beam = g; e.dir = g.dir; }
    }

    // stems
    for (const e of events) {
      if (e.rest || e.type === 1) continue;
      const s = systems[e.sys];
      const yMid = Y(s, e.staff, MID[e.staff]);
      const ds = e.notes.map(T.dia);
      if (!e.dir) e.dir = rhythm ? 'up' : (Math.max(...ds) + Math.min(...ds)) / 2 >= MID[e.staff] ? 'down' : 'up';
      const yHigh = Math.min(...e.ys), yLow = Math.max(...e.ys);
      const len = e.type === 16 && !e.beam ? 4 : 3.5;
      if (e.dir === 'up') { e.stemX = e.x + 1.18 - 0.06; e.stemFrom = yLow - 0.168; e.stemTo = Math.min(yHigh - len, yMid); }
      else { e.stemX = e.x + 0.06; e.stemFrom = yHigh + 0.168; e.stemTo = Math.max(yLow + len, yMid); }
    }
    const beamParts = [];
    for (const g of groups) {
      const a = g.evs[0], z = g.evs[g.evs.length - 1];
      const up = g.dir === 'up';
      const has16 = g.evs.some(e => e.type === 16);
      const end = e => up ? Math.min(...e.ys) - 3.5 : Math.max(...e.ys) + 3.5;
      const slope = Math.max(-0.12, Math.min(0.12, (end(z) - end(a)) / Math.max(1, z.stemX - a.stemX)));
      const base = x => end(a) + slope * (x - a.stemX);
      const room = has16 ? 3.3 : 2.8;
      const need = g.evs.map(e => (up ? Math.min(...e.ys) - room : Math.max(...e.ys) + room) - base(e.stemX));
      const shift = up ? Math.min(0, ...need) : Math.max(0, ...need);
      const at = x => base(x) + shift;
      for (const e of g.evs) e.stemTo = at(e.stemX);
      const t = up ? 0.5 : -0.5, inward = up ? 0.75 : -0.75;
      beamParts.push(poly(a.stemX - 0.06, at(a.stemX - 0.06), z.stemX + 0.06, at(z.stemX + 0.06), t));
      // second beams: across runs of sixteenths; a lone sixteenth gets a short stub
      for (let i = 0; i < g.evs.length; i++) {
        if (g.evs[i].type !== 16) continue;
        let j = i;
        while (j + 1 < g.evs.length && g.evs[j + 1].type === 16) j++;
        let xa, xb;
        if (j > i) { xa = g.evs[i].stemX - 0.06; xb = g.evs[j].stemX + 0.06; }
        else if (i === g.evs.length - 1) { xb = g.evs[i].stemX + 0.06; xa = xb - 1.2; }
        else { xa = g.evs[i].stemX - 0.06; xb = xa + 1.2; }
        beamParts.push(poly(xa, at(xa) + inward, xb, at(xb) + inward, t));
        i = j;
      }
    }

    // events
    let fingerTop = Infinity, fingerBottom = -Infinity;
    const esc = x => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const tabY = (s, string) => s.tops.tab + (string - 1) * 1.5;
    for (const e of events) {
      const s = systems[e.sys];
      const g = [];
      const headW = GL[HEAD[e.type]].w;
      // a label above the system: strum arrows, right-hand fingers, chord names
      if (e.label) g.push(`<text class="elabel" x="${f(e.x + headW / 2)}" y="${f(s.y0 + 1.9)}" text-anchor="middle">${esc(e.label)}</text>`);
      if (e.rest) {
        if (notation) {
          const top = s.tops[e.staff];
          const b = bars[e.m];
          const whole = Math.abs(e.d - (barStart(e.m + 1) - barStart(e.m))) < 1e-9 && e.t === barStart(e.m) && (e.m > 0 || !pickup);
          if (whole) g.push(use('restWhole', b.x + b.w2 / 2 - 0.56, top + 1));
          else {
            const glyph = REST[e.type];
            g.push(use(glyph, e.x, e.type === 1 ? top + 1 : top + 2));
            if (e.dotted) g.push(use('augmentationDot', e.x + GL[glyph].w + 0.35, top + 1.5));
          }
        } else if (tabOn) {
          const b = bars[e.m];
          const whole = Math.abs(e.d - (barStart(e.m + 1) - barStart(e.m))) < 1e-9 && e.t === barStart(e.m);
          if (whole) g.push(use('restWhole', b.x + b.w2 / 2 - 0.56, s.tops.tab + 3));
          else g.push(use(REST[e.type], e.x, s.tops.tab + 3.75));
        }
        out.push(`<g class="ev rest" data-i="${e.i}">${g.join('')}</g>`);
        continue;
      }
      if (notation) {
        const top = TOP[e.staff], bottom = top - 8;
        // ledger lines (none on the rhythm line)
        const ledgers = new Map();
        if (!rhythm) for (const n of e.notes) {
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
          if (e.type >= 8 && !e.beam) g.push(use(`flag${e.type === 16 ? '16th' : '8th'}${e.dir === 'up' ? 'Up' : 'Down'}`, e.stemX - 0.06, e.stemTo));
        }
        // fingering: right hand above, left hand below; stacked so the top number is the top note
        if (fingering && e.notes.some(n => n.finger)) {
          const above = e.voice === 'rh';
          const order = e.notes.map((n, i) => ({ n, y: e.ys[i] })).sort((p, q) => q.y - p.y); // lowest note first
          const cx = e.x + headW / 2;
          if (above) {
            let y = Math.min(...e.ys, e.dir === 'up' && e.stemTo !== undefined ? e.stemTo : Infinity) - 0.9;
            if (e.beam && e.dir === 'up') y -= 0.5;
            for (const { n } of order) { if (n.finger) { g.push(`<text class="finger" x="${f(cx)}" y="${f(y)}" text-anchor="middle">${n.finger}</text>`); fingerTop = Math.min(fingerTop, y - 1.1); } y -= 1.35; }
          } else {
            let y = Math.max(...e.ys, e.dir === 'down' && e.stemTo !== undefined ? e.stemTo : -Infinity) + 2.0;
            if (e.beam && e.dir === 'down') y += 0.5;
            for (const { n } of [...order].reverse()) { if (n.finger) { g.push(`<text class="finger" x="${f(cx)}" y="${f(y)}" text-anchor="middle">${n.finger}</text>`); fingerBottom = Math.max(fingerBottom, y + 0.4); } y += 1.35; }
          }
        }
      }
      if (tabOn) {
        // fret numbers on their strings, cut out of the line
        const cx = e.x + headW / 2;
        for (const n of e.notes) if (n.string) {
          const txt = String(n.fret), w = 0.7 + 0.6 * txt.length, y = tabY(s, n.string);
          g.push(`<rect class="tabbg" x="${f(cx - w / 2)}" y="${f(y - 0.7)}" width="${f(w)}" height="${f(1.4)}"/>`,
            `<text class="tabnum" x="${f(cx)}" y="${f(y + 0.5)}" text-anchor="middle">${txt}</text>`);
        }
        // without the notation, the rhythm goes under the tab
        if (!notation && e.type !== 1) {
          const yb = s.tops.tab + 8.1, ye = s.tops.tab + 7.5 + (e.type === 2 ? 2.2 : 3.4);
          g.push(line(cx, yb, cx, ye, 0.12));
          if (e.type >= 8 && !e.beam) g.push(use(`flag${e.type === 16 ? '16th' : '8th'}Down`, cx - 0.06, ye));
          if (e.dotted) g.push(use('augmentationDot', cx + 0.5, ye - 0.6));
          e.tabStem = { x: cx, y: ye };
        }
      }
      out.push(`<g class="ev" data-i="${e.i}">${g.join('')}</g>`);
    }
    if (notation) out.push(`<g class="beams">${beamParts.join('')}</g>`);
    else if (tabOn) {
      const tb = [];
      for (const g of groups) {
        const a = g.evs[0].tabStem, z = g.evs[g.evs.length - 1].tabStem;
        if (!a || !z) continue;
        tb.push(poly(a.x - 0.06, a.y, z.x + 0.06, z.y, -0.5));
        for (let i = 0; i < g.evs.length; i++) {
          if (g.evs[i].type !== 16) continue;
          let j = i;
          while (j + 1 < g.evs.length && g.evs[j + 1].type === 16) j++;
          const xa = j > i ? g.evs[i].tabStem.x - 0.06 : i === g.evs.length - 1 ? g.evs[i].tabStem.x - 1.2 : g.evs[i].tabStem.x - 0.06;
          const xb = j > i ? g.evs[j].tabStem.x + 0.06 : i === g.evs.length - 1 ? g.evs[i].tabStem.x + 0.06 : g.evs[i].tabStem.x + 1.2;
          tb.push(poly(xa, a.y - 0.75, xb, a.y - 0.75, -0.5));
          i = j;
        }
      }
      out.push(`<g class="beams">${tb.join('')}</g>`);
    }

    // the playhead's path: each column, and the end of each line
    const marks = [];
    for (const b of bars) for (const c of b.cols) marks.push({ t: c.t, sys: b.sys, x: f(c.x + c.acc * 1.2 + 0.6) });
    systems.forEach((s, si) => {
      const lastBar = s.bars[s.bars.length - 1];
      marks.push({ t: barStart(lastBar.m + 1) - 1e-6, sys: si, x: f(s.right - 0.6) });
    });
    marks.sort((a, b) => a.t - b.t);
    // finger numbers above the first line or below the last must not be cut off
    const dy = Math.max(0, 0.3 - fingerTop);
    const total = Math.max(height, fingerBottom + 0.3) + dy;
    const sysBoxes = systems.map(s => rhythm
      ? { top: f(s.tops.rhythm - 1.5 + dy), bottom: f(s.tops.rhythm + 5.5 + dy) }
      : { top: f(s.tops[drawn[0]] - 2 + dy), bottom: f(s.bottom + (notation ? 2 : 4.5) + dy) });

    const svg = `<svg class="staff score" viewBox="0 0 ${f(width)} ${f(total)}" role="img" aria-label="${(piece.title || 'Score').replace(/"/g, '')}">` +
      `<rect class="playhead" x="0" y="0" width="${f(1.6)}" height="0" rx="${f(0.5)}"/><g transform="translate(0 ${f(dy)})">` + out.join('') + '</g></svg>';
    return { svg, events, marks, systems: sysBoxes, L, pickup, length, bars: nBars, barStart, width: f(width), height: f(total), grand };
  }

  self.Score = { layout, parseVoice };
})();
