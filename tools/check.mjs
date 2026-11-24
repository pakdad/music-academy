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
ctx.TextDecoder = TextDecoder; ctx.TextEncoder = TextEncoder;
for (const f of ['theory', 'glyphs', 'staff', 'score', 'pieces', 'drills', 'importer', 'guitar']) vm.runInContext(fs.readFileSync(path.join(SITE, 'shared', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
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

// ---------- importing: every piece survives MIDI out and back in; IMSLP links go to work pages ----------
{
  const Imp = ctx.self.Importer;
  for (const p of ctx.self.PIECES) {
    if (p.imslp && !/^https:\/\/imslp\.org\/wiki\/[^?#]+_\([^)]+\)$/.test(p.imslp)) { failed++; console.error(`✗ piece ${p.id}: IMSLP link is not a work page: ${p.imslp}`); }
    const bytes = Imp.toMidi(p);
    let back;
    try { back = Imp.fromMidi(bytes.buffer, p.id + '.mid').piece; } catch (e) { failed++; console.error(`✗ piece ${p.id}: MIDI round trip: ${e.message}`); continue; }
    const shift = p.pickup ? back.time[0] * 4 / back.time[1] - p.pickup : 0; // MIDI has no pickup bar: the import starts a bar early
    for (const v of ['rh', 'lh']) {
      const notes = src => !src ? '' : Score.parseVoice(src, v).events.filter(e => !e.rest).flatMap(e => e.notes.map(n => `${(e.t).toFixed(2)}:${T.midi(n)}`)).sort().join(' ');
      const want = notes(p[v]);
      const got = !back[v] ? '' : Score.parseVoice(back[v], v).events.filter(e => !e.rest).flatMap(e => e.notes.map(n => `${(e.t).toFixed(2)}:${T.midi(n)}`)).sort().join(' ');
      if (want === got) passed++;
      else { failed++; console.error(`✗ piece ${p.id} ${v}: notes changed in the MIDI round trip\n    want ${want.slice(0, 160)}\n    got  ${got.slice(0, 160)}`); }
    }
    if (back.key !== (p.key || 0) || back.time.join('/') !== p.time.join('/') || back.tempo !== p.tempo) { failed++; console.error(`✗ piece ${p.id}: key/time/tempo changed in the round trip`); } else passed++;
    try { Score.layout(back, { width: 90 }); passed++; } catch (e) { failed++; console.error(`✗ piece ${p.id}: the imported version doesn't engrave: ${e.message}`); }
  }
  // a note too long for one value and across the bar line: shortened, still one onset
  const enc = Imp.encodeHand([{ t: 0, d: 1.25, midi: 60 }, { t: 3, d: 2, midi: 64 }], { L: 4, pickup: 0, length: 8, fifths: 0 });
  eq(enc.text, 'C4:4 r:2 E4:4 | r:1', 'importer shortens notes instead of tying, and merges rests');
}

// ---------- guitar: every chord shape sounds its chord; patterns fill their bars; tab engraves ----------
{
  const Gt = ctx.self.Guitar;
  eq(Gt.openStrings('standard'), [64, 59, 55, 50, 45, 40], 'standard tuning, string 1 first');
  eq(Gt.midi(6, 3), 43, 'G on the low E string, 3rd fret');
  eq(Gt.positions(64, 12).map(p => `${p.string}.${p.fret}`).join(' '), '1.0 2.5 3.9 4.14'.split(' ').filter(x => +x.split('.')[1] <= 12).join(' '), 'every place of E4 up to fret 12');
  const ids = new Set();
  for (const c of Gt.CHORDS) {
    if (ids.has(c.id)) { failed++; console.error(`✗ chord ${c.id}: twice`); }
    ids.add(c.id);
    const want = Gt.chordPcs(c);
    const v = Gt.voicing(c, 'standard');
    const got = [...new Set(v.map(n => T.mod(n.midi, 12)))];
    const root = T.pc(T.parse(c.root + '4'));
    const fifth = T.mod(root + 7, 12);
    const bad = got.filter(p => !want.includes(p));
    const missing = want.filter(p => !got.includes(p) && p !== fifth);
    if (bad.length || missing.length || T.mod(v[0].midi, 12) !== root) { failed++; console.error(`✗ chord ${c.id}: shape sounds ${got.join(',')}, wants ${want.join(',')} with the root lowest`); }
    else passed++;
    if (c.frets.some((f, i) => (f > 0) !== (c.fingers[i] > 0))) { failed++; console.error(`✗ chord ${c.id}: fingers don't match the frets`); } else passed++;
  }
  for (const p of Gt.STRUMS) eq(p.pattern.length, p.time[0] * (p.time[1] === 4 ? 2 : 1), `strum ${p.id} fills its bar with eighths`);
  for (const p of Gt.PICKS) eq(p.slots.length, p.time[0] * (p.time[1] === 4 ? 2 : 1), `picking ${p.id} fills its bar with eighths`);
  for (const [notation, tab] of [[true, true], [false, true], [true, false]]) {
    const out = Score.layout({ clef: 'guitar', tab, notation, time: [4, 4], key: 1, rh: 'G4^3.0:4=C E5^1.0:8=p F#5^1.2:8 r:4 B4+D5^2.0:4 | G4^3.0:8. A4^3.2:16 B4^2.0:2. ' }, { width: 80 });
    if (out.svg.includes('NaN') || out.svg.includes('undefined')) { failed++; console.error(`✗ guitar layout (notation ${notation}, tab ${tab}) has NaN`); } else passed++;
    eq(out.events[0].midis, [55], 'guitar notation sounds an octave lower than written');
    if (tab) eq((out.svg.match(/class="tabnum"/g) || []).length, 7, 'every note has its fret number on the tab');
  }
}

// ---------- German: every text the pages show has a translation ----------
{
  const de = { self: {} };
  vm.createContext(de);
  vm.runInContext(fs.readFileSync(path.join(SITE, 'shared', 'i18n-de.js'), 'utf8'), de, { filename: 'i18n-de.js' });
  const DE = de.self.I18N_DE || {};
  const keys = new Map(); // key -> where
  const walkAll = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walkAll(path.join(dir, d.name)) : [path.join(dir, d.name)]);
  for (const f of walkAll(SITE).filter(f => /\.(html|js)$/.test(f) && !/i18n(-de)?\.js$/.test(f))) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/(?<![\w.])t\(\s*'((?:[^'\\]|\\.)*)'/g)) keys.set(m[1].replace(/\\'/g, "'"), path.relative(SITE, f));
    for (const m of src.matchAll(/data-t>([^<]+)</g)) keys.set(m[1].trim(), path.relative(SITE, f));
  }
  // texts looked up by value rather than written as t('…')
  for (const c of Object.values(T.CHORDS)) keys.set(c.name, 'theory.js chords');
  for (const sc of Object.values(T.SCALES)) keys.set(sc.name, 'theory.js scales');
  for (const pr of T.PROGRESSIONS) keys.set(pr.name, 'theory.js progressions');
  for (const k of ['treble', 'bass', '1st inversion', '2nd inversion', '3rd inversion', 'Piano', 'Guitar']) keys.set(k, 'dynamic');
  const Gt = ctx.self.Guitar;
  for (const tu of Object.values(Gt.TUNINGS)) keys.set(tu.name, 'guitar.js tunings');
  for (const [, n] of Gt.GROUPS) keys.set(n, 'guitar.js chord groups');
  for (const p of [...Gt.STRUMS, ...Gt.PICKS]) keys.set(p.name, 'guitar.js patterns');
  for (const n of ['C major', 'G major', 'A minor pentatonic', 'E minor pentatonic']) keys.set(n, 'guitar-tab scales');
  const ph = s => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort().join(',');
  let missing = 0;
  for (const [k, where] of keys) {
    if (DE[k] === undefined) { missing++; failed++; console.error(`✗ no German for ${JSON.stringify(k)} (${where})`); }
    else if (ph(k) !== ph(DE[k])) { failed++; console.error(`✗ German for ${JSON.stringify(k)} has other placeholders: ${JSON.stringify(DE[k])}`); }
    else passed++;
  }
  const unused = Object.keys(DE).filter(k => !keys.has(k));
  if (unused.length) console.warn(`! ${unused.length} German texts no page uses: ${unused.slice(0, 8).map(k => JSON.stringify(k)).join(', ')}${unused.length > 8 ? ' …' : ''}`);
  // every piece and drill has its German texts
  for (const p of ctx.self.PIECES) if (!p.de || !p.de.title || !p.de.about || !p.de.by) { failed++; console.error(`✗ piece ${p.id}: no German title/by/about`); }
  for (const d of ctx.self.DRILLS) if (!d.de || !d.de.name || !d.de.about) { failed++; console.error(`✗ drill ${d.id}: no German name/about`); }
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
