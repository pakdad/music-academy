// "Did they play this chord?" for MIDI and the on-screen keyboard.
//   const ci = ChordInput.create({ onResult: r => ... })   r = { ok, played, wrongNotes, bassWrong }
//   ci.expect([60, 64, 67], { bass: 4 })                   bass: the pitch class that must be lowest, or null
//
// Any octave and voicing counts. A wrong note counts the moment it's pressed. Notes still held from
// the previous chord are not counted as wrong (legato playing): the chord is right once what's held
// is exactly the chord. On-screen taps are collected one by one, since a mouse can't hold a chord.
(function () {
  const T = Theory;
  function create({ onResult }) {
    let target = [], bass = null, active = false, timer = null, bassTimer = null;
    const screen = new Set();
    const current = () => [...new Set([...Input.held, ...screen])].sort((a, b) => a - b);

    Input.on(e => {
      if (!active) return;
      if (e.type === 'on') {
        if (!target.includes(T.mod(e.midi, 12))) {
          const played = current();
          if (e.source === 'screen') screen.clear();
          return report({ ok: false, wrongNotes: [e.midi], played: [...new Set([...played, e.midi])].sort((a, b) => a - b) });
        }
        if (e.source === 'screen') screen.add(e.midi);
      }
      clearTimeout(timer);
      timer = setTimeout(check, 40);
    });

    function check() {
      if (!active) return;
      const cur = current();
      if (!T.sameSet(T.pcSet(cur), target)) return; // not complete yet, or old notes still down
      if (bass !== null && T.mod(cur[0], 12) !== bass) {
        // give a moment in case the bass note is still on its way
        clearTimeout(bassTimer);
        bassTimer = setTimeout(() => {
          const c = current();
          if (active && T.sameSet(T.pcSet(c), target) && T.mod(c[0], 12) !== bass) { screen.clear(); report({ ok: false, bassWrong: true, played: c }); }
        }, 350);
        return;
      }
      report({ ok: true, played: cur });
    }
    function report(r) {
      if (r.ok) { active = false; screen.clear(); }
      onResult(r);
    }
    return {
      expect(midis, { bass: b = null } = {}) {
        target = T.pcSet(midis); bass = b; screen.clear(); active = true;
        clearTimeout(timer); clearTimeout(bassTimer);
      },
      stop() { active = false; screen.clear(); },
    };
  }
  self.ChordInput = { create };
})();
