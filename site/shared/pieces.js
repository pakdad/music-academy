// The pieces to play. Melodies are traditional or long in the public domain (the composers died more than
// 70 years ago); the accompaniments, simplifications and studies were written for this site.
// Notation and fingering: see shared/score.js. tools/check.mjs checks every bar.
//   level 1: one hand (or nearly), five-finger positions · 2: both hands, simple · 3: both hands, more going on
//   tempo: quarter notes per minute · pickup: quarter notes before the first full bar
//   imslp: where to find the full original score in the public-domain Petrucci Music Library
//   minor: the key is minor (key gives only the signature) · de: { title, by, about } in German
const IMSLP = q => 'https://imslp.org/index.php?search=' + encodeURIComponent(q);

self.PIECES = [
  // ---------------- level 1 ----------------
  {
    id: 'ode-to-joy', title: 'Ode to Joy', by: 'Ludwig van Beethoven, Symphony No. 9 (1824)', level: 1,
    key: 0, time: [4, 4], tempo: 92, imslp: IMSLP('Symphony No.9, Op.125 (Beethoven)'),
    about: 'Right hand in C position, thumb on C. Watch the dotted rhythm in bars 4 and 8.',
    de: { title: "Ode an die Freude", by: "Ludwig van Beethoven, 9. Sinfonie (1824)", about: "Rechte Hand in C-Lage, Daumen auf C. Achte auf den punktierten Rhythmus in Takt 4 und 8." },
    rh: 'E4@3:4 E4@3 F4@4 G4@5 | G4@5 F4@4 E4@3 D4@2 | C4@1 C4@1 D4@2 E4@3 | E4@3:4. D4@2:8 D4@2:2 | ' +
        'E4@3:4 E4@3 F4@4 G4@5 | G4@5 F4@4 E4@3 D4@2 | C4@1 C4@1 D4@2 E4@3 | D4@2:4. C4@1:8 C4@1:2',
  },
  {
    id: 'au-clair-de-la-lune', title: 'Au clair de la lune', by: 'French traditional', level: 1,
    key: 0, time: [4, 4], tempo: 100,
    about: 'Right hand. In the middle part the hand moves down to G position (thumb on G3), then back to C.',
    de: { title: "Au clair de la lune", by: "Französisches Volkslied", about: "Rechte Hand. Im Mittelteil wandert die Hand in die G-Lage (Daumen auf G3), danach zurück nach C." },
    rh: 'C4@1:4 C4@1 C4@1 D4@2 | E4@3:2 D4@2 | C4@1:4 E4@3 D4@2 D4@2 | C4@1:1 | C4@1:4 C4@1 C4@1 D4@2 | E4@3:2 D4@2 | C4@1:4 E4@3 D4@2 D4@2 | C4@1:1 | ' +
        'D4@5:4 D4@5 D4@5 D4@5 | A3@2:2 A3@2 | D4@5:4 C4@4 B3@3 A3@2 | G3@1:1 | C4@1:4 C4@1 C4@1 D4@2 | E4@3:2 D4@2 | C4@1:4 E4@3 D4@2 D4@2 | C4@1:1',
  },
  {
    id: 'haenschen-klein', title: 'Hänschen klein (Lightly Row)', by: 'German traditional', level: 1,
    key: 0, time: [4, 4], tempo: 104,
    about: 'Right hand, C to G. Skips of a third: read the shape, not each note.',
    de: { title: "Hänschen klein", by: "Deutsches Volkslied", about: "Rechte Hand, C bis G. Terzsprünge: lies die Form, nicht jede einzelne Note." },
    rh: 'G4@5:4 E4@3 E4@3:2 | F4@4:4 D4@2 D4@2:2 | C4@1:4 D4@2 E4@3 F4@4 | G4@5 G4@5 G4@5:2 | G4@5:4 E4@3 E4@3:2 | F4@4:4 D4@2 D4@2:2 | C4@1:4 E4@3 G4@5 G4@5 | C4@1:1 | ' +
        'D4@2:4 D4@2 D4@2 D4@2 | D4@2 E4@3 F4@4:2 | E4@3:4 E4@3 E4@3 E4@3 | E4@3 F4@4 G4@5:2 | G4@5:4 E4@3 E4@3:2 | F4@4:4 D4@2 D4@2:2 | C4@1:4 E4@3 G4@5 G4@5 | C4@1:1',
  },
  {
    id: 'twinkle', title: 'Ah ! vous dirai-je, maman (Twinkle, Twinkle)', by: 'French traditional (1761)', level: 1,
    key: 0, time: [4, 4], tempo: 100,
    about: 'Right hand. The leap C to G at the start is a fifth; the hand stretches to A, then settles back into C position.',
    de: { title: "Ah ! vous dirai-je, maman (Morgen kommt der Weihnachtsmann)", by: "Französisches Volkslied (1761)", about: "Rechte Hand. Der Sprung C–G am Anfang ist eine Quinte; die Hand streckt sich bis zum A und kehrt dann in die C-Lage zurück." },
    rh: 'C4@1:4 C4@1 G4@4 G4@4 | A4@5 A4@5 G4@4:2 | F4@4:4 F4@4 E4@3 E4@3 | D4@2 D4@2 C4@1:2 | G4@5:4 G4@5 F4@4 F4@4 | E4@3 E4@3 D4@2:2 | G4@5:4 G4@5 F4@4 F4@4 | E4@3 E4@3 D4@2:2 | ' +
        'C4@1:4 C4@1 G4@4 G4@4 | A4@5 A4@5 G4@4:2 | F4@4:4 F4@4 E4@3 E4@3 | D4@2 D4@2 C4@1:2',
  },
  {
    id: 'surprise-symphony', title: 'Surprise Symphony, theme', by: 'Joseph Haydn, Symphony No. 94 (1791), Andante', level: 1,
    key: 0, time: [2, 4], tempo: 76, imslp: IMSLP('Symphony No.94 in G major, Hob.I:94 (Haydn, Joseph)'),
    about: 'Eighth notes in 2/4, right hand. Haydn plays the tune twice, quietly, then wakes everyone up: the left hand\'s one chord at the end.',
    de: { title: "Sinfonie mit dem Paukenschlag, Thema", by: "Joseph Haydn, Sinfonie Nr. 94 (1791), Andante", about: "Achtel im 2/4-Takt, rechte Hand. Haydn spielt die Melodie zweimal leise und weckt dann alle auf: mit dem einen Akkord der linken Hand am Schluss." },
    rh: 'C4@1:8 C4@1 E4@3 E4@3 | G4@5 G4@5 E4@3:4 | F4@4:8 F4@4 D4@2 D4@2 | B3@3 B3@3 G3@1:4 | ' +
        'C4@1:8 C4@1 E4@3 E4@3 | G4@5 G4@5 E4@3:4 | F4@4:8 F4@4 D4@2 D4@2 | B3@3 B3@3 G3@1:4',
    lh: 'r:2 | r:2 | r:2 | r:2 | r:2 | r:2 | r:2 | r:4 G2@5+D3@2+G3@1:4',
  },
  {
    id: 'largo-new-world', title: 'Largo, from the New World Symphony (simplified)', by: 'Antonín Dvořák, Symphony No. 9 (1893)', level: 1,
    key: 0, time: [4, 4], tempo: 60, imslp: IMSLP('Symphony No.9, Op.95 (Dvořák, Antonín)'),
    about: 'A slow song for the right hand in C position. Hold each dotted quarter its full length, then let the eighth lean into the next note.',
    de: { title: "Largo aus der Sinfonie „Aus der Neuen Welt“ (vereinfacht)", by: "Antonín Dvořák, 9. Sinfonie (1893)", about: "Ein langsames Lied für die rechte Hand in C-Lage. Halte jede punktierte Viertel voll aus und lass die Achtel in die nächste Note hineinführen." },
    rh: 'E4@3:4. G4@5:8 G4@5:2 | E4@3:4. D4@2:8 C4@1:2 | D4@2:4. E4@3:8 G4@5:4. E4@3:8 | D4@2:1 | ' +
        'E4@3:4. G4@5:8 G4@5:2 | E4@3:4. D4@2:8 C4@1:2 | D4@2:4. E4@3:8 D4@2:4. C4@1:8 | C4@1:1',
  },
  {
    id: 'when-the-saints', title: 'When the Saints Go Marching In', by: 'African-American spiritual, traditional', level: 1,
    key: 0, time: [4, 4], tempo: 112,
    about: 'Right hand in C position. Every phrase starts after a rest on beat 1: count it, don\'t skip it.',
    de: { title: "When the Saints Go Marching In", by: "Afroamerikanisches Spiritual, traditionell", about: "Rechte Hand in C-Lage. Jede Phrase beginnt nach einer Pause auf Schlag 1: zähle sie mit, überspringe sie nicht." },
    rh: 'r:4 C4@1 E4@3 F4@4 | G4@5:1 | r:4 C4@1 E4@3 F4@4 | G4@5:1 | r:4 C4@1 E4@3 F4@4 | G4@5:2 E4@3 | C4@1 E4@3 | D4@2:1 | ' +
        'r:4 E4@3 E4@3 D4@2 | C4@1:2. C4@1:4 | E4@3:2 G4@5 | G4@5 F4@4 | r:4 E4@3 F4@4 G4@5 | E4@3:2 C4@1 | D4@2:1 | C4@1:1',
  },
  {
    id: 'ode-to-joy-left', title: 'Ode to Joy, left hand', by: 'Ludwig van Beethoven (1824)', level: 1,
    key: 0, time: [4, 4], tempo: 84, clef: 'bass',
    about: 'The same tune in the bass clef, left hand with 5 on C3. Read the bass clef as itself, not as "treble moved".',
    de: { title: "Ode an die Freude, linke Hand", by: "Ludwig van Beethoven (1824)", about: "Dieselbe Melodie im Bassschlüssel, linke Hand mit dem 5. Finger auf C3. Lies den Bassschlüssel als eigenen Schlüssel, nicht als „verschobenen Violinschlüssel“." },
    lh: 'E3@3:4 E3@3 F3@2 G3@1 | G3@1 F3@2 E3@3 D3@4 | C3@5 C3@5 D3@4 E3@3 | E3@3:4. D3@4:8 D3@4:2 | ' +
        'E3@3:4 E3@3 F3@2 G3@1 | G3@1 F3@2 E3@3 D3@4 | C3@5 C3@5 D3@4 E3@3 | D3@4:4. C3@5:8 C3@5:2',
  },
  {
    id: 'frere-jacques-left', title: 'Frère Jacques, left hand', by: 'French traditional', level: 1,
    key: 0, time: [4, 4], tempo: 92, clef: 'bass',
    about: 'Left hand in the bass clef, with eighth notes in bars 5 and 6 and a low G2. The hand shifts twice: follow the fingers.',
    de: { title: "Bruder Jakob, linke Hand", by: "Französisches Volkslied", about: "Linke Hand im Bassschlüssel, mit Achteln in Takt 5 und 6 und einem tiefen G2. Die Hand wechselt zweimal die Lage: folge den Fingern." },
    lh: 'C3@5:4 D3@4 E3@3 C3@5 | C3@5 D3@4 E3@3 C3@5 | E3@3 F3@2 G3@1:2 | E3@3:4 F3@2 G3@1:2 | ' +
        'G3@2:8 A3@1 G3@2 F3@3 E3@4:4 C3@5 | G3@2:8 A3@1 G3@2 F3@3 E3@4:4 C3@5 | C3@2:4 G2@5 C3@2:2 | C3@2:4 G2@5 C3@2:2',
  },

  // ---------------- level 2 ----------------
  {
    id: 'ode-to-joy-hands', title: 'Ode to Joy, both hands', by: 'Beethoven; accompaniment written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 80,
    about: 'Melody over a slow bass: the left hand moves only on beats 1 and 3.',
    de: { title: "Ode an die Freude, beide Hände", by: "Beethoven; Begleitung für diese Seite geschrieben", about: "Melodie über einem ruhigen Bass: die linke Hand bewegt sich nur auf Schlag 1 und 3." },
    rh: 'E4@3:4 E4@3 F4@4 G4@5 | G4@5 F4@4 E4@3 D4@2 | C4@1 C4@1 D4@2 E4@3 | E4@3:4. D4@2:8 D4@2:2 | ' +
        'E4@3:4 E4@3 F4@4 G4@5 | G4@5 F4@4 E4@3 D4@2 | C4@1 C4@1 D4@2 E4@3 | D4@2:4. C4@1:8 C4@1:2',
    lh: 'C3@2:2 E3@1 | G2@5 B2@3 | C3@2 E3@1 | C3@2 G2@5 | C3@2 E3@1 | G2@5 B2@3 | C3@2 E3@1 | G2@5 C3@2',
  },
  {
    id: 'twinkle-hands', title: 'Twinkle, Twinkle, both hands', by: 'French traditional; accompaniment written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 88,
    about: 'Three chords, as single bass notes: C, F and G. The left hand stays put: 5 on F2, 1 on C3.',
    de: { title: "Morgen kommt der Weihnachtsmann, beide Hände", by: "Französisches Volkslied; Begleitung für diese Seite geschrieben", about: "Drei Akkorde als einzelne Bassnoten: C, F und G. Die linke Hand bleibt liegen: 5 auf F2, 1 auf C3." },
    rh: 'C4@1:4 C4@1 G4@4 G4@4 | A4@5 A4@5 G4@4:2 | F4@4:4 F4@4 E4@3 E4@3 | D4@2 D4@2 C4@1:2 | G4@5:4 G4@5 F4@4 F4@4 | E4@3 E4@3 D4@2:2 | G4@5:4 G4@5 F4@4 F4@4 | E4@3 E4@3 D4@2:2 | ' +
        'C4@1:4 C4@1 G4@4 G4@4 | A4@5 A4@5 G4@4:2 | F4@4:4 F4@4 E4@3 E4@3 | D4@2 D4@2 C4@1:2',
    lh: 'C3@1:1 | F2@5:2 C3@1 | F2@5 C3@1 | G2@4 C3@1 | C3@1 F2@5 | C3@1 G2@4 | C3@1 F2@5 | C3@1 G2@4 | C3@1:1 | F2@5:2 C3@1 | F2@5 C3@1 | G2@4 C3@1',
  },
  {
    id: 'chord-study-c', title: 'Chord study in C', by: 'Written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 72,
    about: 'Read triads as shapes: I – IV – V – I, then vi – IV – V – I. The right hand barely moves; the left hand covers F2 to C3.',
    de: { title: "Akkordstudie in C-Dur", by: "Für diese Seite geschrieben", about: "Lies Dreiklänge als Formen: I – IV – V – I, dann vi – IV – V – I. Die rechte Hand bewegt sich kaum; die linke deckt F2 bis C3 ab." },
    rh: 'C4@1+E4@3+G4@5:2 C4+E4+G4 | C4@1+F4@3+A4@5 C4+F4+A4 | B3@1+D4@2+G4@5 B3+D4+G4 | C4@1+E4@3+G4@5:1 | ' +
        'A3@1+C4@3+E4@5:2 A3+C4+E4 | A3@1+C4@2+F4@5 A3+C4+F4 | B3@1+D4@2+G4@5 B3@1+D4@2+F4@4 | C4@1+E4@3+G4@5:1',
    lh: 'C3@1:1 | F2@5 | G2@4 | C3@1 | A2@3 | F2@5 | G2@4 | C3@1',
  },
  {
    id: 'evening-song', minor: true, title: 'Evening song in A minor', by: 'Written for this site', level: 2,
    key: 0, time: [4, 4], tempo: 72,
    about: 'A minor: no key signature, but the G♯ in bar 7 (the raised seventh) tells you it is minor.',
    de: { title: "Abendlied in a-Moll", by: "Für diese Seite geschrieben", about: "a-Moll: keine Vorzeichen, aber das Gis in Takt 7 (die erhöhte 7. Stufe) verrät Moll." },
    rh: 'A4@3:4 B4@4 C5@5 B4@4 | A4@3:2 E4@1 | F4@3:4 E4@2 D4@1 F4@3 | E4@2:1 | A4@1:4 B4@2 C5@3 D5@4 | E5@5:2 C5@4 | B4@3:4 A4@2 G#4@1 B4@3 | A4@2:1',
    lh: 'A2@5:2 E3@1 | A2@5 C3@3 | D3@2 A2@5 | E3@1:1 | A2@5:2 C3@3 | C3@3 E3@1 | E3@1:1 | A2@5:1',
  },
  {
    id: 'canon-in-d', title: 'Canon in D, theme', by: 'Johann Pachelbel (c. 1680); set for piano for this site', level: 2,
    key: 2, time: [4, 4], tempo: 66, imslp: IMSLP('Canon and Gigue in D major, P.37 (Pachelbel, Johann)'),
    about: 'D major, two sharps. The left hand plays the famous eight-note bass; the right hand walks down over it, one half note per chord.',
    de: { title: "Kanon in D-Dur, Thema", by: "Johann Pachelbel (um 1680); für Klavier gesetzt für diese Seite", about: "D-Dur, zwei Kreuze. Die linke Hand spielt den berühmten Bass aus acht Tönen; die rechte Hand schreitet darüber abwärts, eine Halbe pro Akkord." },
    rh: 'F#5@5:2 E5@4 | D5@3 C#5@2 | B4@2 A4@1 | B4@2 C#5@3 | D5@5 C#5@4 | B4@3 A4@2 | G4@3 F#4@2 | G4@3 E4@1 | D4@1+F#4@3+A4@5:1',
    lh: 'D3@1:2 A2@3 | B2@2 F#2@5 | G2@2 D2@5 | G2@2 A2@1 | D3@1 A2@3 | B2@2 F#2@5 | G2@2 D2@5 | G2@2 A2@1 | D3@1:1',
  },

  // ---------------- level 3 ----------------
  {
    id: 'frere-jacques-canon', title: 'Frère Jacques as a canon', by: 'French traditional; canon set for this site', level: 3,
    key: 0, time: [4, 4], tempo: 84,
    about: 'One player, two voices: the left hand starts the same tune two bars later. Hands independent.',
    de: { title: "Bruder Jakob als Kanon", by: "Französisches Volkslied; Kanonsatz für diese Seite", about: "Ein Spieler, zwei Stimmen: die linke Hand beginnt dieselbe Melodie zwei Takte später. Die Hände spielen unabhängig." },
    rh: 'C4@1:4 D4@2 E4@3 C4@1 | C4@1 D4@2 E4@3 C4@1 | E4@3 F4@4 G4@5:2 | E4@3:4 F4@4 G4@5:2 | G4@4:8 A4@5 G4@4 F4@3 E4@2:4 C4@1 | G4@4:8 A4@5 G4@4 F4@3 E4@2:4 C4@1 | ' +
        'C4@4:4 G3@1 C4@4:2 | C4@4:4 G3@1 C4@4:2 | C4@4:4 G3@1 C4@4:2 | C4@4:4 G3@1 C4@4:2',
    lh: 'r:1 | r:1 | C3@5:4 D3@4 E3@3 C3@5 | C3@5 D3@4 E3@3 C3@5 | E3@3 F3@2 G3@1:2 | E3@3:4 F3@2 G3@1:2 | G3@2:8 A3@1 G3@2 F3@3 E3@4:4 C3@5 | G3@2:8 A3@1 G3@2 F3@3 E3@4:4 C3@5 | ' +
        'C3@2:4 G2@5 C3@2:2 | C3@2:4 G2@5 C3@2:2',
  },
  {
    id: 'waltz-in-f', title: 'Waltz in F', by: 'Written for this site', level: 3,
    key: -1, time: [3, 4], tempo: 112,
    about: 'Three-four time, one flat. The left hand plays bass then chord, chord: "oom-pah-pah".',
    de: { title: "Walzer in F-Dur", by: "Für diese Seite geschrieben", about: "Dreivierteltakt, ein ♭. Die linke Hand spielt Bass, dann Akkord, Akkord: „Hm-ta-ta“." },
    rh: 'C5@5:4 A4@3 F4@1 | G4@2:2 A4@3:8 Bb4@4 | C5@5:4 A4@3 F4@2 | E4@1:2. | G4@3:4 Bb4@5 E4@1 | F4@2:2 A4@4:4 | G4@3:8 F4@2 E4@1:4 G4@3 | F4@2:2.',
    lh: 'F2@5:4 A2@3+C3@1 A2+C3 | E2@5 G2@3+Bb2@1 G2+Bb2 | F2@5 A2@3+C3@1 A2+C3 | C3@5 E3@3+G3@1 E3+G3 | E2@5 G2@3+Bb2@1 G2+Bb2 | F2@5 A2@3+C3@1 A2+C3 | E2@5 G2@3+Bb2@1 G2+Bb2 | F2@5 A2@3+C3@1 F2@5',
  },
  {
    id: 'minuet-in-g', title: 'Minuet in G (simplified)', by: 'Christian Petzold (c. 1725), from the Notebook for Anna Magdalena Bach; left hand simplified for this site', level: 3,
    key: 1, time: [3, 4], tempo: 96, imslp: IMSLP('Minuet in G major, BWV Anh.114'),
    about: 'G major, one sharp (every F is F♯). Running eighths in the right hand over one bass note per bar.',
    de: { title: "Menuett in G-Dur (vereinfacht)", by: "Christian Petzold (um 1725), aus dem Notenbüchlein für Anna Magdalena Bach; linke Hand für diese Seite vereinfacht", about: "G-Dur, ein Kreuz (jedes F ist ein Fis). Laufende Achtel in der rechten Hand über einem Basston pro Takt." },
    rh: 'D5@5:4 G4@1:8 A4@2 B4@3 C5@4 | D5@5:4 G4@1 G4@1 | E5@3:4 C5@1:8 D5@2 E5@3 F#5@4 | G5@5:4 G4@1 G4@1 | C5@4:4 D5@5:8 C5@4 B4@3 A4@2 | B4@4:4 C5@5:8 B4@4 A4@3 G4@2 | F#4@1:4 G4@2:8 A4@3 B4@4 G4@2 | A4@3:2. | ' +
        'D5@5:4 G4@1:8 A4@2 B4@3 C5@4 | D5@5:4 G4@1 G4@1 | E5@3:4 C5@1:8 D5@2 E5@3 F#5@4 | G5@5:4 G4@1 G4@1 | C5@4:4 D5@5:8 C5@4 B4@3 A4@2 | B4@4:4 C5@5:8 B4@4 A4@3 G4@2 | A4@3:4 B4@4:8 A4@3 G4@2 F#4@1 | G4@2:2.',
    lh: 'G3@4:2. | B3@2 | C4@1 | B3@2 | A3@3 | G3@4 | D3@5 | D3@5 | G3@4 | B3@2 | C4@1 | B3@2 | A3@3 | G3@4 | D3@5 | G2@5',
  },
  {
    id: 'prelude-in-c', title: 'Prelude in C, opening (simplified)', by: 'Johann Sebastian Bach, The Well-Tempered Clavier I, BWV 846 (1722)', level: 3,
    key: 0, time: [4, 4], tempo: 56, imslp: IMSLP('Das wohltemperierte Klavier I, BWV 846-869 (Bach, Johann Sebastian)'),
    about: 'Sixteenths in broken chords: C – Dm7 – G7 – C. The left hand holds the bass; the right hand plays the same shape twice per bar. Fingering is marked once per bar.',
    de: { title: "Präludium in C-Dur, Anfang (vereinfacht)", by: "Johann Sebastian Bach, Das Wohltemperierte Klavier I, BWV 846 (1722)", about: "Sechzehntel in gebrochenen Akkorden: C – Dm7 – G7 – C. Die linke Hand hält den Bass; die rechte spielt dieselbe Figur zweimal pro Takt. Der Fingersatz steht einmal pro Takt." },
    rh: 'r:16 E4@1 G4@2 C5@4 E5@5 G4 C5 E5 r E4 G4 C5 E5 G4 C5 E5 | r:16 D4@1 A4@2 D5@4 F5@5 A4 D5 F5 r D4 A4 D5 F5 A4 D5 F5 | ' +
        'r:16 D4@1 G4@2 D5@4 F5@5 G4 D5 F5 r D4 G4 D5 F5 G4 D5 F5 | r:16 E4@1 G4@2 C5@4 E5@5 G4 C5 E5 r E4 G4 C5 E5 G4 C5 E5',
    lh: 'C4@5:2 C4 | C4@5 C4 | B3@5 B3 | C4@5 C4',
  },
  {
    id: 'fur-elise', minor: true, title: 'Für Elise, opening', by: 'Ludwig van Beethoven, WoO 59 (1810)', level: 3,
    key: 0, time: [3, 8], tempo: 60, pickup: 0.5, imslp: IMSLP('Für Elise, WoO 59 (Beethoven, Ludwig van)'),
    about: 'Three-eight time with a two-note pickup. The hands take turns: left-hand broken chords, then the right hand climbs back up. Practise slowly, hands separately first.',
    de: { title: "Für Elise, Anfang", by: "Ludwig van Beethoven, WoO 59 (1810)", about: "Dreiachteltakt mit zwei Auftakttönen. Die Hände wechseln sich ab: gebrochene Akkorde links, dann steigt die rechte Hand wieder auf. Langsam üben, zuerst mit getrennten Händen." },
    rh: 'E5@5:16 D#5@4 | E5@5 D#5@4 E5@5 B4@2 D5@4 C5@3 | A4@1:8 r:16 C4@1 E4@2 A4@3 | B4@4:8 r:16 E4@1 G#4@3 B4@4 | C5@5:8 r:16 E4@1 E5@5 D#5@4 | ' +
        'E5@5 D#5@4 E5@5 B4@2 D5@4 C5@3 | A4@1:8 r:16 C4@1 E4@2 A4@3 | B4@4:8 r:16 E4@1 C5@5 B4@4 | A4@3:4.',
    lh: 'r:8 | r:4. | A2@5:16 E3@2 A3@1 r:8. | E2@5:16 E3@2 G#3@1 r:8. | A2@5:16 E3@2 A3@1 r:8. | r:4. | A2@5:16 E3@2 A3@1 r:8. | E2@5:16 E3@2 G#3@1 r:8. | A2@5:16 E3@2 A3@1 r:8.',
  },
];
