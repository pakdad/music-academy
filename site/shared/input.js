// What the player plays: a MIDI keyboard (Web MIDI: Chrome, Edge, Opera, Android Chrome) or the
// on-screen keyboard. Drills listen to one stream and don't care where a note came from.
//   Input.on(e => { e.type: 'on' | 'off', e.midi, e.vel, e.source: 'midi' | 'screen', e.time })
//   Input.held          the keys down right now (a Set of MIDI numbers)
//   Input.onStatus(fn)  fn({ state: 'unsupported' | 'denied' | 'none' | 'ready' | 'waiting', devices: [names] })
(function () {
  const listeners = new Set();
  const statusListeners = new Set();
  const held = new Set();
  let state = 'waiting', devices = [];

  // time: when it happened, on the performance.now() clock (MIDI messages carry their own timestamp)
  function emit(type, midi, vel, source, time = performance.now()) {
    if (type === 'on') held.add(midi); else held.delete(midi);
    const e = { type, midi, vel, source, time };
    for (const fn of [...listeners]) fn(e);
  }
  function setStatus(s) {
    state = s;
    for (const fn of statusListeners) fn({ state, devices });
  }

  function onMessage(e) {
    const [status, d1, d2] = e.data;
    const cmd = status & 0xf0;
    const time = e.timeStamp > 0 && e.timeStamp <= performance.now() + 5 ? e.timeStamp : performance.now();
    if (cmd === 0x90 && d2 > 0) emit('on', d1, d2 / 127, 'midi', time);
    else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) emit('off', d1, 0, 'midi', time);
  }

  let started = false;
  async function init() {
    if (started) return;
    started = true;
    if (!navigator.requestMIDIAccess || !self.isSecureContext) return setStatus('unsupported');
    let access;
    try { access = await navigator.requestMIDIAccess(); } catch (err) { return setStatus('denied'); }
    const hook = () => {
      devices = [];
      for (const input of access.inputs.values()) {
        if (input.state === 'disconnected') continue;
        input.onmidimessage = onMessage;
        devices.push(input.name);
      }
      // keys held on a device that went away
      if (!devices.length) for (const m of [...held]) emit('off', m, 0, 'midi');
      setStatus(devices.length ? 'ready' : 'none');
    };
    access.onstatechange = hook;
    hook();
  }

  self.Input = {
    init,
    held,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    onStatus(fn) { statusListeners.add(fn); fn({ state, devices }); return () => statusListeners.delete(fn); },
    press: (m, vel = 0.7, time) => emit('on', m, vel, 'screen', time),
    release: m => emit('off', m, 0, 'screen'),
    get state() { return state; },
    get devices() { return devices; },
  };
})();
