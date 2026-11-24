// The drills on the home page (the service worker caches these pages too).
// instrument: which instrument section it belongs to ('any' = all); audience: which editions show it;
// noStats: the page keeps no per-question sessions, so the home page shows no count for it.
// icon: a drill icon in shared/icons.js; section: its group on the home page (SECTIONS).
self.SECTIONS = [['tools', 'Tune and find your way'], ['read', 'Read music'], ['harmony', 'Harmony'], ['chords', 'Chords'], ['hands', 'Right hand'], ['play', 'Play pieces'], ['time', 'Rhythm and time']];
self.DRILLS = [
  {
    id: 'note-reading', path: 'drills/note-reading/', instrument: 'piano', audience: ['adult'],
    name: 'Note reading', icon: 'note-reading', section: 'read',
    about: 'Treble, bass or grand staff: see a note, play the exact key or name it. Ledger lines, accidentals and key signatures; rows of notes to read ahead.',
    de: { name: "Notenlesen", about: "Violin-, Bassschlüssel oder Klaviersystem: Note sehen, genau die Taste spielen oder die Note benennen. Hilfslinien, Vorzeichen und Tonarten; Notenreihen zum Vorauslesen." },
  },
  {
    id: 'key-signatures', path: 'drills/key-signatures/', instrument: 'piano', audience: ['adult'],
    name: 'Key signatures', icon: 'key-signatures', section: 'read',
    about: 'Name the key from its signature (or play the tonic), or pick the signature of a key. Major and minor, up to seven sharps or flats.',
    de: { name: "Tonarten", about: "Die Tonart an den Vorzeichen erkennen (oder den Grundton spielen) oder die Vorzeichen einer Tonart wählen. Dur und Moll, bis zu sieben Kreuze oder Bs." },
  },
  {
    id: 'chords', path: 'drills/chords/', instrument: 'piano', audience: ['adult'],
    name: 'Chords', icon: 'chords', section: 'harmony',
    about: 'Triads and seventh chords, root position and inversions: name them from the staff, play them from the staff, or play them from a chord symbol.',
    de: { name: "Akkorde", about: "Dreiklänge und Septakkorde, Grundstellung und Umkehrungen: aus den Noten benennen, aus den Noten spielen oder nach dem Akkordsymbol spielen." },
  },
  {
    id: 'scales', path: 'drills/scales/', instrument: 'piano', audience: ['adult'],
    name: 'Scales', icon: 'scales', section: 'harmony',
    about: 'Play scales from memory or from the notes, name a scale on the staff, and hear the colour of major, minor and the modes.',
    de: { name: "Tonleitern", about: "Tonleitern auswendig oder nach Noten spielen, eine Tonleiter in den Noten erkennen und den Klang von Dur, Moll und den Kirchentonarten hören." },
  },
  {
    id: 'progressions', path: 'drills/progressions/', instrument: 'piano', audience: ['adult'],
    name: 'Progressions', icon: 'progressions', section: 'harmony',
    about: 'The first look at a new piece: find the key, read each bar as a Roman numeral, hear the progression. Or recognise one by ear, or play one in any key.',
    de: { name: "Akkordfolgen", about: "Der erste Blick auf ein neues Stück: Tonart finden, jeden Takt als Stufe lesen, die Folge hören. Oder eine Folge am Klang erkennen oder in jeder Tonart spielen." },
  },
  {
    id: 'rhythm', path: 'drills/rhythm/', instrument: 'any', audience: ['adult'],
    name: 'Rhythm', icon: 'rhythm', section: 'time',
    about: 'Read a rhythm and tap it in time after a count-in: quarters to sixteenths, dotted notes, syncopation and rests. Every note shows whether it was early or late.',
    de: { name: "Rhythmus", about: "Einen Rhythmus lesen und nach dem Einzählen im Takt klopfen: von Vierteln bis Sechzehnteln, punktierte Noten, Synkopen und Pausen. Jede Note zeigt, ob sie zu früh oder zu spät kam." },
  },
  {
    id: 'pieces', path: 'drills/pieces/', instrument: 'piano', audience: ['adult'], noStats: true,
    name: 'Pieces', icon: 'pieces', section: 'play',
    about: 'Nineteen pieces, from Ode to Joy to Für Elise: learn the notes at your pace (finger numbers on request), then play along with the metronome and see how each note landed.',
    de: { name: "Stücke", about: "Neunzehn Stücke, von der Ode an die Freude bis Für Elise: die Noten im eigenen Tempo lernen (Fingersatz auf Wunsch), dann mit dem Metronom mitspielen und sehen, wie jede Note saß." },
  },
  {
    id: 'metronome', path: 'drills/metronome/', instrument: 'any', audience: ['adult'], noStats: true,
    name: 'Metronome & timing', icon: 'metronome', section: 'time',
    about: 'A metronome that listens: see how early or late each note is, train your inner pulse with silent bars, and measure your setup\'s delay.',
    de: { name: "Metronom & Timing", about: "Ein Metronom, das zuhört: Wie früh oder spät ist jede Note? Den inneren Puls mit stillen Takten trainieren und die Verzögerung des eigenen Geräts messen." },
  },
  {
    id: 'guitar-tuner', path: 'drills/guitar-tuner/', instrument: 'guitar', audience: ['adult'],
    name: "Tuner", icon: 'tuner', section: 'tools',
    about: "Tune your guitar with the microphone: a needle shows how many cents each string is off. Standard and five other tunings, reference tones, A4 adjustable.",
    de: { name: "Stimmgerät", about: "Stimme deine Gitarre mit dem Mikrofon: eine Nadel zeigt, wie viele Cent jede Saite daneben liegt. Standard und fünf weitere Stimmungen, Referenztöne, A4 einstellbar." },
  },
  {
    id: 'guitar-fretboard', path: 'drills/guitar-fretboard/', instrument: 'guitar', audience: ['adult'],
    name: "Fretboard", icon: 'fretboard', section: 'tools',
    about: "Learn where the notes are: find every G on the neck, name a marked position, or explore and listen. Works with the mouse alone.",
    de: { name: "Griffbrett", about: "Lerne, wo die Töne liegen: finde jedes G auf dem Hals, benenne eine markierte Stelle oder erkunde und höre. Geht auch nur mit der Maus." },
  },
  {
    id: 'guitar-notes', path: 'drills/guitar-notes/', instrument: 'guitar', audience: ['adult'],
    name: "Note reading", icon: 'guitar-notes', section: 'read',
    about: "A note as notation, tab and position on the neck: switch each on or off as you get better. Play it (microphone), click it on the fretboard, or name it.",
    de: { name: "Notenlesen", about: "Eine Note als Notenschrift, Tabulatur und Lage auf dem Griffbrett: schalte jedes einzeln ab, wenn du besser wirst. Spiele sie (Mikrofon), klicke sie auf dem Griffbrett oder benenne sie." },
  },
  {
    id: 'guitar-tab', path: 'drills/guitar-tab/', instrument: 'guitar', audience: ['adult'],
    name: "Tab reading", icon: 'guitar-tab', section: 'read',
    about: "New tab melodies every time, with the notation above if you like: play note by note, along with the metronome, or listen first.",
    de: { name: "Tabulatur lesen", about: "Jedes Mal neue Tabulatur-Melodien, auf Wunsch mit Noten darüber: Note für Note spielen, mit dem Metronom mitspielen oder erst anhören." },
  },
  {
    id: 'guitar-chords', path: 'drills/guitar-chords/', instrument: 'guitar', audience: ['adult'],
    name: "Chords", icon: 'guitar-chords', section: 'chords',
    about: "Open, seventh, sus, power and barre chords: play the chord and the microphone checks it, name a chord box, or build the shape on the fretboard.",
    de: { name: "Akkorde", about: "Offene, Sept-, Sus-, Power- und Barréakkorde: spiele den Akkord und das Mikrofon prüft ihn, benenne ein Akkorddiagramm oder baue den Griff auf dem Griffbrett." },
  },
  {
    id: 'guitar-changes', path: 'drills/guitar-changes/', instrument: 'guitar', audience: ['adult'],
    name: "Chord changes", icon: 'guitar-changes', section: 'chords',
    about: "Change chords in time with the metronome, with the next chord always in view, or count your clean changes in one minute.",
    de: { name: "Akkordwechsel", about: "Wechsle Akkorde im Takt mit dem Metronom, der nächste Akkord immer im Blick, oder zähle deine sauberen Wechsel in einer Minute." },
  },
  {
    id: 'guitar-strumming', path: 'drills/guitar-strumming/', instrument: 'guitar', audience: ['adult'],
    name: "Strumming", icon: 'guitar-strumming', section: 'hands',
    about: "Strumming patterns from all-downs to the folk strum, offbeats and 6/8: listen, then strum along; every strum is checked for timing.",
    de: { name: "Schlagmuster", about: "Schlagmuster von nur Abschlägen bis zum Folk-Rhythmus, Offbeats und 6/8: anhören, dann mitschlagen; jeder Schlag wird auf Timing geprüft." },
  },
  {
    id: 'guitar-picking', path: 'drills/guitar-picking/', instrument: 'guitar', audience: ['adult'],
    name: "Picking", icon: 'guitar-picking', section: 'hands',
    about: "Fingerpicking patterns over chord progressions in notation and tab, with the right-hand fingers marked: wait for me, play along or listen.",
    de: { name: "Zupfmuster", about: "Zupfmuster über Akkordfolgen in Noten und Tabulatur, mit den Fingern der rechten Hand: warte auf mich, mitspielen oder anhören." },
  },
];
