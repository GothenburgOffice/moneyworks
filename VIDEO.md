# Videos

How the walkthrough and teaser videos are made. The app ships only the rendered
files in `web/public/media/`; everything used to make them lives in `video/` and
is never an app dependency. The rendered videos and their sources are artwork
under CC BY-NC 4.0 ([ARTWORK.md](ARTWORK.md)).

## What exists

| Video               | Languages | Length, size    | Sound               | Shipped as                                                        |
| ------------------- | --------- | --------------- | ------------------- | ----------------------------------------------------------------- |
| FIRE walkthrough    | en, sv    | 90 s, 1280×720  | Narration, no music | `web/public/media/fire-demo/<locale>/` (video, poster, captions)  |
| FIRE feature teaser | en, sv    | 20 s, 1920×1080 | Silent              | Not in the app; rendered to `video/out/` for the owner to publish |

Every video follows one example: age 50, stop working at 55, plan to 85, spending
1,000 a month, portfolio 100,000, saving 500 a month, one pension of 600 a month
from 65 to 85, with zero return, inflation and fees. The amounts are arbitrary
currency units and never a recommendation.

## Layout

```text
video/
├── Dockerfile              # Authoring image: Node 22, Chromium, FFmpeg, HyperFrames, playwright-core
├── capture.mjs             # Screenshots the calculator plates from a running app
├── render.sh               # Checks and renders every video
├── fire-demo/<locale>/     # 90 s walkthrough
│   ├── index.html          # Root composition: size, length and the seven narration clips
│   ├── compositions/frames/01-walkthrough.html  # Scenes, headings and animation timing
│   ├── narration.txt       # The spoken script, one paragraph per scene
│   └── assets/             # Plates (n-*.png), narration-1..7.wav, captions, mark, font, GSAP
└── fire-features/<locale>/ # 20 s silent teaser: four headline cards with plates
```

The compositions are [HyperFrames](https://github.com/heygen-com/hyperframes)
projects (Apache-2.0, pinned to CLI `0.8.173`): plain HTML and CSS animated with
a local copy of GSAP, rendered frame by frame in headless Chromium and encoded
with FFmpeg.

## Rebuild everything

Run from the repository root. The dev stack must be running for the capture step.

```bash
docker build -t moneyworks-video video
```

```bash
docker run --rm -v "$PWD/video:/video" -v "$PWD/web/public/media:/media" moneyworks-video sh render.sh
```

`render.sh` runs `hyperframes check` and `hyperframes render` for each video,
copies the walkthroughs, a poster frame and the captions into
`web/public/media/fire-demo/<locale>/`, and leaves all four MP4 files in
`video/out/` (gitignored). On Windows Git Bash, prefix the `docker run` with
`MSYS_NO_PATHCONV=1` and use a Windows-style path for the mounts.

After a render, bump `version` in `web/src/content/fire-demo.ts` so browsers
fetch the new files.

## Recapture the interface plates

The plates are real screenshots of the calculator, never rebuilt UI. Recapture
them whenever the calculator's look or copy changes:

```bash
docker run --rm --network container:moneyworks-app-1 -v "$PWD/video:/video" -e FIRE_URL="http://127.0.0.1:3000/sv/tools/fire?theme=dark" -e OUT=fire-demo/sv/assets -e PENSION_NAME=Exempelpension moneyworks-video node capture.mjs
```

- Sharing the app container's network makes the page load from `127.0.0.1`,
  which the dev server accepts. Another hostname leaves the page unhydrated.
- Run it once per language (`/en/…`, `OUT=fire-demo/en/assets`, default pension
  name), then copy the `n-*.png` files into `fire-features/<locale>/assets/`.
- The script prints the example's results; they must match in both languages
  (216,000 needed, 130,000 projected, 1,934 a month, gap 86,000).
- It relies on the calculator's `data-*` attributes. If a selector is missing,
  fix the script; do not add attributes to the app only for the video.

## Narration

- One clip per scene, `narration-1.wav` to `narration-7.wav`, generated from the
  paragraphs in `narration.txt` with Gemini text-to-speech, voice Aoede, and the
  style direction "Relaxed, natural and friendly, at a natural speaking pace. A
  calm product walkthrough narration." The same voice is used for both languages.
- Generate a paragraph per call, not the whole script, so no silence detection is
  needed to cut it up.
- Convert each clip to mono 16-bit WAV and level it to about -21.5 LUFS
  (`ffmpeg -af loudnorm=print_format=summary` reports the level; apply the
  difference with `-af volume=<n>dB`). Raw clips differ by several dB.
- A clip must fit its scene: it starts 0.35 s into the scene and has to end
  before the next scene starts. Scene starts are in the `scenes` array in the
  composition. If a clip is too long, shorten the text; the 90 s length is fixed.
- Set `data-duration` on the matching `<audio>` in `index.html` to the clip's
  real length.
- Agents cannot hear the result. A person must listen before a narration change
  is merged: pronunciation of the brand name, tone across clips, and captions
  against speech.

## Timing and captions

- On-screen reveals are tied to the speech. In `01-walkthrough.html` the offsets
  after `scenes[n].voiceStart` or `scenes[n].start` say when a plate appears.
  After changing a clip, find the pauses with
  `ffmpeg -af silencedetect=noise=-40dB:d=0.22` and move the offsets to the
  sentence that names the thing shown.
- Captions are WebVTT files in `assets/`, timed to the same measured pauses. The
  English video carries English and Swedish captions; the Swedish video carries
  Swedish ones. Captions must say what the voice says.
- The text walkthrough in `web/src/content/fire-demo.ts` must say the same as the
  narration, in both languages.

## Adding a video or a language

1. Copy the closest existing folder (`fire-demo/en` for a narrated video,
   `fire-features/en` for a silent one) and add it to `render.sh`.
2. Translate headings and the script. Swedish uses sentence case, and the app's
   own labels for buttons and views ("Beräkna planen", "Sparplan", "Uttagsplan").
3. Capture plates in that language, generate and level the narration, set the
   clip lengths, move the reveal offsets and write the captions.
4. Run `render.sh`, look at frames from every scene, and have a person listen.
5. For a video shown in the app, add its files under `web/public/media/`, point
   the tool's content file at them and update `ARTWORK.md`.

## Rules

- Keep the brand mark in `assets/brand-mark.svg` identical to the paths in
  `web/src/content/brand.ts`.
- No stock media, music, third-party player or tracking. No production URL in a
  video unless the owner supplies it.
- Say only what the calculator does. Illustrative amounts are never presented as
  advice or a forecast.
- Third-party notices stay with the files: GSAP's header in `gsap.min.js`,
  `MANROPE-LICENSE.txt`, and `HYPERFRAMES-LICENSE.txt`.
