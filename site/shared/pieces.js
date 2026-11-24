// The pieces to play. Melodies are traditional or long in the public domain; the accompaniments and the
// studies were written for this site. Notation: see shared/score.js. tools/check.mjs checks every bar.
//   level 1: one hand, five-finger position · 2: both hands, simple · 3: both hands, more going on
//   hands: which hand(s) the piece is for by default; tempo: quarter notes per minute
self.PIECES = [
  {
    id: 'ode-to-joy', title: 'Ode to Joy', by: 'Ludwig van Beethoven, Symphony No. 9 (1824)', level: 1,
    key: 0, time: [4, 4], tempo: 92,
    about: 'Right hand in C position. Watch the dotted rhythm in bars 4 and 8.',
    rh: 'E4:4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:4. D4:8 D4:2 | E4:4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:4. C4:8 C4:2',
  },
  {
    id: 'au-clair-de-la-lune', title: 'Au clair de la lune', by: 'French traditional', level: 1,
    key: 0, time: [4, 4], tempo: 100,
    about: 'Right hand. The middle part dips below middle C: B3, A3 and G3 on ledger lines.',
    rh: 'C4:4 C4 C4 D4 | E4:2 D4 | C4:4 E4 D4 D4 | C4:1 | C4:4 C4 C4 D4 | E4:2 D4 | C4:4 E4 D4 D4 | C4:1 | ' +
        'D4:4 D4 D4 D4 | A3:2 A3 | D4:4 C4 B3 A3 | G3:1 | C4:4 C4 C4 D4 | E4:2 D4 | C4:4 E4 D4 D4 | C4:1',
  },
  {
    id: 'haenschen-klein', title: 'Hänschen klein (Lightly Row)', by: 'German traditional', level: 1,
    key: 0, time: [4, 4], tempo: 104,
    about: 'Right hand, C to G. Skips of a third: read the shape, not each note.',
    rh: 'G4:4 E4 E4:2 | F4:4 D4 D4:2 | C4:4 D4 E4 F4 | G4 G4 G4:2 | G4:4 E4 E4:2 | F4:4 D4 D4:2 | C4:4 E4 G4 G4 | C4:1 | ' +
        'D4:4 D4 D4 D4 | D4 E4 F4:2 | E4:4 E4 E4 E4 | E4 F4 G4:2 | G4:4 E4 E4:2 | F4:4 D4 D4:2 | C4:4 E4 G4 G4 | C4:1',
  },
  {
    id: 'twinkle', title: 'Ah ! vous dirai-je, maman (Twinkle, Twinkle)', by: 'French traditional (1761)', level: 1,
    key: 0, time: [4, 4], tempo: 100,
    about: 'Right hand. The leap C to G at the start: a fifth, five lines and spaces up.',
    rh: 'C4:4 C4 G4 G4 | A4 A4 G4:2 | F4:4 F4 E4 E4 | D4 D4 C4:2 | G4:4 G4 F4 F4 | E4 E4 D4:2 | G4:4 G4 F4 F4 | E4 E4 D4:2 | ' +
        'C4:4 C4 G4 G4 | A4 A4 G4:2 | F4:4 F4 E4 E4 | D4 D4 C4:2',
  },
  {
    id: 'ode-to-joy-left', title: 'Ode to Joy, left hand', by: 'Ludwig van Beethoven (1824)', level: 1,
    key: 0, time: [4, 4], tempo: 84, clef: 'bass',
    about: 'The same tune in the bass clef, left hand from C3. Read the bass clef as itself, not as "treble moved".',
    lh: 'E3:4 E3 F3 G3 | G3 F3 E3 D3 | C3 C3 D3 E3 | E3:4. D3:8 D3:2 | E3:4 E3 F3 G3 | G3 F3 E3 D3 | C3 C3 D3 E3 | D3:4. C3:8 C3:2',
  },
  {
    id: 'frere-jacques-left', title: 'Frère Jacques, left hand', by: 'French traditional', level: 1,
    key: 0, time: [4, 4], tempo: 92, clef: 'bass',
    about: 'Left hand in the bass clef, with eighth notes in bars 5 and 6 and a low G2.',
    lh: 'C3:4 D3 E3 C3 | C3 D3 E3 C3 | E3 F3 G3:2 | E3:4 F3 G3:2 | G3:8 A3 G3 F3 E3:4 C3 | G3:8 A3 G3 F3 E3:4 C3 | C3:4 G2 C3:2 | C3:4 G2 C3:2',
  },
  {
    id: 'ode-to-joy-hands', title: 'Ode to Joy, both hands', by: 'Beethoven; accompaniment written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 80,
    about: 'Melody over a slow bass: the left hand moves only on beats 1 and 3.',
    rh: 'E4:4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:4. D4:8 D4:2 | E4:4 E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:4. C4:8 C4:2',
    lh: 'C3:2 E3 | G2 B2 | C3 E3 | C3 G2 | C3 E3 | G2 B2 | C3 E3 | G2 C3',
  },
  {
    id: 'twinkle-hands', title: 'Twinkle, Twinkle, both hands', by: 'French traditional; accompaniment written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 88,
    about: 'Three chords, as single bass notes: C, F and G. Hear how the bass changes the colour.',
    rh: 'C4:4 C4 G4 G4 | A4 A4 G4:2 | F4:4 F4 E4 E4 | D4 D4 C4:2 | G4:4 G4 F4 F4 | E4 E4 D4:2 | G4:4 G4 F4 F4 | E4 E4 D4:2 | ' +
        'C4:4 C4 G4 G4 | A4 A4 G4:2 | F4:4 F4 E4 E4 | D4 D4 C4:2',
    lh: 'C3:1 | F3:2 C3 | F3 C3 | G2 C3 | C3 F3 | C3 G2 | C3 F3 | C3 G2 | C3:1 | F3:2 C3 | F3 C3 | G2 C3',
  },
  {
    id: 'chord-study-c', title: 'Chord study in C', by: 'Written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 72,
    about: 'Read triads as shapes: I – IV – V – I, then vi – IV – V – I. The right hand barely moves.',
    rh: 'C4+E4+G4:2 C4+E4+G4 | C4+F4+A4 C4+F4+A4 | B3+D4+G4 B3+D4+G4 | C4+E4+G4:1 | ' +
        'A3+C4+E4:2 A3+C4+E4 | A3+C4+F4 A3+C4+F4 | B3+D4+G4 B3+D4+F4 | C4+E4+G4:1',
    lh: 'C3:1 | F2 | G2 | C3 | A2 | F2 | G2 | C3',
  },
  {
    id: 'evening-song', title: 'Evening song in A minor', by: 'Written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 72,
    about: 'A minor: no key signature, but the G♯ in bar 7 (the raised seventh) tells you it is minor.',
    rh: 'A4:4 B4 C5 B4 | A4:2 E4 | F4:4 E4 D4 F4 | E4:1 | A4:4 B4 C5 D5 | E5:2 C5 | B4:4 A4 G#4 B4 | A4:1',
    lh: 'A2:2 E3 | A2 C3 | D3 A2 | E3:1 | A2:2 C3 | C3 E3 | E3:1 | A2:1',
  },
  {
    id: 'frere-jacques-canon', title: 'Frère Jacques as a canon', by: 'French traditional; canon set for this site', level: 3,
    key: 0, time: [4, 4], tempo: 84,
    about: 'One player, two voices: the left hand starts the same tune two bars later. Hands independent.',
    rh: 'C4:4 D4 E4 C4 | C4 D4 E4 C4 | E4 F4 G4:2 | E4:4 F4 G4:2 | G4:8 A4 G4 F4 E4:4 C4 | G4:8 A4 G4 F4 E4:4 C4 | C4:4 G3 C4:2 | C4:4 G3 C4:2 | C4:4 G3 C4:2 | C4:4 G3 C4:2',
    lh: 'r:1 | r:1 | C3:4 D3 E3 C3 | C3 D3 E3 C3 | E3 F3 G3:2 | E3:4 F3 G3:2 | G3:8 A3 G3 F3 E3:4 C3 | G3:8 A3 G3 F3 E3:4 C3 | C3:4 G2 C3:2 | C3:4 G2 C3:2',
  },
  {
    id: 'waltz-in-f', title: 'Waltz in F', by: 'Written for this site', level: 3,
    key: -1, time: [3, 4], tempo: 112,
    about: 'Three-four time, one flat. The left hand plays bass then chord, chord: "oom-pah-pah".',
    rh: 'C5:4 A4 F4 | G4:2 A4:8 Bb4 | C5:4 A4 F4 | E4:2. | G4:4 Bb4 E4 | F4:2 A4:4 | G4:8 F4 E4:4 G4 | F4:2.',
    lh: 'F2:4 A2+C3 A2+C3 | E2 G2+Bb2 G2+Bb2 | F2 A2+C3 A2+C3 | C3 E3+G3 E3+G3 | E2 G2+Bb2 G2+Bb2 | F2 A2+C3 A2+C3 | E2 G2+Bb2 G2+Bb2 | F2 A2+C3 F2',
  },
  {
    id: 'minuet-in-g', title: 'Minuet in G (simplified)', by: 'Christian Petzold (c. 1725), from the Notebook for Anna Magdalena Bach; left hand simplified for this site', level: 3,
    key: 1, time: [3, 4], tempo: 96,
    about: 'G major, one sharp (every F is F♯). Running eighths in the right hand over one bass note per bar.',
    rh: 'D5:4 G4:8 A4 B4 C5 | D5:4 G4 G4 | E5:4 C5:8 D5 E5 F#5 | G5:4 G4 G4 | C5:4 D5:8 C5 B4 A4 | B4:4 C5:8 B4 A4 G4 | F#4:4 G4:8 A4 B4 G4 | A4:2. | ' +
        'D5:4 G4:8 A4 B4 C5 | D5:4 G4 G4 | E5:4 C5:8 D5 E5 F#5 | G5:4 G4 G4 | C5:4 D5:8 C5 B4 A4 | B4:4 C5:8 B4 A4 G4 | A4:4 B4:8 A4 G4 F#4 | G4:2.',
    lh: 'G3:2. | B3 | C4 | B3 | A3 | G3 | D3 | D3 | G3 | B3 | C4 | B3 | A3 | G3 | D3 | G2',
  },
];
