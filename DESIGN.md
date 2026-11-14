# Design

Visual direction C, "Bright works": charcoal and lime, bold uppercase two-line
headings, a large tilted original mark and sharply cornered contrasting tool
panels. Legible and honest: no invented account data, performance charts or
commercial proof. Design tokens are CSS variables in
[web/src/app/globals.css](web/src/app/globals.css); this file records the rules
behind them.

## Identity

- English: **Money Working**. Swedish: **Pengar jobbar**. Mixed case, with the
  second word in the primary colour (decision #92).
- One original mark for both languages, on a 44-unit grid with 4.5-unit round
  strokes: an M whose rising stroke breaks out into an arrow. The favicon is the
  same mark in ground colour on a primary-colour rounded tile
  (`web/public/brand-icon.svg`, `web/src/app/favicon.ico`).
- Only the name follows the locale at render time
  ([web/src/content/brand.ts](web/src/content/brand.ts)).
- At 420px and below the header name wraps to two lines without shrinking
  navigation controls.

## Colour

| Token               | Dark (default)        | Use                                                         |
| ------------------- | --------------------- | ----------------------------------------------------------- |
| ground              | `#181c18`             | Page background                                             |
| surface             | `#242a24`             | Raised panels                                               |
| ink                 | `#f8f8f0`             | Text                                                        |
| muted               | `#c2c8bd`             | Secondary text                                              |
| line                | `#485145`             | Dividers                                                    |
| primary             | `#d6fb79`             | Mark, actions, second headline line, FIRE panel, about band |
| positive / negative | `#a9e5ad` / `#ffb4b4` | Status, always with text                                    |

Light mode uses ivory `#f8f8f0`, charcoal text, a dark action and green
`#3f7f14` headline accent. The crypto panel is ivory in both. Colours are
identity and category, never a signal of financial success.

The theme follows the system's light or dark preference until the visitor picks
one with the header toggle; the pick is kept in `localStorage` and applied by a
small inline script before the page paints, on every page. Without JavaScript
the page is dark and the toggle hidden.

## Typography

- Manrope, self-hosted variable Latin (covers Swedish); keep its OFL licence in
  `web/public/fonts/`.
- Intro heading: 80px / 800, stepping to 46–57px on compact desktop and
  39px / 33px on mobile. Two translated spans give deliberate line breaks.
- Tool titles 29px / 800; reading copy 14–16px; small type only for labels.
- Use tabular figures in calculator output. Test Swedish as well as English.

## Layout and shape

- Centred 1160px frame (1220px on large screens); gutters 32 / 20 / 16px.
- Header and footer are full width on the same inner grid. Desktop navigation
  becomes a native mobile menu at 740px.
- Sticky header: 92px (78px mobile), compacting to 64px (60px mobile) after
  scrolling, inside a constant-height slot so content never shifts.
- 3px corners everywhere. Cards are flat; the only shadow is the floating mobile
  menu.

## Components

- **BrandLogo / SiteHeader:** localized link label, decorative SVG hidden from
  assistive technology, real section anchors, full-document language links.
  44×44px mobile menu summary that closes on navigation and Escape. The account
  control is a Log in link (icon only on mobile, its label kept as the accessible
  name); for a signed-in member it opens a small panel with the email, Account
  settings, Admin for admins and Log out, closing on Escape, outside clicks and
  tabbing away.
- **ToolCard:** category, status (available or planned), purpose and native
  expandable details. Planned tools never show fake inputs or results.
- **ToolView:** a tool's own page (`/[locale]/tools/[tool]`) with its own banner,
  sharing only the header and footer with the hub.
- **LearnSection:** native disclosures, one open initially.
- **Footer:** logo, necessary-only cookie notice as a sentence with native
  details (no banner).
- **FIRE inputs:** native labelled fields and radios, editable pension rows,
  a separate result region with SVG chart and accessible yearly table.
- **Account:** two-column entry layout stacking on mobile, one native form
  panel, 16px inputs with password-manager/paste support and generic
  security-safe feedback. The private area shows an honest empty state.

## Motion and accessibility

- State changes: 180ms `cubic-bezier(.16, 1, .3, 1)`; reduced motion disables
  transitions and smooth scrolling. No content depends on entry animation.
- One H1, landmarks, skip link, visible keyboard focus, at least 44px targets.
- Content, links, language switching and disclosures work without JavaScript.
  Tool workspaces and account pages may require it (decision #4).

## Don'ts

- No fake balances, financial outcomes, testimonials or published guides.
- No dense dashboard layout.
- No assumed currency, tax jurisdiction or crypto-accounting method.
- Never convert working native links or disclosures into JavaScript-only ones.
