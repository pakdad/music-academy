// Plays guitar exercises written as pieces (shared/score.js with tab): wait for me, play along, listen.
// Input comes from the microphone (Mic 'note' events) or from clicks on the fretboard: player.input(midi, time).
//   const pl = GPlayer.create({ card, status, result, onFinish(score) })
//   pl.load(piece)  pl.start('wait' | 'play' | 'listen', { bpm, metronome })  pl.stop()  pl.input(midi, time)
(function () {
  const { h } = UI;
  function create({ card, status, result, onFinish = () => {}, onStep = () => {} }) {
    let piece = null, L = null, run = null, evEls = {}, ph = null;

    function load(p) { piece = p; stop(); render(); }
    function render() {
      const width = Math.max(44, Math.min(120, Math.round((card.clientWidth || 900) / 10.5)));
      L = Score.layout(piece, { width });
      card.innerHTML = L.svg;
      const svg = card.querySelector('svg');
      ph = svg.querySelector('.playhead');
      evEls = [...svg.querySelectorAll('.ev')].reduce((m, g) => (m[g.dataset.i] = g, m), {});
    }
    const cls = (e, c) => { const g = evEls[e.i]; if (!g) return; g.classList.remove('cur', 'good', 'off', 'bad'); if (c) g.classList.add(c); };
    function playhead(t) {
      const m = L.marks;
      let i = 0;
      while (i + 1 < m.length && m[i + 1].t <= t) i++;
      const a = m[i], b = m[i + 1];
      const x = b && b.sys === a.sys && b.t > a.t ? a.x + (b.x - a.x) * Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t))) : a.x;
      const box = L.systems[a.sys];
      ph.setAttribute('x', x - 8); ph.setAttribute('y', box.top); ph.setAttribute('height', box.bottom - box.top);
      ph.classList.add('on');
    }
    // octave slips of the pitch detector are forgiven; the pitch class must be right
    const matches = (want, got) => want === got || Math.abs(want - got) === 12;

    function start(mode, { bpm = 80, metronome = true } = {}) {
      stop();
      render();
      result.innerHTML = '';
      Sound.unlock();
      if (mode === 'wait') return startWait();
      startTimed(mode === 'listen', bpm, metronome);
    }
    function stop() {
      if (!run) return;
      run.tr && run.tr.stop();
      cancelAnimationFrame(run.raf);
      run = null;
      if (ph) ph.classList.remove('on');
    }

    function startWait() {
      const byT = new Map();
      for (const e of L.events) if (!e.rest) (byT.get(e.t) || byT.set(e.t, []).get(e.t)).push(e);
      const steps = [...byT.entries()].sort((a, b) => a[0] - b[0]).map(([t, evs]) => ({ t, evs, need: evs.flatMap(e => e.midis) }));
      run = { mode: 'wait', steps, i: 0, got: [], wrong: 0, clean: 0, missed: false };
      const show = () => { const s = steps[run.i]; s.evs.forEach(e => cls(e, 'cur')); playhead(s.t); onStep(s); };
      show();
      status.textContent = t('Play each note when it lights up: on your guitar (microphone) or by clicking the fretboard.');
      run.input = m => {
        const s = steps[run.i];
        const k = s.need.findIndex((x, j) => !run.got.includes(j) && matches(x, m));
        if (k < 0) { run.wrong++; run.missed = true; return 'bad'; }
        run.got.push(k);
        if (run.got.length < s.need.length) return 'good';
        s.evs.forEach(e => cls(e, run.missed ? 'off' : 'good'));
        if (!run.missed) run.clean++;
        run.i++; run.got = []; run.missed = false;
        if (run.i >= steps.length) { finishWait(); return 'good'; }
        show();
        return 'good';
      };
    }
    function finishWait() {
      const r = run; stop();
      const score = Math.round(r.clean / r.steps.length * 100);
      box(score, [t('{a} of {b} steps without a slip', { a: r.clean, b: r.steps.length }), r.wrong === 1 ? t('1 wrong note') : t('{n} wrong notes', { n: r.wrong })],
        score >= 90 ? t('Ready for “Play along”.') : t('Again, until it flows.'));
    }

    function startTimed(listen, bpm, metronome) {
      const [num, den] = piece.time;
      const countIn = listen ? 0 : L.L;
      const steps = den === 8 ? 2 : 1;
      const tr = Transport.create({
        bpm, stepsPerBeat: steps,
        onStep: (s, time) => {
          const q = s / steps - countIn;
          if (q >= L.length - 1e-9 || (q >= 0 && !metronome)) return;
          const inBar = ((q % L.L) + L.L) % L.L;
          Sound.click(time, inBar < 1e-6 ? 2 : Math.abs(inBar - Math.round(inBar)) < 1e-6 ? 1 : 0, q < 0 ? 1 : 0.7);
        },
      });
      const spb = tr.spb;
      if (listen) for (const e of L.events) if (!e.rest) tr.at(e.t + countIn, time => e.midis.forEach(m => Sound.pluck(m, { when: time, dur: Math.max(0.5, e.d * spb * 1.5) })));
      const expected = listen ? [] : L.events.filter(e => !e.rest).flatMap(e => e.midis.map(m => ({ e, m, beat: e.t + countIn, done: false })));
      for (const x of expected) x.e.judge = { n: x.e.midis.length, hit: 0, good: 0, miss: 0 };
      const msBeat = tr.msPerBeat;
      run = { mode: listen ? 'listen' : 'play', tr, expected, win: Math.min(280, Math.max(140, 0.45 * msBeat)), good: Math.max(70, 0.14 * msBeat), offsets: [], wrong: 0 };
      tr.start();
      const loop = () => {
        if (!run) return;
        const beat = tr.beatNow(), b = beat - countIn;
        if (b < 0) { status.innerHTML = `<span class="countin">${Math.floor(-b) + 1}</span>`; ph.classList.remove('on'); }
        else {
          status.textContent = listen ? t('Listen…') : t('Play along!');
          playhead(b);
          if (listen) for (const e of L.events) if (!e.rest) { const on = b >= e.t && b < e.t + e.d; if (on !== (evEls[e.i] && evEls[e.i].classList.contains('cur'))) evEls[e.i] && evEls[e.i].classList.toggle('cur', on); }
        }
        if (!listen) {
          const late = beat - run.win / msBeat;
          for (const x of expected) if (!x.done && x.beat < late) { x.done = true; x.e.judge.miss++; settle(x.e); }
        }
        if (b > L.length + 0.4) { if (listen) { stop(); status.textContent = ''; } else finishPlay(); return; }
        run.raf = requestAnimationFrame(loop);
      };
      run.raf = requestAnimationFrame(loop);
      run.input = (m, time) => {
        if (listen) return null;
        const at = tr.beatOfPerf(time);
        let best = null;
        for (const x of expected) if (!x.done && matches(x.m, m) && Math.abs(at - x.beat) * msBeat <= run.win && (!best || Math.abs(at - x.beat) < Math.abs(at - best.beat))) best = x;
        if (!best) { run.wrong++; return 'bad'; }
        best.done = true;
        const off = (at - best.beat) * msBeat;
        run.offsets.push(off);
        best.e.judge.hit++;
        if (Math.abs(off) <= run.good) best.e.judge.good++;
        settle(best.e);
        return 'good';
      };
    }
    function settle(e) { const j = e.judge; if (j.hit + j.miss < j.n) return; cls(e, j.miss ? 'bad' : j.good === j.n ? 'good' : 'off'); }
    function finishPlay() {
      const r = run; stop();
      const total = r.expected.length, hit = r.offsets.length, onTime = r.offsets.filter(o => Math.abs(o) <= r.good).length;
      const mean = hit ? r.offsets.reduce((a, b) => a + b, 0) / hit : 0;
      const score = Math.max(0, Math.round((onTime + 0.6 * (hit - onTime)) / total * 100 - 2 * r.wrong));
      const lean = Math.abs(mean) < 15 ? t('right on the beat') : mean > 0 ? t('{n} ms late on average (dragging)', { n: Math.round(mean) }) : t('{n} ms early on average (rushing)', { n: Math.round(-mean) });
      box(score, [t('{a} of {b} notes played ({p} %)', { a: hit, b: total, p: Math.round(hit / total * 100) }), t('{n} on time (within ±{ms} ms)', { n: onTime, ms: Math.round(r.good) }), hit ? lean : ''].filter(Boolean),
        score >= 90 ? t('Clean: try it a little faster.') : score >= 60 ? t('Getting there: once more, or a little slower.') : t('Slow it down (tempo slider) or use “Wait for me” first.'));
    }
    function box(score, lines, advice) {
      status.textContent = '';
      result.innerHTML = '';
      result.append(h('div', { class: 'card result-card' }, h('div', { class: 'big-score' }, score + ' %'), h('ul', {}, lines.map(l => h('li', {}, l))), h('p', { class: 'advice' }, advice)));
      onFinish(score);
    }

    return {
      load, start, stop, render,
      get running() { return !!run; },
      get mode() { return run && run.mode; },
      input(m, time = performance.now()) { return run && run.input ? run.input(m, time) : null; },
      get layout() { return L; },
    };
  }
  self.GPlayer = { create };
})();
