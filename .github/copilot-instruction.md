# MoneyWorks Copilot Instructions

MoneyWorks is an owner-hosted, country-neutral personal-finance project. It implements a single-page bilingual hub, a pension-aware FIRE calculator, reusable site/account/privacy components, a real database health endpoint and an email/password account foundation. Crypto tax calculations remain planned. Repository source does not imply that public hosting or registration has been configured.

## Maintain these instructions

- **Keep guidance current:** Update this file alongside meaningful changes to application behavior, dependencies, containers, credentials, migrations, tests or CI. Update the root README when its user-facing commands or behavior change.
- **Separate fact from plans:** Describe existing files and implemented behavior accurately. Future ideas below are not completed functionality or authority to build a feature without a request.
- **Use executable sources:** Treat `web/package.json`, `web/package-lock.json`, Docker/Compose configuration, Prisma schema/migrations and `.github/workflows/ci.yml` as the authorities for current versions and commands. Do not preserve stale prose when those files change.
- **Dependency restraint:** Frameworks are acceptable; qualify every additional package. Prefer native HTML, Node APIs and small maintained code for ordinary UI/utilities. Established security/protocol implementations may justify a dependency; document the reason and transitive cost, pin versions and audit. Do not install an npm for every small feature.
- **Preserve entry points:** Keep this singularly named file as the detailed reference. `.github/copilot-instructions.md` is the standard Copilot discovery entry point and directs agents here; avoid maintaining two divergent full copies.
- **Keep changes scoped:** Preserve unrelated work, inspect the current Git diff and report which checks actually ran. Do not claim local checks, CI or deployment succeeded without confirming the corresponding result.
- **Preview-first iteration:** Review development changes in an unpublished Perplexity preview before pushing when the owner requests preview work. Keep those edits local and do not publish publicly, commit or push to GitHub until the owner approves that step.

## Project scope and stack

- **Repository:** `hkarn/moneyworks`, MIT licensed.
- **Hosting:** Maintained and hosted by its owner. Do not add deployment wizards, credential generators or general third-party onboarding unless requested.
- **Application:** Next.js App Router, React, strict TypeScript, Tailwind CSS and `next-intl`, with `en` and `sv` locales.
- **Database:** Self-hosted PostgreSQL using Prisma and `@prisma/adapter-pg`. The schema contains `Greeting` plus `User`, `Account`, `Session`, `Verification` and `RateLimit`; the additive account migration preserves the greeting data.
- **Toolchain:** Node.js and npm run inside the development container. The CI checks job also installs its own matching toolchain on the disposable GitHub runner; do not require a host-side Node installation for the owner's normal workflow.
- **Dependency policy:** Use compatible stable releases, exact direct dependency versions and the committed npm lockfile. Do not force incompatible peer dependencies or adopt prereleases just because a registry `latest` tag points to one.
- **Compatibility holds:** TypeScript and ESLint major updates are currently held in Dependabot because of lint-plugin peer compatibility. Recheck those peers before changing the holds; the README records the currently selected versions.

## Existing repository layout

```text
moneyworks/
├── .devcontainer/                 # VS Code extension of the development Compose stack
├── .github/
│   ├── copilot-instructions.md    # Standard Copilot entry point
│   ├── copilot-instruction.md     # This maintained reference
│   ├── dependabot.yml            # Weekly dependency updates and compatibility holds
│   └── workflows/ci.yml          # Checks and disposable container integration tests
├── .editorconfig                 # LF/editor settings
├── .gitattributes                # LF checkout rules and workflow archive exclusion
├── .env.example                  # Template for the owner's gitignored root .env
├── Dockerfile.dev                # Development app image
├── docker-compose.dev.yml        # web and db services
└── web/
    ├── messages/                 # English/Swedish interface messages
    ├── prisma/
    │   ├── migrations/           # Committed schema changes and initial greetings
    │   └── schema.prisma
    ├── prisma.config.ts          # Prisma connection URL and migration configuration
    ├── src/
    │   ├── app/
    │   │   ├── [locale]/         # Static public hub and separate dynamic account route
    │   │   ├── api/account/      # Native form POST/redirect adapters
    │   │   ├── api/auth/         # Allowlisted auth HTTP endpoints
    │   │   ├── api/health/db/     # Read-only database health route
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── generated/prisma/     # Generated locally; gitignored
    │   ├── components/           # Site presentation, account/ and privacy/ components
    │   ├── content/              # Separate typed site, account and privacy copy
    │   ├── features/             # Pure account query model and typed tool catalogue
    │   ├── i18n/                 # Routing, navigation and translation loading
    │   ├── lib/                  # Server-only DB/auth/HTTP/mail; auth configuration
    │   ├── styles/               # Account, privacy and cookie feature styles
    │   └── proxy.ts              # Next.js locale routing proxy
    └── tests/                    # Architecture, units, LF, smoke and account integration
```

Email/password authentication, an empty private workspace and the FIRE calculator are implemented locally. There are no saved financial plans, crypto tax calculations, forum or GraphQL subsystems. Production infrastructure and future integrations must not be described as already deployed.

## Component boundaries

- **Route orchestration:** Resolve request/query state, auth configuration and sessions in server routes. Pass only the required user fields or public controller/contact details, never full sessions/configuration, into presentation.
- **Presentation:** Reuse `components/account/` for entry, form, tabs and workspace, and `components/privacy/` for privacy rendering. Keep privacy copy in `content/privacy.ts`, independent of account messages.
- **Pure features:** `features/account/view.ts` parses allowlisted view/feedback queries; `features/tools/catalog.ts` defines approved stable tool IDs/status and a neutral card-content contract. Add approved tools through the catalogue and both translations, not duplicated card calls or a FIRE-specific prop type. No additional tools are approved by this abstraction.
- **Server boundary:** DB/auth/HTTP/mail modules are server-only. ESLint and `test:architecture` reject persistence/auth imports or environment reads from presentation/content/pure-feature modules. Resolve those dependencies at the route boundary instead.
- **Styles and tests:** Keep shared tokens/site rules in `app/globals.css`; feature CSS lives in `styles/`. Preserve native/no-JS behavior, both locales/themes and responsive layouts when extracting components. Run architecture tests alongside lint, types and existing flow checks.
- **Shared navigation:** Keep the sticky header's reserved slot independent of its compact bar height to prevent scroll/layout oscillation. Preserve hash/skip/result clearance, 44px controls, both mobile-menu modes and the full-size no-JS fallback. No redundant footer back-to-top control; the header logo remains available.
- **FIRE separation:** `features/fire/model.ts` is the dependency-free, independently tested engine. Static `components/fire/` render fields, pensions, results scaffold and method; copy lives in `content/fire.ts`. `enhancements/fire-calculator.js` handles only the DOM. `scripts/build-fire.mjs` combines it with the tested engine into one gitignored classic script during prebuild/predev. Do not duplicate the model or add a runtime compiler/chart/form library.
- **FIRE truth and privacy:** Preserve both questions/strategies, monthly non-borrowing checks, pension age boundaries and real-money conventions in `FIRE.md`. No guaranteed returns, mortality label, financial input persistence/URLs/telemetry or account saving. Without JavaScript, explanatory HTML remains readable and calculation controls honestly unavailable.
- **Payout editing:** No fixed payout-count ceiling. Save validates only that row using the shared model validator, accepts it in page memory and collapses it into an Edit/Remove summary. Cancel restores accepted values or discards a new draft. Disable collapsed inputs; calculate from accepted records and require open edits to be saved/cancelled. Enter saves a payout input or calculates elsewhere. Never turn this into browser/account persistence without approval.
- **Number entry:** Optional zero-based amounts (portfolio, contributions, end reserve and payout amount) start empty with a `0` placeholder; blank means zero, not missing required spending or ages. Reset and reopened zero payouts keep this convention. Normalize redundant integer-leading zeros on blur only, preserving in-progress decimals, signs/exponents and fresh Enter results.
- **Result phases:** Preserve the Savings plan / Retirement plan toggle. Savings rows come from the same pure engine as projected savings, with month-end contributions and no separate working pension income. Chart actual entered savings against a distinct minimum-capital target; never invent a funded join to portfolio-needed retirement. Monthly saving to target is a total, not a top-up or preservation guarantee. Handle retirement now/unsupported targets, preserve phase on recalculation and reset it on Clear.

## Runtime behavior

- **Single-page tool hub:** Keep one content page per locale, composed from separate header/navigation, logo, intro, tools, information, about and footer components. Links navigate sections rather than inventing unimplemented tool routes. FIRE is functional locally; crypto tax must remain explicitly planned until its real functionality exists.
- **Focused tool views:** A clean homepage shows only the hub. Available tools open a reusable pre-rendered ToolView shell by native hash, with their own banner/workspace and the shared header/footer; unrelated hub content is hidden. Keep native no-JS entry, Back/Forward, homepage-section exits and context-preserving theme/locale controls. Financial inputs never enter the URL.
- **Preview checks:** Use focused changed-component/interaction checks for routine preview edits. Run full suites only when the owner explicitly requests them or requests a specifically authorized GitHub push; that request still needs the existing write confirmation.
- **Separate design explorations:** The standalone MoneyWorks design board is not production functionality. Its eight directions, ten-tool expansion study, article topics and possible YouTube layouts are hypothetical. Only FIRE and crypto tax are selected tool plans; do not implement the other eight example tools or invent a channel, published articles, financial results or new production routes from those mockups without approval. Keep the actual bilingual Next.js preview separate, with pre-rendered main content and small interactive enhancements.
- **Static content:** Pre-render `/en` and `/sv` as HTML with localized SEO metadata at build time. Content must be readable without JavaScript; do not turn the whole page into a client-rendered application or fetch the page body after load.
- **Small enhancements:** `public/db-status.js` updates the footer status from the uncached health endpoint; `public/site-ui.js` closes the mobile menu after navigation/with Escape and provides localized theme switching. Dark C is the static default; light/dark are the only accepted URL preference values. Carry the choice through locale links, guard history updates for opaque previews, and do not use browser-storage APIs forbidden by the preview host. Hide the theme control without JavaScript rather than exposing a dead button. Initial database status says "checking", never a cached success. Failures change the status, not the site content; no database is needed to build the pages.
- **Brand and content:** Direction C (Bright works) is the owner-selected starter. Preserve its charcoal/lime identity, bold headings, contrasting planned-tool panels, original M/W logo, self-hosted Manrope, CSS tokens and responsive component patterns recorded in `DESIGN.md`. This selection does not approve the mockup board's expanded feature inventory. `PRODUCT.md` records scope. Translated copy lives under `Site` and `ConnectionStatus` in the message files, accessed through the typed content helper.
- **Country-neutral:** Do not assume SEK, a tax jurisdiction, a trading method or financial outputs. Tax methods and supported countries are deliberately undecided until calculator development.
- **Health endpoint:** `/api/health/db` performs a real greeting read. It returns HTTP 200 with `status: "ok"` on success or HTTP 503 with `status: "error"` on failure, with `Cache-Control: no-store`.
- **Connection handling:** Reuse the Prisma connection pool across hot reloads. Keep client initialization lazy so a production build does not need a live database, and retain finite connection/query timeouts.
- **Secrets:** Never expose connection strings, credentials or raw database errors in rendered pages or health responses. Never put database credentials in `NEXT_PUBLIC_` variables.
- **Localization:** English is the default even when browser language or an old locale cookie is Swedish; keep automatic locale detection disabled. Explicit `/en` and `/sv` routes select the language. Keep translations consistent and put localized pages under `src/app/[locale]/`.

## Containers and credentials

- **Shared development paths:** The repository is mounted at `/workspace`; the app works in `/workspace/web`. Keep `node_modules` and `.next` in their Docker volumes, not in a competing host dependency path.
- **Startup:** Normal Compose waits for database health, runs `npm ci` and `npm run db:setup`, then starts the development server. The devcontainer performs installation/setup on creation but leaves starting the server to the terminal.
- **Network:** The app binds to host localhost port 3000. PostgreSQL is reached at `db:5432` from containers and `localhost:5433` from host tools. Do not change the container URL to `localhost` unless the runtime topology actually changes.
- **Persistence:** PostgreSQL 18 uses `postgres18_data` mounted at `/var/lib/postgresql`. Preserve that volume and any retained PostgreSQL 16 volume; do not reuse an older major-version data directory directly.
- **Manual configuration:** The owner copies `.env.example` to root `.env` once and maintains it manually. Preserve existing `.env` files; never overwrite them as part of an update or commit real credentials.
- **Consistent values:** Keep `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `DATABASE_URL` consistent. URL-encode password characters only in the URL. Example credentials are disposable development defaults, not recommended hosted credentials.
- **Password changes:** Editing `.env` does not rotate an existing PostgreSQL role's password. Change that password in PostgreSQL as well and recreate the web service with the updated configuration.
- **Hosting boundary:** Only development Docker configuration is implemented. Account secrets/mail/privacy configuration are documented in `AUTH.md`; production images, reverse proxies, public TLS and backups are not deployed or verified by this work. Do not present launch prerequisites as completed infrastructure.

## Accounts and privacy

- **Static boundary:** Account pages and APIs may be dynamic, but public locale pages stay SSG. Never read sessions in the shared locale layout/header to personalize the public homepage.
- **Real identity:** Stable User IDs own future data; credential and provider accounts are separate. Email/password is implemented first, with public registration after configuration. Google is planned, not enabled. Linking must require explicit authenticated action; never silently merge by email or trust an unverified provider.
- **Security:** Use the established auth implementation for hashing, verification, sessions, recovery, origin checks and durable rate limits. Keep auth/mail code server-only. Never log credentials/token URLs, disable origin checks or rely only on cookie presence for authorization. Preserve the body limit, guarded IP-header boundary and conservative fallback limiter.
- **Configuration:** Maintain root `.env` manually from the example. Missing core/mail settings disable accounts; missing public privacy identity/contact disables registration. Do not invent operator details, claim live email delivery from capture tests or enable public registration with fixture values.
- **Necessary-only storage:** No analytics/advertising or locale cookies are enabled. Keep the discreet native cookie/privacy notice; do not add an unnecessary accept-all banner or a consent cookie. Non-essential storage or tracking needs a fresh consent/privacy review before it loads.
- **Future measurement/advertising:** Google tags, Analytics and possibly publisher ads are future interests, not installed integrations. Consent/CMP selection and implementation need a separate scoped request; do not load optional tags in anticipation.
- **Preview and evidence:** Embedded account review forms are explicitly disabled; real flows are tested on the first-party Next app with a disposable database and loopback capture mailbox. Do not weaken cookie/iframe protections to fake sign-in in the preview. `AUTH.md` records setup, safeguards and verification commands.

## Safe development commands

Run these from the repository root with Docker available:

```bash
# Start or rebuild the development stack without deleting persistent data.
docker compose -f docker-compose.dev.yml up --build

# Stop containers while preserving database and dependency volumes.
docker compose -f docker-compose.dev.yml down

# Inspect application logs or open an app-container terminal.
docker compose -f docker-compose.dev.yml logs -f web
docker compose -f docker-compose.dev.yml exec web sh

# Add a dependency, then commit both package.json and package-lock.json.
docker compose -f docker-compose.dev.yml exec web npm install --save-exact <package>

# Local checks using the container's toolchain.
docker compose -f docker-compose.dev.yml exec web npm run test:line-endings
docker compose -f docker-compose.dev.yml exec web npm run test:smoke
docker compose -f docker-compose.dev.yml exec web npm run lint
docker compose -f docker-compose.dev.yml exec web npm run typecheck
docker compose -f docker-compose.dev.yml exec web npm run db:validate
docker compose -f docker-compose.dev.yml exec web npm run build
docker compose -f docker-compose.dev.yml exec web npm audit --audit-level=high

# After deliberate schema changes, create and commit a named migration.
docker compose -f docker-compose.dev.yml exec web npm run db:migrate -- --name <description>
```

Inside the devcontainer, use `/workspace/web` as the terminal working directory and run `npm run dev -- --hostname 0.0.0.0`. Rebuild the devcontainer after infrastructure changes.

Never recommend `down -v`, `down --volumes`, `prisma migrate reset`, deleting database volumes or force-restoring a checkout as a routine rebuild/debugging step. Destructive work on the owner's data requires explicit authorization; CI cleanup is a separate, intentionally disposable environment.

## Prisma changes

- **Connection configuration:** Keep the Prisma 7 datasource URL in `web/prisma.config.ts`, not in `schema.prisma`.
- **Generated client:** `npm run db:generate` generates the client into gitignored `src/generated/prisma/`. Do not hand-edit or commit generated client files; ESLint intentionally excludes them.
- **Schema changes:** Edit the schema, create a migration with `npm run db:migrate` and commit the SQL. Do not rewrite an already applied migration to change a persistent database.
- **Startup migrations:** `npm run db:setup` generates the client and applies committed migrations with `prisma migrate deploy`. `npm run db:deploy` applies committed migrations without regeneration.
- **Greeting data:** Initial greetings are inserted by the initial migration. Do not unconditionally reseed or overwrite the owner's edited greetings on every startup.

## Tests, CI and line endings

- **Triggers:** `.github/workflows/ci.yml` runs on pushes to `main`, pull requests and manual `workflow_dispatch` requests.
- **Checks job:** Runs line-ending regression tests, ESLint, generated-client/type checking, Prisma schema validation, production build and high-severity dependency audit.
- **Container job:** Exercises `core.autocrlf=true`, builds the app and starts disposable app/PostgreSQL containers. `npm run test:smoke` checks pre-rendered HTML/metadata, default routing, the health API and the actual enhancement script. During outages, `npm run test:db-status` expects unavailable in both languages while the static heading stays accessible, followed by recovery.
- **CI isolation:** `COMPOSE_PROJECT_NAME=moneyworks-ci` identifies the runner's test stack. CI uses example credentials and temporary data, never the owner's hosted environment or credentials.
- **Cleanup:** Keep the `if: always()` cleanup step. It removes CI containers, volumes, network and the locally built app image and verifies no project containers, volumes or networks remain. Do not copy this destructive cleanup into normal owner startup/rebuild commands.
- **Failures:** Preserve diagnostic container logs on failures, finite startup retries, job timeouts and Bash pipeline failure handling. Confirm the actual run result before reporting CI success.
- **LF rules:** Preserve `.gitattributes` and `.editorconfig` LF settings, especially for shell scripts, Dockerfiles, Compose/workflow YAML, SQL and Prisma files. `npm run test:line-endings` checks tracked container inputs and a Windows-style checkout.
- **Existing Windows checkouts:** LF checkout rules do not authorize discarding local edits. If adding a shell entrypoint later, test both LF and actual CRLF script inputs, including existing bind mounts, before claiming the Habbits-style issue is fixed.
- **Workflow archives:** `.github/workflows export-ignore` omits workflows from Git source archives only. Workflow files must remain tracked; do not add them to `.gitignore` or disable Actions to achieve archive exclusion.
- **Dependency updates:** Review grouped Dependabot updates for Next/config, React/types, Prisma and Tailwind. Keep related packages aligned and retain compatibility holds until they can be safely lifted.

## Coding conventions

- **TypeScript:** Preserve strict checking and use explicit, useful types at interfaces and API boundaries. Do not add `any` to bypass a compiler error.
- **React:** Prefer Server Components; add client components only for browser interaction or state. Keep components focused.
- **Routes:** Use App Router handlers under `src/app/api/` for requested API features. Validate inputs and return appropriate status codes without exposing internal errors.
- **Styling:** Follow the CSS tokens and component classes in `globals.css` and `DESIGN.md`, retaining Tailwind where useful. Optional UI/state libraries are not installed requirements.
- **Changes:** Extend the existing localized structure and shared database helper rather than introducing duplicate infrastructure without a concrete need.

## Future direction, not implemented

Retain these as development ideas, not a binding implementation sequence or assumed approved architecture:

- **Calculators:** FIRE projections from spending, withdrawal rate and savings; compound-interest tools; tax helpers such as average purchase-price calculations.
- **Persistence:** A future user/scenario data model, saved calculations and account-specific views.
- **Authentication providers:** Email/password registration, verification and recovery exist; future providers require explicit linking and operator-owned configuration, as described in `AUTH.md`.
- **Community:** Blog/forum posts, comments, likes and moderation.
- **Optional technology:** Context or Zustand, shadcn/ui, GraphQL, additional services/mobile clients and shared types are possible future choices, not dependencies to add preemptively.
- **Hosting work:** A production image, reverse proxy, HTTPS and backups need a separate owner-directed implementation. Prior provider suggestions do not establish a selected provider.

Last updated: 2026-10-29. Maintainer: Håkan Arnoldson (`hkarn`).
