// The guitar: tunings, where notes are on the neck, chord shapes, strumming and picking patterns, and drawings of
// the fretboard (clickable) and of chord boxes.
//
// Strings are numbered like in tab: 1 is the high e, 6 the low E. Frets: 0 is the open string.
//   Guitar.midi(string, fret)          sounding pitch (with the tuning and capo from the guitar settings)
//   Guitar.positions(midi, maxFret)     every { string, fret } that plays it
//   Guitar.fretboard(el, opts)          an SVG fretboard; opts.onPick(string, fret) when clicked
//   Guitar.diagram(shape)               an SVG chord box
(function () {
  const T = self.Theory;

  const TUNINGS = {
    standard:  { name: 'Standard (E A D G B E)', notes: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    halfDown:  { name: 'Half step down (E♭)', notes: ['Eb2', 'Ab2', 'Db3', 'Gb3', 'Bb3', 'Eb4'] },
    dropD:     { name: 'Drop D (D A D G B E)', notes: ['D2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
    dadgad:    { name: 'DADGAD', notes: ['D2', 'A2', 'D3', 'G3', 'A3', 'D4'] },
    openG:     { name: 'Open G (D G D G B D)', notes: ['D2', 'G2', 'D3', 'G3', 'B3', 'D4'] },
    openD:     { name: 'Open D (D A D F♯ A D)', notes: ['D2', 'A2', 'D3', 'F#3', 'A3', 'D4'] },
  };

  // the player's guitar settings (home page): tuning, capo, left-handed
  function settings() {
    const p = (self.UI && UI.store.get('guitar', {})) || {};
    return { tuning: TUNINGS[p.tuning] ? p.tuning : 'standard', capo: p.capo || 0, left: !!p.left };
  }
  // open-string pitches, string 1 first
  function openStrings(tuning) {
    const t = TUNINGS[tuning || settings().tuning];
    return t.notes.map(n => T.midi(T.parse(n))).reverse();
  }
  const midi = (string, fret, tuning) => openStrings(tuning)[string - 1] + fret + (settings().capo || 0);
  function positions(m, maxFret = 12, tuning) {
    const out = [];
    for (let s = 1; s <= 6; s++) { const f = m - midi(s, 0, tuning); if (f >= 0 && f <= maxFret) out.push({ string: s, fret: f }); }
    return out;
  }
  // a note name for a position (spelled with sharps unless the key says flats)
  const noteAt = (string, fret, fifths = 0) => T.spell(midi(string, fret), fifths);

  // ---------- chords: frets from the low E (string 6) to the high e (string 1); -1 = not played ----------
  // fingers: 1 index … 4 little; barre: { fret, from, to } strings (6 = low E)
  const CHORDS = [
    // open major
    { id: 'C',  root: 'C', type: 'maj',  group: 'open', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
    { id: 'A',  root: 'A', type: 'maj',  group: 'open', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
    { id: 'G',  root: 'G', type: 'maj',  group: 'open', frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
    { id: 'E',  root: 'E', type: 'maj',  group: 'open', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
    { id: 'D',  root: 'D', type: 'maj',  group: 'open', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
    // open minor
    { id: 'Am', root: 'A', type: 'min',  group: 'minor', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
    { id: 'Em', root: 'E', type: 'min',  group: 'minor', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
    { id: 'Dm', root: 'D', type: 'min',  group: 'minor', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
    // seventh chords
    { id: 'A7', root: 'A', type: 'dom7', group: 'seventh', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0] },
    { id: 'B7', root: 'B', type: 'dom7', group: 'seventh', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
    { id: 'C7', root: 'C', type: 'dom7', group: 'seventh', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
    { id: 'D7', root: 'D', type: 'dom7', group: 'seventh', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
    { id: 'E7', root: 'E', type: 'dom7', group: 'seventh', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
    { id: 'G7', root: 'G', type: 'dom7', group: 'seventh', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
    { id: 'Am7', root: 'A', type: 'min7', group: 'seventh', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
    { id: 'Em7', root: 'E', type: 'min7', group: 'seventh', frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0] },
    { id: 'Dm7', root: 'D', type: 'min7', group: 'seventh', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], barre: { fret: 1, from: 2, to: 1 } },
    { id: 'Cmaj7', root: 'C', type: 'maj7', group: 'seventh', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
    { id: 'Fmaj7', root: 'F', type: 'maj7', group: 'seventh', frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
    { id: 'Amaj7', root: 'A', type: 'maj7', group: 'seventh', frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
    // suspended
    { id: 'Dsus2', root: 'D', type: 'sus2', group: 'sus', frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 3, 0] },
    { id: 'Dsus4', root: 'D', type: 'sus4', group: 'sus', frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4] },
    { id: 'Asus2', root: 'A', type: 'sus2', group: 'sus', frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
    { id: 'Asus4', root: 'A', type: 'sus4', group: 'sus', frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },
    { id: 'Esus4', root: 'E', type: 'sus4', group: 'sus', frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
    // power chords
    { id: 'E5', root: 'E', type: 'pow', group: 'power', frets: [0, 2, 2, -1, -1, -1], fingers: [0, 1, 2, 0, 0, 0] },
    { id: 'A5', root: 'A', type: 'pow', group: 'power', frets: [-1, 0, 2, 2, -1, -1], fingers: [0, 0, 1, 2, 0, 0] },
    { id: 'G5', root: 'G', type: 'pow', group: 'power', frets: [3, 5, 5, -1, -1, -1], fingers: [1, 3, 4, 0, 0, 0] },
    { id: 'D5', root: 'D', type: 'pow', group: 'power', frets: [-1, -1, 0, 2, 3, -1], fingers: [0, 0, 0, 1, 2, 0] },
    // barre chords
    { id: 'F',   root: 'F',  type: 'maj', group: 'barre', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], barre: { fret: 1, from: 6, to: 1 } },
    { id: 'Bm',  root: 'B',  type: 'min', group: 'barre', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 2, from: 5, to: 1 } },
    { id: 'B',   root: 'B',  type: 'maj', group: 'barre', frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], barre: { fret: 2, from: 5, to: 1 } },
    { id: 'F#m', root: 'F#', type: 'min', group: 'barre', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 2, from: 6, to: 1 } },
    { id: 'Cm',  root: 'C',  type: 'min', group: 'barre', frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], barre: { fret: 3, from: 5, to: 1 } },
    { id: 'Gm',  root: 'G',  type: 'min', group: 'barre', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], barre: { fret: 3, from: 6, to: 1 } },
  ];
  const GROUPS = [['open', 'Open major'], ['minor', 'Open minor'], ['seventh', 'Seventh chords'], ['sus', 'Sus chords'], ['power', 'Power chords'], ['barre', 'Barre chords']];
  const TYPE_TONES = { maj: [0, 4, 7], min: [0, 3, 7], dom7: [0, 4, 7, 10], min7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], sus2: [0, 2, 7], sus4: [0, 5, 7], pow: [0, 7] };
  const SYMBOL = { maj: '', min: 'm', dom7: '7', min7: 'm7', maj7: 'maj7', sus2: 'sus2', sus4: 'sus4', pow: '5' };
  const chordById = id => CHORDS.find(c => c.id === id);
  // what a shape sounds: [{ string, fret, midi }] low to high
  function voicing(shape, tuning) {
    const out = [];
    shape.frets.forEach((f, i) => { if (f >= 0) { const s = 6 - i; out.push({ string: s, fret: f, midi: midi(s, f, tuning) }); } });
    return out;
  }
  const chordPcs = shape => [...new Set(TYPE_TONES[shape.type].map(x => T.mod(T.pc(T.parse(shape.root + '4')) + x, 12)))].sort((a, b) => a - b);
  // what a strummed shape should sound like to the microphone: each string with its first six harmonics
  // (a string's 3rd harmonic is a fifth up, the 5th a major third: richer chords would win without them)
  function template(shape) {
    const v = Array(12).fill(0);
    for (const n of voicing(shape)) for (let hn = 1; hn <= 6; hn++) v[T.mod(n.midi + Math.round(12 * Math.log2(hn)), 12)] += Math.pow(0.75, 2 * (hn - 1));
    return v;
  }
  const similarity = (chroma, tpl) => { let d = 0, x = 0, y = 0; for (let i = 0; i < 12; i++) { d += chroma[i] * tpl[i]; x += chroma[i] * chroma[i]; y += tpl[i] * tpl[i]; } return d / Math.sqrt(x * y || 1); };
  // which of these shapes was strummed? { best, score, scores: Map(id → similarity) }
  function recognise(chroma, shapes) {
    const scores = new Map(shapes.map(c => [c.id, similarity(chroma, template(c))]));
    let best = null;
    for (const c of shapes) if (!best || scores.get(c.id) > scores.get(best.id)) best = c;
    return { best, score: best ? scores.get(best.id) : 0, scores };
  }
  // the name, in the chosen note names: C, Am, F♯m, Hm (German), B7 → H7
  const chordName = shape => (self.UI ? UI.noteName(T.parse(shape.root + '4')) : shape.root) + SYMBOL[shape.type];

  // ---------- strumming: one character per eighth note (D down, U up, - hand moves, no strum) ----------
  const STRUMS = [
    { id: 'quarters', time: [4, 4], level: 1, pattern: 'D-D-D-D-', name: 'All downs' },
    { id: 'eighths',  time: [4, 4], level: 1, pattern: 'DUDUDUDU', name: 'Down-up eighths' },
    { id: 'folk',     time: [4, 4], level: 2, pattern: 'D-DU-UDU', name: 'The folk strum (D, DU, UDU)' },
    { id: 'rock',     time: [4, 4], level: 2, pattern: 'D-DUD-DU', name: 'Rock: D DU D DU' },
    { id: 'push',     time: [4, 4], level: 3, pattern: 'D-DU-UD-', name: 'The push (anticipation)' },
    { id: 'offbeat',  time: [4, 4], level: 3, pattern: '-U-U-U-U', name: 'Offbeats (reggae, ska)' },
    { id: 'waltz',    time: [3, 4], level: 1, pattern: 'D-D-D-',   name: 'Waltz: three downs' },
    { id: 'waltz2',   time: [3, 4], level: 2, pattern: 'D-DUDU',   name: 'Waltz with up-strums' },
    { id: 'ballad68', time: [6, 8], level: 2, pattern: 'D-UD-U',   name: '6/8 ballad' },
  ];

  // ---------- picking: one slot per eighth note; B = the chord's bass string, 1–3 = strings; p i m a = fingers ----------
  const PICKS = [
    { id: 'pima',   time: [4, 4], level: 1, slots: [['B', 'p'], ['3', 'i'], ['2', 'm'], ['1', 'a'], ['B', 'p'], ['3', 'i'], ['2', 'm'], ['1', 'a']], name: 'Arpeggio up (p i m a)' },
    { id: 'pimami', time: [3, 4], level: 1, slots: [['B', 'p'], ['3', 'i'], ['2', 'm'], ['1', 'a'], ['2', 'm'], ['3', 'i']], name: 'Up and down (p i m a m i)' },
    { id: 'pimi',   time: [4, 4], level: 2, slots: [['B', 'p'], ['3', 'i'], ['2', 'm'], ['3', 'i'], ['B', 'p'], ['3', 'i'], ['2', 'm'], ['3', 'i']], name: 'Rolling (p i m i)' },
    { id: 'pinch',  time: [4, 4], level: 2, slots: [['B+1', 'p+a'], ['3', 'i'], ['2', 'm'], ['3', 'i'], ['B+1', 'p+a'], ['3', 'i'], ['2', 'm'], ['3', 'i']], name: 'Pinch (bass and melody together)' },
    { id: 'travis', time: [4, 4], level: 3, slots: [['B', 'p'], ['2', 'm'], ['A', 'p'], ['3', 'i'], ['B', 'p'], ['2', 'm'], ['A', 'p'], ['3', 'i']], name: 'Alternating bass (Travis basics)' },
  ];
  // the bass strings of a shape: B = the lowest string played, A = the next one up (alternate bass)
  function pickStrings(shape, code) {
    const played = shape.frets.map((f, i) => ({ s: 6 - i, f })).filter(x => x.f >= 0);
    return code.split('+').map(c => c === 'B' ? played[0].s : c === 'A' ? (played[1] || played[0]).s : +c);
  }

  // ---------- drawings ----------
  const svgNS = (w, h, cls, body) => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" role="img">${body}</svg>`;

  // a horizontal neck, string 1 on top (like tab). marks: [{ string, fret, label, cls }]
  function fretboard(el, { frets = 12, marks = [], onPick = null } = {}) {
    const left = settings().left;
    const FW = 52, SH = 26, X0 = 50, Y0 = 24, W = X0 + frets * FW + 16, H = Y0 * 2 + SH * 5;
    const flip = x => left ? W - x : x;
    const fx = f => flip(f === 0 ? X0 - FW * 0.5 : X0 + (f - 0.5) * FW); // the middle of a fret (0 = open, left of the nut)
    const sy = s => Y0 + (s - 1) * SH;
    const parts = [];
    for (const f of [3, 5, 7, 9, 15, 17]) if (f <= frets) parts.push(`<circle class="inlay" cx="${fx(f)}" cy="${Y0 + SH * 2.5}" r="6"/>`);
    if (frets >= 12) parts.push(`<circle class="inlay" cx="${fx(12)}" cy="${Y0 + SH * 1.5}" r="6"/>`, `<circle class="inlay" cx="${fx(12)}" cy="${Y0 + SH * 3.5}" r="6"/>`);
    for (let i = 0; i <= frets; i++) parts.push(`<line class="${i === 0 ? 'nut' : 'fret'}" x1="${flip(X0 + i * FW)}" y1="${Y0 - 6}" x2="${flip(X0 + i * FW)}" y2="${Y0 + SH * 5 + 6}"/>`);
    for (let s = 1; s <= 6; s++) parts.push(`<line class="string" x1="${flip(X0 - FW)}" y1="${sy(s)}" x2="${flip(W - 6)}" y2="${sy(s)}" style="stroke-width:${0.8 + (s - 1) * 0.35}"/>`);
    for (const f of [3, 5, 7, 9, 12, 15]) if (f <= frets) parts.push(`<text class="fretno" x="${fx(f)}" y="${H - 3}" text-anchor="middle">${f}</text>`);
    if (onPick) for (let s = 1; s <= 6; s++) for (let f = 0; f <= frets; f++)
      parts.push(`<rect class="hit" data-s="${s}" data-f="${f}" x="${fx(f) - FW / 2}" y="${sy(s) - SH / 2}" width="${FW}" height="${SH}"/>`);
    for (const m of marks) {
      if (m.fret > frets) continue;
      parts.push(`<g class="mark ${m.cls || ''}"><circle cx="${fx(m.fret)}" cy="${sy(m.string)}" r="10.5"/>${m.label !== undefined && m.label !== '' ? `<text x="${fx(m.fret)}" y="${sy(m.string) + 4.5}" text-anchor="middle">${m.label}</text>` : ''}</g>`);
    }
    el.innerHTML = svgNS(W, H, 'fretboard' + (onPick ? ' pickable' : ''), parts.join('')).replace('<svg ', `<svg style="max-width:${Math.round(W * 1.45)}px" `);
    if (onPick) el.querySelector('svg').addEventListener('pointerdown', e => {
      const r = e.target.closest?.('.hit');
      if (!r) return;
      e.preventDefault();
      onPick(+r.dataset.s, +r.dataset.f, e);
    });
  }

  // a chord box: strings left (low E) to right (high e), frets downwards; x and o above
  function diagram(shape, { size = 1 } = {}) {
    const played = shape.frets.filter(f => f > 0);
    const base = Math.max(1, Math.min(...played, 99)) > 2 && Math.max(...played) > 4 ? Math.min(...played) : 1;
    const SW = 20, FH = 24, X0 = 26, Y0 = 46, rows = 5;
    const W = X0 * 2 + SW * 5, H = Y0 + FH * rows + 12;
    const parts = [];
    parts.push(`<text class="dname" x="${W / 2}" y="16" text-anchor="middle">${chordName(shape)}</text>`);
    for (let r = 0; r <= rows; r++) parts.push(`<line class="${r === 0 && base === 1 ? 'nut' : 'fret'}" x1="${X0}" y1="${Y0 + r * FH}" x2="${X0 + SW * 5}" y2="${Y0 + r * FH}"/>`);
    for (let i = 0; i < 6; i++) parts.push(`<line class="string" x1="${X0 + i * SW}" y1="${Y0}" x2="${X0 + i * SW}" y2="${Y0 + rows * FH}"/>`);
    if (base > 1) parts.push(`<text class="dbase" x="${X0 - 8}" y="${Y0 + FH * 0.6}" text-anchor="end">${base}</text>`);
    if (shape.barre) {
      const xa = X0 + (6 - shape.barre.from) * SW, xb = X0 + (6 - shape.barre.to) * SW, y = Y0 + (shape.barre.fret - base + 0.5) * FH;
      parts.push(`<rect class="dot" x="${xa - 8}" y="${y - 8}" width="${xb - xa + 16}" height="16" rx="8"/>`);
    }
    shape.frets.forEach((f, i) => {
      const x = X0 + i * SW;
      if (f < 0) parts.push(`<text class="dmute" x="${x}" y="${Y0 - 7}" text-anchor="middle">×</text>`);
      else if (f === 0) parts.push(`<circle class="dopen" cx="${x}" cy="${Y0 - 11}" r="5"/>`);
      else {
        const y = Y0 + (f - base + 0.5) * FH;
        const onBarre = shape.barre && f === shape.barre.fret && shape.fingers[i] === 1;
        if (!onBarre) parts.push(`<circle class="dot" cx="${x}" cy="${y}" r="8.5"/>`);
        if (shape.fingers[i] && !onBarre) parts.push(`<text class="dfinger" x="${x}" y="${y + 4}" text-anchor="middle">${shape.fingers[i]}</text>`);
      }
    });
    return `<svg class="diagram" viewBox="0 0 ${W} ${H}" style="width:${Math.round(W * 1.25 * size)}px" role="img" aria-label="${chordName(shape)}">${parts.join('')}</svg>`;
  }

  self.Guitar = {
    TUNINGS, CHORDS, GROUPS, STRUMS, PICKS, TYPE_TONES, SYMBOL,
    settings, openStrings, midi, positions, noteAt, chordById, voicing, chordPcs, chordName, pickStrings, template, similarity, recognise,
    fretboard, diagram,
  };
})();
