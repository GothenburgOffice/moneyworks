# MoneyWorks project instructions

MoneyWorks is a self-hosted, country-neutral personal-finance tool hub. It implements a bilingual (English/Swedish) pre-rendered hub, a pension-aware FIRE calculator, reusable site/account/privacy components, a real database health endpoint and an email/password account foundation. Crypto tax is planned. Nothing is publicly hosted yet.

This file is the shared reference for coding agents (Copilot reads it directly; `CLAUDE.md` imports it). Topic details live in `DESIGN.md`, `FIRE.md` and `AUTH.md`; history, decisions and planned work live in GitHub issues.

## Working rules

- **Workflow:** Work on a branch, open a pull request and let CI run the full suite. Locally, run the checks relevant to the change. Report the checks that actually ran; never claim a pass that was not observed.
- **Decisions:** Product and architecture questions are GitHub issues labelled `decision`. Do not build features that depend on an open one. Once decided, write the outcome as a closing comment, update the affected rules here or in a topic doc, and close the issue. Closed `decision` issues are the decision log.
- **Product principles:** Make tool purposes clear without financial marketing claims; distinguish planned from working; stay readable, accessible and static-first; keep the same meaning and hierarchy in English and Swedish.
- **Keep guidance current:** Update this file and the README alongside meaningful changes to behavior, dependencies, containers, credentials, migrations, tests or CI. Treat `web/package.json`, the lockfile, Docker/Compose files, Prisma schema/migrations and `.github/workflows/ci.yml` as the authorities for versions and commands.
- **Separate fact from plans:** Describe only implemented behavior as existing. Planned items are not authority to build them without a request.
- **Dependency restraint:** Frameworks are acceptable; qualify every additional package. Prefer native HTML, Node APIs and small maintained code for ordinary UI/utilities. Established security/protocol implementations may justify a dependency; document the reason, pin exact versions and audit.
- **Keep changes scoped:** Preserve unrelated work and inspect the current diff before committing.
- **Private notes:** `notes/` and `CLAUDE.local.md` are gitignored for working notes and session logs. The repository is public; never commit credentials, personal contact details or operator data.

## Stack

- **Repository:** `GothenburgOffice/moneyworks`, MIT licensed, public.
- **Application:** Next.js App Router, React, strict TypeScript, Tailwind CSS and `next-intl`, with `en` and `sv` locales.
- **Database:** PostgreSQL 18 via Prisma 7 and `@prisma/adapter-pg`. Models: `Greeting` (connection test) plus `User`, `Account`, `Session`, `Verification` and `RateLimit`.
- **Toolchain:** Node.js and npm run only inside the Debian-based development container; the host needs Docker, not Node. CI installs its own matching toolchain.
- **Node support:** `engines.node` is `>=22.12.0` for hosting flexibility. The dev image and `@types/node` track Node 22 so newer-only APIs fail locally; CI runs the unit job on Node 22 and the current LTS. Raise the floor in `package.json`, `Dockerfile.dev`, `@types/node`, the CI matrix and the Dependabot holds together.
- **Dependency policy:** Compatible stable releases, exact direct versions, committed lockfile. No forced peer overrides or prereleases. TypeScript and ESLint majors are held in Dependabot until lint-plugin peers support them.

## Repository layout

```text
moneyworks/
├── .devcontainer/                # VS Code devcontainer on top of the dev Compose stack
├── .github/
│   ├── copilot-instructions.md   # This file
│   ├── dependabot.yml            # Weekly updates and compatibility holds
│   └── workflows/ci.yml          # Checks and disposable container integration tests
├── .editorconfig / .gitattributes # LF rules
├── .env.example                  # Template for the gitignored root .env
├── CLAUDE.md                     # Claude Code entry point; imports this file
├── Dockerfile.dev                # Debian (trixie-slim) Node 22 development image
├── docker-compose.dev.yml        # web and db services
├── moneyworks.code-workspace     # VS Code workspace and extension recommendations
└── web/
    ├── messages/                 # English/Swedish interface messages
    ├── prisma/                   # schema.prisma and committed migrations
    ├── prisma.config.ts          # Prisma connection URL and migration configuration
    ├── scripts/                  # FIRE bundle builder, auth cleanup
    ├── src/
    │   ├── app/[locale]/         # Static public hub and dynamic account route
    │   ├── app/api/              # account form adapters, auth endpoints, DB health
    │   ├── components/           # Site, fire/, account/ and privacy/ components
    │   ├── content/              # Typed site, brand, FIRE, account and privacy copy
    │   ├── enhancements/         # Browser DOM enhancement sources
    │   ├── features/             # Pure models: FIRE engine, account queries, tool catalogue
    │   ├── generated/prisma/     # Generated client; gitignored
    │   ├── i18n/                 # Routing, navigation and translation loading
    │   ├── lib/                  # Server-only DB/auth/HTTP/mail
    │   ├── styles/               # Feature CSS
    │   └── proxy.ts              # Locale routing proxy
    └── tests/                    # Architecture, unit, LF, smoke and account integration
```

## Component boundaries

- **Localized identity:** `content/brand.ts` selects MoneyWorks/M-W for English and Pengar jobbar/PJ for Swedish. Pass the explicit locale to shared brand, intro and about components; keep names, SVG marks and favicons server-rendered. Language links stay on the current host.
- **Route orchestration:** Resolve request/query state, auth configuration and sessions in server routes. Pass only the required user fields or public controller/contact details into presentation, never full sessions/configuration.
- **Presentation:** Reuse `components/account/` for entry, form, tabs and workspace, and `components/privacy/` for privacy rendering. Privacy copy lives in `content/privacy.ts`, independent of account messages.
- **Pure features:** `features/account/view.ts` parses allowlisted view/feedback queries; `features/tools/catalog.ts` defines tool IDs/status and a neutral card-content contract. Add tools through the catalogue and both translations, not duplicated card calls.
- **Server boundary:** DB/auth/HTTP/mail modules are server-only. ESLint and `test:architecture` reject persistence/auth imports or environment reads from presentation/content/pure-feature modules.
- **Styles and tests:** Shared tokens/site rules live in `app/globals.css`; feature CSS in `styles/`. Preserve no-JS behavior, both locales/themes and responsive layouts.
- **Shared navigation:** Keep the sticky header's reserved slot independent of its compact bar height to prevent scroll/layout oscillation. Preserve hash/skip/result clearance, 44px controls, both mobile-menu modes and the full-size no-JS fallback. The header logo replaces footer back-to-top links.
- **Icon-only actions:** Use shared local SVG icons, native buttons, localized contextual accessible names, decorative SVGs hidden from assistive technology, visible focus and at least 44px targets.

## FIRE calculator

- **Separation:** `features/fire/model.ts` is the dependency-free, independently tested engine. `components/fire/` render fields, pensions, result scaffold and method; copy lives in `content/fire.ts`. `enhancements/fire-calculator.js` handles only the DOM. `scripts/build-fire.mjs` combines it with the engine into gitignored `public/fire-calculator.js` during prebuild/predev. Do not duplicate the model. (The client-side approach for future tools is open: see the `decision` issues.)
- **Truth and privacy:** Preserve both questions/strategies, monthly non-borrowing checks, pension age boundaries and real-money conventions in `FIRE.md`. No guaranteed returns, financial input persistence, URLs, telemetry or account saving. Without JavaScript, explanations stay readable and calculation controls are honestly unavailable.
- **Ages:** No fixed lifespan bounds. Use only numeric representability, whole non-negative ages and chronological ordering; do not silently truncate long horizons.
- **Payout editing:** No payout-count ceiling. Save validates that row with the shared model validator, accepts it in page memory and collapses it into an Edit/Remove summary. Cancel restores accepted values or discards a new draft. Calculate from accepted records; open edits must be saved/cancelled first. Enter saves a payout input or calculates elsewhere.
- **Number entry:** Optional zero-based amounts (portfolio, contributions, end reserve, payout amount) start empty with a `0` placeholder; blank means zero. Spending and ages remain required. Normalize redundant leading zeros on blur only, preserving in-progress decimals.
- **Result phases:** Keep the Savings plan / Retirement plan toggle, both from the same engine. Chart actual savings against a distinct minimum-capital target. Monthly saving to target is a total, not a top-up. Preserve phase on recalculation and reset it on Clear.
- **Display:** Whole currency units in results, payouts, charts and yearly tables; keep fractional inputs/rates/model precision. Round the minimum required monthly saving up.
- **Walkthrough video:** Self-hosted native video with local EN/SV subtitles (off by default) and a text version, near the calculator heading. User-initiated playback only; pause on closing the demo or leaving the tool. No third-party player, analytics or video-production dependency in the app.

## Runtime behavior

- **Hub and tool views:** One pre-rendered content page per locale composed from separate components. Available tools open a pre-rendered ToolView by native hash, with their own banner/workspace and the shared header/footer. Keep no-JS entry, Back/Forward, section exits and context-preserving theme/locale controls. Financial inputs never enter the URL.
- **Static content:** Pre-render `/en` and `/sv` with localized metadata. Do not client-render the page or fetch the body after load.
- **Small enhancements:** `public/db-status.js` updates the footer status from the uncached health endpoint; `public/site-ui.js` closes the mobile menu and provides theme switching. Dark is the static default; `light`/`dark` are the only accepted URL preference values, carried through locale links with guarded history updates. No browser-storage APIs. Hide the theme control without JavaScript. Initial database status says "checking"; failures change the status, not the content. Builds need no database.
- **Brand:** Direction C (Bright works) as recorded in `DESIGN.md`: charcoal/lime, bold headings, contrasting tool panels, original marks, self-hosted Manrope, CSS tokens.
- **Country-neutral:** Do not assume SEK, a tax jurisdiction, a trading method or financial outputs.
- **Health endpoint:** `/api/health/db` reads a greeting; HTTP 200 `status: "ok"` or 503 `status: "error"`, always `Cache-Control: no-store`.
- **Connection handling:** Reuse the Prisma pool across hot reloads, initialize lazily and keep finite connection/query timeouts.
- **Secrets:** Never expose connection strings, credentials or raw database errors. Never put secrets in `NEXT_PUBLIC_` variables.
- **Localization:** English is the default regardless of browser language or old locale cookies; automatic detection stays disabled. Localized pages live under `src/app/[locale]/`.

## Containers and credentials

- **Paths:** The repository is mounted at `/workspace`; the app works in `/workspace/web`. `node_modules` and `.next` stay in Docker volumes.
- **Startup:** Normal Compose waits for database health, runs `npm ci` and `npm run db:setup`, then starts the dev server. The devcontainer runs install/setup on creation and leaves starting the server to the terminal. It installs Claude Code, ESLint and Prisma extensions in the container (no formatter) and keeps Claude Code's configuration in the `claude_config` volume.
- **Network:** The app binds to host `localhost:3000`. PostgreSQL is `db:5432` from containers and `localhost:5433` from the host.
- **Persistence:** PostgreSQL 18 uses the `postgres18_data` volume at `/var/lib/postgresql`. Preserve it and any retained PostgreSQL 16 volume.
- **Configuration:** Root `.env` is copied once from `.env.example` and maintained manually; never overwrite it or commit real credentials. Keep `POSTGRES_*` and `DATABASE_URL` consistent (URL-encode the password only in the URL). Editing `.env` does not rotate an existing role's password.
- **Hosting:** Only development Docker configuration exists. Production image, reverse proxy, TLS and backups are tracked in GitHub issues; do not describe them as done.

## Accounts and privacy

- **Static boundary:** Account pages and APIs may be dynamic; public locale pages stay static. Never read sessions in the shared layout/header.
- **Identity:** Stable `User.id` owns future data; credential and provider accounts are separate. Email/password exists; Google is planned. Linking requires explicit authenticated action; never merge silently by email or trust an unverified provider.
- **Security:** Use Better Auth for hashing, verification, sessions, recovery, origin checks and durable rate limits. Keep auth/mail server-only. Never log credentials or token URLs, disable origin checks or authorize by cookie presence alone. Preserve the body limit, guarded IP-header boundary and fallback limiter.
- **Configuration:** Missing core/mail settings disable accounts; missing privacy identity/contact disables registration. Do not invent operator details or enable public signup with fixture values.
- **Necessary-only storage:** No analytics, advertising or locale cookies. Keep the native footer cookie/privacy notice; no accept-all banner or consent cookie. Any optional tracking needs a privacy review and a decided issue first.
- **Testing:** Real flows are tested against a disposable database and a loopback capture mailbox. Account pages send anti-framing headers; do not weaken cookie/origin/framing protections. `AUTH.md` has setup and verification details.

## Commands

Inside the devcontainer, work in `/workspace/web` and run `npm run dev -- --hostname 0.0.0.0`. From the host, prefix commands with `docker compose -f docker-compose.dev.yml exec web`.

```bash
npm run lint
npm run typecheck
npm run test:ui
npm run test:architecture
npm run test:fire
npm run test:auth-config
npm run test:line-endings
npm run test:smoke          # needs the running app and database
npm run db:validate
npm run build
npm audit --audit-level=high
npm install --save-exact <package>          # commit package.json and package-lock.json
npm run db:migrate -- --name <description>  # after deliberate schema changes
```

Rebuild the devcontainer after infrastructure changes. Never run `down -v`, `down --volumes`, `prisma migrate reset`, delete database volumes or force-restore a checkout as a routine step; destructive work on the owner's data needs explicit approval. CI cleanup is a separate, disposable environment.

## Prisma

- Keep the datasource URL in `web/prisma.config.ts`, not `schema.prisma`.
- The generated client in `src/generated/prisma/` is gitignored and excluded from ESLint; never hand-edit it.
- Edit the schema, create a migration with `npm run db:migrate` and commit the SQL. Never rewrite an applied migration.
- `npm run db:setup` generates the client and runs `prisma migrate deploy`; `npm run db:deploy` only applies migrations.
- Initial greetings come from the first migration; do not reseed or overwrite them on startup.

## Tests, CI and line endings

- **Triggers:** CI runs on pushes to `main`, pull requests and manual dispatch.
- **Branch protection:** `main` requires a pull request (0 approvals), resolved conversations, and the `unit` and `containers` checks passing on a branch up to date with `main`; force pushes and deletion are blocked, admins included. `unit` is a gate job over the Node matrix so the required name never changes; keep it when editing the matrix.
- **Unit job:** Line endings, ESLint, UI/architecture/FIRE/auth-config tests, type checking, Prisma validation, production build, migrations and account lifecycle against a disposable database, and a high-severity audit.
- **Container job:** Exercises `core.autocrlf=true`, builds the app and starts disposable app/PostgreSQL containers, runs smoke tests, verifies live database reads, and checks that outages change only the status before recovery.
- **Isolation and cleanup:** `COMPOSE_PROJECT_NAME=moneyworks-ci` with example credentials. Keep the `if: always()` cleanup and its verification; never copy that destructive cleanup into normal commands. Preserve failure logs, finite retries and job timeouts.
- **LF rules:** Preserve `.gitattributes` and `.editorconfig`, especially for shell scripts, Dockerfiles, YAML, SQL and Prisma files. If a shell entrypoint is added, test both LF and CRLF inputs.
- **Workflow archives:** `.github/workflows export-ignore` only omits workflows from source archives; keep them tracked.
- **Dependabot:** Review grouped Next/config, React/types, Prisma and Tailwind updates together.

## Coding conventions

- **TypeScript:** Strict checking, useful explicit types at interfaces and API boundaries, no `any` to silence errors.
- **React:** Prefer Server Components; add client components only for browser interaction or state.
- **Routes:** App Router handlers under `src/app/api/`. Validate inputs and return proper status codes without exposing internal errors.
- **Styling:** Follow the CSS tokens and component classes in `globals.css` and `DESIGN.md`.
- **Reuse:** Extend the existing localized structure and database helper rather than adding parallel infrastructure.
