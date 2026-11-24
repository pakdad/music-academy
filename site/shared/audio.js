// A small piano-like synthesiser (Web Audio), for hearing chords, scales and progressions.
// Nothing to download: every sound is made on the device.
//   Sound.note(60)                      middle C
//   Sound.chord([48, 64, 67, 72], { at: 1 })
//   Sound.enabled = false               (the 🔊 button)
(function () {
  let ctx = null, master = null;

  function audio() {
    if (!ctx) {
      ctx = new (self.AudioContext || self.webkitAudioContext)();
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);

  // partials: [multiple, level]; higher notes get fewer and quieter overtones, like a real string
  function note(m, { at = 0, dur = 1.2, vel = 0.7 } = {}) {
    if (!Sound.enabled) return;
    const c = audio();
    const t = c.currentTime + 0.02 + at;
    const f0 = hz(m);
    const out = c.createGain();
    const peak = vel * 0.28 * (m < 48 ? 1.15 : 1);
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(peak, t + 0.006);
    out.gain.exponentialRampToValueAtTime(peak * 0.35, t + 0.35);
    out.gain.exponentialRampToValueAtTime(peak * 0.12, t + Math.max(0.5, dur));
    out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(Math.min(14000, f0 * 9), t);
    lp.frequency.exponentialRampToValueAtTime(Math.min(9000, f0 * 3.5), t + 0.6);
    lp.connect(out).connect(master);
    const partials = [[1, 1], [2, 0.45], [3, 0.18], [4, 0.1], [5, 0.05]].filter(([p]) => f0 * p < 9000);
    for (const [p, level] of partials) {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = 'sine';
      o.frequency.value = f0 * p * (1 + (p - 1) * 0.0004); // a touch of piano-string stretch
      g.gain.value = level / partials.length * 1.6;
      o.connect(g).connect(lp);
      o.start(t);
      o.stop(t + dur + 0.6);
    }
  }
  function chord(ms, opts = {}) { ms.forEach((m, i) => note(m, { ...opts, at: (opts.at || 0) + (opts.roll ? i * 0.03 : 0) })); }
  // [[midis...], ...] one after another
  function sequence(steps, { gap = 1.1, dur = 1.0, roll = false } = {}) {
    steps.forEach((ms, i) => chord([].concat(ms), { at: i * gap, dur, roll }));
    return steps.length * gap;
  }
  // short feedback sounds
  function tick(ok) {
    if (!Sound.enabled || !Sound.feedback) return;
    const c = audio(), t = c.currentTime + 0.01;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(ok ? 1320 : 180, t);
    g.gain.setValueAtTime(ok ? 0.05 : 0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (ok ? 0.08 : 0.18));
    o.connect(g).connect(master);
    o.start(t); o.stop(t + 0.2);
  }

  self.Sound = { enabled: true, feedback: true, note, chord, sequence, tick, unlock: () => audio() };
})();
