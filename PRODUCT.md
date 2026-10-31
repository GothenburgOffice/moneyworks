# MoneyWorks product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People exploring their personal finances through tools and useful information. The initial site is country-neutral, explicitly confirmed by the owner on 2026-10-29; it must not assume SEK, a tax jurisdiction or a visitor's portfolio.

## Product Purpose

MoneyWorks is a home for personal-finance tools and plain-language information. The local application has a reusable single-page hub and a functioning pension-aware FIRE calculator, with additional tools still planned.

## Operating Context

The owner hosts and maintains the application. Development is reviewed in an unpublished Perplexity preview before approval to commit or push to GitHub. The actual Next.js and PostgreSQL implementation is retained rather than replaced with a mockup.

## Capabilities and Constraints

- English is the default, with Swedish available.
- Pre-rendered Next.js HTML must contain the main content and localized metadata without JavaScript.
- Small progressive enhancements provide navigation, real database status and local FIRE calculation; do not make the entire page client-rendered.
- The first selected tools are FIRE and crypto tax. FIRE now has a local functional calculator; crypto tax remains explicitly planned. Do not invent market forecasts, tax rules, supported jurisdictions or saving features.
- Keep the main content as one pre-rendered page per locale, with separated components. The owner-requested account flows use a separate dynamic account route; do not make public content dynamic for authentication.
- Public registration starts with email/password, verification and recovery. Google is planned next and additional providers may follow, linked explicitly to the same stable user.
- Keep third-party dependencies few and justified. Frameworks are accepted; do not add packages for trivial utilities, cookie UI, forms or other code that is easy to maintain directly.
- Existing database connectivity and failure handling remain functional but should not dominate the finance-site layout.
- Preserve manually maintained, gitignored `.env` configuration and existing data.

## Brand Commitments

The owner requested Pengar jobbar branding for the Swedish preview. English
remains MoneyWorks. This is locale-specific presentation in the existing shared
app, not authorization to configure domains, analytics or public hosting.

The owner selected direction C, Bright works, as the real application's basic visual starter. Its charcoal/lime palette, bold headings, original M/W mark, sharp corners and contrasting tool panels are the selected starting direction, not a mandate to implement the hypothetical expansion study. The owner explicitly requested Taste Skill and Impeccable for the design work.

## Evidence on Hand

The localized Next.js application, health API, disposable PostgreSQL preview and local pension-aware FIRE calculator are implemented. The account foundation adds real authentication with an empty private area; operator mail/privacy configuration is required before public registration is available. The embedded review does not accept credentials. No saved financial balances, crypto tax calculations, performance statistics, testimonials or published articles exist.

## Product Principles

- Make the purpose and future tool choices clear without financial marketing claims.
- Distinguish planned capabilities from working behaviour.
- Keep content readable, accessible and static-first.
- Use the same meaning and information hierarchy in English and Swedish.

## Open Decisions

Crypto calculator inputs, tax methods and supported jurisdictions, article content and public deployment remain undecided. Public email/password registration, verification/recovery and explicit future provider linking are confirmed decisions with a local implementation; operational and privacy launch prerequisites remain unfinished. Google measurement tags, Analytics and possibly publisher ads are future interests only: no integration or consent platform has been added or selected.

## Pension-aware FIRE calculator

The owner requested both portfolio-needed and retirement-age views, with manual
government/employer pension payout ranges and an option to draw capital down by
a chosen planning age of at least 75. Implemented locally within the existing
single-page public hub, in both languages; see `FIRE.md` for model semantics.

Inputs cover spending, savings/contributions, a 75–120 end age, optional end reserve,
return/inflation/fee assumptions and up to 20 pension streams. Payouts can be
inflation-linked or fixed. Preservation targets real starting capital at the plan
end, not an indefinite withdrawal guarantee. Calculation stays in the page:
no account saving, network submission or new storage.
