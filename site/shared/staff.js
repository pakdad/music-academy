// Draws music on a staff as SVG: treble, bass or grand staff, key signatures, whole notes,
// chords (seconds side by side), ledger lines, accidentals (key signature and bar rules) and labels.
//
//   el.innerHTML = Staff.svg({
//     clef: 'treble' | 'bass' | 'grand',
//     key: 0,                                   // fifths: 3 = A major / F# minor, -2 = Bb major / G minor
//     items: [                                  // one column each, left to right
//       { notes: [Theory.parse('C4'), ...],     // a note can say { ..., staff: 'bass' } on a grand staff
//         color: '#16a34a',                     // or per note: { ..., color }
//         label: 'C', sublabel: 'I',            // text under the system
//         mark: true },                         // a soft highlight behind the column
//     ],
//     barlines: true,                           // a bar line after every column (accidentals reset)
//     ledgers: 4,                               // room for this many ledger lines above and below
//     spacing: 7,                               // column width in staff spaces
//     gap: 7,                                   // grand staff: spaces between the staves (default: room for the ledgers)
//   })
//
// Units: one staff space is 10 SVG units. Glyphs come from Bravura (glyphs.js).
(function () {
  const S = 10;
  const T = self.Theory;
  const GL = self.GLYPHS;
  const k = S / 250; // font units per staff space are 250
  const TREBLE_TOP = 38; // F5, the treble staff's top line, as a diatonic index
  const BASS_TOP = 26;   // A3
  const ACC_GLYPH = { '-2': 'accidentalDoubleFlat', '-1': 'accidentalFlat', 0: 'accidentalNatural', 1: 'accidentalSharp', 2: 'accidentalDoubleSharp' };
  // key signature positions (treble); the bass clef is two octaves lower
  const SHARP_POS = ['F5', 'C5', 'G5', 'D5', 'A4', 'E5', 'B4'].map(s => T.dia(T.parse(s)));
  const FLAT_POS = ['B4', 'E5', 'A4', 'D5', 'G4', 'C5', 'F4'].map(s => T.dia(T.parse(s)));

  const f = v => Math.round(v * 100) / 100;

  // the glyph outlines, once per page
  function ensureDefs() {
    if (typeof document === 'undefined' || document.getElementById('staff-glyphs')) return;
    const defs = Object.entries(GL).map(([n, g]) => `<path id="g-${n}" d="${g.d}"/>`).join('');
    const holder = document.createElement('div');
    holder.innerHTML = `<svg id="staff-glyphs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${defs}</defs></svg>`;
    document.body.prepend(holder.firstChild);
  }
  const glyph = (n, x, y, attrs = '', sx = 1, sy = 1) =>
    `<use href="#g-${n}" transform="translate(${f(x)} ${f(y)}) scale(${f(k * sx * 1000) / 1000} ${f(-k * sy * 1000) / 1000})" ${attrs}/>`;
  const line = (x1, y1, x2, y2, w, attrs = '') =>
    `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="currentColor" stroke-width="${f(w * S)}" ${attrs}/>`;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  function svg(spec) {
    ensureDefs();
    const clef = spec.clef || 'treble';
    const key = spec.key || 0;
    const items = spec.items || [];
    const ledgers = spec.ledgers ?? 4;
    const spacing = spec.spacing ?? 7;
    const staves = clef === 'grand' ? ['treble', 'bass'] : [clef];
    const hasLabels = items.some(i => i.label || i.sublabel);

    // vertical layout
    const margin = Math.max(3, ledgers + 1.5) * S;
    const top = {};
    top[staves[0]] = margin;
    // between the staves: room for both staves' ledger lines, so a note can't look like it belongs to either
    const gap = spec.gap ?? Math.max(7, 2 * ledgers + 2);
    if (clef === 'grand') top.bass = margin + (4 + gap) * S;
    const lastBottom = top[staves[staves.length - 1]] + 4 * S;
    const labelY = lastBottom + margin - 0.6 * S;
    const height = lastBottom + margin + (hasLabels ? 4.2 * S : 0);
    const y = (staff, d) => top[staff] + ((staff === 'bass' ? BASS_TOP : TREBLE_TOP) - d) * S / 2;
    const staffOf = n => n.staff || (clef !== 'grand' ? clef : T.dia(n) >= 28 ? 'treble' : 'bass');

    // horizontal layout: brace, clef, key signature, then the columns
    const x0 = (clef === 'grand' ? 2.2 : 0.8) * S;
    const clefX = x0 + 0.9 * S;
    let x = clefX + 3.7 * S;
    const sig = T.keySignature(key);
    const sigX = x;
    x += sig.reduce((a, s) => a + (s.alter > 0 ? 1.15 : 1.05) * S, 0) + (sig.length ? 1.2 * S : 0.6 * S);

    const parts = [];
    const cols = [];
    let carry = {}; // accidentals in force in this bar, by staff and position
    for (const item of items) {
      const notes = item.notes.map(n => ({ ...n, staff: staffOf(n) }));
      // accidentals
      for (const n of notes) {
        const pos = n.staff + T.dia(n);
        const inForce = pos in carry ? carry[pos] : T.keyAlter(key, n.step);
        if (Math.abs(n.alter) > 2) throw new Error('No glyph for a triple sharp or flat');
        n.showAcc = n.acc !== undefined ? n.acc : (n.alter !== inForce ? n.alter : null);
        carry[pos] = n.alter;
      }
      // seconds: the upper note of a second steps to the right
      for (const st of staves) {
        const group = notes.filter(n => n.staff === st).sort((a, b) => T.dia(a) - T.dia(b));
        for (let i = 1; i < group.length; i++) {
          if (T.dia(group[i]) - T.dia(group[i - 1]) === 1 && !group[i - 1].right) group[i].right = true;
          if (T.dia(group[i]) === T.dia(group[i - 1])) group[i].right = true; // unison spelled two ways
        }
      }
      // accidental columns, from the top down, left of the notes
      const withAcc = notes.filter(n => n.showAcc !== null && n.showAcc !== undefined)
        .sort((a, b) => (a.staff === b.staff ? T.dia(b) - T.dia(a) : a.staff === 'treble' ? -1 : 1));
      const placed = [];
      for (const n of withAcc) {
        let col = 0;
        while (placed.some(p => p.col === col && p.staff === n.staff && Math.abs(T.dia(p) - T.dia(n)) < 6)) col++;
        n.col = col;
        placed.push(n);
      }
      const accCols = placed.length ? Math.max(...placed.map(p => p.col)) + 1 : 0;
      const lead = accCols ? accCols * 1.2 * S + 0.3 * S : 0;
      const head = GL.noteheadWhole.w * S;
      const hasRight = notes.some(n => n.right);
      const need = lead + head * (hasRight ? 2 : 1) + 2.6 * S;
      const width = Math.max(spacing * S, need);
      const cx = x + (width - head * (hasRight ? 2 : 1)) / 2 + lead / 2 + head / 2;
      cols.push({ item, notes, x, width, cx, head });
      x += width;
      if (spec.barlines) carry = {};
    }
    // stretch to a minimum width (so a single note doesn't make a tiny card)
    if (spec.minWidth && x + 0.8 * S < spec.minWidth * S && cols.length) {
      const extra = (spec.minWidth * S - 0.8 * S - x) / cols.length;
      cols.forEach((c, i) => { c.x += extra * i; c.cx += extra * i + extra / 2; c.width += extra; });
      x += extra * cols.length;
    }
    if (!cols.length && spec.minWidth) x = Math.max(x, spec.minWidth * S - 0.8 * S);
    const width = x + 0.8 * S;
    const right = cols.length ? cols[cols.length - 1].x + cols[cols.length - 1].width : width - 0.8 * S;

    // highlighted columns go behind everything
    for (const c of cols) if (c.item.mark) {
      const t = top[staves[0]] - 1.5 * S, b = lastBottom + 1.5 * S;
      parts.push(`<rect class="mark" x="${f(c.x + 0.4 * S)}" y="${f(t)}" width="${f(c.width - 0.8 * S)}" height="${f(b - t)}" rx="${S}"/>`);
    }

    // staves, clefs, key signatures
    for (const st of staves) {
      for (let i = 0; i < 5; i++) parts.push(line(x0, top[st] + i * S, right, top[st] + i * S, 0.13));
      if (st === 'treble') parts.push(glyph('gClef', clefX, y('treble', 32)));
      else parts.push(glyph('fClef', clefX, y('bass', 24)));
      const shift = st === 'bass' ? -14 : 0;
      let sx = sigX;
      sig.forEach((s, i) => {
        const d = (s.alter > 0 ? SHARP_POS : FLAT_POS)[i] + shift;
        parts.push(glyph(ACC_GLYPH[s.alter], sx, y(st, d)));
        sx += (s.alter > 0 ? 1.15 : 1.05) * S;
      });
    }
    // system line and brace
    const sysTop = top[staves[0]], sysBottom = lastBottom;
    parts.push(line(x0, sysTop, x0, sysBottom, 0.16));
    if (clef === 'grand') {
      const span = (sysBottom - sysTop) / S;
      parts.push(glyph('brace', x0 - 1.6 * S, sysBottom, '', span / 4 * 1.25, span / 4));
    }
    // bar lines
    cols.forEach((c, i) => {
      const last = i === cols.length - 1;
      if (!spec.barlines && !last) return;
      if (spec.barlines === false && last) return;
      const bx = c.x + c.width;
      for (const st of staves) parts.push(line(bx, top[st], bx, top[st] + 4 * S, 0.16));
      if (clef === 'grand') parts.push(line(bx, top.treble + 4 * S, bx, top.bass, 0.16));
    });

    // notes
    for (const c of cols) {
      const color = c.item.color ? ` fill="${c.item.color}" color="${c.item.color}"` : '';
      const g = [];
      for (const st of staves) {
        const group = c.notes.filter(n => n.staff === st);
        if (!group.length) continue;
        const topLine = st === 'bass' ? BASS_TOP : TREBLE_TOP, bottomLine = topLine - 8;
        const left = c.cx - c.head / 2;
        // ledger lines, as wide as the noteheads beyond them
        const ledgersAt = new Map();
        for (const n of group) {
          const d = T.dia(n);
          if (d > topLine) for (let l = topLine + 2; l <= d; l += 2) ledgersAt.set(l, (ledgersAt.get(l) || 0) | (n.right ? 2 : 1));
          if (d < bottomLine) for (let l = bottomLine - 2; l >= d; l -= 2) ledgersAt.set(l, (ledgersAt.get(l) || 0) | (n.right ? 2 : 1));
        }
        for (const [l, sides] of ledgersAt) {
          const x1 = left - 0.4 * S, x2 = left + c.head * (sides & 2 ? 2 : 1) + 0.4 * S;
          g.push(line(x1, y(st, l), x2, y(st, l), 0.16));
        }
        for (const n of group) {
          const nx = left + (n.right ? c.head : 0), ny = y(st, T.dia(n));
          const nc = n.color ? ` fill="${n.color}"` : '';
          g.push(glyph('noteheadWhole', nx, ny, nc));
          if (n.showAcc !== null && n.showAcc !== undefined) {
            const ag = ACC_GLYPH[n.showAcc];
            const ax = left - 0.3 * S - n.col * 1.2 * S - GL[ag].w * S;
            g.push(glyph(ag, ax, ny, nc));
          }
        }
      }
      parts.push(`<g class="col"${color}>${g.join('')}</g>`);
      if (c.item.label) parts.push(`<text class="label" x="${f(c.cx)}" y="${f(labelY + 1.6 * S)}" text-anchor="middle"${color}>${esc(c.item.label)}</text>`);
      if (c.item.sublabel) parts.push(`<text class="sublabel" x="${f(c.cx)}" y="${f(labelY + 3.6 * S)}" text-anchor="middle"${color}>${esc(c.item.sublabel)}</text>`);
    }

    const label = spec.label ? ` aria-label="${esc(spec.label)}"` : '';
    return `<svg class="staff" viewBox="0 0 ${f(width)} ${f(height)}" role="img"${label} style="--sw:${f(width)};--sh:${f(height)}">${parts.join('')}</svg>`;
  }

  // the diatonic range a clef shows with a number of ledger lines
  function range(clef, ledgers = 0) {
    if (clef === 'bass') return [18 - ledgers * 2, BASS_TOP + ledgers * 2];
    if (clef === 'treble') return [30 - ledgers * 2, TREBLE_TOP + ledgers * 2];
    return [18 - ledgers * 2, TREBLE_TOP + ledgers * 2];
  }

  self.Staff = { svg, range, ensureDefs, S };
})();
