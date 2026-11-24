// Listening through the microphone, all in the browser (nothing is recorded or sent anywhere).
//   await Mic.start()                       asks for the microphone; false if refused or unavailable
//   Mic.on('frame', f => …)                 every ~25 ms: { rms, freq, midi (fractional), clarity, time }
//   Mic.on('note', n => …)                  a new note: { midi, cents, freq, time } (onset + a steady pitch)
//   Mic.on('onset', o => …)                 something was plucked, strummed or clapped: { time, rms }
//   Mic.on('state', s => …)                 'off' | 'asking' | 'on' | 'denied' | 'unsupported'
//   Mic.chromaBetween(t0, t1)               how much of each pitch class sounded (12 numbers, summing to 1)
//   Mic.chordScore(chroma, pcs)             the share of that energy in a chord's pitch classes
// Times are on the performance.now() clock, corrected by the measured microphone delay (metronome page).
// Pitch: YIN (de Cheveigné & Kawahara 2002) on the newest samples.
(function () {
  const listeners = { frame: new Set(), note: new Set(), onset: new Set(), state: new Set() };
  let state = 'off', ctx, stream, src, an, timer, buf, fbuf, sr;
  let prevRms = 0, env = 0, lastOnset = -1e9, onsetSinceNote = false, stableMidi = null, stableCount = 0, noteMidi = null;
  const chromaLog = [];
  let wantChroma = 0;

  const emit = (type, x) => { for (const fn of [...listeners[type]]) fn(x); };
  const setState = s => { state = s; emit('state', s); };
  const delay = () => ((self.UI && UI.prefs.micLatency) || 0) + 20; // detection lag + measured input delay

  async function start() {
    if (state === 'on') return true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !self.isSecureContext) { setState('unsupported'); return false; }
    setState('asking');
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    } catch (e) { setState('denied'); return false; }
    ctx = Sound.context();
    sr = ctx.sampleRate;
    src = ctx.createMediaStreamSource(stream);
    an = ctx.createAnalyser();
    an.fftSize = 8192;
    an.smoothingTimeConstant = 0;
    src.connect(an);
    buf = new Float32Array(an.fftSize);
    fbuf = new Float32Array(an.frequencyBinCount);
    timer = setInterval(tick, 25);
    setState('on');
    return true;
  }
  function stop() {
    clearInterval(timer);
    if (stream) stream.getTracks().forEach(t => t.stop());
    if (src) src.disconnect();
    stream = src = null;
    setState('off');
  }

  // YIN on W samples ending at the newest: returns { freq, clarity }
  const W = 1024;
  let dbuf = null;
  function yin(x) {
    const minTau = Math.floor(sr / 1100), maxTau = Math.ceil(sr / 70);
    const start = x.length - W - maxTau;
    if (!dbuf || dbuf.length !== maxTau + 1) dbuf = new Float32Array(maxTau + 1);
    const d = dbuf;
    d[0] = 1;
    let sum = 0;
    for (let tau = 1; tau <= maxTau; tau++) {
      let acc = 0;
      for (let j = 0; j < W; j++) { const v = x[start + j] - x[start + j + tau]; acc += v * v; }
      sum += acc;
      d[tau] = sum > 0 ? acc * tau / sum : 1;
    }
    let tau = -1;
    for (let t = minTau; t <= maxTau; t++) if (d[t] < 0.12) { while (t + 1 <= maxTau && d[t + 1] < d[t]) t++; tau = t; break; }
    if (tau < 0) { let best = minTau; for (let t = minTau; t <= maxTau; t++) if (d[t] < d[best]) best = t; if (d[best] > 0.35) return { freq: 0, clarity: 0 }; tau = best; }
    const a = d[tau - 1] ?? d[tau], b = d[tau], c = d[tau + 1] ?? d[tau];
    const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
    const t2 = tau + (Math.abs(shift) < 1 ? shift : 0);
    return { freq: sr / t2, clarity: 1 - b };
  }

  function chromaNow() {
    an.getFloatFrequencyData(fbuf);
    const c = new Float32Array(12);
    const binHz = sr / an.fftSize;
    for (let k = Math.ceil(70 / binHz); k < Math.min(fbuf.length, 1700 / binHz); k++) {
      const db = fbuf[k];
      if (db < -90) continue;
      const mag = Math.pow(10, db / 20);
      const m = 69 + 12 * Math.log2(k * binHz / 440);
      const near = Math.round(m), w = 1 - 2 * Math.abs(m - near);
      if (w <= 0) continue;
      c[((near % 12) + 12) % 12] += mag * mag * w;
    }
    const total = c.reduce((a, b) => a + b, 0) || 1;
    return Array.from(c, v => v / total);
  }

  function tick() {
    if (!an) return;
    an.getFloatTimeDomainData(buf);
    const n = buf.length;
    let e = 0, el = 0, lp = 0;
    const a = 1 - Math.exp(-2 * Math.PI * 900 / sr); // a gentle low-pass at ~900 Hz for onsets
    for (let i = n - 1024; i < n; i++) { e += buf[i] * buf[i]; lp += a * (buf[i] - lp); el += lp * lp; }
    const rms = Math.sqrt(e / 1024), low = Math.sqrt(el / 1024);
    const now = performance.now();
    // onset: a clear jump in loudness over the last moment
    // (on the low-passed signal: guitar attacks are mostly below 1 kHz, a metronome click from the speakers isn't)
    env = env * 0.92 + low * 0.08;
    if (low > 0.01 && low > prevRms * 1.5 && low > env * 1.4 && now - lastOnset > 90) {
      lastOnset = now;
      onsetSinceNote = true;
      emit('onset', { time: now - delay(), rms });
    }
    prevRms = low;
    // pitch
    let freq = 0, clarity = 0, midi = null;
    if (rms > 0.004) {
      ({ freq, clarity } = yin(buf));
      const A4 = (self.UI && UI.store.get('guitar', {}).a4) || 440;
      if (freq > 0 && clarity > 0.8) midi = 69 + 12 * Math.log2(freq / A4);
    }
    emit('frame', { rms, freq, clarity, midi, time: now });
    // a note: a steady pitch for two frames, after an onset (or a new pitch without one, as in a hammer-on)
    if (midi !== null) {
      const m = Math.round(midi);
      if (m === stableMidi) stableCount++; else { stableMidi = m; stableCount = 1; }
      if (stableCount >= 2 && (onsetSinceNote || m !== noteMidi)) {
        const recent = now - lastOnset < 250;
        emit('note', { midi: m, cents: Math.round((midi - m) * 100), freq, time: recent ? lastOnset - delay() : now - 60 - delay() });
        noteMidi = m;
        onsetSinceNote = false;
      }
    } else if (rms < 0.003) { stableMidi = null; stableCount = 0; noteMidi = null; }
    if (wantChroma > 0) {
      chromaLog.push({ time: now, c: chromaNow() });
      while (chromaLog.length && chromaLog[0].time < now - 4000) chromaLog.shift();
    }
  }

  function chromaBetween(t0, t1) {
    const frames = chromaLog.filter(f => f.time >= t0 && f.time <= t1);
    const c = Array(12).fill(0);
    for (const f of frames) for (let i = 0; i < 12; i++) c[i] += f.c[i];
    const total = c.reduce((a, b) => a + b, 0) || 1;
    return frames.length ? c.map(v => v / total) : null;
  }
  const chordScore = (chroma, pcs) => chroma ? pcs.reduce((a, p) => a + chroma[p], 0) : 0;

  self.Mic = {
    start, stop,
    on(type, fn) { listeners[type].add(fn); if (type === 'state') fn(state); return () => listeners[type].delete(fn); },
    get state() { return state; },
    // chroma is only worked out while a page asks for it
    wantChroma(on) { wantChroma += on ? 1 : -1; },
    chromaBetween, chordScore,
  };
})();
