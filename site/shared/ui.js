// The frame every drill shares: the top bar (score, MIDI light, sound, stats, settings), the settings
// and stats dialogs, multiple-choice buttons, feedback, and the progress kept on this device.
//
//   const page = UI.page({ drill: 'note-reading', title: 'Note reading',
//                          settings: [...spec], defaults: {...}, describe: key => 'F♯5 (treble)',
//                          onSettings: s => restart(s) });
//   page.ask('treble:F#5')          start the clock for a question
//   page.answer(true)               record it: returns the time in ms
//   page.pick(['treble:C4', ...])   the next question, weighted towards weak and slow ones
(function () {
  const ED = self.EDITION || {};
  const P = ED.slug || 'music-academy';

  // ---------- storage (localStorage, this device only) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(P + ':' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(P + ':' + k, JSON.stringify(v)); } catch (e) { /* private mode or full */ } },
    del(k) { try { localStorage.removeItem(P + ':' + k); } catch (e) {} },
    keys() { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(P + ':')) out.push(k.slice(P.length + 1)); } } catch (e) {} return out; },
  };

  // latency: how late (ms) this setup's played notes arrive compared to what is heard, measured in the metronome
  const prefs = Object.assign({ names: 'en', sound: true, feedback: true, keyboard: true, latency: 0 }, store.get('prefs', {}));
  const setPref = (k, v) => { prefs[k] = v; store.set('prefs', prefs); applyPrefs(); };
  function applyPrefs() {
    if (self.Sound) { Sound.enabled = prefs.sound; Sound.feedback = prefs.feedback; }
    document.documentElement.classList.toggle('no-keyboard', !prefs.keyboard);
  }
  applyPrefs();

  const noteName = (n, opts = {}) => Theory.name(n, { lang: prefs.names, ...opts });
  const keyName = key => Theory.keyName(key, { lang: prefs.names });
  const chordName = (root, type, opts = {}) => Theory.chordName(root, type, { lang: prefs.names, ...opts });

  // ---------- progress per question ----------
  // stats:<drill> = { <item>: { n: tries, ok: right, acc: recent accuracy 0..1, t: recent time ms, last } }
  const cache = {};
  const stats = drill => (cache[drill] ||= store.get('stats:' + drill, {}));
  function record(drill, item, ok, ms) {
    const all = stats(drill);
    const s = all[item] || { n: 0, ok: 0, acc: 0, t: 0 };
    s.n++;
    if (ok) s.ok++;
    s.acc = s.n === 1 ? (ok ? 1 : 0) : s.acc * 0.7 + (ok ? 0.3 : 0);
    if (ok) s.t = s.t ? Math.round(s.t * 0.7 + ms * 0.3) : Math.round(ms);
    s.last = Date.now();
    all[item] = s;
    store.set('stats:' + drill, all);
    return s;
  }
  // new items first, then the ones often missed or slow
  function weight(s, target) {
    if (!s) return 3;
    const slow = s.t ? Math.min(3, Math.max(0, (s.t - target) / target)) : 1.5;
    return 0.35 + 4 * (1 - s.acc) + slow;
  }
  function pick(drill, items, { target = 1500, avoid = [] } = {}) {
    const st = stats(drill);
    let c = items.filter(k => !avoid.includes(k));
    if (!c.length) c = items;
    const w = c.map(k => weight(st[k], target));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i]; }
    return c[c.length - 1];
  }

  // sessions = [{ id, drill, start, n, ok, ms (sum of right answers' times) }], newest last
  function saveSession(sess) {
    if (!sess.n) return;
    const all = store.get('sessions', []);
    const i = all.findIndex(s => s.id === sess.id);
    const row = { id: sess.id, drill: sess.drill, start: sess.start, n: sess.n, ok: sess.ok, ms: sess.ms };
    if (i >= 0) all[i] = row; else all.push(row);
    store.set('sessions', all.slice(-500));
  }

  // ---------- small helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'html') el.innerHTML = v;
      else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) if (kid != null) el.append(kid);
    return el;
  };
  const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rand = a => a[Math.floor(Math.random() * a.length)];
  const sec = ms => (ms / 1000).toFixed(ms < 10000 ? 1 : 0) + ' s';

  // ---------- settings dialog ----------
  // spec: [{ id, label, type: 'choice' | 'multi' | 'number', options: [[value, label], ...], min, max, format, hint, show: s => bool }]
  function settingsDialog(spec, values, onSave) {
    const draft = JSON.parse(JSON.stringify(values));
    const dlg = h('dialog', { class: 'sheet' });
    const body = h('div', { class: 'sheet-body' });
    function draw() {
      body.innerHTML = '';
      for (const f of spec) {
        if (f.show && !f.show(draft)) continue;
        const row = h('div', { class: 'field' }, h('div', { class: 'field-label' }, f.label));
        if (f.type === 'number') {
          const out = h('span', { class: 'num' }, f.format ? f.format(draft[f.id]) : draft[f.id]);
          const input = h('input', { type: 'range', min: f.min, max: f.max, step: f.step || 1, value: draft[f.id],
            oninput: e => { draft[f.id] = +e.target.value; out.textContent = f.format ? f.format(draft[f.id]) : draft[f.id]; } });
          row.append(h('div', { class: 'range' }, input, out));
        } else {
          const seg = h('div', { class: 'seg' });
          for (const [v, label] of f.options) {
            const on = f.type === 'multi' ? draft[f.id].includes(v) : draft[f.id] === v;
            seg.append(h('button', { type: 'button', class: on ? 'on' : '', onclick: () => {
              if (f.type === 'multi') {
                const set = new Set(draft[f.id]);
                if (set.has(v)) { if (set.size > 1) set.delete(v); } else set.add(v);
                draft[f.id] = f.options.map(o => o[0]).filter(x => set.has(x));
              } else draft[f.id] = v;
              draw();
            } }, label));
          }
          row.append(seg);
        }
        if (f.hint) row.append(h('div', { class: 'hint' }, f.hint));
        body.append(row);
      }
    }
    draw();
    dlg.append(h('h2', {}, 'Settings'), body, h('div', { class: 'sheet-actions' },
      h('button', { class: 'btn ghost', onclick: () => dlg.close() }, 'Cancel'),
      h('button', { class: 'btn primary', onclick: () => { dlg.close(); onSave(draft); } }, 'Start')));
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
  }

  // ---------- stats dialog: the weakest items of a drill ----------
  function statsDialog(drill, describe, onReset) {
    const all = stats(drill);
    const rows = Object.entries(all).map(([k, s]) => ({ k, s, w: weight(s, 1500) })).sort((a, b) => b.w - a.w);
    const dlg = h('dialog', { class: 'sheet' });
    const table = h('table', { class: 'stats' },
      h('thead', {}, h('tr', {}, h('th', {}, 'What'), h('th', {}, 'Recent'), h('th', {}, 'Time'), h('th', {}, 'Tries'))),
      h('tbody', {}, rows.slice(0, 40).map(({ k, s }) => h('tr', {},
        h('td', {}, describe ? describe(k) : k),
        h('td', { class: s.acc < 0.7 ? 'bad' : s.acc > 0.9 ? 'good' : '' }, Math.round(s.acc * 100) + ' %'),
        h('td', {}, s.t ? sec(s.t) : '–'),
        h('td', {}, String(s.n))))));
    dlg.append(h('h2', {}, 'Your weak spots'),
      h('p', { class: 'hint' }, rows.length ? 'Most-missed and slowest first. These come up more often.' : 'Nothing yet: practise a little first.'),
      h('div', { class: 'sheet-body' }, rows.length ? table : ''),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost danger', onclick: () => { if (confirm('Forget everything this drill has learned about you?')) { store.del('stats:' + drill); delete cache[drill]; dlg.close(); onReset && onReset(); } } }, 'Reset'),
        h('button', { class: 'btn primary', onclick: () => dlg.close() }, 'Close')));
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
  }

  // ---------- the page frame ----------
  function page(opts) {
    const { drill, title } = opts;
    let settings = Object.assign({}, opts.defaults, store.get('settings:' + drill, {}));
    document.title = `${title} · ${ED.name || 'Music Academy'}`;
    const app = $('#app');
    const hud = h('div', { class: 'hud' });
    const midiDot = h('button', { class: 'midi', title: 'MIDI', onclick: () => showMidiHelp() }, h('span', { class: 'dot' }), h('span', { class: 'midi-text' }, 'MIDI'));
    const soundBtn = h('button', { class: 'icon', title: 'Sound on/off', onclick: () => { setPref('sound', !prefs.sound); soundBtn.textContent = prefs.sound ? '🔊' : '🔇'; } }, prefs.sound ? '🔊' : '🔇');
    const kbBtn = h('button', { class: 'icon', title: 'On-screen keyboard', onclick: () => setPref('keyboard', !prefs.keyboard) }, '🎹');
    const statsBtn = h('button', { class: 'icon', title: 'Weak spots', onclick: () => statsDialog(drill, opts.describe, () => opts.onSettings(settings)) }, '📊');
    const setBtn = h('button', { class: 'icon', title: 'Settings', onclick: () => openSettings() }, '⚙️');
    const bar = h('header', { class: 'bar' },
      h('a', { class: 'home', href: '/', title: ED.name || 'Home' }, '‹'),
      h('h1', {}, title), opts.hud === false ? null : hud,
      h('div', { class: 'tools' }, ...Object.entries({ midi: midiDot, sound: soundBtn, keyboard: kbBtn, stats: statsBtn, settings: setBtn })
        .filter(([id]) => (opts.tools || ['midi', 'sound', 'keyboard', 'stats', 'settings']).includes(id)).map(([, el]) => el)));
    const prompt = h('div', { class: 'prompt' });
    const card = h('div', { class: 'card' });
    const feedback = h('div', { class: 'feedback' });
    const answers = h('div', { class: 'answers' });
    const keys = h('div', { class: 'keys' });
    app.append(bar, h('main', { class: 'stage' }, prompt, card, feedback, answers), keys);

    Input.onStatus(({ state, devices }) => {
      midiDot.dataset.state = state;
      midiDot.title = state === 'ready' ? 'MIDI: ' + devices.join(', ')
        : state === 'none' ? 'No MIDI keyboard connected'
        : state === 'unsupported' ? 'This browser has no Web MIDI (use Chrome or Edge)'
        : state === 'denied' ? 'MIDI access was refused' : 'MIDI';
      midiDot.querySelector('.midi-text').textContent = state === 'ready' ? devices[0] : 'MIDI';
    });
    Input.init();
    function showMidiHelp() {
      const s = Input.state;
      const msg = {
        ready: `Connected: ${Input.devices.join(', ')}. Play the answers on your keyboard.`,
        none: 'No MIDI keyboard found. Connect your digital piano by USB (or Bluetooth MIDI) and switch it on; it shows up here by itself.',
        unsupported: 'This browser can\'t read MIDI keyboards. Use Chrome or Edge on a computer or Android tablet (Safari and iPad can\'t), over https. The on-screen keyboard and the answer buttons work everywhere.',
        denied: 'MIDI access was refused. Allow it in the browser\'s site settings (the icon left of the address) and reload.',
      }[s] || 'Looking for MIDI keyboards…';
      alert(msg);
    }

    const sess = { id: Date.now().toString(36), drill, start: Date.now(), n: 0, ok: 0, ms: 0, streak: 0, best: 0 };
    let askedAt = 0, current = null;
    function drawHud() {
      const acc = sess.n ? Math.round(sess.ok / sess.n * 100) + ' %' : '–';
      const avg = sess.ok ? sec(sess.ms / sess.ok) : '–';
      hud.innerHTML = '';
      hud.append(
        h('span', { title: 'Right / asked' }, h('b', {}, `${sess.ok}/${sess.n}`)),
        h('span', { title: 'Accuracy this session' }, acc),
        h('span', { title: 'Average time for a right answer' }, '⏱ ' + avg),
        h('span', { title: 'Streak (best)' }, `🔥 ${sess.streak}` + (sess.best > sess.streak ? ` (${sess.best})` : '')));
    }
    drawHud();
    addEventListener('pagehide', () => saveSession(sess));
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveSession(sess); });

    let kb = null;
    if (opts.keyboard !== false) kb = Keyboard.create(keys, opts.keyboard || {});
    else keys.remove();

    function openSettings() {
      settingsDialog(opts.settings || [], settings, s => {
        settings = s;
        store.set('settings:' + drill, s);
        opts.onSettings(s);
      });
    }

    // number keys pick a multiple-choice answer
    let choiceHandler = null;
    addEventListener('keydown', e => {
      if (e.target.closest('dialog, input')) return;
      if (choiceHandler && /^[1-9]$/.test(e.key)) choiceHandler(+e.key - 1);
      if (opts.onKey) opts.onKey(e);
    });

    return {
      el: { prompt, card, feedback, answers, keys },
      kb,
      get settings() { return settings; },
      openSettings,
      ask(item) { current = item; askedAt = performance.now(); },
      // record an answer; for several tries at one question, only the first one counts
      answer(ok, { item = current, count = true } = {}) {
        const ms = performance.now() - askedAt;
        if (!count) return ms;
        sess.n++;
        if (ok) { sess.ok++; sess.ms += ms; sess.streak++; sess.best = Math.max(sess.best, sess.streak); } else sess.streak = 0;
        if (item) record(drill, item, ok, ms);
        drawHud();
        if (sess.n % 10 === 0) saveSession(sess);
        Sound.tick(ok);
        return ms;
      },
      pick: (items, o) => pick(drill, items, o),
      flash(ok, html) {
        feedback.className = 'feedback show ' + (ok === true ? 'ok' : ok === false ? 'bad' : 'info');
        feedback.innerHTML = html || '';
      },
      clearFlash() { feedback.className = 'feedback'; feedback.innerHTML = ''; },
      // multiple choice: [{ label, value, sub }] -> calls onPick(value, button)
      choices(options, onPick, { columns } = {}) {
        answers.innerHTML = '';
        const grid = h('div', { class: 'choices', style: columns ? `--cols:${columns}` : '' });
        const buttons = options.map((o, i) => h('button', { class: 'choice', 'data-i': i + 1, onclick: e => onPick(o.value, e.currentTarget) },
          h('span', { class: 'choice-label' }, o.label), o.sub ? h('span', { class: 'choice-sub' }, o.sub) : null));
        grid.append(...buttons);
        answers.append(grid);
        choiceHandler = i => buttons[i] && buttons[i].click();
        return buttons;
      },
      clearChoices() { answers.innerHTML = ''; choiceHandler = null; },
    };
  }

  // the home page's summary of a drill
  function summary(drill) {
    const sessions = store.get('sessions', []).filter(s => s.drill === drill);
    const today = new Date().toDateString();
    const t = sessions.filter(s => new Date(s.start).toDateString() === today);
    const sum = (a, k) => a.reduce((x, s) => x + s[k], 0);
    return {
      total: sum(sessions, 'n'),
      today: sum(t, 'n'),
      acc: sum(t, 'n') ? sum(t, 'ok') / sum(t, 'n') : null,
      avg: sum(t, 'ok') ? sum(t, 'ms') / sum(t, 'ok') : null,
      last: sessions.length ? sessions[sessions.length - 1].start : null,
    };
  }

  // everything this site keeps on the device, as a file and back
  function exportData() {
    const data = { site: P, exported: new Date().toISOString(), data: {} };
    for (const k of store.keys()) data.data[k] = store.get(k);
    return data;
  }
  function importData(obj) {
    if (!obj || !obj.data) throw new Error('Not a progress file');
    for (const [k, v] of Object.entries(obj.data)) store.set(k, v);
  }

  self.UI = { store, prefs, setPref, noteName, keyName, chordName, page, pick, stats, summary, h, $, shuffle, rand, sec, exportData, importData };
})();

// offline support (needs https or localhost)
if ('serviceWorker' in navigator && self.isSecureContext) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
