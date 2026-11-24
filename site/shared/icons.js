// Line icons, drawn for this site (24×24, 1.8 px strokes in the current colour).
//   Icons.svg('metronome')            an inline SVG string
//   Icons.svg('note-reading', 40)     a drill icon (they're drawn on a 48×48 grid)
(function () {
  const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
  const F = 'fill="currentColor" stroke="none"';
  // ---------- interface (24×24) ----------
  const UI = {
    home: `<path ${S} d="M3.5 10.5 12 3.5l8.5 7V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>`,
    back: `<path ${S} d="M15 4.5 7.5 12l7.5 7.5"/>`,
    close: `<path ${S} d="M6 6l12 12M18 6 6 18"/>`,
    check: `<path ${S} d="M4.5 12.5 9.5 17.5 19.5 6.5"/>`,
    settings: `<path ${S} d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle ${S} cx="15" cy="7" r="2.3"/><circle ${S} cx="9" cy="17" r="2.3"/>`,
    stats: `<path ${S} d="M4 20.5h16M6.5 20.5V12M12 20.5V5.5M17.5 20.5V9.5"/>`,
    keyboard: `<rect ${S} x="2.5" y="5" width="19" height="14" rx="2"/><path ${S} d="M8.8 19v-5M15.2 19v-5M12 19v-5"/><path ${F} d="M7.6 5h2.4v8.5H7.6zM14 5h2.4v8.5H14z"/>`,
    sound: `<path ${S} d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path ${S} d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>`,
    mute: `<path ${S} d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path ${S} d="M16 9.5l5 5M21 9.5l-5 5"/>`,
    mic: `<rect ${S} x="9" y="3" width="6" height="11" rx="3"/><path ${S} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>`,
    midi: `<circle ${S} cx="12" cy="12" r="9"/><path ${F} d="M11 6.2h2v2h-2z"/><circle ${F} cx="7.4" cy="10.4" r="1.1"/><circle ${F} cx="16.6" cy="10.4" r="1.1"/><circle ${F} cx="8.6" cy="15" r="1.1"/><circle ${F} cx="15.4" cy="15" r="1.1"/><circle ${F} cx="12" cy="11.6" r="1.1"/>`,
    metronome: `<path ${S} d="M9 3.5h6l4 17h-14z"/><path ${S} d="M7 15.5h10M12 15.5l4.5-9"/><circle ${F} cx="16.6" cy="6.3" r="1.5"/>`,
    delay: `<circle ${S} cx="12" cy="13" r="7.5"/><path ${S} d="M12 13V9.2M9.5 2.8h5M12 2.8v2.7M17.8 6.2l1.4-1.4"/>`,
    globe: `<circle ${S} cx="12" cy="12" r="9"/><path ${S} d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>`,
    sun: `<circle ${S} cx="12" cy="12" r="4"/><path ${S} d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>`,
    moon: `<path ${S} d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2z"/>`,
    auto: `<circle ${S} cx="12" cy="12" r="8.5"/><path ${F} d="M12 3.5a8.5 8.5 0 0 1 0 17z"/>`,
    palette: `<path ${S} d="M12 3a9 9 0 1 0 0 18c1.3 0 1.8-.9 1.4-1.9-.5-1.2.2-2.4 1.6-2.4H17a4 4 0 0 0 4-4c0-5.2-4-9.7-9-9.7z"/><circle ${F} cx="7.5" cy="11" r="1.3"/><circle ${F} cx="10" cy="7" r="1.3"/><circle ${F} cx="15" cy="7.5" r="1.3"/>`,
    notes: `<path ${S} d="M9 18V6l10-2v12"/><circle ${S} cx="6.5" cy="18" r="2.5"/><circle ${S} cx="16.5" cy="16" r="2.5"/>`,
    guitar: `<path ${S} d="M14.5 9.5l5-5M18 3l3 3M11.5 8.5c-1.6-1.6-4.5-1.2-5.6.5-.6 1-.4 2-1.4 2.6C2.6 12.9 2.5 16.3 4.6 18.4s5.5 2 6.8 0c.6-1 1.6-.8 2.6-1.4 1.7-1.1 2.1-4 .5-5.6z"/><circle ${S} cx="9" cy="15" r="1.6"/>`,
    piano: `<rect ${S} x="3" y="4" width="18" height="16" rx="2"/><path ${S} d="M7.5 20v-6.5M12 20v-6.5M16.5 20v-6.5"/><path ${F} d="M6.2 4h2.6v9.5H6.2zM10.7 4h2.6v9.5h-2.6zM15.2 4h2.6v9.5h-2.6z"/>`,
    play: `<path ${F} d="M7.5 4.5v15l12.5-7.5z"/>`,
    stop: `<rect ${F} x="6" y="6" width="12" height="12" rx="2"/>`,
    plus: `<path ${S} d="M12 5v14M5 12h14"/>`,
    minus: `<path ${S} d="M5 12h14"/>`,
    tap: `<path ${S} d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.6-2.2L4.5 15a1.6 1.6 0 0 1 2.4-2.1L9 15"/>`,
    timer: `<circle ${S} cx="12" cy="13.5" r="7.5"/><path ${S} d="M12 13.5V10M10 2.5h4"/>`,
    flame: `<path ${S} d="M12 3c.7 3 4.5 5 4.5 9.8a4.5 4.5 0 0 1-9 0c0-2.2 1-3.7 2.2-4.8 0 1.9.8 3 2 3 0-3.3-1-5.5.3-8z"/>`,
    target: `<circle ${S} cx="12" cy="12" r="8.5"/><circle ${S} cx="12" cy="12" r="4.5"/><circle ${F} cx="12" cy="12" r="1.5"/>`,
    right: `<circle ${S} cx="12" cy="12" r="8.5"/><path ${S} d="M8 12.3l2.8 2.8 5.2-5.6"/>`,
    upload: `<path ${S} d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15"/>`,
    download: `<path ${S} d="M12 4v11.5M7.5 11 12 15.5l4.5-4.5M4.5 15v3.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V15"/>`,
    again: `<path ${S} d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.5H15"/>`,
    chevron: `<path ${S} d="M9 4.5 16.5 12 9 19.5"/>`,
    info: `<circle ${S} cx="12" cy="12" r="9"/><path ${S} d="M12 11v5.5"/><circle ${F} cx="12" cy="7.8" r="1.2"/>`,
    hand: `<path ${S} d="M7 11V6.5a1.5 1.5 0 0 1 3 0V11V4.5a1.5 1.5 0 0 1 3 0V11V5.5a1.5 1.5 0 0 1 3 0V12v-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.2a6 6 0 0 1-4.9-2.6L3.6 15A1.6 1.6 0 0 1 6 13l1 1"/>`,
  };
  // ---------- drills (48×48) ----------
  const D = 'fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"';
  const staff = y => [0, 1, 2, 3, 4].map(i => `M5 ${y + i * 5}h38`).join('');
  const faint = (y, n = 3, gap = 7) => `<path ${'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"'} opacity=".38" d="${Array.from({ length: n }, (_, i) => `M4 ${y + i * gap}h40`).join('')}"/>`;
  const head = (x, y, filled = true) => `<ellipse ${filled ? F : D} cx="${x}" cy="${y}" rx="4.2" ry="3.2" transform="rotate(-20 ${x} ${y})"/>`;
  const DRILL = {
    'note-reading': `${faint(17)}<ellipse ${F} cx="20" cy="31" rx="7" ry="5.3" transform="rotate(-20 20 31)"/><path ${D} stroke-width="3" d="M26.4 29V6.5"/>`,
    'key-signatures': `${faint(17)}<path ${D} stroke-width="2.8" d="M11 12v26M17.5 10v26M7.5 21l14-3.5M7.5 30l14-3.5"/><path ${D} stroke-width="2.8" d="M30 8v29c5-3 11-6 11-10.5 0-3.6-4.6-4.6-11-.8"/>`,
    chords: `${faint(17)}${head(21, 35)}${head(21, 27)}${head(21, 19)}<path ${D} stroke-width="2.8" d="M25 33.4V6"/>`,
    scales: `${head(8, 38)}${head(17, 31)}${head(26, 24)}${head(35, 17)}${head(42, 10)}<path ${D} stroke-width="1.6" opacity=".45" d="M4 42h40"/>`,
    progressions: `<rect ${D} x="5" y="14" width="10" height="20" rx="2"/><rect ${D} x="19" y="14" width="10" height="20" rx="2"/><rect ${D} x="33" y="14" width="10" height="20" rx="2"/><path ${D} d="M8.5 24h3M21.5 21.5v5M26.5 21.5v5M35.5 21.5l2.5 5 2.5-5"/>`,
    rhythm: `<path ${D} d="M6 32h36"/>${head(11, 31)}${head(21, 31)}${head(33, 31)}<path ${D} d="M14.9 29.6V14h10v15.6M36.9 29.6V14"/><path ${D} stroke-width="4" d="M14.9 15h10"/>`,
    pieces: `<path ${D} d="M12 5h17l8 8v30H12z"/><path ${D} d="M29 5v8h8"/><path ${D} stroke-width="1.4" d="M16 21h16M16 25h16M16 29h16M16 33h16M16 37h16"/>${head(22, 31)}<path ${D} d="M25.9 29.6V18"/>`,
    metronome: `<path ${D} d="M18 6h12l8 36H10z"/><path ${D} d="M14 32h20M24 32l9-19"/><circle ${F} cx="33.4" cy="12.3" r="2.6"/>`,
    tuner: `<path ${D} d="M7 33a17 17 0 0 1 34 0"/><path ${D} stroke-width="2" d="M24 16v3M14 19.5l1.8 2.3M34 19.5l-1.8 2.3M10 26.5l2.8.8M38 26.5l-2.8.8"/><path ${D} d="M24 33l5-12"/><circle ${F} cx="24" cy="33" r="2.6"/><path ${D} d="M14 39h20"/>`,
    fretboard: `<rect ${D} x="4" y="12" width="40" height="24" rx="3"/><path ${D} stroke-width="3.2" d="M9 12v24"/><path ${D} stroke-width="1.4" d="M19 12v24M29 12v24M39 12v24M4 17h40M4 22h40M4 26.5h40M4 31h40"/><circle ${F} cx="24" cy="24" r="2.6"/><circle ${F} cx="34" cy="24" r="2.6"/>`,
    'guitar-notes': `${faint(9, 3, 6)}<ellipse ${F} cx="19" cy="18" rx="5.6" ry="4.3" transform="rotate(-20 19 18)"/><path ${D} stroke-width="2.6" d="M24.2 16.3V3"/><path ${D} stroke-width="1.5" d="M4 32h40M4 37h40M4 42h40"/><path ${D} stroke-width="2.4" d="M30 30v14"/><circle ${F} cx="19" cy="37" r="3"/>`,
    'guitar-tab': `<path ${D} stroke-width="1.4" d="M5 10h38M5 16h38M5 22h38M5 28h38M5 34h38M5 40h38"/><rect style="fill:var(--tile)" x="11" y="11" width="9" height="10" rx="2"/><rect style="fill:var(--tile)" x="27" y="23" width="9" height="10" rx="2"/><text x="15.5" y="20" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" font-family="ui-sans-serif, system-ui, sans-serif">3</text><text x="31.5" y="32" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" font-family="ui-sans-serif, system-ui, sans-serif">0</text>`,
    'guitar-chords': `<rect ${D} x="11" y="10" width="26" height="32" rx="1.5"/><path ${D} stroke-width="3.6" d="M11 10.5h26"/><path ${D} stroke-width="1.4" d="M16.2 10v32M21.4 10v32M26.6 10v32M31.8 10v32M11 18h26M11 26h26M11 34h26"/><circle ${F} cx="21.4" cy="22" r="3"/><circle ${F} cx="26.6" cy="22" r="3"/><circle ${F} cx="31.8" cy="14" r="3"/><path ${D} stroke-width="1.6" d="M9.5 4l3 3M12.5 4l-3 3"/><circle ${D} stroke-width="1.6" cx="37" cy="5.5" r="1.8"/>`,
    'guitar-changes': `<rect ${D} x="4" y="12" width="15" height="22" rx="1.5"/><rect ${D} x="29" y="12" width="15" height="22" rx="1.5"/><path ${D} stroke-width="1.2" d="M9 12v22M14 12v22M4 19h15M4 26h15M34 12v22M39 12v22M29 19h15M29 26h15"/><circle ${F} cx="9" cy="22.5" r="2.4"/><circle ${F} cx="39" cy="15.5" r="2.4"/><path ${D} d="M20.5 23h7M24.5 19.5l3.5 3.5-3.5 3.5"/>`,
    'guitar-strumming': `<path ${D} stroke-width="1.2" d="M6 8v34M10.5 8v34M15 8v34M33 8v34M37.5 8v34M42 8v34"/><path ${D} d="M24 7v22M18 23l6 6 6-6"/><path ${D} d="M24 41V19M18 25l6-6 6 6" opacity=".45"/>`,
    'guitar-picking': `<path ${D} stroke-width="1.4" d="M4 12h40M4 19h40M4 26h40M4 33h40"/><circle ${F} cx="9" cy="33" r="3.2"/><circle ${F} cx="19" cy="26" r="3.2"/><circle ${F} cx="29" cy="19" r="3.2"/><circle ${F} cx="39" cy="12" r="3.2"/><path ${D} stroke-width="1.6" d="M9 40v2M19 40v2M29 40v2M39 40v2"/>`,
  };
  function svg(name, size) {
    if (DRILL[name]) return `<svg class="ico ico-drill" viewBox="0 0 48 48" width="${size || 40}" height="${size || 40}" aria-hidden="true">${DRILL[name]}</svg>`;
    return `<svg class="ico" viewBox="0 0 24 24" width="${size || 22}" height="${size || 22}" aria-hidden="true">${UI[name] || UI.info}</svg>`;
  }
  // an element, for UI.h
  function el(name, size) {
    const t = document.createElement('template');
    t.innerHTML = svg(name, size);
    return t.content.firstChild;
  }
  self.Icons = { svg, el, names: [...Object.keys(UI), ...Object.keys(DRILL)] };
})();
