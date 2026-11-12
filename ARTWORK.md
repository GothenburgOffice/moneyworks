# Artwork

The source code in this repository is licensed under the [MIT License](LICENSE).
The artwork below was made for the MoneyWorks and Pengar jobbar sites that the
owner hosts at `moneyworks.finance` and `pengarjobbar.nu`. It is **not** covered
by the MIT License. All rights are reserved, and you may not use it without
written permission from the owner.

## What is not covered

- The MoneyWorks (M/W) and Pengar jobbar (PJ) marks, wherever they appear:
  - `web/public/moneyworks-mark.svg`
  - `web/public/pengar-jobbar-mark.svg`
  - `web/src/app/favicon.ico`
  - the mark path data in `web/src/content/brand.ts`, and its rendering in
    `web/src/components/brand-logo.tsx`
- The FIRE calculator walkthrough video, its poster image and its subtitles:
  `web/public/media/fire-demo.mp4`, `fire-demo-poster.webp` and
  `fire-demo.en.vtt` / `fire-demo.sv.vtt`.

## What stays MIT

Everything else, including the application code, styles, tests, configuration
and the generic interface icons in `web/src/components/ui-icons.tsx`. The
self-hosted Manrope font in `web/public/fonts/` keeps its own
[SIL Open Font License](web/public/fonts/OFL.txt).

## Running your own copy

You may fork and self-host the code. Replace the artwork above with your own
before you publish a site, and do not present your copy as MoneyWorks or
Pengar jobbar. Swapping it means editing `web/src/content/brand.ts` and the
files listed above.
