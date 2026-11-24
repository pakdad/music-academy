// The drills on the home page (the service worker caches these pages too).
// instrument: which instrument section it belongs to ('any' = all); audience: which editions show it;
// noStats: the page keeps no per-question sessions, so the home page shows no count for it.
self.DRILLS = [
  {
    id: 'note-reading', path: 'drills/note-reading/', instrument: 'piano', audience: ['adult'],
    name: 'Note reading', icon: '♩',
    about: 'Treble, bass or grand staff: see a note, play the exact key or name it. Ledger lines, accidentals and key signatures; rows of notes to read ahead.',
    de: { name: "Notenlesen", about: "Violin-, Bassschlüssel oder Klaviersystem: Note sehen, genau die Taste spielen oder die Note benennen. Hilfslinien, Vorzeichen und Tonarten; Notenreihen zum Vorauslesen." },
  },
  {
    id: 'key-signatures', path: 'drills/key-signatures/', instrument: 'piano', audience: ['adult'],
    name: 'Key signatures', icon: '♯♭',
    about: 'Name the key from its signature (or play the tonic), or pick the signature of a key. Major and minor, up to seven sharps or flats.',
    de: { name: "Tonarten", about: "Die Tonart an den Vorzeichen erkennen (oder den Grundton spielen) oder die Vorzeichen einer Tonart wählen. Dur und Moll, bis zu sieben Kreuze oder Bs." },
  },
  {
    id: 'chords', path: 'drills/chords/', instrument: 'piano', audience: ['adult'],
    name: 'Chords', icon: 'C⁷',
    about: 'Triads and seventh chords, root position and inversions: name them from the staff, play them from the staff, or play them from a chord symbol.',
    de: { name: "Akkorde", about: "Dreiklänge und Septakkorde, Grundstellung und Umkehrungen: aus den Noten benennen, aus den Noten spielen oder nach dem Akkordsymbol spielen." },
  },
  {
    id: 'scales', path: 'drills/scales/', instrument: 'piano', audience: ['adult'],
    name: 'Scales', icon: '♪♪',
    about: 'Play scales from memory or from the notes, name a scale on the staff, and hear the colour of major, minor and the modes.',
    de: { name: "Tonleitern", about: "Tonleitern auswendig oder nach Noten spielen, eine Tonleiter in den Noten erkennen und den Klang von Dur, Moll und den Kirchentonarten hören." },
  },
  {
    id: 'progressions', path: 'drills/progressions/', instrument: 'piano', audience: ['adult'],
    name: 'Progressions', icon: 'I–V',
    about: 'The first look at a new piece: find the key, read each bar as a Roman numeral, hear the progression. Or recognise one by ear, or play one in any key.',
    de: { name: "Akkordfolgen", about: "Der erste Blick auf ein neues Stück: Tonart finden, jeden Takt als Stufe lesen, die Folge hören. Oder eine Folge am Klang erkennen oder in jeder Tonart spielen." },
  },
  {
    id: 'rhythm', path: 'drills/rhythm/', instrument: 'any', audience: ['adult'],
    name: 'Rhythm', icon: '♪♫',
    about: 'Read a rhythm and tap it in time after a count-in: quarters to sixteenths, dotted notes, syncopation and rests. Every note shows whether it was early or late.',
    de: { name: "Rhythmus", about: "Einen Rhythmus lesen und nach dem Einzählen im Takt klopfen: von Vierteln bis Sechzehnteln, punktierte Noten, Synkopen und Pausen. Jede Note zeigt, ob sie zu früh oder zu spät kam." },
  },
  {
    id: 'pieces', path: 'drills/pieces/', instrument: 'piano', audience: ['adult'], noStats: true,
    name: 'Pieces', icon: '♫',
    about: 'Nineteen pieces, from Ode to Joy to Für Elise: learn the notes at your pace (finger numbers on request), then play along with the metronome and see how each note landed.',
    de: { name: "Stücke", about: "Neunzehn Stücke, von der Ode an die Freude bis Für Elise: die Noten im eigenen Tempo lernen (Fingersatz auf Wunsch), dann mit dem Metronom mitspielen und sehen, wie jede Note saß." },
  },
  {
    id: 'metronome', path: 'drills/metronome/', instrument: 'any', audience: ['adult'], noStats: true,
    name: 'Metronome & timing', icon: '♩=',
    about: 'A metronome that listens: see how early or late each note is, train your inner pulse with silent bars, and measure your setup\'s delay.',
    de: { name: "Metronom & Timing", about: "Ein Metronom, das zuhört: Wie früh oder spät ist jede Note? Den inneren Puls mit stillen Takten trainieren und die Verzögerung des eigenen Geräts messen." },
  },
];
