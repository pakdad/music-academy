// Music theory for every drill: spelled notes, keys, scales, chords and Roman numerals.
// Works in the browser (self.Theory) and in Node (tools/check.mjs loads it the same way).
//
// A note is { step, alter, octave }: step 0..6 is C D E F G A B, alter is -2..2 (bb b natural # x),
// octave is scientific pitch notation (C4 = middle C = MIDI 60). Notes are always spelled, so
// F# major has an E#, never an F, and the staff can draw exactly what a score would show.
(function () {
  const LETTERS = 'CDEFGAB';
  const NATURAL = [0, 2, 4, 5, 7, 9, 11];
  const FIFTHS = 'FCGDAEB'; // the line of fifths: sharps are added in this order, flats in reverse
  const mod = (a, n) => ((a % n) + n) % n;

  // ---------- notes ----------
  const note = (step, alter = 0, octave = 4) => ({ step, alter, octave });
  const dia = n => n.octave * 7 + n.step; // diatonic index: one per staff position
  const fromDia = (d, alter = 0) => note(mod(d, 7), alter, Math.floor(d / 7));
  const midi = n => 12 * (n.octave + 1) + NATURAL[n.step] + n.alter;
  const pc = n => mod(midi(n), 12);
  const same = (a, b) => a.step === b.step && a.alter === b.alter && a.octave === b.octave;

  // 'C4', 'F#5', 'Bb3', 'Ebb2', 'Gx4' (octave optional)
  function parse(s) {
    const m = /^([A-Ga-g])(bb|b|##|#|x)?(-?\d+)?$/.exec(String(s).trim());
    if (!m) throw new Error('Not a note: ' + s);
    const alter = { bb: -2, b: -1, '##': 2, x: 2, '#': 1 }[m[2]] || 0;
    return note(LETTERS.indexOf(m[1].toUpperCase()), alter, m[3] === undefined ? 4 : +m[3]);
  }

  // move by a number of letter steps and semitones, keeping the spelling right:
  // transpose(E4, 2, 4) is G#4, a major third up; transpose(E4, 2, 3) is G4
  function transpose(n, steps, semis) {
    const t = fromDia(dia(n) + steps);
    t.alter = midi(n) + semis - midi(t);
    return t;
  }

  // the usual spelling of a MIDI number in a key (for showing what was played): the key's own note,
  // else a natural, else a sharp in sharp keys and a flat in flat keys (in C: C#, Eb, F#, Ab, Bb)
  function spell(m, fifths = 0) {
    const want = mod(m, 12);
    const dir = fifths > 0 ? 1 : fifths < 0 ? -1 : [3, 8, 10].includes(want) ? -1 : 1;
    let best = null;
    for (let step = 0; step < 7; step++) {
      const ka = keyAlter(fifths, step);
      for (const alter of [-1, 0, 1]) {
        if (mod(NATURAL[step] + alter, 12) !== want) continue;
        const cost = alter === ka ? 0 : alter === 0 ? 1 : Math.sign(alter) === dir ? 2 : 3;
        if (!best || cost < best.cost) best = { step, alter, cost };
      }
    }
    const n = note(best.step, best.alter, 0);
    n.octave = Math.round((m - midi(n)) / 12);
    return n;
  }

  const ACC = { '-2': '𝄫', '-1': '♭', 0: '', 1: '♯', 2: '𝄪' };
  const ACC_ASCII = { '-2': 'bb', '-1': 'b', 0: '', 1: '#', 2: 'x' };

  // English: C, F♯, B♭. German: C, Fis, B (= B♭), H (= B), Es, As, Heses.
  function name(n, opts = {}) {
    const oct = opts.octave ? String(n.octave) : '';
    if (opts.lang === 'de') return germanName(n) + oct;
    return LETTERS[n.step] + (opts.ascii ? ACC_ASCII[n.alter] : ACC[n.alter]) + oct;
  }
  function germanName(n) {
    const L = LETTERS[n.step];
    if (L === 'B') return ['Heses', 'B', 'H', 'His', 'Hisis'][n.alter + 2];
    const base = L.toLowerCase();
    if (n.alter > 0) return L + 'is'.repeat(n.alter);
    if (n.alter < 0) {
      // Es and As drop the e of "-es"; Eses and Asas follow the same rule
      const vowel = base === 'e' || base === 'a';
      return L + (vowel ? 's' : 'es') + (n.alter === -2 ? (vowel ? L.toLowerCase() + 's' : 'es') : '');
    }
    return L;
  }

  // ---------- keys ----------
  // A key is { fifths: -7..7, minor: bool }. fifths > 0 counts sharps, < 0 flats.
  function keyTonic(fifths, minor = false, octave = 4) {
    const p = fifths + (minor ? 4 : 1);
    return note(LETTERS.indexOf(FIFTHS[mod(p, 7)]), Math.floor(p / 7), octave);
  }
  // the alteration the key signature gives a letter
  function keyAlter(fifths, step) {
    const i = FIFTHS.indexOf(LETTERS[step]);
    if (fifths > 0) return i < fifths ? 1 : 0;
    if (fifths < 0) return i >= 7 + fifths ? -1 : 0;
    return 0;
  }
  // the accidentals of a key signature in the order they're written
  function keySignature(fifths) {
    const order = fifths >= 0 ? FIFTHS : [...FIFTHS].reverse().join('');
    return [...order.slice(0, Math.abs(fifths))].map(L => ({ step: LETTERS.indexOf(L), alter: Math.sign(fifths) }));
  }
  function keyName(key, opts = {}) {
    const t = keyTonic(key.fifths, key.minor);
    if (opts.lang === 'de') {
      const n = germanName(t);
      return key.minor ? n.toLowerCase() + '-Moll' : n + '-Dur';
    }
    return name(t) + (key.minor ? ' minor' : ' major');
  }
  // every key with at most `max` sharps or flats
  function keys(max = 7, { major = true, minor = true } = {}) {
    const out = [];
    for (let f = -max; f <= max; f++) {
      if (major) out.push({ fifths: f, minor: false });
      if (minor) out.push({ fifths: f, minor: true });
    }
    return out;
  }

  // ---------- scales ----------
  const SCALES = {
    major:         { name: 'major',          de: 'Dur',              steps: [0, 2, 4, 5, 7, 9, 11] },
    naturalMinor:  { name: 'natural minor',  de: 'Moll',   steps: [0, 2, 3, 5, 7, 8, 10] },
    harmonicMinor: { name: 'harmonic minor', de: 'Moll harmonisch',  steps: [0, 2, 3, 5, 7, 8, 11] },
    melodicMinor:  { name: 'melodic minor',  de: 'Moll melodisch',   steps: [0, 2, 3, 5, 7, 9, 11] },
    dorian:        { name: 'Dorian',         de: 'dorisch',          steps: [0, 2, 3, 5, 7, 9, 10] },
    phrygian:      { name: 'Phrygian',       de: 'phrygisch',        steps: [0, 1, 3, 5, 7, 8, 10] },
    lydian:        { name: 'Lydian',         de: 'lydisch',          steps: [0, 2, 4, 6, 7, 9, 11] },
    mixolydian:    { name: 'Mixolydian',     de: 'mixolydisch',      steps: [0, 2, 4, 5, 7, 9, 10] },
    locrian:       { name: 'Locrian',        de: 'lokrisch',         steps: [0, 1, 3, 5, 6, 8, 10] },
  };
  // one octave up from the tonic, both ends included (8 notes)
  function scale(tonic, type = 'major') {
    const s = SCALES[type].steps;
    return [...s, 12].map((semis, k) => transpose(tonic, k, semis));
  }
  // the key signature a scale is usually written with (its parent major or minor key)
  function scaleFifths(tonic, type) {
    const parent = { major: 0, naturalMinor: 5, harmonicMinor: 5, melodicMinor: 5, dorian: 1, phrygian: 2, lydian: 3, mixolydian: 4, locrian: 6 }[type];
    // the major key whose degree `parent` is this tonic: walk back down the major scale
    const back = [0, 2, 4, 5, 7, 9, 11][parent];
    const major = transpose(tonic, -parent, -back);
    for (let f = -7; f <= 7; f++) {
      const t = keyTonic(f, false);
      if (t.step === major.step && t.alter === major.alter) return f;
    }
    return null; // a theoretical key (more than 7 accidentals)
  }

  // ---------- chords ----------
  // each tone: [letter steps above the root, semitones above the root]
  const CHORDS = {
    maj:  { name: 'major',             sym: '',     tones: [[0, 0], [2, 4], [4, 7]] },
    min:  { name: 'minor',             sym: 'm',    tones: [[0, 0], [2, 3], [4, 7]] },
    dim:  { name: 'diminished',        sym: '°',    tones: [[0, 0], [2, 3], [4, 6]] },
    aug:  { name: 'augmented',         sym: '+',    tones: [[0, 0], [2, 4], [4, 8]] },
    dom7: { name: 'dominant 7th',      sym: '7',    tones: [[0, 0], [2, 4], [4, 7], [6, 10]] },
    maj7: { name: 'major 7th',         sym: 'maj7', tones: [[0, 0], [2, 4], [4, 7], [6, 11]] },
    min7: { name: 'minor 7th',         sym: 'm7',   tones: [[0, 0], [2, 3], [4, 7], [6, 10]] },
    hdim7:{ name: 'half-diminished 7th', sym: 'ø7', tones: [[0, 0], [2, 3], [4, 6], [6, 10]] },
    dim7: { name: 'diminished 7th',    sym: '°7',   tones: [[0, 0], [2, 3], [4, 6], [6, 9]] },
  };
  const TRIADS = ['maj', 'min', 'dim', 'aug'];
  const SEVENTHS = ['dom7', 'maj7', 'min7', 'hdim7', 'dim7'];

  // a chord in close position from the root up; inversion n moves the lowest n tones up an octave
  function chord(root, type, inversion = 0) {
    const ns = CHORDS[type].tones.map(([s, semis]) => transpose(root, s, semis));
    for (let i = 0; i < inversion; i++) ns.push(transpose(ns.shift(), 7, 12));
    return ns;
  }
  function chordName(root, type, opts = {}) {
    let s = name(root, opts) + CHORDS[type].sym;
    if (opts.bass && !(opts.bass.step === root.step && opts.bass.alter === root.alter)) s += '/' + name(opts.bass, opts);
    return s;
  }
  const pcSet = notes => [...new Set(notes.map(n => mod(typeof n === 'number' ? n : midi(n), 12)))].sort((a, b) => a - b);
  const sameSet = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
  // which chords a set of pitches could be (any octave, any voicing)
  function identify(midis) {
    const set = pcSet(midis);
    const out = [];
    for (const r of set) for (const [type, c] of Object.entries(CHORDS)) {
      if (sameSet(pcSet(c.tones.map(([, s]) => r + s)), set)) out.push({ rootPc: r, type });
    }
    return out;
  }
  function chordQuality(notes) {
    const r = midi(notes[0]);
    const ints = notes.map(n => mod(midi(n) - r, 12));
    for (const [type, c] of Object.entries(CHORDS)) {
      if (c.tones.length === ints.length && c.tones.every(([, s], i) => s === ints[i])) return type;
    }
    return null;
  }

  // ---------- harmony in a key ----------
  const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const ROMAN_SUFFIX = { maj: '', min: '', dim: '°', aug: '+', dom7: '7', maj7: 'maj7', min7: '7', hdim7: 'ø7', dim7: '°7' };
  const LOWER = new Set(['min', 'dim', 'min7', 'hdim7', 'dim7']);

  function roman(degree, type) {
    const n = NUMERALS[degree];
    return (LOWER.has(type) ? n.toLowerCase() : n) + ROMAN_SUFFIX[type];
  }
  // 'V7' -> { degree: 4, type: 'dom7' }, 'vii°' -> { degree: 6, type: 'dim' }, 'bVI' isn't used here
  function parseRoman(s) {
    const m = /^(VII|VI|IV|V|III|II|I|vii|vi|iv|v|iii|ii|i)(°7|ø7|maj7|7|°|\+)?$/.exec(s);
    if (!m) throw new Error('Not a Roman numeral: ' + s);
    const lower = m[1] === m[1].toLowerCase();
    const degree = NUMERALS.indexOf(m[1].toUpperCase());
    const suffix = m[2] || '';
    const type = {
      '': lower ? 'min' : 'maj', '°': 'dim', '+': 'aug', 'ø7': 'hdim7', '°7': 'dim7',
      maj7: 'maj7', 7: lower ? 'min7' : 'dom7',
    }[suffix];
    return { degree, type };
  }
  // the root of a scale degree. Minor keys use the natural minor, except that a diminished
  // chord on the 7th degree (vii°, viiø7, vii°7) is built on the raised leading tone.
  function degreeRoot(key, degree, type, octave = 3) {
    const tonic = keyTonic(key.fifths, key.minor, octave);
    const s = scale(tonic, key.minor ? 'naturalMinor' : 'major');
    const root = { ...s[degree] };
    if (key.minor && degree === 6 && ['dim', 'hdim7', 'dim7'].includes(type)) root.alter += 1;
    return root;
  }
  function romanChord(key, numeral, octave = 3) {
    const { degree, type } = parseRoman(numeral);
    const root = degreeRoot(key, degree, type, octave);
    return { numeral, degree, type, root, notes: chord(root, type) };
  }
  // the chords that belong to a key, as Roman numerals (minor: with V and vii° from harmonic minor)
  function diatonic(key, sevenths = false) {
    if (!key.minor) return sevenths ? ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'] : ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    return sevenths ? ['i7', 'iiø7', 'IIImaj7', 'iv7', 'V7', 'VImaj7', 'VII7', 'vii°7'] : ['i', 'ii°', 'III', 'iv', 'v', 'V', 'VI', 'VII', 'vii°'];
  }

  // well-known progressions, so the ear can learn their sound
  const PROGRESSIONS = [
    { id: 'I-IV-V-I',    minor: false, chords: ['I', 'IV', 'V', 'I'],    name: 'The basic cadence' },
    { id: 'I-V-vi-IV',   minor: false, chords: ['I', 'V', 'vi', 'IV'],   name: 'The pop progression' },
    { id: 'I-vi-IV-V',   minor: false, chords: ['I', 'vi', 'IV', 'V'],   name: 'The fifties progression' },
    { id: 'ii-V-I-I',    minor: false, chords: ['ii', 'V', 'I', 'I'],    name: 'ii–V–I, the jazz cadence' },
    { id: 'vi-IV-I-V',   minor: false, chords: ['vi', 'IV', 'I', 'V'],   name: 'The pop progression from vi' },
    { id: 'I-IV-vi-V',   minor: false, chords: ['I', 'IV', 'vi', 'V'],   name: 'I–IV–vi–V' },
    { id: 'I-iii-IV-V',  minor: false, chords: ['I', 'iii', 'IV', 'V'],  name: 'Rising bass' },
    { id: 'IV-V-iii-vi', minor: false, chords: ['IV', 'V', 'iii', 'vi'], name: 'The royal road' },
    { id: 'I-ii-V-I',    minor: false, chords: ['I', 'ii', 'V', 'I'],    name: 'I–ii–V–I' },
    { id: 'i-iv-V-i',    minor: true,  chords: ['i', 'iv', 'V', 'i'],    name: 'The minor cadence' },
    { id: 'i-VI-III-VII',minor: true,  chords: ['i', 'VI', 'III', 'VII'],name: 'The epic minor loop' },
    { id: 'i-VII-VI-V',  minor: true,  chords: ['i', 'VII', 'VI', 'V'],  name: 'The Andalusian cadence' },
    { id: 'ii°-V-i-i',   minor: true,  chords: ['ii°', 'V', 'i', 'i'],   name: 'Minor ii–V–i' },
    { id: 'i-iv-VII-III',minor: true,  chords: ['i', 'iv', 'VII', 'III'],name: 'Circle of fifths in minor' },
    { id: 'i-VI-iv-V',   minor: true,  chords: ['i', 'VI', 'iv', 'V'],   name: 'i–VI–iv–V' },
  ];

  // a piano voicing: the root in the left hand, the chord in the right hand close to the previous one
  function voice(chords, { lo = 64, hi = 81 } = {}) {
    let prev = null;
    return chords.map(c => {
      const bass = { ...c.root, octave: 2 };
      if (midi(bass) < 40) bass.octave = 3; // keep it off the bottom ledger lines (E2 is the lowest)
      if (midi(bass) > 55) bass.octave = 2;
      const options = [];
      for (let oct = 3; oct <= 5; oct++) for (let inv = 0; inv < c.notes.length; inv++) {
        const root = { ...c.root, octave: oct };
        const ns = chord(root, c.type, inv);
        const ms = ns.map(midi);
        if (ms[0] >= lo && ms[ms.length - 1] <= hi) options.push({ ns, ms });
      }
      const centre = (lo + hi) / 2;
      const cost = o => prev
        ? o.ms.reduce((a, m, i) => a + Math.abs(m - (prev[i] ?? prev[prev.length - 1])), 0)
        : Math.abs(o.ms.reduce((a, b) => a + b) / o.ms.length - centre);
      options.sort((a, b) => cost(a) - cost(b));
      const pickd = options[0];
      prev = pickd.ms;
      return { ...c, bass, upper: pickd.ns };
    });
  }

  self.Theory = {
    LETTERS, NATURAL, mod, note, dia, fromDia, midi, pc, same, parse, transpose, spell, name, germanName,
    keyTonic, keyAlter, keySignature, keyName, keys,
    SCALES, scale, scaleFifths,
    CHORDS, TRIADS, SEVENTHS, chord, chordName, pcSet, sameSet, identify, chordQuality,
    NUMERALS, roman, parseRoman, degreeRoot, romanChord, diatonic, PROGRESSIONS, voice,
  };
})();
