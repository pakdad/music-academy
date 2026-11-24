// The drills on the home page (the service worker caches these pages too).
// instrument: which instrument section it belongs to ('any' = all); audience: which editions show it;
// noStats: the page keeps no per-question sessions, so the home page shows no count for it.
self.DRILLS = [
  {
    id: 'note-reading', path: 'drills/note-reading/', instrument: 'piano', audience: ['adult'],
    name: 'Note reading', icon: '♩',
    about: 'Treble, bass or grand staff: see a note, play the exact key or name it. Ledger lines, accidentals and key signatures; rows of notes to read ahead.',
  },
  {
    id: 'key-signatures', path: 'drills/key-signatures/', instrument: 'piano', audience: ['adult'],
    name: 'Key signatures', icon: '♯♭',
    about: 'Name the key from its signature (or play the tonic), or pick the signature of a key. Major and minor, up to seven sharps or flats.',
  },
  {
    id: 'chords', path: 'drills/chords/', instrument: 'piano', audience: ['adult'],
    name: 'Chords', icon: 'C⁷',
    about: 'Triads and seventh chords, root position and inversions: name them from the staff, play them from the staff, or play them from a chord symbol.',
  },
  {
    id: 'scales', path: 'drills/scales/', instrument: 'piano', audience: ['adult'],
    name: 'Scales', icon: '♪♪',
    about: 'Play scales from memory or from the notes, name a scale on the staff, and hear the colour of major, minor and the modes.',
  },
  {
    id: 'progressions', path: 'drills/progressions/', instrument: 'piano', audience: ['adult'],
    name: 'Progressions', icon: 'I–V',
    about: 'The first look at a new piece: find the key, read each bar as a Roman numeral, hear the progression. Or recognise one by ear, or play one in any key.',
  },
  {
    id: 'pieces', path: 'drills/pieces/', instrument: 'piano', audience: ['adult'], noStats: true,
    name: 'Pieces', icon: '♫',
    about: 'Short pieces with real rhythm, one or both hands: learn the notes at your pace, then play along with the metronome and see how each note landed.',
  },
  {
    id: 'metronome', path: 'drills/metronome/', instrument: 'any', audience: ['adult'], noStats: true,
    name: 'Metronome & timing', icon: '♩=',
    about: 'A metronome that listens: see how early or late each note is, train your inner pulse with silent bars, and measure your setup\'s delay.',
  },
];
