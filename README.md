# Music Academy

Music theory practice at the keyboard, for grown-ups who want to **read faster** and **find their bearings in a
new score quickly**: what key is this in, which notes are these, what are the chords doing?

Everything runs in the browser. The server only hands out static files, and progress stays on the device.
It's best with a digital piano connected over MIDI, and works with an on-screen keyboard and answer buttons too.

| Drill | What it trains |
| --- | --- |
| **Note reading** | Treble, bass or grand staff. See a note and play the exact key (octave included), or name it. Ledger lines (up to four), accidentals, or notes that follow a real key signature. Single notes, or rows of 4 or 8 to read ahead. |
| **Key signatures** | Signature → key (tap it or play the tonic), and key → signature. Major and minor, up to 7 ♯/♭, treble and bass. After a miss it shows the rule of thumb (last sharp + half step; second-to-last flat). |
| **Chords** | Triads and seventh chords (major, minor, dim, aug, 7, maj7, m7, ø7, °7), root position or all inversions. Name them from the staff, play them from the staff (the written bass must be lowest), or play them from a chord symbol. |
| **Scales** | Play a scale from memory or from the notes (1–2 octaves, up or up-and-down, any starting octave), name a scale from the staff, or recognise major, minor and the modes **by ear** over a drone. |
| **Progressions** | The first look at a new piece: a 4-bar progression on the grand staff. Name the key (major or its relative minor? the chords decide), then each bar as a Roman numeral, then hear it. Also: recognise a progression by ear, or play one in any key from its numerals. |

| **Pieces** | Short pieces with real rhythm, levels 1–3: traditional and public-domain melodies (Beethoven's Ode to Joy, Au clair de la lune, Hänschen klein, Frère Jacques, Petzold's Minuet in G) and studies written for this site (A minor, a waltz in F, a chord study, a canon). **Wait for me** waits for the right notes; **Play along** counts in, runs the metronome and judges every note for pitch and timing (early/late, in ms); **Listen** plays it with a playhead. Practise one hand while the other plays itself, at any tempo. |
| **Metronome & timing** | A metronome that listens: 2/4 to 6/8, subdivisions, accent, tap tempo, and *silent bars* (the click drops out, you keep going). Every note you play is placed against the beat: how many ms early or late, your average and your spread. *Measure my delay* calibrates the delay of your setup; Play along uses it too. |

Every drill keeps statistics per question (recent accuracy, recent response time). The questions you miss or answer
slowly come up more often, and **📊** shows your weak spots. Note names are English (B, B♭) or German (H, B).

## How it works

```
site/                       everything that gets served (plain HTML, CSS, JavaScript; no framework, no bundler)
  index.html                home page: drills, settings, save/load progress
  drills/<drill>/index.html one page per drill
  shared/
    theory.js               the music theory: spelled notes, keys, scales, chords, Roman numerals, voicings
    staff.js                draws notation as SVG (clefs, key signatures, ledger lines, chords, accidentals)
    score.js                engraves whole pieces: rhythm, stems, beams, rests, time signatures, several lines
    pieces.js               the pieces, in a small text notation (see score.js)
    transport.js            a beat clock on the audio timeline (metronome, play along)
    glyphs.js               the music symbols, from the Bravura font (SIL OFL, see BRAVURA-OFL.txt)
    input.js                MIDI keyboard (Web MIDI) and on-screen keyboard, one stream of notes
    chordinput.js           "did they play this chord?", tolerant of legato and any voicing
    keyboard.js             the on-screen piano
    audio.js                a small piano-like synthesiser (Web Audio), nothing to download
    ui.js                   the frame every drill shares, settings, statistics, progress on the device
    drills.js               the list of drills (the home page and the offline cache read it)
    edition.js              which edition this is (replaced by the build)
  sw.js, manifest.webmanifest, icon*  installable app, works offline
editions/<edition>/site.json  an edition: name, audience, instruments
tools/check.mjs             tests the theory, renders every staff the drills can ask for, parses every page
tools/build.mjs             builds an edition into dist/<edition>/
Dockerfile, nginx.conf      the image: check, build, serve with nginx
deploy/docker-compose.yml   how the homelab runs it
.github/workflows/          check, build, push to GHCR, deploy on the homelab runner
```

**Editions.** The plan is an adult and a children's edition, each for piano and guitar. An edition is a build of the
same `site/` with its own `editions/<name>/site.json`: `audience` picks which drills show (each drill in
`drills.js` lists its audiences), `instruments` the instrument tabs that are live. Each edition becomes its own image
and its own address, so its progress (kept per web address) stays separate. Today there's one: `adult` with piano.

**Look.** The colours are the pakdad.com palette: paper, ink and terracotta (`#b6431c`, `#ef8a5f` on dark).

**MIDI.** Web MIDI works in Chrome, Edge and Opera on computers and in Chrome on Android, over https (or
localhost). Safari and every browser on iPad and iPhone don't have it, so there use the on-screen keyboard or the
answer buttons. Plug in the piano and it shows up by itself (the MIDI light in the top bar).

**Progress** lives in the browser's local storage for this address. The home page can save it to a file and load
it back, to move it between devices.

## Adding a piece

Add it to `site/shared/pieces.js`. Each hand is text, bar by bar:

```js
rh: 'E4:4 E4 F4 G4 | G4:4. F4:8 E4:2 | C4+E4+G4:1',   // pitch:length; + makes a chord; r is a rest
lh: 'C3:2 G2 | C3:1 | r:1',                          // 1 2 4 8 = whole … eighth, a dot for dotted
```

The length carries on until the next one is given. `node tools/check.mjs` checks that every bar adds up to the
time signature, the hands are the same length, and the piece engraves. Only use music that is in the public
domain or that you wrote.

## Adding a drill

1. Create `site/drills/<id>/index.html`. Copy the `<head>` and script tags of an existing drill, then call
   `UI.page({ drill, title, settings, defaults, describe, onSettings })`. That gives you the top bar, settings,
   statistics, `page.ask(item)` / `page.answer(ok)`, `page.pick(items)` (weighted towards weak items),
   `page.choices(...)`, `page.flash(...)` and the on-screen keyboard.
2. Draw with `Staff.svg({ clef, key, items })` and listen with `Input.on(...)` (or `ChordInput` for chords).
3. Add it to `site/shared/drills.js`.
4. `node tools/check.mjs` must pass (it also checks that the page's script parses).

## Run it locally

```bash
python3 -m http.server 8000 --directory site
```

Open http://localhost:8000 in Chrome. Web MIDI works on localhost, so a USB piano works right away.

```bash
node tools/check.mjs          # theory tests and render checks
node tools/build.mjs adult    # → dist/adult/
docker build -t music-academy . && docker run --rm -p 8082:80 music-academy
```

## Deploying

Pushing to `main` runs the checks, builds the image on GitHub, pushes it to `ghcr.io/<owner>/music-academy`, and a
self-hosted runner on the homelab pulls it and restarts the container (health-checked). A tag `v1.2.0` also
makes versioned images and a GitHub Release. To roll back, run the workflow by hand with an older `image_tag`.
The one-time server setup is in [docs/homelab-setup.md](docs/homelab-setup.md).

## Licence and credits

The code is under the [MIT License](LICENSE).

Music symbols: [Bravura](https://github.com/steinbergmedia/bravura) by Steinberg Media Technologies GmbH, under the
SIL Open Font License 1.1 (`site/shared/BRAVURA-OFL.txt`). Only the outlines of the symbols used are included.
