// Imports a piece from a MIDI file (.mid, .midi) or MusicXML (.musicxml, .xml, .mxl) into the pieces notation
// (shared/score.js), and writes pieces back out as MIDI. Everything happens in the browser.
//
//   const r = await Importer.fromFile(file)   → { piece, report: { notes, bars, simplified, warnings: [...] } }
//   Importer.toMidi(piece)                    → Uint8Array (a standard MIDI file)
//
// What gets simplified, so the piece can be shown and played here: each hand becomes one line of notes and chords
// (notes that start together form a chord), timing is rounded to sixteenth notes, tied and too-long notes end at the
// bar line or at the next note (no ties), and only the first time and key signature are used.
// PDFs are pictures of music and can't be read as notes.
(function () {
  const T = self.Theory;
  const VALUES = [[4, '1'], [3, '2.'], [2, '2'], [1.5, '4.'], [1, '4'], [0.75, '8.'], [0.5, '8'], [0.25, '16']];
  const MAX_BARS = 300;
  const q16 = x => Math.round(x * 4) / 4;
  const err = msg => { const e = new Error(msg); e.user = true; return e; };

  // a length (in quarter notes, a multiple of a sixteenth) as note values, longest first
  function split(len) {
    const out = [];
    let rest = q16(len);
    while (rest > 1e-9) { const v = VALUES.find(([x]) => x <= rest + 1e-9); out.push(v); rest = q16(rest - v[0]); }
    return out;
  }

  // ---------- notes → notation ----------
  // notes: [{ t, d, midi }] in quarter notes. Returns { text, simplified, chordsCut }
  function encodeHand(notes, { L, pickup, length, fifths }) {
    const barStart = m => pickup ? (m === 0 ? 0 : pickup + (m - 1) * L) : m * L;
    const barOf = t => pickup ? (t < pickup - 1e-9 ? 0 : 1 + Math.floor((t - pickup) / L + 1e-9)) : Math.floor(t / L + 1e-9);
    const byT = new Map();
    let chordsCut = 0;
    for (const n of notes) {
      const t = q16(n.t);
      if (t >= length - 1e-9) continue;
      const g = byT.get(t) || { t, midis: new Set(), end: t };
      g.midis.add(n.midi);
      g.end = Math.max(g.end, q16(n.t + n.d));
      byT.set(t, g);
    }
    const onsets = [...byT.values()].sort((a, b) => a.t - b.t);
    const segs = [];
    let cur = 0;
    onsets.forEach((g, i) => {
      if (g.t > cur + 1e-9) segs.push({ t: cur, len: g.t - cur, rest: true });
      const next = i + 1 < onsets.length ? onsets[i + 1].t : length;
      const end = Math.min(Math.max(g.end, g.t + 0.25), next);
      let midis = [...g.midis].sort((a, b) => a - b);
      if (midis.length > 6) { midis = midis.slice(-6); chordsCut++; }
      segs.push({ t: g.t, len: end - g.t, midis });
      cur = end;
    });
    if (cur < length - 1e-9) segs.push({ t: cur, len: length - cur, rest: true });
    const nBars = barOf(length - 1e-6) + 1;
    const bars = Array.from({ length: nBars }, () => []);
    let simplified = 0;
    const name = ms => ms.map(m => T.name(T.spell(m, fifths), { ascii: true, octave: true })).join('+');
    for (const s of segs) {
      let t = s.t, left = s.len, first = true;
      while (left > 1e-9) {
        const m = barOf(t);
        const piece = Math.min(left, barStart(m + 1) - t);
        const vals = split(piece);
        vals.forEach(([len, code], i) => bars[m].push(!s.rest && first && i === 0 ? { note: `${name(s.midis)}:${code}` } : { rest: len }));
        if (!s.rest && (vals.length > 1 || !first)) simplified++;
        first = false; t += piece; left = q16(left - piece);
      }
    }
    // rests next to each other in a bar become as few rests as possible
    const tokens = bar => {
      const out = [];
      for (const x of bar) { const last = out[out.length - 1]; if (x.rest && last && last.rest) last.rest += x.rest; else out.push({ ...x }); }
      return out.flatMap(x => x.note ? [x.note] : split(x.rest).map(([, code]) => `r:${code}`));
    };
    return { text: bars.map(b => tokens(b).join(' ')).join(' | '), simplified, chordsCut };
  }

  // the key signature that fits the notes best (when the file doesn't say)
  function guessFifths(midis) {
    const hist = Array(12).fill(0);
    for (const m of midis) hist[T.mod(m, 12)]++;
    let best = 0, bestScore = -1;
    for (let f = -6; f <= 6; f++) {
      const pcs = T.scale(T.keyTonic(f, false), 'major').slice(0, 7).map(T.pc);
      const score = pcs.reduce((a, p) => a + hist[p], 0) - Math.abs(f) * 0.01;
      if (score > bestScore) { bestScore = score; best = f; }
    }
    return best;
  }

  // two hands from several voices: the highest voice is the right hand, the lowest the left
  function hands(voices) {
    voices = voices.filter(v => v.notes.length);
    if (!voices.length) throw err('no-notes');
    const avg = v => v.notes.reduce((a, n) => a + n.midi, 0) / v.notes.length;
    voices.sort((a, b) => avg(b) - avg(a));
    if (voices.length === 1) {
      const all = voices[0].notes;
      if (all.every(n => n.midi >= 55)) return { rh: all, lh: [] };
      if (all.every(n => n.midi <= 64)) return { rh: [], lh: all };
      return { rh: all.filter(n => n.midi >= 60), lh: all.filter(n => n.midi < 60) };
    }
    const top = avg(voices[0]), bottom = avg(voices[voices.length - 1]);
    const rh = [], lh = [];
    for (const v of voices) (Math.abs(avg(v) - top) <= Math.abs(avg(v) - bottom) ? rh : lh).push(...v.notes);
    return { rh, lh };
  }

  function build({ title, by, rh, lh, time, tempo, fifths, minor, pickup, source, warnings }) {
    if (!time || !(time[0] > 0) || ![1, 2, 4, 8, 16].includes(time[1])) { if (time) warnings.push('time'); time = [4, 4]; }
    const L = time[0] * 4 / time[1];
    if (!(pickup > 0 && pickup < L)) pickup = 0;
    pickup = q16(pickup);
    const all = [...rh, ...lh];
    const offGrid = all.filter(n => Math.abs(n.t * 4 - Math.round(n.t * 4)) > 0.08).length;
    if (fifths === null || fifths === undefined || Math.abs(fifths) > 7) fifths = guessFifths(all.map(n => n.midi));
    const barStart = m => pickup ? (m === 0 ? 0 : pickup + (m - 1) * L) : m * L;
    let end = Math.max(...all.map(n => n.t + n.d));
    let bars = pickup ? 1 + Math.ceil((end - pickup) / L - 1e-9) : Math.ceil(end / L - 1e-9);
    if (bars > MAX_BARS) { warnings.push('long'); bars = MAX_BARS; }
    const length = barStart(bars);
    const opt = { L, pickup, length, fifths };
    const R = rh.length ? encodeHand(rh, opt) : null;
    const H = lh.length ? encodeHand(lh, opt) : null;
    const simplified = (R ? R.simplified : 0) + (H ? H.simplified : 0);
    if ((R && R.chordsCut) || (H && H.chordsCut)) warnings.push('chords');
    const piece = {
      id: 'my-' + Date.now().toString(36), mine: true, level: 0,
      title: (title || 'Imported piece').trim().slice(0, 120), by: (by || '').trim().slice(0, 160), source,
      key: fifths, minor: !!minor, time, pickup, tempo: Math.max(30, Math.min(200, Math.round(tempo || 100))),
      about: '', imported: Date.now(),
    };
    if (R) piece.rh = R.text;
    if (H) piece.lh = H.text;
    if (!piece.rh && !piece.lh) throw err('no-notes');
    return { piece, report: { notes: all.length, bars, offGrid, simplified, warnings: [...new Set(warnings)] } };
  }

  // ---------- MIDI ----------
  function parseMidi(buf) {
    const d = new DataView(buf);
    const str = (p, n) => String.fromCharCode(...new Uint8Array(buf, p, n));
    if (buf.byteLength < 14 || str(0, 4) !== 'MThd') throw err('not-midi');
    const hlen = d.getUint32(4), ntr = d.getUint16(10), div = d.getInt16(12);
    if (div <= 0) throw err('smpte');
    let p = 8 + hlen;
    const tracks = [], meta = { tempo: null, time: null, key: null, timeChanges: 0, names: [] };
    for (let ti = 0; ti < ntr && p + 8 <= buf.byteLength; ti++) {
      if (str(p, 4) !== 'MTrk') break;
      const len = d.getUint32(p + 4);
      let q = p + 8;
      const end = Math.min(q + len, buf.byteLength);
      p = q + len;
      let tick = 0, status = 0;
      const on = new Map(), notes = [];
      const vlq = () => { let v = 0, b; do { b = d.getUint8(q++); v = (v << 7) | (b & 0x7f); } while (b & 0x80 && q < end); return v; };
      while (q < end) {
        tick += vlq();
        const b = d.getUint8(q);
        if (b === 0xff) {
          q++;
          const type = d.getUint8(q++), l = vlq();
          if (type === 0x51 && meta.tempo === null && l >= 3) meta.tempo = 60e6 / ((d.getUint8(q) << 16) | (d.getUint8(q + 1) << 8) | d.getUint8(q + 2));
          else if (type === 0x58 && l >= 2) { if (!meta.time) meta.time = [d.getUint8(q), 2 ** d.getUint8(q + 1)]; else if (tick > 0) meta.timeChanges++; }
          else if (type === 0x59 && !meta.key && l >= 2) meta.key = { fifths: d.getInt8(q), minor: d.getUint8(q + 1) === 1 };
          else if (type === 0x03 || type === 0x01) { const t = new TextDecoder('utf-8').decode(new Uint8Array(buf, q, l)).replace(/\0/g, '').trim(); if (t) meta.names.push(t); }
          q += l;
          continue;
        }
        if (b === 0xf0 || b === 0xf7) { q++; q += vlq(); continue; }
        if (b & 0x80) { status = b; q++; }
        const cmd = status & 0xf0, ch = status & 0x0f;
        if (cmd === 0x90 || cmd === 0x80) {
          const note = d.getUint8(q++), vel = d.getUint8(q++), key = ch * 128 + note;
          if (cmd === 0x90 && vel > 0) { if (!on.has(key)) on.set(key, []); on.get(key).push(tick); }
          else { const st = on.get(key); if (st && st.length) { const s0 = st.shift(); notes.push({ tick: s0, dur: tick - s0, midi: note, ch }); } }
        } else if (cmd === 0xc0 || cmd === 0xd0) q += 1;
        else if (cmd >= 0x80) q += 2;
        else q++; // not a status byte and no running status: skip it
      }
      for (const [key, st] of on) for (const s0 of st) notes.push({ tick: s0, dur: Math.max(1, tick - s0), midi: key % 128, ch: Math.floor(key / 128) });
      tracks.push({ notes });
    }
    return { division: div, tracks, meta };
  }

  function fromMidi(buf, filename) {
    const { division, tracks, meta } = parseMidi(buf);
    const warnings = [];
    let voices = tracks.map(tr => ({ notes: tr.notes.filter(n => n.ch !== 9) }));
    // one track with several channels (format 0): one voice per channel
    const withNotes = voices.filter(v => v.notes.length);
    if (withNotes.length === 1) {
      const chans = [...new Set(withNotes[0].notes.map(n => n.ch))];
      if (chans.length > 1) voices = chans.map(c => ({ notes: withNotes[0].notes.filter(n => n.ch === c) }));
    }
    voices = voices.map(v => ({ notes: v.notes.map(n => ({ t: n.tick / division, d: n.dur / division, midi: n.midi })) }));
    if (meta.timeChanges) warnings.push('meter');
    const { rh, lh } = hands(voices);
    const fileTitle = (filename || '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
    const title = meta.names.find(n => n.length > 3 && !/^(piano|track|staff|untitled|acoustic|grand|right|left|melody)/i.test(n)) || fileTitle;
    return build({
      title, by: '', rh, lh, time: meta.time, tempo: meta.tempo, fifths: meta.key ? meta.key.fifths : null,
      minor: meta.key ? meta.key.minor : false, pickup: 0, source: filename, warnings,
    });
  }

  // ---------- MusicXML ----------
  async function unzip(buf) {
    const d = new DataView(buf);
    let e = buf.byteLength - 22;
    while (e >= 0 && d.getUint32(e, true) !== 0x06054b50) e--;
    if (e < 0) throw err('not-zip');
    const count = d.getUint16(e + 10, true);
    let cd = d.getUint32(e + 16, true);
    const files = {};
    for (let i = 0; i < count; i++) {
      const method = d.getUint16(cd + 10, true), csize = d.getUint32(cd + 20, true);
      const nlen = d.getUint16(cd + 28, true), elen = d.getUint16(cd + 30, true), clen = d.getUint16(cd + 32, true), off = d.getUint32(cd + 42, true);
      files[new TextDecoder().decode(new Uint8Array(buf, cd + 46, nlen))] = { method, csize, off };
      cd += 46 + nlen + elen + clen;
    }
    async function read(name) {
      const f = files[name];
      if (!f) throw err('not-musicxml');
      const ln = d.getUint16(f.off + 26, true), le = d.getUint16(f.off + 28, true);
      const data = new Uint8Array(buf, f.off + 30 + ln + le, f.csize);
      if (f.method === 0) return new TextDecoder().decode(data);
      if (f.method === 8 && self.DecompressionStream) {
        const out = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
        return new TextDecoder().decode(out);
      }
      throw err('not-zip');
    }
    return { names: Object.keys(files), read };
  }

  function fromMusicXml(text, filename) {
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.querySelector('parsererror') || !doc.documentElement) throw err('not-musicxml');
    const root = doc.documentElement.nodeName;
    if (root === 'score-timewise') throw err('timewise');
    if (root !== 'score-partwise') throw err('not-musicxml');
    const txt = sel => { const el = doc.querySelector(sel); return el ? el.textContent.trim() : ''; };
    const title = txt('work > work-title') || txt('movement-title') || (filename || '').replace(/\.[^.]+$/, '');
    const by = txt('identification > creator[type="composer"]');
    const warnings = [];
    let fifths = null, minor = false, time = null, tempo = null, pickup = 0, timeChanges = 0, keyChanges = 0;
    const parts = [...doc.querySelectorAll('score-partwise > part')].map((part, pi) => {
      const notes = [];
      let div = 1, staves = 1, mStart = 0;
      [...part.children].filter(m => m.nodeName === 'measure').forEach((measure, mi) => {
        let cur = 0, max = 0, lastStart = 0;
        for (const el of measure.children) {
          if (el.nodeName === 'attributes') {
            const dv = el.querySelector('divisions'); if (dv) div = +dv.textContent || div;
            const k = el.querySelector('key > fifths');
            if (k) { if (fifths === null) { fifths = +k.textContent; minor = (el.querySelector('key > mode') || {}).textContent === 'minor'; } else if (+k.textContent !== fifths && pi === 0) keyChanges++; }
            const tm = el.querySelector('time');
            if (tm && tm.querySelector('beats')) {
              const t2 = [parseInt(tm.querySelector('beats').textContent, 10), parseInt(tm.querySelector('beat-type').textContent, 10)];
              if (!time) time = t2; else if ((t2[0] !== time[0] || t2[1] !== time[1]) && pi === 0) timeChanges++;
            }
            const st = el.querySelector('staves'); if (st) staves = +st.textContent || 1;
          } else if (el.nodeName === 'direction' || el.nodeName === 'sound') {
            const s = el.nodeName === 'sound' ? el : el.querySelector('sound[tempo]');
            if (s && s.getAttribute('tempo') && !tempo) tempo = +s.getAttribute('tempo');
            const pm = el.querySelector('metronome > per-minute'); if (pm && !tempo) tempo = parseFloat(pm.textContent);
          } else if (el.nodeName === 'backup') cur -= +(el.querySelector('duration') || {}).textContent || 0;
          else if (el.nodeName === 'forward') { cur += +(el.querySelector('duration') || {}).textContent || 0; max = Math.max(max, cur); }
          else if (el.nodeName === 'note') {
            if (el.querySelector(':scope > grace') || el.querySelector(':scope > cue')) continue;
            const dur = +((el.querySelector(':scope > duration') || {}).textContent || 0);
            const chord = !!el.querySelector(':scope > chord');
            const start = chord ? lastStart : cur;
            if (!chord) { lastStart = cur; cur += dur; }
            max = Math.max(max, cur);
            const pitch = el.querySelector(':scope > pitch');
            if (!pitch || el.querySelector(':scope > rest')) continue;
            const step = 'CDEFGAB'.indexOf(pitch.querySelector('step').textContent.trim());
            const alter = Math.round(+((pitch.querySelector('alter') || {}).textContent || 0));
            const midi = T.midi({ step, alter, octave: +pitch.querySelector('octave').textContent });
            const staff = +((el.querySelector(':scope > staff') || {}).textContent || 1);
            const t = mStart + start / div, d = dur / div;
            const tieStop = [...el.querySelectorAll(':scope > tie')].some(x => x.getAttribute('type') === 'stop');
            if (tieStop) {
              const prev = [...notes].reverse().find(n => n.midi === midi && n.staff === staff && Math.abs(n.t + n.d - t) < 1e-6);
              if (prev) { prev.d += d; continue; }
            }
            notes.push({ t, d, midi, staff });
          }
        }
        const len = max / div;
        if (mi === 0 && measure.getAttribute('implicit') === 'yes') pickup = len;
        mStart += len;
      });
      return { notes, staves };
    });
    if (timeChanges) warnings.push('meter');
    if (keyChanges) warnings.push('key');
    let rh, lh;
    const piano = parts.find(p => p.staves >= 2 && p.notes.length);
    if (piano) { rh = piano.notes.filter(n => n.staff === 1); lh = piano.notes.filter(n => n.staff >= 2); if (parts.filter(p => p.notes.length).length > 1) warnings.push('parts'); }
    else ({ rh, lh } = hands(parts.map(p => ({ notes: p.notes }))));
    if (pickup && time && pickup >= time[0] * 4 / time[1] - 1e-9) pickup = 0;
    return build({ title, by, rh, lh, time, tempo, fifths, minor, pickup, source: filename, warnings });
  }

  async function fromFile(file) {
    const name = file.name || 'file';
    const ext = (name.match(/\.([^.]+)$/) || [])[1]?.toLowerCase();
    const buf = await file.arrayBuffer();
    const head = new Uint8Array(buf, 0, Math.min(4, buf.byteLength));
    const sig = String.fromCharCode(...head);
    if (sig === '%PDF' || ext === 'pdf') throw err('pdf');
    if (sig === 'MThd') return fromMidi(buf, name);
    if (sig.startsWith('PK')) {
      const z = await unzip(buf);
      let root = null;
      if (z.names.includes('META-INF/container.xml')) {
        const c = new DOMParser().parseFromString(await z.read('META-INF/container.xml'), 'application/xml');
        const rf = c.querySelector('rootfile');
        root = rf && rf.getAttribute('full-path');
      }
      root = root || z.names.find(n => /\.(musicxml|xml)$/i.test(n) && !n.startsWith('META-INF'));
      if (!root) throw err('not-musicxml');
      return fromMusicXml(await z.read(root), name);
    }
    const text = new TextDecoder().decode(buf);
    if (/<score-(partwise|timewise)/.test(text)) return fromMusicXml(text, name);
    throw err('unknown');
  }

  // ---------- writing MIDI ----------
  function toMidi(piece) {
    const div = 480;
    const vlq = v => { const out = [v & 0x7f]; while ((v >>= 7)) out.unshift((v & 0x7f) | 0x80); return out; };
    const track = events => {
      events.sort((a, b) => a.tick - b.tick || a.order - b.order);
      const bytes = [];
      let last = 0;
      for (const e of events) { bytes.push(...vlq(e.tick - last), ...e.data); last = e.tick; }
      bytes.push(0, 0xff, 0x2f, 0);
      return [0x4d, 0x54, 0x72, 0x6b, ...[24, 16, 8, 0].map(s => (bytes.length >> s) & 0xff), ...bytes];
    };
    const us = Math.round(60e6 / (piece.tempo || 100));
    const [num, den] = piece.time;
    const title = Array.from(new TextEncoder().encode(piece.title || ''));
    const meta = [
      { tick: 0, order: 0, data: [0xff, 0x03, ...vlq(title.length), ...title] },
      { tick: 0, order: 0, data: [0xff, 0x51, 3, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff] },
      { tick: 0, order: 0, data: [0xff, 0x58, 4, num, Math.log2(den), 24, 8] },
      { tick: 0, order: 0, data: [0xff, 0x59, 2, (piece.key || 0) & 0xff, piece.minor ? 1 : 0] },
    ];
    const tracks = [track(meta)];
    ['rh', 'lh'].forEach((v, ch) => {
      if (!piece[v]) return;
      const evs = [];
      for (const e of self.Score.parseVoice(piece[v], v).events) {
        if (e.rest) continue;
        const a = Math.round(e.t * div), b = Math.round((e.t + e.d) * div);
        for (const n of e.notes) {
          const m = T.midi(n);
          evs.push({ tick: a, order: 1, data: [0x90 | ch, m, 80] }, { tick: b, order: 0, data: [0x80 | ch, m, 0] });
        }
      }
      tracks.push(track(evs));
    });
    const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, tracks.length, (div >> 8) & 0xff, div & 0xff];
    return new Uint8Array([...head, ...tracks.flat()]);
  }

  self.Importer = { fromFile, fromMidi, fromMusicXml, parseMidi, toMidi, encodeHand };
})();
