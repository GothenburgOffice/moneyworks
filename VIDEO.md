# Videos

How the site's videos work and the rules they follow. The app ships only the
rendered walkthrough files in `web/public/media/`. The sources and the tools
that render them (compositions, narration recordings, interface captures and
the authoring image) are branded artwork and are kept outside this repository
by the owner, with their own rebuild instructions. The rendered videos are
artwork under CC BY-NC 4.0 ([ARTWORK.md](ARTWORK.md)).

## What exists

| Video               | Languages | Length, size    | Sound               | Shipped as                                                       |
| ------------------- | --------- | --------------- | ------------------- | ---------------------------------------------------------------- |
| FIRE walkthrough    | en, sv    | 90 s, 1280×720  | Narration, no music | `web/public/media/fire-demo/<locale>/` (video, poster, captions) |
| FIRE feature teaser | en, sv    | 20 s, 1920×1080 | Silent              | Not in the app; the owner publishes it                           |

Every video follows one example: age 50, stop working at 55, plan to 85, spending
1,000 a month, portfolio 100,000, saving 500 a month, one pension of 600 a month
from 65 to 85, with zero return, inflation and fees. The amounts are arbitrary
currency units and never a recommendation. The calculator gives 216,000 needed,
130,000 projected, 1,934 a month and a gap of 86,000 for it, in both languages.

## In the app

- `web/src/content/fire-demo.ts` points at the files and holds the text
  walkthrough, the captions list and the player copy for each language. Bump its
  `version` whenever a shipped file changes, so browsers fetch the new one.
- The walkthrough is native, self-hosted video: user-initiated playback only,
  captions off by default, paused on closing the demo or leaving the tool. No
  third-party player, analytics or tracking.
- The English video carries English and Swedish captions; the Swedish video
  carries Swedish ones.

## Rules for the videos

- Narration, captions and the text walkthrough in `fire-demo.ts` say the same
  thing, in both languages.
- Interface images are real screenshots of the calculator, never rebuilt UI.
  Recapture them whenever the calculator's look or copy changes. Do not add
  attributes to the app only for the video.
- One narration voice for both languages, calm and natural. Agents cannot hear
  the result: a person listens before a narration change is published
  (pronunciation of the brand name, tone across clips, captions against speech).
- Swedish uses sentence case and the app's own labels for buttons and views
  ("Beräkna planen", "Sparplan", "Uttagsplan").
- The brand mark in a video is identical to the paths in
  `web/src/content/brand.ts`.
- No stock media, music, third-party player or tracking. No production URL in a
  video unless the owner supplies it.
- Say only what the calculator does. Illustrative amounts are never presented as
  advice or a forecast.
- Third-party notices travel with the files that need them (GSAP, Manrope,
  HyperFrames).

## Adding or replacing a video

The owner renders videos from the sources kept outside the repository. A pull
request here only adds or replaces the rendered files under
`web/public/media/`, points the tool's content file at them, bumps `version`,
keeps the text walkthrough in step with the narration and updates
`ARTWORK.md`.
