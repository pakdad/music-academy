// The toolbox: a round button in the corner of every page. It opens a panel to
//   check the inputs (MIDI keyboard, microphone, speakers), measure the delay of your setup,
//   run a metronome (it keeps going while you practise), and change the settings
//   (language, light or dark, look, note names, sound, guitar).
//   Toolbox.open('check' | 'delay' | 'metronome' | 'settings')
(function () {
  if (!self.UI || !document.body) return;
  const { h } = UI;
  const ED = self.EDITION || {};
  const TABS = [['check', 'right', t('Check')], ['delay', 'delay', t('Delay')], ['metronome', 'metronome', t('Metronome')], ['settings', 'settings', t('Settings')]];
  let panel = null, backdrop = null, current = 'check';
  const cleanups = [];
  const metro = { tr: null, bpm: UI.store.get('toolbox:bpm', 80), beats: UI.store.get('toolbox:beats', 4), raf: 0, dots: null }; // the toolbox metronome

  // scripts a page may not have loaded: fetched when the toolbox needs them
  const need = (global, src) => self[global] ? Promise.resolve() : new Promise((ok, fail) => {
    const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = fail; document.head.append(s);
  });

  // ---------- the button ----------
  const fab = h('button', { class: 'fab', title: t('Check, metronome and settings'), 'aria-label': t('Check, metronome and settings'), onclick: () => panel ? close() : open() },
    Icons.el('metronome', 30), h('span', { class: 'fab-dot' }));
  document.body.append(fab);
  // stay above the on-screen keyboard
  const place = () => {
    const keys = document.querySelector('.keys');
    const hk = keys && getComputedStyle(keys).display !== 'none' ? keys.offsetHeight : 0;
    document.documentElement.style.setProperty('--fab-bottom', hk + 'px');
  };
  addEventListener('load', place);
  addEventListener('resize', place);
  new MutationObserver(place).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  setTimeout(place, 300);
  function status() {
    const midi = self.Input && Input.state === 'ready', mic = self.Mic && Mic.state === 'on';
    fab.classList.toggle('live', !!(midi || mic));
    fab.classList.toggle('ticking', !!metro.tr);
  }
  if (self.Input) Input.onStatus(status);
  if (self.Mic) Mic.on('state', status);

  // ---------- the panel ----------
  function open(tab = current) {
    current = tab;
    if (!panel) {
      backdrop = h('div', { class: 'tb-backdrop', onclick: close });
      panel = h('section', { class: 'tb', role: 'dialog', 'aria-label': t('Check, metronome and settings') });
      document.body.append(backdrop, panel);
      requestAnimationFrame(() => { panel.classList.add('open'); backdrop.classList.add('open'); });
    }
    draw();
  }
  function close() {
    cleanups.splice(0).forEach(f => f());
    if (!panel) return;
    const p = panel, b = backdrop;
    panel = backdrop = null;
    p.classList.remove('open'); b.classList.remove('open');
    setTimeout(() => { p.remove(); b.remove(); }, 200);
  }
  addEventListener('keydown', e => { if (e.key === 'Escape' && panel) close(); });

  function draw() {
    cleanups.splice(0).forEach(f => f());
    panel.innerHTML = '';
    const tabs = h('nav', { class: 'tb-tabs' }, TABS.map(([id, icon, label]) =>
      h('button', { class: 'tb-tab' + (id === current ? ' on' : ''), onclick: () => { current = id; draw(); } }, Icons.el(icon, 20), h('span', {}, label))),
      h('button', { class: 'iconbtn tb-close', title: t('Close'), 'aria-label': t('Close'), onclick: close }, Icons.el('close')));
    const body = h('div', { class: 'tb-body' });
    panel.append(tabs, body);
    ({ check, delay, metronome, settings })[current](body);
  }
  const card = (icon, title, ...kids) => h('div', { class: 'tb-card' }, h('div', { class: 'tb-card-head' }, Icons.el(icon, 22), h('h3', {}, title)), ...kids);
  const seg = (options, value, onPick) => {
    const el = h('div', { class: 'seg' });
    const paint = v => { el.innerHTML = ''; for (const [val, label, icon] of options) el.append(h('button', { class: val === v ? 'on' : '', onclick: () => { onPick(val); paint(val); } }, icon ? Icons.el(icon, 18) : null, label)); };
    paint(value);
    return el;
  };

  // ---------- check: are the inputs and the speakers working? ----------
  function check(body) {
    // MIDI
    if (self.Input) {
      const st = h('p', { class: 'tb-status' }), live = h('div', { class: 'tb-live' }, t('Play a key: it shows up here.'));
      const help = h('p', { class: 'hint' });
      body.append(card('midi', t('MIDI keyboard'), st, live, help));
      Input.init();
      const off1 = Input.onStatus(({ state, devices }) => {
        st.className = 'tb-status ' + (state === 'ready' ? 'ok' : state === 'unsupported' || state === 'denied' ? 'warn' : '');
        st.textContent = state === 'ready' ? t('Connected: {devices}', { devices: devices.join(', ') })
          : state === 'none' ? t('No MIDI keyboard connected') : state === 'unsupported' ? t('This browser has no Web MIDI (use Chrome or Edge)')
          : state === 'denied' ? t('MIDI access was refused') : t('Looking for MIDI keyboards…');
        help.textContent = state === 'ready' ? '' : state === 'none' ? t('Connect your digital piano by USB (or Bluetooth MIDI) and switch it on; it shows up here by itself.')
          : state === 'unsupported' ? t('Safari and iPad can\'t read MIDI keyboards. Use Chrome or Edge on a computer or an Android tablet; the on-screen keyboard and the answer buttons work everywhere.')
          : state === 'denied' ? t('Allow MIDI in the browser\'s site settings (the icon left of the address) and reload.') : '';
      });
      const off2 = Input.on(e => {
        if (e.type !== 'on' || e.source !== 'midi') return;
        live.innerHTML = `${Icons.svg('check', 18)} <b>${UI.noteName(Theory.spell(e.midi, 0), { octave: true })}</b> · ${t('velocity {n}', { n: Math.round(e.vel * 127) })}`;
        live.classList.remove('flash'); void live.offsetWidth; live.classList.add('flash');
      });
      cleanups.push(off1, off2);
    }
    // microphone
    const mst = h('p', { class: 'tb-status' }), meter = h('div', { class: 'meter' }, h('span'));
    const heard = h('div', { class: 'tb-live' }, t('Play or sing a note: it shows up here.'));
    const toggle = h('button', { class: 'btn' });
    body.append(card('mic', t('Microphone'), mst, h('div', { class: 'row left' }, toggle), meter, heard, h('p', { class: 'hint' }, t('For the guitar, and for clapping or strumming along with the metronome. Nothing is recorded or sent anywhere.'))));
    need('Mic', '/shared/mic.js').then(() => {
      if (!panel) return;
      toggle.onclick = () => Mic.state === 'on' ? Mic.stop() : Mic.start();
      const off1 = Mic.on('state', s => {
        toggle.innerHTML = '';
        toggle.append(Icons.el(s === 'on' ? 'stop' : 'mic', 18), s === 'on' ? t('Turn off') : t('Turn on'));
        mst.className = 'tb-status ' + (s === 'on' ? 'ok' : s === 'denied' || s === 'unsupported' ? 'warn' : '');
        mst.textContent = { on: t('Listening'), asking: t('Asking for the microphone…'), denied: t('The microphone is blocked: allow it in the browser\'s site settings and reload.'), unsupported: t('This browser can\'t use the microphone here (it needs https).') }[s] || t('Microphone off');
        status();
      });
      const bar = meter.firstChild;
      const off2 = Mic.on('frame', f => {
        bar.style.width = Math.min(100, Math.round(Math.sqrt(f.rms) * 220)) + '%';
        if (f.midi !== null) heard.innerHTML = `${Icons.svg('check', 18)} <b>${UI.noteName(Theory.spell(Math.round(f.midi), 0), { octave: true })}</b> · ${Math.round(f.freq)} Hz`;
      });
      cleanups.push(off1, off2);
    });
    // speakers
    body.append(card('sound', t('Speakers'), h('div', { class: 'row left' },
      h('button', { class: 'btn', onclick: () => { const was = Sound.enabled; Sound.enabled = true; Sound.unlock(); Sound.note(69, { dur: 1 }); Sound.click(null, 2); Sound.enabled = was; } }, Icons.el('play', 18), t('Play a test sound'))),
      h('p', { class: 'hint' }, t('You should hear a tone and a click. If not, check the volume and that sound is on in the settings.'))));
  }

  // ---------- delay: how late do played notes arrive? ----------
  function delay(body) {
    const cur = h('p', { class: 'tb-status' });
    const show = () => { cur.textContent = t('MIDI keyboard and tapping: {a} ms · Microphone: {b} ms', { a: Math.round(UI.prefs.latency || 0), b: Math.round(UI.prefs.micLatency || 0) }); };
    show();
    const count = h('div', { class: 'tb-count' }, '');
    const pad = h('button', { class: 'pad', onpointerdown: e => { e.preventDefault(); hit(e.timeStamp || performance.now(), 'tap'); } }, Icons.el('tap', 28), t('Tap here with the click'));
    const go = h('button', { class: 'btn primary', onclick: () => start() }, Icons.el('play', 18), t('Start'));
    body.append(card('delay', t('Delay'), h('p', {}, t('Play one note exactly with each click, 12 times: on your MIDI keyboard, on the guitar or clapping (microphone on), or tap the pad. The delay found is taken off every note from then on.')),
      cur, h('div', { class: 'row left' }, go, h('button', { class: 'btn ghost', onclick: () => { UI.setPref('latency', 0); UI.setPref('micLatency', 0); show(); } }, t('Reset'))), count, pad));
    let run = null;
    async function start() {
      await need('Transport', '/shared/transport.js');
      if (run) run.tr.stop();
      metroStop();
      if (self.Mic) await need('Mic', '/shared/mic.js');
      Sound.unlock();
      const tr = Transport.create({ bpm: 80, onStep: (s, time) => { if (s < 16) Sound.click(time, s % 4 === 0 ? 2 : 1); } });
      run = { tr, offs: { midi: [], tap: [], mic: [] } };
      tr.start();
      count.textContent = t('Listen to 4 clicks, then play along…');
    }
    function hit(time, source) {
      if (!run) return;
      const b = run.tr.beatOfPerf(time);
      if (b < 3.5) return;
      const n = Math.round(b);
      let off = time - run.tr.perfOf(n);
      if (source === 'mic') off += (UI.prefs.micLatency || 0); // the microphone's times already have the old correction off
      run.offs[source].push(off);
      const got = run.offs[source].length;
      count.textContent = t('{n} of 12', { n: got });
      if (got >= 12) {
        const sorted = run.offs[source].slice(2).sort((x, y) => x - y);
        const med = Math.round(sorted[Math.floor(sorted.length / 2)]);
        run.tr.stop(); run = null;
        if (source === 'mic') UI.setPref('micLatency', Math.max(-50, Math.min(300, med)));
        else UI.setPref('latency', Math.max(-50, Math.min(250, med)));
        count.textContent = t('Measured: {n} ms. Saved.', { n: med });
        show();
      }
    }
    const off1 = self.Input ? Input.on(e => { if (e.type === 'on') hit(e.time, e.source === 'midi' ? 'midi' : 'tap'); }) : () => {};
    const off2 = self.Mic ? Mic.on('onset', o => hit(o.time, 'mic')) : () => {};
    const key = e => { if ((e.code === 'Space' || e.code === 'KeyJ') && !e.repeat) { e.preventDefault(); hit(e.timeStamp || performance.now(), 'tap'); } };
    addEventListener('keydown', key);
    cleanups.push(off1, off2, () => removeEventListener('keydown', key), () => { if (run) { run.tr.stop(); run = null; } });
  }

  // ---------- metronome: keeps running while the panel is closed ----------
  function metroStart() {
    need('Transport', '/shared/transport.js').then(() => {
      metroStop();
      Sound.unlock();
      metro.tr = Transport.create({ bpm: metro.bpm, onStep: (s, time) => Sound.click(time, s % metro.beats === 0 ? 2 : 1) });
      metro.tr.own = true;
      metro.tr.start();
      status();
      const loop = () => {
        if (!metro.tr) return;
        if (metro.dots) { const b = metro.tr.beatNow(); [...metro.dots.children].forEach((d, i) => d.classList.toggle('on', b >= 0 && Math.floor(b) % metro.beats === i && b % 1 < 0.3)); }
        metro.raf = requestAnimationFrame(loop);
      };
      metro.raf = requestAnimationFrame(loop);
      if (panel && current === 'metronome') draw();
    });
  }
  function metroStop() {
    if (metro.tr) { metro.tr.stop(); metro.tr = null; cancelAnimationFrame(metro.raf); }
    status();
    if (panel && current === 'metronome') draw();
  }
  // an exercise starting its own clock stops this one
  document.addEventListener('transport-start', e => { if (metro.tr && e.detail !== metro.tr) metroStop(); });
  function metronome(body) {
    const out = h('div', { class: 'bpm' });
    const paint = () => { out.innerHTML = `${metro.bpm}<small>${t('beats per minute')}</small>`; slider.value = metro.bpm; };
    const set = v => { metro.bpm = Math.max(30, Math.min(240, Math.round(v))); UI.store.set('toolbox:bpm', metro.bpm); paint(); if (metro.tr) { clearTimeout(set.t); set.t = setTimeout(metroStart, 250); } };
    const slider = h('input', { type: 'range', min: 30, max: 240, value: metro.bpm, oninput: e => set(+e.target.value) });
    let taps = [];
    const tap = () => { const now = performance.now(); if (taps.length && now - taps[taps.length - 1] > 2000) taps = []; taps.push(now); if (taps.length >= 3) { const iv = taps.slice(-5).map((x, i, a) => i ? x - a[i - 1] : 0).slice(1); set(60000 / (iv.reduce((a, b) => a + b, 0) / iv.length)); } };
    metro.dots = h('div', { class: 'beats' }, Array.from({ length: metro.beats }, (_, i) => h('span', { class: i === 0 ? 'first' : '' })));
    const go = h('button', { class: 'btn primary big', onclick: () => metro.tr ? metroStop() : metroStart() }, Icons.el(metro.tr ? 'stop' : 'play', 20), metro.tr ? t('Stop') : t('Start'));
    body.append(card('metronome', t('Metronome'),
      h('div', { class: 'bpm-row' }, h('button', { class: 'btn round', 'aria-label': '−', onclick: () => set(metro.bpm - 1) }, Icons.el('minus')), out, h('button', { class: 'btn round', 'aria-label': '+', onclick: () => set(metro.bpm + 1) }, Icons.el('plus'))),
      slider, metro.dots,
      h('div', { class: 'row' }, go, h('button', { class: 'btn', onclick: tap }, Icons.el('hand', 18), t('Tap tempo'))),
      h('div', { class: 'tb-field' }, h('span', {}, t('Beats per bar')), seg([[2, '2'], [3, '3'], [4, '4'], [6, '6']], metro.beats, v => { metro.beats = v; UI.store.set('toolbox:beats', v); if (metro.tr) metroStart(); draw(); })),
      h('p', { class: 'hint' }, t('It keeps going while you practise; close the panel and play along. Exercises with their own metronome stop it.'))));
    paint();
  }

  // ---------- settings ----------
  function settings(body) {
    const P = UI.prefs;
    const autoLang = I18N.browserLang === 'de' ? 'Deutsch' : 'English';
    const field = (label, el) => h('div', { class: 'tb-field' }, h('span', {}, label), el);
    body.append(card('globe', t('Language'), seg([['auto', t('Auto ({lang})', { lang: autoLang })], ['en', 'English'], ['de', 'Deutsch']], P.lang === 'en' || P.lang === 'de' ? P.lang : 'auto', v => {
      if (v !== 'auto') UI.setPref('names', v); else UI.setPref('names', I18N.browserLang);
      UI.setPref('lang', v);
    })));
    body.append(card('auto', t('Look'),
      field(t('Light or dark'), seg([['auto', t('Auto'), 'auto'], ['light', t('Light'), 'sun'], ['dark', t('Dark'), 'moon']], P.mode || 'auto', v => UI.setPref('mode', v))),
      field(t('Colours'), seg([['color', 'Pakdad'], ['mono', t('Black & white')]], P.theme === 'mono' ? 'mono' : 'color', v => UI.setPref('theme', v)))));
    body.append(card('notes', t('Music'),
      field(t('Note names'), seg([['en', 'C D E F G A B'], ['de', 'C D E F G A H']], P.names, v => UI.setPref('names', v))),
      field(t('Sound'), seg([['all', t('Music and clicks'), 'sound'], ['music', t('Music only')], ['off', t('Off'), 'mute']], P.sound ? (P.feedback ? 'all' : 'music') : 'off', v => { UI.setPref('sound', v !== 'off'); UI.setPref('feedback', v === 'all'); }))));
    if ((ED.instruments || []).includes('guitar') && self.Guitar) {
      const G = () => UI.store.get('guitar', {});
      const setG = (k, v) => { const g = G(); g[k] = v; UI.store.set('guitar', g); };
      const sel = (options, value, onChange) => { const s = h('select', { class: 'text', onchange: e => onChange(e.target.value) }, options.map(([v, l]) => h('option', { value: v, selected: String(v) === String(value) }, l))); return s; };
      body.append(card('guitar', t('Guitar'),
        field(t('Tuning'), sel(Object.entries(Guitar.TUNINGS).map(([id, tu]) => [id, t(tu.name)]), G().tuning || 'standard', v => setG('tuning', v))),
        field(t('Capo'), sel([0, 1, 2, 3, 4, 5, 7].map(n => [n, n ? t('Fret {n}', { n }) : t('None')]), G().capo || 0, v => setG('capo', +v))),
        field(t('Hand'), seg([[false, t('Right-handed')], [true, t('Left-handed (mirrored)')]], !!G().left, v => setG('left', v)))));
    }
    body.append(h('a', { class: 'tb-link', href: '/#progress', onclick: close }, Icons.el('download', 18), t('Save or load your progress')));
  }

  self.Toolbox = { open, close };
})();
