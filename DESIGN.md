---
name: MoneyWorks
description: Clear, country-neutral personal-finance tools and information.
colors:
  ground: "#181c18"
  surface: "#242a24"
  ink: "#f8f8f0"
  muted: "#c2c8bd"
  line: "#485145"
  primary: "#d6fb79"
  primary-soft: "#314124"
  primary-ink: "#181c18"
  positive: "#a9e5ad"
  negative: "#ffb4b4"
typography:
  headline:
    fontFamily: Manrope
    fontSize: 80px
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: -0.065em
  title:
    fontFamily: Manrope
    fontSize: 26px
    fontWeight: 600
    letterSpacing: -0.035em
  body:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: Manrope
    fontSize: 13px
    fontWeight: 600
rounded:
  control: 3px
  card: 3px
spacing:
  desktop-gutter: 32px
  mobile-gutter: 20px
  narrow-gutter: 16px
  card-gap: 24px
components:
  button-primary:
    background: "{colors.primary}"
    color: "{colors.primary-ink}"
    borderRadius: "{rounded.control}"
  tool-card:
    background: "{colors.primary}"
    borderRadius: "{rounded.card}"
---

# Design System: MoneyWorks

## Overview

Direction C, Bright works, is the owner-selected visual starter for the real application. The country-neutral product scope remains in `PRODUCT.md`. The ten-tool/blog/video expansion study is not implemented or adopted by selecting this direction.

Use charcoal/lime, bold uppercase two-line headings, a large tilted original M/W mark with two useful anchor labels, and sharply cornered contrasting tool panels. Keep it legible and honest: no invented account data, performance charts or commercial proof.

## Creative North Star

A useful place to start. Cooperative clarity informs the original mark and common grid, not a literal stationery or office metaphor.

## Color Palette

The frontmatter and `web/src/app/globals.css` record the dark default. Charcoal is the ground; lime identifies the mark, action and second headline line. FIRE uses a lime panel and crypto an ivory panel, both with dark readable text. The about band is lime. These colours are identity and category treatment, not fabricated financial success.

The light counterpart uses ivory `#f8f8f0`, charcoal text, a dark action and green `#3f7f14` headline accent. The localized theme control enhances static HTML; language links carry a validated mode query, and history updates are guarded for restricted iframes. No browser-storage APIs are used. Without scripts the control is hidden and all content remains readable in dark mode. Database success/failure colours always accompany text.

## Typography

Manrope is self-hosted as a variable Latin font, including Swedish characters. Preserve its OFL license in `web/public/fonts/`. The introductory title is deliberately larger than dense application-page headings because this is a public tool hub; it is not an account dashboard.

The introductory title scales to 80px with 800 weight, stepping through 46–57px at compact desktop and 39px/33px on mobile. Two translated spans provide deliberate line breaks, while the full heading remains readable text. Tool titles use 29px/800, reducing on mobile. Reading copy is 14–16px; small type is limited to labels and secondary information. Test Swedish as well as English.

## Layout

The centred frame is 1160px, growing to 1220px only on larger screens. Gutters step from 32px to 20px and then 16px. The desktop hero pairs oversized type with the M/W illustration and two anchored question labels. At narrow widths, artwork and content stack naturally without carousels. Two contrasting tool panels follow, with status labels reflecting actual functionality.

The header and footer are full-width surfaces aligned to the same inner grid. Desktop navigation becomes a native mobile menu at 740px. The page remains one content surface per locale.

## Shapes

Cards, signals and controls use 3px corners. Categories are plain labels, not oversized decorative badges. Dividers separate native disclosure rows.

## Elevation

Cards at rest are flat, without shadows. The only shadow belongs to the floating mobile navigation menu. It is functional separation from content, not ambient decoration.

## Components

### Brand and Navigation

`BrandLogo` composes the original M/W vector and wordmark. The link has a meaningful localized label and returns to the top. SVG decoration is hidden from the accessibility tree.

`SiteHeader` composes the brand, desktop section links, language switcher and native mobile disclosure. Section links target real anchors; language changes use full-document routes so they work with static HTML.

The mobile menu summary is 44×44px. It closes after anchor navigation and with Escape, returning focus to its summary. Links, summaries and the skip link have explicit keyboard focus treatment.

### Planned Tool Panels

`ToolCard` owns the category, Planned/Planeras state, intended purpose and native expandable plan. It has no fake calculation fields or output. A plus rotates into a close indication when expanded; the full plan and unavailability notice remain in the static HTML.

### Information

`LearnSection` uses native disclosures with one explanatory item initially open. No modal or client router is required to read the copy.

### About and Footer

The about section explains the country-neutral intent. The footer reuses the original logo and keeps actual database connectivity visually subordinate to the product content.

### Inputs

The FIRE calculator uses native labelled fields, radio choices and editable pension
ranges, with a separate result region, forecast SVG and accessible yearly table.
Reuse the C tokens, Manrope and sharp controls; keep figures tabular and forecasts
explicit. No fake portfolio records are supplied. Details and assumptions live in
`FIRE.md`; crypto calculation remains planned.

## Account and cookie extension

The shared header is sticky on public and account pages. It starts at 92px
(78px mobile) and becomes 64px (60px mobile) after its original height has
scrolled past. A constant-height slot avoids shifting page content; anchor
clearance follows the actual bar size. Control heights stay at least 44px.
Without JavaScript the expanded header remains sticky. Footer back-to-top links
are removed; the persistent header logo provides that action instead.

Account entry, form, tabs and workspace are separate Server Components. Privacy
presentation and copy are independent of account messages. Keep the account page
as request/session orchestration, with no client auth SDK or homepage session reads.
Account, privacy and cookie CSS live under `web/src/styles/`; shared site tokens
and rules stay in `globals.css`. This is an internal separation, not a redesign.

The tool section maps the approved typed catalogue through the neutral `ToolCard`
content contract. FIRE is locally available and links to the in-page calculator;
crypto remains planned. The catalogue does not authorize extra mockup tools.

The owner requested actual email/password accounts with public registration after
configuration; these forms are not decorative email collection. Reuse C in a
two-column entry layout that stacks on mobile, with one native form panel and
localized links. Use 16px inputs, password-manager/paste support, 15–128 character
guidance and generic security-safe feedback. No client auth, form or consent UI
library is required.

The private area uses real identity and an honest empty state, not sample balances
or pretend saved portfolios. Google linking is planned, not an inactive provider
button. Privacy information is available without signing in.

The necessary-only cookie notice is a persistent footer sentence with native
details, not a covering banner, accept-all control or consent-dismissal cookie.
Keep it available without JavaScript. Account pages use origin-only referrer
information and anti-framing headers. Embedded review copies are explicitly
inert/read-only, never a credential collection surface.

## Motion and Accessibility

State changes use 180ms and `cubic-bezier(.16, 1, .3, 1)`. Hover movement is limited to a small action-link nudge; no content depends on entry animations. Reduced-motion preference disables transitions and smooth scrolling.

Main content, links, language switching and disclosures remain useful without JavaScript. Theme switching and the real database status are small enhancements; status truthfully remains checking without scripts. The root permits the intentional theme-attribute change without a hydration mismatch; the page is not made client-rendered for theme state.

## Do's and Don'ts

- Do preserve semantic headings, one H1, landmarks, the skip link and clear navigation labels.
- Do keep English/Swedish meaning and information hierarchy aligned.
- Do label planned functionality honestly and keep country/tax assumptions explicit.
- Do use the existing CSS variables and reusable Server Components.
- Do keep the custom logo legible at header, footer and favicon sizes.
- Do preserve static HTML and small independent enhancements.
- Don't add fake balances, financial outcomes, testimonials or published guides.
- Don't turn the layout into a dense dashboard or add accounts/login without a request.
- Don't assume SEK, a tax jurisdiction or a crypto-accounting method.
- Don't convert working native links/disclosures into JavaScript-only interactions.
- Don't treat the chosen visual starter as approval for extra tools, articles, videos or financial functionality.
