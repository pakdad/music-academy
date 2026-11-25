// The chord book: every chord type on every root, what it is made of, and the ways to play it on the piano and
// the guitar, with fingers. Works in the browser (self.ChordBook) and in Node (tools/check.mjs checks every
// voicing it makes: the right notes, the right bass, fingers a hand can play).
//
//   const c = ChordBook.chord(Theory.parse('F#4'), 'm7')       { root, type, tones: [{ note, degree, label, pc }], bass, pcs }
//   ChordBook.parse('F#m7/E')                                  { root, type: 'm7', bass } or null (German: { german: true })
//   ChordBook.symbol(c, UI.noteName)                           'F♯m7'
//   ChordBook.piano(c, { hand: 'rh' | 'lh' })                  [{ id, cat, rh: [{ note, midi, tone, finger }], lh: [...] }]
//   ChordBook.guitar(c)                                        [{ id, cat, frets (low E first, -1 = not played), fingers, barres, notes }]
//   ChordBook.identify([60, 64, 67])                           what a played chord is: { root, type, bass }
(function () {
  const T = self.Theory;
  const mod = T.mod;

  // ---------- chord types ----------
  // a degree: [letter steps, semitones] above the root
  const DEG = {
    '1': [0, 0], '2': [1, 2], 'b3': [2, 3], '3': [2, 4], '4': [3, 5], 'b5': [4, 6], '5': [4, 7], '#5': [4, 8],
    '6': [5, 9], 'bb7': [6, 9], 'b7': [6, 10], '7': [6, 11], '9': [8, 14],
  };
  const LABEL = { '1': '1', '2': '2', 'b3': '♭3', '3': '3', '4': '4', 'b5': '♭5', '5': '5', '#5': '♯5', '6': '6', 'bb7': '𝄫7', 'b7': '♭7', '7': '7', '9': '9' };
  const TYPES = [
    { id: 'maj',   sym: '',        group: 'triads',   name: 'Major',                  degrees: ['1', '3', '5'] },
    { id: 'm',     sym: 'm',       group: 'triads',   name: 'Minor',                  degrees: ['1', 'b3', '5'] },
    { id: 'dim',   sym: 'dim',     group: 'triads',   name: 'Diminished',             degrees: ['1', 'b3', 'b5'] },
    { id: 'aug',   sym: 'aug',     group: 'triads',   name: 'Augmented',              degrees: ['1', '3', '#5'] },
    { id: 'sus2',  sym: 'sus2',    group: 'triads',   name: 'Suspended second',       degrees: ['1', '2', '5'] },
    { id: 'sus4',  sym: 'sus4',    group: 'triads',   name: 'Suspended fourth',       degrees: ['1', '4', '5'] },
    { id: '5',     sym: '5',       group: 'triads',   name: 'Power chord',            degrees: ['1', '5'] },
    { id: '6',     sym: '6',       group: 'sevenths', name: 'Major sixth',            degrees: ['1', '3', '5', '6'] },
    { id: 'm6',    sym: 'm6',      group: 'sevenths', name: 'Minor sixth',            degrees: ['1', 'b3', '5', '6'] },
    { id: '7',     sym: '7',       group: 'sevenths', name: 'Dominant seventh',       degrees: ['1', '3', '5', 'b7'] },
    { id: 'maj7',  sym: 'maj7',    group: 'sevenths', name: 'Major seventh',          degrees: ['1', '3', '5', '7'] },
    { id: 'm7',    sym: 'm7',      group: 'sevenths', name: 'Minor seventh',          degrees: ['1', 'b3', '5', 'b7'] },
    { id: 'm7b5',  sym: 'm7♭5',    group: 'sevenths', name: 'Half-diminished',        degrees: ['1', 'b3', 'b5', 'b7'] },
    { id: 'dim7',  sym: 'dim7',    group: 'sevenths', name: 'Diminished seventh',     degrees: ['1', 'b3', 'b5', 'bb7'] },
    { id: 'mmaj7', sym: 'm(maj7)', group: 'sevenths', name: 'Minor-major seventh',    degrees: ['1', 'b3', '5', '7'] },
    { id: '7sus4', sym: '7sus4',   group: 'sevenths', name: 'Seventh with a fourth',  degrees: ['1', '4', '5', 'b7'] },
    { id: 'add9',  sym: 'add9',    group: 'ninths',   name: 'Added ninth',            degrees: ['1', '3', '5', '9'] },
    { id: 'madd9', sym: 'm(add9)', group: 'ninths',   name: 'Minor with added ninth', degrees: ['1', 'b3', '5', '9'] },
    { id: '9',     sym: '9',       group: 'ninths',   name: 'Dominant ninth',         degrees: ['1', '3', '5', 'b7', '9'] },
    { id: 'maj9',  sym: 'maj9',    group: 'ninths',   name: 'Major ninth',            degrees: ['1', '3', '5', '7', '9'] },
    { id: 'm9',    sym: 'm9',      group: 'ninths',   name: 'Minor ninth',            degrees: ['1', 'b3', '5', 'b7', '9'] },
  ];
  const TYPE = Object.fromEntries(TYPES.map(x => [x.id, x]));
  const GROUPS = [['triads', 'Triads'], ['sevenths', 'Sixths and sevenths'], ['ninths', 'Added notes and ninths']];
  const SEVENTH = new Set(['b7', '7', 'bb7']);

  // the usual spelling of a root on a black key: flats, but F♯, and C♯ and G♯ for minor-type chords
  const MINORISH = new Set(['m', 'dim', 'm6', 'm7', 'm7b5', 'dim7', 'mmaj7', 'madd9', 'm9']);
  function rootFor(pc, typeId) {
    const minor = MINORISH.has(typeId);
    const black = { 1: minor ? 'C#' : 'Db', 3: 'Eb', 6: 'F#', 8: minor ? 'G#' : 'Ab', 10: 'Bb' };
    return black[mod(pc, 12)] ? T.parse(black[mod(pc, 12)] + '4') : T.spell(mod(pc, 12) + 60, 0);
  }
  // C♯ ↔ D♭ (for roots on black keys)
  function enharmonic(n) {
    if (Math.abs(n.alter) !== 1) return null;
    const o = T.transpose(n, n.alter > 0 ? 1 : -1, 0);
    return Math.abs(o.alter) === 1 ? o : null;
  }

  function chord(root, typeId, bass = null) {
    const type = TYPE[typeId] || TYPE.maj;
    const r = T.note(root.step, root.alter, 4);
    const tones = type.degrees.map((d, i) => {
      const note = T.transpose(r, DEG[d][0], DEG[d][1]);
      return { i, degree: d, label: LABEL[d], note, pc: T.pc(note) };
    });
    let b = null;
    if (bass) {
      const pc = T.pc(bass);
      if (pc !== tones[0].pc) b = tones.find(x => x.pc === pc) || { i: -1, degree: null, label: '', note: T.note(bass.step, bass.alter, 4), pc };
    }
    return { root: r, type, tones, bass: b, pcs: tones.map(x => x.pc) };
  }
  const symbol = (c, name = n => T.name(n)) => name(c.root) + c.type.sym + (c.bass ? '/' + name(c.bass.note) : '');

  // ---------- reading a chord symbol ----------
  const ALIAS = {};
  const alias = (id, ...names) => { for (const n of names) ALIAS[n] = id; };
  alias('maj', '', 'maj', 'M', 'major', 'dur');
  alias('m', 'm', 'min', 'mi', '-', 'minor', 'moll');
  alias('dim', 'dim', '°', 'o');
  alias('aug', 'aug', '+', '+5', '#5');
  alias('sus2', 'sus2', '2');
  alias('sus4', 'sus4', 'sus', '4');
  alias('5', '5');
  alias('6', '6', 'maj6', 'M6', 'add6');
  alias('m6', 'm6', 'min6', '-6', 'mi6');
  alias('7', '7', 'dom7');
  alias('maj7', 'maj7', 'M7', 'Δ', 'Δ7', 'ma7', 'j7');
  alias('m7', 'm7', 'min7', '-7', 'mi7');
  alias('m7b5', 'm7b5', 'ø', 'ø7', 'min7b5', '-7b5', 'mi7b5');
  alias('dim7', 'dim7', '°7', 'o7');
  alias('mmaj7', 'mmaj7', 'mM7', 'm/maj7', 'mΔ7', 'mΔ', 'minmaj7', '-maj7');
  alias('7sus4', '7sus4', '7sus', 'sus47');
  alias('add9', 'add9', 'add2');
  alias('madd9', 'madd9', 'madd2', 'minadd9', '-add9');
  alias('9', '9', 'dom9');
  alias('maj9', 'maj9', 'M9', 'Δ9', 'ma9', 'j9');
  alias('m9', 'm9', 'min9', '-9', 'mi9');
  function typeOf(text) {
    const x = text.replace(/♭/g, 'b').replace(/♯/g, '#').replace(/[\s()]/g, '');
    if (x in ALIAS) return ALIAS[x];
    const lower = x.toLowerCase();
    return lower.length > 2 && lower in ALIAS ? ALIAS[lower] : null; // Maj7, MIN7, Sus4
  }
  // the ways the start of s can be a note: English (F#, Bb, F♯, B♭) or German (Fis, Es, As, H; B alone is B♭)
  function notesAt(s, german) {
    const m = /^([A-Ha-h])/.exec(s);
    if (!m) return [];
    const L = m[1].toUpperCase(), rest = s.slice(1);
    const step = 'CDEFGAB'.indexOf(L === 'H' ? 'B' : L);
    const out = [];
    const push = (alter, len) => out.push([T.note(step, alter, 4), rest.slice(len)]);
    const low = rest.toLowerCase();
    if (L === 'H') { if (low.startsWith('is')) push(1, 2); push(0, 0); return out; }
    if (german && L === 'B') { if (rest.startsWith('b')) push(-1, 1); push(-1, 0); return out; }
    for (const [acc, alter] of [['##', 2], ['x', 2], ['#', 1], ['♯', 1], ['bb', -2], ['b', -1], ['♭', -1]]) if (rest.startsWith(acc)) push(alter, acc.length);
    for (const [acc, alter] of [['isis', 2], ['is', 1], ['eses', -2], ['es', -1]]) if (low.startsWith(acc)) push(alter, acc.length);
    if ((L === 'E' || L === 'A') && low.startsWith('s')) push(-1, 1); // Es, As
    push(0, 0);
    return out;
  }
  function parse(text, { german = false } = {}) {
    const s = String(text || '').trim().replace(/\s+/g, '');
    if (!s) return null;
    let main = s, bass = null;
    const slash = s.lastIndexOf('/');
    if (slash > 0) {
      const b = notesAt(s.slice(slash + 1), german).find(([, rest]) => rest === '');
      if (b) { bass = b[0]; main = s.slice(0, slash); }
    }
    for (const [root, rest] of notesAt(main, german)) {
      const type = typeOf(rest);
      if (type) return { root, type, bass: bass && T.pc(bass) !== T.pc(root) ? bass : null };
    }
    return null;
  }

  // what a played chord is (pitch classes match a type; the lowest note is the bass)
  function identify(midis) {
    const pcs = [...new Set(midis.map(m => mod(m, 12)))];
    if (pcs.length < 2) return null;
    const low = mod(Math.min(...midis), 12);
    const hits = [];
    for (const ty of TYPES) for (const r of pcs) {
      const set = ty.degrees.map(d => mod(r + DEG[d][1], 12));
      if (set.length === pcs.length && set.every(x => pcs.includes(x))) hits.push({ r, ty });
    }
    if (!hits.length) return null;
    const best = hits.find(x => x.r === low) || hits[0];
    const root = rootFor(best.r, best.ty.id);
    const c = chord(root, best.ty.id);
    return { root, type: best.ty.id, bass: best.r === low ? null : c.tones.find(x => x.pc === low).note };
  }

  // ---------- piano ----------
  const above = (pc, m) => m + mod(pc - m, 12); // pc at m or the first one above
  // a tone at a pitch, keeping its spelling
  function place(note, m) { const n = T.note(note.step, note.alter, 0); n.octave = Math.round((m - T.midi(n)) / 12); return n; }
  // tones from the bottom up, each at the next place above the one before; the first at lo or above
  function stack(tones, lo) {
    const out = [];
    let m = lo;
    for (const tone of tones) { m = above(tone.pc, out.length ? m + 1 : m); out.push({ tone, midi: m, note: place(tone.note, m) }); }
    return out;
  }
  // close position from a bottom tone: the others in order above it, all within the octave
  const closeFrom = (bottom, tones) => [bottom, ...tones.filter(x => x !== bottom).sort((a, b) => mod(a.pc - bottom.pc, 12) - mod(b.pc - bottom.pc, 12))];
  // the closest grouping of some tones (the one with the smallest span)
  function compact(tones) {
    let best = null;
    for (const b of tones) {
      const order = closeFrom(b, tones);
      const span = mod(order[order.length - 1].pc - b.pc, 12);
      if (!best || span < best.span) best = { order, span };
    }
    return best.order;
  }

  // piano fingering for one hand, low to high: 1 is the thumb. Every rising choice of fingers is tried; each pair
  // of fingers has a comfortable distance (in semitones) and going outside it costs.
  const REACH = { 12: [2, 5], 13: [3, 6], 14: [5, 8], 15: [7, 12], 23: [1, 3], 24: [3, 5], 25: [4, 7], 34: [1, 2], 35: [3, 4], 45: [1, 3] };
  function fingers(midis, hand = 'rh') {
    const n = midis.length;
    if (!n) return [];
    if (n === 1) return [hand === 'lh' ? 5 : 1];
    const ms = hand === 'lh' ? [...midis].reverse() : midis; // from the thumb outwards
    const off = (a, b, d) => { const [lo, hi] = REACH[a * 10 + b]; return d < lo ? lo - d : d > hi ? d - hi : 0; };
    let best = null, bestCost = Infinity;
    const rec = acc => {
      if (acc.length === n) {
        let c = 0;
        for (let i = 1; i < n; i++) c += off(acc[i - 1], acc[i], Math.abs(ms[i] - ms[i - 1])) ** 2;
        const span = Math.abs(ms[n - 1] - ms[0]);
        if (n >= 3) c += off(1, acc[n - 1], span) ** 2;
        if (n === 3) c += acc.filter(f => f === 2 || f === 4).length * 0.1; // 1-3-5 when it fits as well
        if (acc[n - 1] !== 5 && span >= 6) c += 0.3;
        if (c < bestCost) { bestCost = c; best = acc; }
        return;
      }
      for (let f = acc[acc.length - 1] + 1; f <= 5 - (n - acc.length - 1); f++) rec([...acc, f]);
    };
    rec([1]);
    return hand === 'lh' ? [...best].reverse() : best;
  }
  const withFingers = (ns, hand) => { const fs = fingers(ns.map(x => x.midi), hand); return ns.map((x, i) => ({ ...x, finger: fs[i] })); };

  // the ways to play a chord on the piano. cat: usual | easy | broad | inv
  function piano(c, { hand = 'rh' } = {}) {
    const out = [];
    const tones = c.tones, n = tones.length, R = tones[0];
    const fifth = tones.find(x => x.degree === '5');
    const sev = tones.find(x => SEVENTH.has(x.degree));
    const oneLo = hand === 'rh' ? 57 : 45; // a one-hand chord's bass: A3–A♭4 (right hand) or A2–A♭3 (left)
    const other = hand === 'rh' ? 'lh' : 'rh';
    const one = (id, cat, order, extra = {}) => out.push({ id, cat, [hand]: withFingers(stack(order, oneLo), hand), [other]: [], hand, ...extra });
    const two = (id, cat, lh, rh, extra = {}) => out.push({ id, cat, lh: withFingers(lh, 'lh'), rh: withFingers(rh, 'rh'), ...extra });

    // another note in the bass (C/D): the left hand plays it, the right hand the chord
    if (c.bass) {
      const lh = stack([c.bass], 40);
      two('slash', 'usual', lh, stack(closeFrom(R, tones), Math.max(lh[0].midi + 5, 57)));
    }
    if (n <= 4) one('root', 'usual', closeFrom(R, tones));
    // the root in the left hand, the rest close together in the right (for 9th chords, the usual way)
    {
      const lh = stack([R], 43);
      two('split', n >= 5 ? 'usual' : 'easy', lh, stack(compact(n >= 4 ? tones.slice(1) : tones), 57));
    }
    if (n >= 4 && fifth) one('no5', 'easy', closeFrom(R, tones.filter(x => x !== fifth)));
    // broad: the root doubled in octaves under the chord; spread: root and fifth (or seventh) below, the rest above
    if (n <= 4) {
      const r = above(R.pc, 33);
      const lh = [{ tone: R, midi: r, note: place(R.note, r) }, { tone: R, midi: r + 12, note: place(R.note, r + 12) }];
      two('octave', 'broad', lh, stack(closeFrom(R, tones), Math.max(57, r + 13)));
    }
    {
      const x = sev || tones.find(t => ['5', 'b5', '#5'].includes(t.degree));
      const lh = stack(x ? [R, x] : [R], 40);
      const rest = tones.filter(t => t !== R && t !== x);
      if (!sev && rest.length < 3) {
        if (tones.some(t => t.degree === '9')) { if (x) rest.push(x); } else rest.push(R);
        if (rest.length < 3 && x && !rest.includes(x)) rest.push(x);
      }
      if (rest.length) two('spread', 'broad', lh, stack(closeFrom(rest[0], rest), Math.max(lh[lh.length - 1].midi + 1, 55)));
    }
    // inversions: each other chord tone in the bass, in one hand
    // (an added ninth in the bass is another chord, not an inversion)
    if (n >= 3 && n <= 4) for (let i = 1; i < n; i++) if (tones[i].degree !== '9') one('inv' + i, 'inv', closeFrom(tones[i], tones), { inversion: i });
    return out;
  }

  // ---------- guitar (standard tuning) ----------
  const STD = [40, 45, 50, 55, 59, 64]; // open strings, low E (index 0) to high e (index 5)
  const stringNo = i => 6 - i;

  // fingers for a shape: frets low E first, -1 not played, 0 open. One finger per note, or one finger flat across
  // several strings (the index finger across the lowest fret; another finger across neighbouring strings at one
  // fret, like the ring finger in x32333). Every grouping and every rising choice of fingers is tried; stretches,
  // squeezes, a little-finger barre and using all four fingers cost. null if no hand can play it.
  function increasing(n) {
    const out = [];
    const rec = acc => { if (acc.length === n) { out.push(acc); return; } for (let f = (acc[acc.length - 1] || 0) + 1; f <= 4 - (n - acc.length - 1); f++) rec([...acc, f]); };
    rec([]);
    return out;
  }
  function fingerGuitar(frets) {
    const notes = [];
    frets.forEach((f, i) => { if (f > 0) notes.push({ i, f }); });
    const fingers = frets.map(() => 0);
    if (!notes.length) return { fingers, barres: [], used: 0 };
    const b = Math.min(...notes.map(x => x.f));
    if (Math.max(...notes.map(x => x.f)) - b > 3) return null;
    const merges = [];
    const atB = notes.filter(x => x.f === b);
    if (atB.length >= 2) {
      let ok = true;
      for (let i = atB[0].i; i <= atB[atB.length - 1].i; i++) if (!(frets[i] >= b)) ok = false; // nothing open or muted under it
      if (ok) merges.push({ index: true, notes: atB });
    }
    const indexBarre = merges[0];
    for (const f of new Set(notes.map(x => x.f))) {
      let run = [];
      // (a run the index barre already covers is the same grip)
      const flush = () => { if (run.length >= 2 && !(indexBarre && run.every(x => indexBarre.notes.includes(x)))) merges.push({ index: false, notes: run }); run = []; };
      for (let i = 0; i < 6; i++) { if (frets[i] === f) run.push(notes.find(x => x.i === i)); else flush(); }
      flush();
    }
    const options = [[]];
    merges.forEach((m, a) => {
      options.push([m]);
      merges.forEach((m2, z) => { if (z > a && m2.notes[0].f !== m.notes[0].f) options.push([m, m2]); });
    });
    let best = null;
    for (const opt of options) {
      const grouped = new Set(opt.flatMap(m => m.notes));
      const units = [...opt.map(m => ({ f: m.notes[0].f, i: m.notes[0].i, notes: m.notes, index: m.index })),
        ...notes.filter(x => !grouped.has(x)).map(x => ({ f: x.f, i: x.i, notes: [x], index: false }))].sort((p, q) => p.f - q.f || p.i - q.i);
      if (units.length > 4) continue;
      for (const fs of increasing(units.length)) {
        if (units.some((u, k) => u.index && fs[k] !== 1)) continue;
        // a short index barre is cheap, another finger flat across strings less so; all four fingers a little
        let cost = opt.reduce((a, m) => a + (m.index ? 0.2 : 0.5), 0) + (units.length === 4 ? 0.4 : 0), ok = true;
        for (let k = 1; k < units.length; k++) {
          const df = units[k].f - units[k - 1].f, dn = fs[k] - fs[k - 1];
          if (df - dn > 1) { ok = false; break; }
          cost += 1.5 * Math.max(0, df - dn) + 0.5 * Math.max(0, dn - df - 1);
        }
        if (!ok) continue;
        cost += units.filter((u, k) => u.notes.length > 1 && !u.index && fs[k] === 4).length * 2;
        if (!best || cost < best.cost - 1e-9) best = { cost, units, fs };
      }
    }
    if (!best) return null;
    const barres = [];
    best.units.forEach((u, k) => {
      for (const x of u.notes) fingers[x.i] = best.fs[k];
      if (u.notes.length > 1) barres.push({ fret: u.f, from: stringNo(u.notes[0].i), to: stringNo(u.notes[u.notes.length - 1].i), finger: best.fs[k] });
    });
    return { fingers, barres, used: best.units.length };
  }
  function shapeStats(frets) {
    const fretted = frets.filter(f => f > 0);
    return { pos: fretted.length ? Math.min(...fretted) : 0, top: fretted.length ? Math.max(...fretted) : 0, strings: frets.filter(f => f >= 0).length, opens: frets.filter(f => f === 0).length };
  }
  function shapeOf(frets, extra = {}) {
    const fg = fingerGuitar(frets);
    return fg ? { frets, ...fg, ...shapeStats(frets), ...extra } : null;
  }
  const fretsOf = s => s.split(' ').map(x => x === 'x' ? null : +x);

  // open chords beyond the common ones in guitar.js (fingers are worked out): [type, root, frets low E first]
  const OPEN = [
    ['m7', 'B', '-1 2 0 2 0 2'], ['maj7', 'G', '3 2 0 0 0 2'], ['maj7', 'D', '-1 -1 0 2 2 2'], ['maj7', 'E', '0 2 1 1 0 0'],
    ['6', 'C', '-1 3 2 2 1 0'], ['6', 'A', '-1 0 2 2 2 2'], ['6', 'D', '-1 -1 0 2 0 2'], ['6', 'E', '0 2 2 1 2 0'], ['6', 'G', '3 2 0 0 0 0'],
    ['m6', 'A', '-1 0 2 2 1 2'], ['m6', 'D', '-1 -1 0 2 0 1'], ['m6', 'E', '0 2 2 0 2 0'],
    ['add9', 'C', '-1 3 2 0 3 3'], ['add9', 'E', '0 2 4 1 0 0'], ['add9', 'A', '-1 0 2 4 2 0'], ['add9', 'G', '3 0 0 2 0 3'],
    ['madd9', 'E', '0 2 4 0 0 0'], ['madd9', 'A', '-1 0 2 4 1 0'],
    ['9', 'E', '0 2 0 1 0 2'], ['m9', 'E', '0 2 0 0 0 2'], ['maj9', 'C', '-1 3 2 4 3 0'],
    ['aug', 'C', '-1 3 2 1 1 0'],
    ['sus2', 'C', '-1 3 0 0 3 3'], ['sus4', 'C', '-1 3 3 0 1 1'], ['sus4', 'G', '3 3 0 0 1 3'],
    ['7sus4', 'A', '-1 0 2 0 3 0'], ['7sus4', 'D', '-1 -1 0 2 1 3'],
    ['mmaj7', 'A', '-1 0 2 1 1 0'],
  ];
  const GTYPE = { maj: 'maj', min: 'm', dom7: '7', min7: 'm7', maj7: 'maj7', sus2: 'sus2', sus4: 'sus4', pow: '5' };
  function openShapes(c) {
    const out = [];
    const rootIs = r => T.pc(T.parse(r + '4')) === c.pcs[0];
    // the common open chords, with the fingers guitar.js gives them (its barre chords are the movable shapes below)
    if (self.Guitar) for (const s of self.Guitar.CHORDS) if (s.group !== 'barre' && GTYPE[s.type] === c.type.id && rootIs(s.root)) {
      out.push({ frets: s.frets, fingers: s.fingers, barres: s.barre ? [{ ...s.barre, finger: 1 }] : [], used: new Set(s.fingers.filter(Boolean)).size, ...shapeStats(s.frets) });
    }
    for (const [type, root, frets] of OPEN) if (type === c.type.id && rootIs(root)) { const s = shapeOf(frets.split(' ').map(Number)); if (s) out.push(s); }
    return out.map(s => ({ id: 'open', ...s }));
  }

  // movable shapes: frets relative to the root on the bass string (x = not played)
  const MOVABLE = {
    6: { // the E shape: root on the low E string
      maj: '0 2 2 1 0 0', m: '0 2 2 0 0 0', '7': '0 2 0 1 0 0', m7: '0 2 0 0 0 0', maj7: '0 2 1 1 0 0', mmaj7: '0 2 1 0 0 0',
      '6': '0 x -1 1 0 x', m6: '0 x -1 0 0 x', m7b5: '0 x 0 0 -1 x', dim7: '0 x -1 0 -1 x', dim: '0 1 2 0 x x', aug: '0 3 2 1 1 0',
      sus4: '0 2 2 2 0 0', '7sus4': '0 2 0 2 0 0', '9': '0 2 0 1 0 2', m9: '0 2 0 0 0 2', '5': '0 2 2 x x x',
    },
    5: { // the A shape: root on the A string
      maj: 'x 0 2 2 2 0', m: 'x 0 2 2 1 0', '7': 'x 0 2 0 2 0', m7: 'x 0 2 0 1 0', maj7: 'x 0 2 1 2 0', mmaj7: 'x 0 2 1 1 0',
      '6': 'x 0 2 2 2 2', m6: 'x 0 x -1 1 0', m7b5: 'x 0 1 0 1 x', dim7: 'x 0 1 -1 1 x', dim: 'x 0 1 2 1 x', aug: 'x 0 3 2 2 1',
      sus2: 'x 0 2 2 0 0', sus4: 'x 0 2 2 3 0', '7sus4': 'x 0 2 0 3 0', '9': 'x 0 -1 0 0 0', maj9: 'x 0 -1 1 0 x', m9: 'x 0 -2 0 0 0', '5': 'x 0 2 2 x x',
    },
    4: { // the D shape: root on the D string, four strings
      maj: 'x x 0 2 3 2', m: 'x x 0 2 3 1', '7': 'x x 0 2 1 2', m7: 'x x 0 2 1 1', maj7: 'x x 0 2 2 2', mmaj7: 'x x 0 2 2 1',
      '6': 'x x 0 2 0 2', m6: 'x x 0 2 0 1', m7b5: 'x x 0 1 1 1', dim7: 'x x 0 1 0 1', dim: 'x x 0 1 3 1', aug: 'x x 0 3 3 2',
      sus2: 'x x 0 2 3 0', sus4: 'x x 0 2 3 3', '7sus4': 'x x 0 2 1 3', '5': 'x x 0 2 3 x',
    },
  };
  function movable(c) {
    const out = [];
    for (const s of [6, 5, 4]) {
      const tpl = MOVABLE[s][c.type.id];
      if (!tpl) continue;
      const rel = fretsOf(tpl);
      let r = mod(c.pcs[0] - STD[6 - s], 12);
      if (r + Math.min(...rel.filter(x => x !== null)) < 0) r += 12;
      const sh = shapeOf(rel.map(x => x === null ? -1 : r + x), { id: { 6: 'e-shape', 5: 'a-shape', 4: 'd-shape' }[s], rootString: s, fret: r });
      if (sh) out.push(sh);
    }
    return out;
  }

  // every playable shape for a chord within reach: o.strings (indices, low E = 0), o.bass (pitch class on the
  // lowest string played), o.need (pitch classes that must sound), o.exact (each string a different tone),
  // o.all (every string in the set sounds), o.extra (allowed pitch classes besides the chord's). Strings below the
  // lowest one played are muted; none in between.
  function search(c, { strings = [0, 1, 2, 3, 4, 5], bass = null, need = c.pcs, exact = false, all = false, extra = [], minStrings = 4, maxFret = 9, maxFingers = 4 } = {}) {
    const allowed = new Set([...c.pcs, ...extra]);
    const found = new Map();
    const frets = Array(6).fill(-1);
    for (let p = 0; p <= maxFret; p++) {
      const lo = Math.max(1, p), hi = p + 3;
      const opts = strings.map(i => {
        const o = [];
        if (p <= 2 && allowed.has(mod(STD[i], 12))) o.push(0);
        for (let f = lo; f <= hi; f++) if (allowed.has(mod(STD[i] + f, 12))) o.push(f);
        return o;
      });
      const check = () => {
        const snd = strings.filter(i => frets[i] >= 0);
        if (snd.length < minStrings) return;
        const pcs = snd.map(i => mod(STD[i] + frets[i], 12));
        if (need.some(x => !pcs.includes(x))) return;
        if (exact && new Set(pcs).size !== pcs.length) return;
        const fr = snd.map(i => frets[i]).filter(f => f > 0);
        if (snd.some(i => frets[i] === 0) && fr.length && Math.max(...fr) > 4) return; // open strings only in first position
        const key = frets.join(' ');
        if (found.has(key)) return;
        const fg = fingerGuitar(frets);
        if (!fg || fg.used > maxFingers) return;
        found.set(key, { frets: [...frets], ...fg, ...shapeStats(frets), bassPc: pcs[0] });
      };
      const rec = (k, started) => {
        if (k === strings.length) { check(); return; }
        const i = strings[k];
        if (!started && !all) { frets[i] = -1; rec(k + 1, false); }
        for (const f of opts[k]) {
          if (!started && bass !== null && mod(STD[i] + f, 12) !== bass) continue;
          frets[i] = f;
          rec(k + 1, true);
        }
        frets[i] = -1;
      };
      rec(0, false);
    }
    return [...found.values()];
  }
  const bigBarre = s => s.barres.some(b => b.finger === 1 && b.from - b.to >= 3);
  const fullScore = s => s.used + (bigBarre(s) ? 1.5 : 0) + s.pos * 0.5 - s.strings * 0.9 - s.opens * 0.3;
  const best = (list, score) => list.length ? list.reduce((a, b) => (score(b) < score(a) ? b : a)) : null;
  // the tones a guitar voicing must have: a perfect fifth may go in chords of four tones or more
  const needed = c => c.tones.filter(t => !(t.degree === '5' && c.tones.length >= 4)).map(t => t.pc);

  // what each string sounds, spelled as the chord's tones
  function decorate(c, sh) {
    const notes = sh.frets.map((f, i) => {
      if (f < 0) return null;
      const m = STD[i] + f, pc = mod(m, 12);
      const tone = c.tones.find(x => x.pc === pc) || (c.bass && c.bass.pc === pc ? c.bass : null);
      return { string: stringNo(i), fret: f, midi: m, tone, note: place(tone ? tone.note : T.spell(m), m) };
    });
    const low = notes.find(Boolean);
    return { ...sh, notes, bass: low.tone, bassNote: low.note };
  }

  // the ways to play a chord on the guitar. cat: usual | easy | movable | inv (another bass) | small (on three or four strings)
  function guitar(c) {
    const out = [], seen = new Set();
    const n = c.tones.length, root = c.pcs[0], need = needed(c);
    const add = (cat, sh, extra = {}) => {
      if (!sh) return;
      const key = sh.frets.join(' ');
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ cat, ...decorate(c, sh), ...extra });
    };
    if (c.bass) add('usual', best(search(c, { bass: c.bass.pc, need, extra: [c.bass.pc] }), fullScore), { id: 'slash' });
    const opens = openShapes(c), mov = movable(c);
    for (const s of opens) add('usual', s);
    if (!opens.length) {
      const first = [...mov].sort((a, b) => (a.id === 'd-shape') - (b.id === 'd-shape') || a.pos - b.pos)[0];
      if (first) add('usual', first);
    }
    if (!out.some(s => s.cat === 'usual' && s.id !== 'slash')) {
      // no shape on file: the best full chords found, low on the neck and higher up
      const all = search(c, { bass: root, need }).sort((a, b) => fullScore(a) - fullScore(b));
      add('usual', all[0] && { id: 'full', ...all[0] });
    }
    // easy: when every usual shape needs a big barre, a small shape on the top strings
    const usual = out.filter(s => s.cat === 'usual' && s.id !== 'slash');
    if (usual.length && usual.every(bigBarre)) {
      const easy = best(search(c, { strings: [2, 3, 4, 5], need, minStrings: 3, maxFret: 7, maxFingers: 3 }),
        s => s.used * 1.5 + (bigBarre(s) ? 1 : 0) + s.pos * 0.3 - s.strings * 0.6 + (s.bassPc !== root ? 3 : 0));
      add('easy', easy && { id: 'easy', ...easy });
    }
    for (const s of mov) add('movable', s);
    if (!out.some(s => s.cat === 'movable')) {
      // no movable shape on file: the best full chord in another place on the neck
      const u = usual[0];
      const alt = search(c, { bass: root, need }).filter(s => !u || Math.abs(s.pos - u.pos) >= 3).sort((a, b) => fullScore(a) - fullScore(b))[0];
      add('movable', alt && { id: 'full', ...alt });
    }
    // another chord tone in the bass, as a full chord (C/E, C/G)
    if (n >= 3 && n <= 4) for (const t of c.tones.slice(1)) {
      if ((c.bass && c.bass.pc === t.pc) || t.degree === '9') continue;
      add('inv', best(search(c, { bass: t.pc, need }), fullScore), { id: 'slash', over: t });
    }
    // every inversion on three neighbouring strings (triads) or on the top four (four-note chords)
    const sets = n === 3 ? [['top3', [3, 4, 5]], ['mid3', [2, 3, 4]]] : n === 4 ? [['top4', [2, 3, 4, 5]]] : [];
    for (const [id, strings] of sets) for (const t of c.tones) {
      const list = search(c, { strings, bass: t.pc, need: c.pcs, exact: true, all: true, minStrings: strings.length, maxFret: 12 });
      add('small', best(list, s => s.pos + s.used * 0.3), { id, over: t });
    }
    return out;
  }

  self.ChordBook = {
    DEG, LABEL, TYPES, TYPE, GROUPS, STD, MOVABLE, OPEN,
    rootFor, enharmonic, chord, symbol, parse, identify,
    fingers, piano, fingerGuitar, search, guitar, needed, place,
  };
})();
