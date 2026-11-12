# Artwork

The source code in this repository is licensed under the [MIT License](LICENSE).
The artwork below was made for the MoneyWorks and Pengar jobbar sites that the
owner hosts at `moneyworks.finance` and `pengarjobbar.nu`. It is **not** covered
by the MIT License. It is licensed under
[Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/):
you may share and adapt it for non-commercial purposes if you give credit, link
to the license and say what you changed. For commercial use, ask the owner for
written permission.

The Creative Commons license does not grant trademark rights. The names and
marks identify the owner's sites, so don't present your copy or your work as
MoneyWorks or Pengar jobbar.

## What is not covered

- The MoneyWorks (M/W) and Pengar jobbar (PJ) marks, wherever they appear:
  - `web/public/moneyworks-mark.svg`
  - `web/public/pengar-jobbar-mark.svg`
  - `web/src/app/favicon.ico`
  - the mark path data in `web/src/content/brand.ts` (the `paths` and `icon`
    values), and the marks drawn from it
- The FIRE calculator walkthrough video, its poster image and its subtitles:
  `web/public/media/fire-demo.mp4`, `fire-demo-poster.webp` and
  `fire-demo.en.vtt` / `fire-demo.sv.vtt`.

## What stays MIT

Everything else, including the application code, styles, tests, configuration
and the generic interface icons in `web/src/components/ui-icons.tsx`. That
includes `web/src/components/brand-logo.tsx`: the component is MIT, only the
mark data it draws is artwork. The self-hosted Manrope font in
`web/public/fonts/` keeps its own [SIL Open Font License](web/public/fonts/OFL.txt).

## Running your own copy

You may fork and self-host the code. Before you publish a site, replace the
artwork above with your own, or follow the CC BY-NC terms (non-commercial use
with credit). Either way, don't present your copy as MoneyWorks or Pengar
jobbar. Swapping it means editing `web/src/content/brand.ts` and the files
listed above.
