# MoneyWorks product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People exploring their personal finances through tools and useful information. The initial site is country-neutral, explicitly confirmed by the owner on 2026-10-29; it must not assume SEK, a tax jurisdiction or a visitor's portfolio.

## Product Purpose

MoneyWorks is a home for multiple personal-finance tools and plain-language information. This iteration establishes a single-page site layout and reusable components, not functioning financial calculators.

## Operating Context

The owner hosts and maintains the application. Development is reviewed in an unpublished Perplexity preview before approval to commit or push to GitHub. The actual Next.js and PostgreSQL implementation is retained rather than replaced with a mockup.

## Capabilities and Constraints

- English is the default, with Swedish available.
- Pre-rendered Next.js HTML must contain the main content and localized metadata without JavaScript.
- Small progressive enhancements may provide navigation behaviour and real database status; do not make the entire page client-rendered.
- The first planned tools are a FIRE calculator and a crypto-trading tax calculator. Both remain explicitly planned; do not invent outputs, dates, tax rules, rates or working calculation flows.
- Keep one content page per locale, with separated components for the logo, header/navigation, sections and footer.
- Existing database connectivity and failure handling remain functional but should not dominate the finance-site layout.
- Preserve manually maintained, gitignored `.env` configuration and existing data.

## Brand Commitments

The owner selected direction C, Bright works, as the real application's basic visual starter. Its charcoal/lime palette, bold headings, original M/W mark, sharp corners and contrasting tool panels are the selected starting direction, not a mandate to implement the hypothetical expansion study. The owner explicitly requested Taste Skill and Impeccable for the design work.

## Evidence on Hand

The current localized Next.js application, real health API and disposable PostgreSQL preview are implemented. No calculators, customer accounts, financial balances, performance statistics, testimonials or published articles exist; do not fabricate proof.

## Product Principles

- Make the purpose and future tool choices clear without financial marketing claims.
- Distinguish planned capabilities from working behaviour.
- Keep content readable, accessible and static-first.
- Use the same meaning and information hierarchy in English and Swedish.

## Open Decisions

Calculator inputs, tax methods and supported jurisdictions, article content, public deployment and any accounts remain undecided and outside this layout request.
