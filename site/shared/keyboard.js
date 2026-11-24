// An on-screen piano keyboard. It plays into Input like a MIDI keyboard does, and shows what's held
// (from either source) and what a drill marks.
//   const kb = Keyboard.create(el, { lo: 36, hi: 84 })
//   kb.mark(60, 'good' | 'bad' | 'hint'), kb.clear(), kb.setRange(lo, hi)
(function () {
  const BLACK = new Set([1, 3, 6, 8, 10]);
  const isBlack = m => BLACK.has(((m % 12) + 12) % 12);

  function create(el, { lo = 36, hi = 84, sound = true } = {}) {
    const marks = new Map();
    let keys = new Map();

    function render() {
      // start and end on white keys
      while (isBlack(lo)) lo--;
      while (isBlack(hi)) hi++;
      const whites = [];
      for (let m = lo; m <= hi; m++) if (!isBlack(m)) whites.push(m);
      const W = 24, H = 110, BW = 15, BH = 68;
      const parts = [];
      const x = {};
      whites.forEach((m, i) => { x[m] = i * W; });
      for (const m of whites) {
        parts.push(`<rect class="key white" data-m="${m}" x="${x[m] + 0.5}" y="0.5" width="${W - 1}" height="${H}" rx="3"/>`);
        if (m % 12 === 0) parts.push(`<text class="key-label" x="${x[m] + W / 2}" y="${H - 8}" text-anchor="middle">C${m / 12 - 1}</text>`);
      }
      for (let m = lo; m <= hi; m++) if (isBlack(m)) {
        parts.push(`<rect class="key black" data-m="${m}" x="${x[m - 1] + W - BW / 2}" y="0.5" width="${BW}" height="${BH}" rx="2"/>`);
      }
      const width = whites.length * W;
      el.innerHTML = `<svg class="keyboard" viewBox="0 0 ${width + 1} ${H + 2}">${parts.join('')}</svg>`;
      keys = new Map([...el.querySelectorAll('.key')].map(k => [+k.dataset.m, k]));
      refresh();
      // middle C in view
      const c4 = keys.get(60);
      if (c4 && el.scrollWidth > el.clientWidth) el.scrollLeft = c4.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft - el.clientWidth / 2;
    }

    function refresh() {
      for (const [m, k] of keys) {
        k.classList.toggle('held', Input.held.has(m));
        k.classList.remove('good', 'bad', 'hint');
        if (marks.has(m)) k.classList.add(marks.get(m));
      }
    }

    // touch and mouse: each pointer holds one key; sliding moves to the next key (glissando)
    const down = new Map();
    const keyAt = (cx, cy) => { const t = document.elementFromPoint(cx, cy); return t && t.classList.contains('key') ? +t.dataset.m : null; };
    el.addEventListener('pointerdown', e => {
      const m = keyAt(e.clientX, e.clientY);
      if (m === null) return;
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      down.set(e.pointerId, m);
      if (sound) Sound.note(m, { dur: 0.6 });
      Input.press(m, 0.7, e.timeStamp);
    });
    el.addEventListener('pointermove', e => {
      if (!down.has(e.pointerId)) return;
      const m = keyAt(e.clientX, e.clientY);
      if (m === null || m === down.get(e.pointerId)) return;
      Input.release(down.get(e.pointerId));
      down.set(e.pointerId, m);
      if (sound) Sound.note(m, { dur: 0.6 });
      Input.press(m, 0.7, e.timeStamp);
    });
    const up = e => { if (!down.has(e.pointerId)) return; Input.release(down.get(e.pointerId)); down.delete(e.pointerId); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    Input.on(refresh);

    render();
    return {
      el,
      mark(m, cls) { marks.set(m, cls); refresh(); },
      clear() { marks.clear(); refresh(); },
      setRange(a, b) { if (a === lo && b === hi) return; lo = a; hi = b; render(); },
    };
  }

  self.Keyboard = { create, isBlack };
})();
