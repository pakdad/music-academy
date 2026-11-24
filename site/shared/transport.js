// A clock in beats on the audio timeline, for the metronome and for playing pieces.
// Sounds are scheduled a little ahead on the audio clock (the only clock that keeps exact time),
// so a busy page never makes the beat stumble.
//
//   const tr = Transport.create({ bpm: 90, stepsPerBeat: 2, onStep: (step, time) => Sound.click(time) })
//   tr.at(4, time => Sound.chord([60, 64, 67], { when: time }))   something on beat 4
//   tr.start()  tr.stop()
//   tr.beatNow()          the beat being heard right now (fractional), for drawing
//   tr.perfOf(beat)       when that beat is heard, on the performance.now() clock (for judging input)
//   tr.beatOfPerf(ms)     the other way round
(function () {
  function create({ bpm = 90, stepsPerBeat = 1, onStep = null, lookahead = 0.15, startDelay = 0.15 } = {}) {
    const ctx = Sound.context();
    const spb = 60 / bpm;
    let t0 = null, timer = null, nextStep = 0;
    const queue = []; // { beat, fn }, sorted by beat

    const timeOf = beat => t0 + beat * spb;
    function pump() {
      const horizon = ctx.currentTime + lookahead;
      if (onStep) while (timeOf(nextStep / stepsPerBeat) < horizon) { onStep(nextStep, timeOf(nextStep / stepsPerBeat)); nextStep++; }
      while (queue.length && timeOf(queue[0].beat) < horizon) { const q = queue.shift(); q.fn(timeOf(q.beat)); }
    }
    const tr = {
      bpm, spb, msPerBeat: spb * 1000,
      get running() { return timer !== null; },
      at(beat, fn) {
        let i = queue.length;
        while (i > 0 && queue[i - 1].beat > beat) i--;
        queue.splice(i, 0, { beat, fn });
        return tr;
      },
      start() {
        Sound.unlock();
        t0 = ctx.currentTime + startDelay;
        nextStep = 0;
        pump();
        timer = setInterval(pump, 25);
        return tr;
      },
      stop() { clearInterval(timer); timer = null; queue.length = 0; },
      timeOf,
      beatNow: () => tr.beatOfPerf(performance.now()),
      perfOf: beat => Sound.perfAt(timeOf(beat)),
      beatOfPerf(ms) { const p0 = tr.perfOf(0); return (ms - p0) / tr.msPerBeat; },
    };
    return tr;
  }
  self.Transport = { create };
})();
