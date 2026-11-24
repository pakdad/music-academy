#!/usr/bin/env node
// Checks before every build (the Dockerfile runs it, so a wrong answer key never ships):
//   - the music theory: keys, signatures, scales, chords, Roman numerals, note names
//   - every key signature, chord, scale and progression the drills can ask renders on the staff
//   - every page's inline script parses
//   node tools/check.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const ctx = { self: {} };
vm.createContext(ctx);
for (const f of ['theory', 'glyphs', 'staff', 'score', 'pieces', 'drills']) vm.runInContext(fs.readFileSync(path.join(SITE, 'shared', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
const T = ctx.self.Theory, Staff = ctx.self.Staff;

let failed = 0, passed = 0;
function eq(got, want, what) {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g === w) passed++;
  else { failed++; console.error(`✗ ${what}\n    got  ${g}\n    want ${w}`); }
}
const names = ns => ns.map(n => T.name(n, { ascii: true })).join(' ');
const P = s => T.parse(s);

// ---------- notes ----------
eq(T.midi(P('C4')), 60, 'middle C is MIDI 60');
eq(T.midi(P('B#3')), 60, 'B#3 = C4');
eq(T.midi(P('Cb4')), 59, 'Cb4 = B3');
eq(T.midi(P('A4')), 69, 'A4 = 69');
eq(names([T.transpose(P('E4'), 2, 4), T.transpose(P('E4'), 2, 3), T.transpose(P('B3'), 1, 1)]), 'G# G C', 'transpose keeps spelling');
eq(T.name(T.spell(61, 2), { ascii: true }), 'C#', 'spell 61 in D major');
eq(T.name(T.spell(61, -3), { ascii: true }), 'Db', 'spell 61 in Eb major');
eq(T.spell(60, 0).octave, 4, 'spell keeps the octave');
eq(['Bb', 'B', 'Eb', 'Ab', 'F#', 'Ebb', 'Cb', 'Abb', 'Bbb', 'C#', 'Db'].map(s => T.germanName(P(s))), ['B', 'H', 'Es', 'As', 'Fis', 'Eses', 'Ces', 'Asas', 'Heses', 'Cis', 'Des'], 'German note names');

// ---------- keys ----------
const majors = [], minors = [];
for (let f = -7; f <= 7; f++) { majors.push(T.name(T.keyTonic(f, false), { ascii: true })); minors.push(T.name(T.keyTonic(f, true), { ascii: true })); }
eq(majors.join(' '), 'Cb Gb Db Ab Eb Bb F C G D A E B F# C#', 'major keys around the circle');
eq(minors.join(' '), 'Ab Eb Bb F C G D A E B F# C# G# D# A#', 'minor keys around the circle');
eq(names(T.keySignature(3).map(s => ({ ...s, octave: 4 }))), 'F# C# G#', 'A major signature');
eq(names(T.keySignature(-4).map(s => ({ ...s, octave: 4 }))), 'Bb Eb Ab Db', 'Ab major signature');
eq(names(T.keySignature(7).map(s => ({ ...s, octave: 4 }))), 'F# C# G# D# A# E# B#', 'C# major signature');
eq(T.keyAlter(-1, 6), -1, 'F major flattens B');
eq(T.keyAlter(2, 3), 1, 'D major sharpens F');
eq(T.keyAlter(2, 4), 0, 'D major leaves G');
eq(T.keyName({ fifths: -3, minor: false }, { lang: 'de' }), 'Es-Dur', 'German key name Es-Dur');
eq(T.keyName({ fifths: -3, minor: true }, { lang: 'de' }), 'c-Moll', 'German key name c-Moll');
eq(T.keyName({ fifths: 6, minor: true }), 'D♯ minor', 'English key name');

// ---------- scales ----------
eq(names(T.scale(P('F#4'))), 'F# G# A# B C# D# E# F#', 'F# major');
eq(names(T.scale(P('Gb4'))), 'Gb Ab Bb Cb Db Eb F Gb', 'Gb major');
eq(names(T.scale(P('A4'), 'harmonicMinor')), 'A B C D E F G# A', 'A harmonic minor');
eq(names(T.scale(P('C4'), 'melodicMinor')), 'C D Eb F G A B C', 'C melodic minor');
eq(names(T.scale(P('D4'), 'dorian')), 'D E F G A B C D', 'D Dorian');
eq(names(T.scale(P('G#4'), 'harmonicMinor')), 'G# A# B C# D# E Fx G#', 'G# harmonic minor has F double sharp');
eq(names(T.scale(P('F4'), 'lydian')), 'F G A B C D E F', 'F Lydian');
eq([T.scaleFifths(P('D4'), 'dorian'), T.scaleFifths(P('E4'), 'phrygian'), T.scaleFifths(P('F#4'), 'harmonicMinor'), T.scaleFifths(P('Bb4'), 'mixolydian'), T.scaleFifths(P('B4'), 'locrian'), T.scaleFifths(P('G#4'), 'major')],
  [0, 0, 3, -3, 0, null], 'scale signatures');
eq(T.scale(P('C4')).map(n => T.midi(n)), [60, 62, 64, 65, 67, 69, 71, 72], 'C major pitches');

// ---------- chords ----------
eq(names(T.chord(P('B3'), 'dim')), 'B D F', 'B diminished');
eq(names(T.chord(P('F#3'), 'dom7')), 'F# A# C# E', 'F#7');
eq(names(T.chord(P('Eb4'), 'aug')), 'Eb G B', 'Eb augmented');
eq(names(T.chord(P('C4'), 'maj', 1)), 'E G C', 'C first inversion');
eq(T.midi(T.chord(P('C4'), 'maj', 2)[2]), 76, 'C second inversion: E5 on top');
eq(names(T.chord(P('Db4'), 'hdim7')), 'Db Fb Abb Cb', 'Db half-diminished');
eq(names(T.chord(P('C#4'), 'dim7')), 'C# E G Bb', 'C# diminished 7th');
eq(T.chordName(P('F#4'), 'min7', { bass: P('A4') }), 'F♯m7/A', 'slash chord name');
eq(T.chordQuality(T.chord(P('G4'), 'maj7')), 'maj7', 'chord quality');
eq(T.identify([60, 64, 67]).some(c => c.rootPc === 0 && c.type === 'maj'), true, 'identify C major');
eq(T.identify([64, 67, 72]).some(c => c.rootPc === 0 && c.type === 'maj'), true, 'identify C/E');

// ---------- Roman numerals ----------
const Am = { fifths: 0, minor: true }, Bb = { fifths: -2, minor: false };
eq(names(T.romanChord(Am, 'V').notes), 'E G# B', 'V in A minor has G#');
eq(names(T.romanChord(Am, 'vii°').notes), 'G# B D', 'vii° in A minor');
eq(names(T.romanChord(Am, 'VII').notes), 'G B D', 'VII in A minor');
eq(names(T.romanChord(Am, 'III').notes), 'C E G', 'III in A minor');
eq(names(T.romanChord(Bb, 'ii').notes), 'C Eb G', 'ii in Bb major');
eq(names(T.romanChord(Bb, 'V7').notes), 'F A C Eb', 'V7 in Bb major');
eq(names(T.romanChord({ fifths: 5, minor: true }, 'V').notes), 'D# Fx A#', 'V in G# minor has F double sharp');
eq(names([60, 61, 63, 66, 68, 70].map(m => T.spell(m, 0))), 'C C# Eb F# Ab Bb', 'chromatic spelling in C');
eq(T.parseRoman('viiø7'), { degree: 6, type: 'hdim7' }, 'parse viiø7');
eq(T.parseRoman('IVmaj7'), { degree: 3, type: 'maj7' }, 'parse IVmaj7');
eq(T.parseRoman('ii7'), { degree: 1, type: 'min7' }, 'parse ii7');
for (const minor of [false, true]) for (const n of T.diatonic({ fifths: 0, minor })) {
  const c = T.romanChord({ fifths: 0, minor }, n);
  eq(T.roman(c.degree, c.type), n, `Roman numeral round trip ${n}`);
}
// every diatonic triad in C major is made of white keys only
eq(T.diatonic({ fifths: 0, minor: false }).every(n => T.romanChord({ fifths: 0, minor: false }, n).notes.every(x => x.alter === 0)), true, 'C major triads are diatonic');

// ---------- the drills' content renders ----------
let rendered = 0;
const render = (spec, what) => {
  try { const s = Staff.svg(spec); if (!s.startsWith('<svg') || s.includes('NaN') || s.includes('undefined')) throw new Error('bad SVG: ' + s.slice(0, 200)); rendered++; }
  catch (e) { failed++; console.error(`✗ render ${what}: ${e.message}`); }
};
for (const clef of ['treble', 'bass', 'grand']) for (let f = -7; f <= 7; f++) render({ clef, key: f, items: [], minWidth: 18 }, `${clef} ${f}`);
for (const clef of ['treble', 'bass']) {
  const [lo, hi] = Staff.range(clef, 4);
  for (let d = lo; d <= hi; d++) for (const a of [-2, -1, 0, 1, 2]) render({ clef, key: 3, items: [{ notes: [T.fromDia(d, a)] }] }, `${clef} note ${d}/${a}`);
}
for (const type of Object.keys(T.CHORDS)) for (let step = 0; step < 7; step++) for (const alter of [-1, 0, 1]) {
  const root = T.note(step, alter, 4);
  if (T.chord(root, type).some(n => Math.abs(n.alter) > 2)) continue; // triple sharps/flats: the drills leave these out
  for (let inv = 0; inv < T.CHORDS[type].tones.length; inv++) {
    const notes = T.chord(root, type, inv);
    render({ clef: 'treble', items: [{ notes, label: T.chordName(root, type, { bass: notes[0] }) }], minWidth: 18 }, `${type} ${T.name(root)} inv ${inv}`);
    eq(T.sameSet(T.pcSet(notes), T.pcSet(T.CHORDS[type].tones.map(([, s]) => T.midi(root) + s))), true, `${T.name(root)} ${type} pitches`);
  }
}
for (const type of Object.keys(T.SCALES)) for (let step = 0; step < 7; step++) for (const alter of [-1, 0, 1]) {
  const s = T.scale(T.note(step, alter, 4), type);
  eq(s.slice(1).map((n, i) => T.midi(n) - T.midi(s[i])), T.SCALES[type].steps.slice(1).concat(12).map((x, i) => x - T.SCALES[type].steps[i]), `${T.name(s[0])} ${type} steps`);
  render({ clef: 'treble', key: 0, items: s.map(n => ({ notes: [n] })), barlines: false }, `scale ${T.name(s[0])} ${type}`);
}
for (const prog of T.PROGRESSIONS) for (let f = -7; f <= 7; f++) {
  const key = { fifths: f, minor: prog.minor };
  const chords = T.voice(prog.chords.map(n => T.romanChord(key, n)));
  for (const c of chords) {
    const top = T.midi(c.upper[c.upper.length - 1]), bottom = T.midi(c.upper[0]), bass = T.midi(c.bass);
    if (bottom < 64 || top > 81 || bass < 40 || bass > 52) { failed++; console.error(`✗ voicing out of range: ${prog.id} in ${T.keyName(key)}: ${c.numeral} ${names(c.upper)} / ${T.name(c.bass, { octave: true })}`); }
  }
  render({ clef: 'grand', key: f, barlines: true, items: chords.map(c => ({ notes: [{ ...c.bass, staff: 'bass' }, ...c.upper.map(n => ({ ...n, staff: 'treble' }))], label: 'x', sublabel: c.numeral })) }, `${prog.id} in ${f}`);
}

// ---------- pieces: every bar adds up, the hands are the same length, every line engraves ----------
const Score = ctx.self.Score;
const ids = new Set();
for (const p of ctx.self.PIECES) {
  const what = `piece ${p.id}`;
  if (ids.has(p.id)) { failed++; console.error(`✗ ${what}: duplicate id`); }
  ids.add(p.id);
  for (const k of ['title', 'by', 'level', 'time', 'tempo', 'about']) if (p[k] === undefined) { failed++; console.error(`✗ ${what}: no ${k}`); }
  const L = p.time[0] * 4 / p.time[1];
  const lengths = [];
  for (const v of ['rh', 'lh']) {
    if (!p[v]) continue;
    let parsed;
    try { parsed = Score.parseVoice(p[v], v); } catch (e) { failed++; console.error(`✗ ${what}: ${e.message}`); continue; }
    const pickup = p.pickup || 0;
    parsed.bars.forEach((len, i) => {
      const want = pickup && i === 0 ? pickup : L;
      const lastOk = pickup && i === parsed.bars.length - 1 && Math.abs(len - (L - pickup)) < 1e-9;
      if (Math.abs(len - want) > 1e-9 && !lastOk) { failed++; console.error(`✗ ${what} ${v} bar ${i + 1}: ${len} quarter notes, should be ${want}`); }
      else passed++;
    });
    // fingering in chords must make sense: right hand's fingers rise with the pitch, left hand's fall
    for (const e of parsed.events) {
      const fs = e.notes.filter(n => n.finger).sort((a, b) => T.midi(a) - T.midi(b)).map(n => n.finger);
      if (fs.length < 2) continue;
      const ok = fs.every((x, i) => !i || (v === 'rh' ? x > fs[i - 1] : x < fs[i - 1]));
      if (!ok) { failed++; console.error(`✗ ${what} ${v}: chord fingering ${fs.join('-')} (bottom to top) is impossible`); } else passed++;
    }
    lengths.push(parsed.length);
    // hands stay on their staff: right hand from G3 up, left hand up to E4
    for (const e of parsed.events) for (const n of e.notes) {
      const m = T.midi(n);
      const staffed = (p.clef || (v === 'rh' ? 'treble' : 'bass')) === 'treble' && !(p.rh && p.lh && v === 'lh');
      if (staffed ? m < 55 || m > 84 : m < 36 || m > 64) { failed++; console.error(`✗ ${what} ${v}: ${T.name(n, { octave: true })} is far off its staff`); }
    }
  }
  if (!lengths.length) { failed++; console.error(`✗ ${what}: no notes`); }
  if (lengths.length === 2 && Math.abs(lengths[0] - lengths[1]) > 1e-9) { failed++; console.error(`✗ ${what}: the hands have different lengths (${lengths.join(' / ')})`); }
  for (const [width, fingering] of [[44, false], [70, true], [120, true]]) {
    try {
      const out = Score.layout(p, { width, fingering });
      if (out.svg.includes('NaN') || out.svg.includes('undefined')) throw new Error('bad SVG');
      if (!out.marks.length || out.events.some(e => !e.rest && e.midis.some(m => !(m > 0)))) throw new Error('bad events');
      rendered++;
    } catch (e) { failed++; console.error(`✗ ${what} at width ${width}: ${e.message}`); }
  }
}

// ---------- pages ----------
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
let scripts = 0;
for (const f of walk(SITE).filter(f => f.endsWith('.html'))) {
  const html = fs.readFileSync(f, 'utf8');
  for (const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
    try { new vm.Script(m[1], { filename: path.relative(SITE, f) }); scripts++; }
    catch (e) { failed++; console.error(`✗ ${path.relative(SITE, f)}: ${e.message}`); }
  }
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
    if (!fs.existsSync(path.join(SITE, m[1]))) { failed++; console.error(`✗ ${path.relative(SITE, f)} loads missing ${m[1]}`); }
  }
}
for (const d of ctx.self.DRILLS) if (!fs.existsSync(path.join(SITE, d.path, 'index.html'))) { failed++; console.error(`✗ drills.js lists ${d.path}, which has no index.html`); }
for (const f of walk(path.join(SITE, 'shared')).filter(f => f.endsWith('.js'))) {
  try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: path.relative(SITE, f) }); } catch (e) { failed++; console.error(`✗ ${path.relative(SITE, f)}: ${e.message}`); }
}

console.log(`${failed ? '✗' : '✓'} theory: ${passed} checks passed${failed ? `, ${failed} failed` : ''} · ${rendered} staves rendered · ${scripts} page scripts parsed`);
process.exit(failed ? 1 : 0);
