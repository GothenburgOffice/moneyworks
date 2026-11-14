# Accessibility

MoneyWorks aims to be usable by everyone, including people who use a keyboard, a screen reader,
zoom, a high-contrast or reduced-motion setting, or a slow connection. This page says what the
project commits to, where it runs, what is known to fall short and how to report a barrier.

## Commitment

- Public pages are server-rendered HTML that read without JavaScript, in English and Swedish with the
  same meaning and hierarchy.
- Controls are native elements where possible, with visible focus, localized accessible names for
  icon-only buttons and targets of at least 44 px.
- Layouts work on small screens and in both the dark and light themes.
- The walkthrough video on the FIRE calculator is user-started, has English and Swedish subtitles
  and a text version.
- Accessibility problems are treated as bugs.

The design rules behind this are in [DESIGN.md](DESIGN.md) and
[.github/copilot-instructions.md](.github/copilot-instructions.md).

## Supported environments

Current desktop and mobile browsers. The automated browser tests run Chromium at desktop and
mobile sizes, in both languages and also without JavaScript; other browsers are expected to work
because the pages use standard HTML but are not tested. Testing with assistive technology is not
documented yet.

## Known limitations

- The tool calculators (for example the FIRE calculator) need JavaScript. Without it their
  explanations stay readable and the controls say why they are disabled.
- The project has had no formal accessibility audit and does not claim conformance with a specific
  WCAG level.
- Charts are visual; the same results are also shown as numbers and in a yearly table.
- `/admin` (for the site operator) is English only.

## Report a barrier

Open an issue with the **Accessibility barrier** template, saying the page, what you tried, what
happened and which browser and assistive technology you used. Do not include personal or financial
information. If an issue is not an option for you, use GitHub's **Report content** on any item in
this repository and say it concerns accessibility.
