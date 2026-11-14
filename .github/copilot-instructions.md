# MoneyWorks project instructions

MoneyWorks is a self-hosted, country-neutral personal-finance tool hub. It implements a bilingual (English/Swedish) pre-rendered hub, a pension-aware FIRE calculator, reusable site/account/privacy components, a real database health endpoint and an account foundation (email/password, optional Google sign-in). Crypto tax is planned. Nothing is publicly hosted yet.

This file is the shared reference for coding agents (Copilot reads it directly; `CLAUDE.md` imports it). Topic details live in `DESIGN.md`, `FIRE.md`, `AUTH.md` and `VIDEO.md`; history, decisions and planned work live in GitHub issues.

## Shared standards

This repo follows the owner's [WebDev Studio](https://github.com/hkarn/WebDev-Studio)
standards: [stack](https://github.com/hkarn/WebDev-Studio/blob/main/standards/nextjs-postgres.md),
[dev environment](https://github.com/hkarn/WebDev-Studio/blob/main/standards/dev-environment.md),
[CI](https://github.com/hkarn/WebDev-Studio/blob/main/standards/ci.md),
[dependencies](https://github.com/hkarn/WebDev-Studio/blob/main/standards/dependencies.md),
[security](https://github.com/hkarn/WebDev-Studio/blob/main/standards/security.md) and
[agent instructions](https://github.com/hkarn/WebDev-Studio/blob/main/standards/agent-instructions.md).
Which services, models and providers to use, how to configure and price them, and the business
decisions behind them come from
[tech-research FINDINGS.md](https://github.com/hkarn/tech-research/blob/main/FINDINGS.md), which
is private: the owner's agent sessions read it with `gh`. This repo's own files stay the authority
for what is implemented here.

## Working rules

- **Workflow:** Work on a branch and open the pull request as a draft. CI skips draft pull requests; the maintainer marks one ready for review after reading it, which starts CI. Never mark a pull request ready yourself. While iterating, run only `npm run typecheck` and `npm run lint`, and keep a note of which tests the changes call for. Run the rest before a commit or a PR, or when asked: lint, format check (`format:check`), typecheck and the unit tests (`test:line-endings`, `test:ui`, `test:architecture`, `test:fire`, `test:auth-config`), plus integration tests (`test:accounts`, `test:smoke`) when API, auth or database code changed and the browser/E2E tests (`test:e2e`, `test:e2e:accounts` for account pages) covering any changed UI. CI runs the unit and container suites on every PR that is ready for review, and the release-image job only on `main`. Report the checks that actually ran; never claim a pass that was not observed.
- **Decisions:** Product and architecture questions are GitHub issues labelled `decision`. Do not build features that depend on an open one. Once decided, write the outcome as a closing comment, update the affected rules here or in a topic doc, and close the issue. Closed `decision` issues are the decision log.
- **Issue labels:** Never apply `good first issue` or `help wanted` when creating or editing issues; the maintainer sets those manually to invite outside help. Use `decision`, `enhancement`, `bug`, `documentation` or `dependencies`. `CONTRIBUTING.md` only accepts outside pull requests for `help wanted` issues or plans a maintainer approved in the issue.
- **Product principles:** Make tool purposes clear without financial marketing claims; distinguish planned from working; stay readable, accessible and static-first; keep the same meaning and hierarchy in English and Swedish.
- **Swedish capitalization:** Swedish uses sentence case everywhere: headings, navigation, buttons, labels, tabs, table headers and metadata titles capitalize only the first word and proper nouns ("Lär dig", "Nuvarande ålder", "Skicka återställningslänk"), never English Title Case ("Lär Dig", "Nuvarande Ålder"). Do not copy the capitalization of an English string into its Swedish translation. Weekdays, months, languages and nationalities stay lowercase ("svenska", "engelska"). English may use title case where its own style calls for it, but keep headings and labels consistent within a locale.
- **Keep guidance current:** Update this file and the README alongside meaningful changes to behavior, dependencies, containers, credentials, migrations, tests or CI. Treat `web/package.json`, the lockfile, Docker/Compose files, Prisma schema/migrations and `.github/workflows/ci.yml` as the authorities for versions and commands.
- **Separate fact from plans:** Describe only implemented behavior as existing. Planned items are not authority to build them without a request.
- **Dependency restraint:** Frameworks are acceptable; qualify every additional package. Prefer native HTML, Node APIs and small maintained code for ordinary UI/utilities. Established security/protocol implementations may justify a dependency; document the reason, pin exact versions and audit.
- **Keep changes scoped:** Preserve unrelated work and inspect the current diff before committing.
- **Private notes:** `notes/` and `CLAUDE.local.md` are gitignored for working notes and session logs. The repository is public; never commit credentials, personal contact details or operator data.

## Stack

- **Repository:** `GothenburgOffice/moneyworks`, MIT licensed, public.
- **Application:** Next.js App Router, React, strict TypeScript, Tailwind CSS and `next-intl`, with `en` and `sv` locales.
- **Database:** PostgreSQL 18 via Prisma 7 and `@prisma/adapter-pg`. Models: `User` (with `isAdmin`, and `lockedAt`, `deletedAt` and `lastSignInAt` for admin user management), `Account`, `Session`, `Verification` and `RateLimit` for accounts, `SiteSetting` (key/value site settings edited at `/admin`; secrets encrypted), plus `Scenario` for saved tool work (`userId`, `toolId`, `name`, `schemaVersion`, JSON `data`, created/updated times; deleted with its user). Nothing writes scenarios yet: saving is decision #8.
- **Toolchain:** Node.js and npm run only inside the Debian-based development container; the host needs Docker, not Node. CI installs its own matching toolchain.
- **Node support:** `engines.node` is `>=22.13.0` for hosting flexibility (the lowest 22.x every locked package accepts; Tailwind's WASI fallback and ESLint tooling need 22.13). The Dockerfile and `@types/node` track Node 22 so newer-only APIs fail locally; CI runs a single unit job on Node 22, like vocabulary-training. Raise the floor in `package.json`, `Dockerfile`, `@types/node`, the CI `node-version` and the Dependabot holds together.
- **Dependency policy:** Compatible stable releases, exact direct versions, committed lockfile. No forced peer overrides or prereleases. TypeScript and ESLint majors are held in Dependabot until lint-plugin peers support them. Prettier and `eslint-config-prettier` are dev-only, for one shared formatting standard across GothenburgOffice repositories. `@playwright/test` is dev-only: real-browser checks of navigation, the FIRE calculator, account pages and no-JS rendering that the mocked-DOM unit tests cannot cover.

## Repository layout

```text
moneyworks/
├── .devcontainer/                # VS Code devcontainer on top of the dev Compose stack
├── .github/
│   ├── copilot-instructions.md   # This file
│   ├── dependabot.yml            # Weekly updates and compatibility holds
│   ├── ISSUE_TEMPLATE/           # Bug, feature and accessibility forms (no blank issues)
│   ├── pull_request_template.md  # Linked issue, summary and the checks a PR owes
│   └── workflows/
│       ├── ci.yml                # Checks and disposable container integration tests
│       └── claude.yml            # Read-only issue review on @claude mentions (writers only)
├── .editorconfig / .gitattributes # LF rules
├── .prettierrc.json / .prettierignore # Shared Prettier settings (printWidth 100)
├── .git-blame-ignore-revs        # Whole-repo reformat commits hidden from blame
├── .env.example                  # Template for the required, gitignored root .env
├── README.md                     # Setup, commands and configuration
├── CLAUDE.md                     # Claude Code entry point; imports this file
├── DESIGN.md / FIRE.md / AUTH.md # Visual system, FIRE model semantics, accounts and security
├── CONTRIBUTING.md               # Which outside pull requests are reviewed
├── SECURITY.md                   # Supported versions and private vulnerability reporting
├── LICENSE                       # MIT, for the code
├── ARTWORK.md                    # Artwork under CC BY-NC, not MIT (marks, favicon, video)
├── VIDEO.md                      # How the site's videos work and their rules (sources kept outside the repo)
├── CODE_OF_CONDUCT.md            # Expected behavior and how to report it
├── ACCESSIBILITY.md              # Accessibility commitment, known limitations, reporting
├── Dockerfile                    # development, devcontainer, migration and production targets (Node 22, trixie-slim)
├── compose.yaml                  # Base stack: db, migrate, app (production build from source)
├── compose.dev.yaml              # Development override: dev target and source mounts
├── compose.images.yaml           # Published release image + PostgreSQL
├── moneyworks.code-workspace     # VS Code workspace and extension recommendations
└── web/
    ├── README.md                 # Pointer to the root README for the app folder
    ├── messages/                 # English/Swedish interface messages
    ├── prisma/                   # schema.prisma and committed migrations
    ├── prisma.config.ts          # Prisma connection URL and migration configuration
    ├── playwright.config.ts      # Browser tests against a running app (test:e2e)
    ├── playwright.accounts.config.ts # Account-page browser tests on a disposable DB (test:e2e:accounts)
    ├── scripts/                  # Auth cleanup (cleanup-auth.mjs)
    ├── src/
    │   ├── app/[locale]/         # Static hub, static tools/[tool] pages and dynamic account route
    │   ├── app/admin/            # Site settings and users pages (404 unless a signed-in admin)
    │   ├── app/api/              # account and admin form adapters, auth endpoints, DB health
    │   ├── components/           # Site, fire/, account/, admin/ and privacy/ components
    │   ├── content/              # Typed site, brand, FIRE, account and privacy copy
    │   ├── features/             # Pure models: FIRE engine, account queries, tool catalogue
    │   ├── generated/prisma/     # Generated client; gitignored
    │   ├── i18n/                 # Routing, navigation and translation loading
    │   ├── lib/                  # Server-only DB/auth/HTTP/mail
    │   ├── styles/               # Feature CSS
    │   └── proxy.ts              # Locale routing proxy
    └── tests/                    # Architecture, unit, LF, smoke, account integration, e2e/ and e2e-accounts/ (Playwright)
```

## Component boundaries

- **Localized identity:** `content/brand.ts` selects the name: Money Working for English, Pengar jobbar for Swedish (decision #92). Both share one mark and one favicon (`public/brand-icon.svg`, `app/favicon.ico`). Pass the explicit locale to shared brand, intro and about components; keep names, the SVG mark and favicons server-rendered. The repository, package, database and image keep the `moneyworks` identifier. Language links stay on the current host and never switch domain (owner decision in #7); search engines learn each language's home domain from `LOCALE_ORIGINS`.
- **Route orchestration:** Resolve request/query state, auth configuration and sessions in server routes. Pass only the required user fields or public controller/contact details into presentation, never full sessions/configuration.
- **Presentation:** Reuse `components/account/` for entry, form, tabs and workspace, and `components/privacy/` for privacy rendering. Privacy copy lives in `content/privacy.ts`, independent of account messages.
- **Pure features:** `features/account/view.ts` parses allowlisted view/feedback queries; `features/tools/catalog.ts` defines tool IDs/status and a neutral card-content contract. Add tools through the catalogue and both translations, not duplicated card calls.
- **Server boundary:** DB/auth/HTTP/mail modules are server-only. ESLint and `test:architecture` reject persistence/auth imports or environment reads from presentation/content/pure-feature modules.
- **Styles and tests:** Shared tokens/site rules live in `app/globals.css`; feature CSS in `styles/`. Keep content readable without JavaScript (tool workspaces and account pages may require it), both locales/themes and responsive layouts.
- **Shared navigation:** Keep the sticky header's reserved slot independent of its compact bar height to prevent scroll/layout oscillation. Preserve section-link/skip/result clearance, 44px controls, both mobile-menu modes and the full-size no-JS fallback. The header logo replaces footer back-to-top links.
- **Interactive tools:** Each tool's workspace is a React client component (an island) inside the pre-rendered page; the server renders the tool's heading, description, walkthrough and method, and passes typed copy and the locale as props. A tool may keep the visitor's inputs in `sessionStorage` (one versioned key per tool, validated with the tool's model validator on restore, every access in try/catch), so reloads and in-site navigation keep them and closing the tab clears them; longer keeping is account saving (#8). Financial inputs never go into URLs (history, logs, referrers), telemetry or requests. The "no browser storage" rule this replaces came from the first preview host, not from a decision (owner, 2026-11-14). Tools import their pure model from `features/` directly; no separate browser bundle. Decided in #4.
- **Icon-only actions:** Use shared local SVG icons, native buttons, localized contextual accessible names, decorative SVGs hidden from assistive technology, visible focus and at least 44px targets.

## FIRE calculator

- **Separation:** `features/fire/model.ts` is the dependency-free, independently tested engine. `components/fire/fire-calculator.tsx` is the server shell (heading, walkthrough, method); `fire-workspace.tsx` is the client component that owns form, payout and result state and imports the model directly, with `fire-fields`, `pension-editor`, `fire-results` and `fire-chart` rendering from that state. Copy lives in `content/fire.ts`. Do not duplicate the model.
- **Truth and privacy:** Preserve both questions/strategies, monthly non-borrowing checks, pension age boundaries and real-money conventions in `FIRE.md`. No guaranteed returns, URLs, telemetry or account saving (#8). Inputs and accepted payouts are kept in `sessionStorage` (`moneyworks.fire.v1`, `features/fire/stored-inputs.ts`) for the tab's lifetime; open payout edits are not, and Clear removes the stored copy. Calculation needs JavaScript; without it, explanations stay readable, controls stay disabled and a notice says why.
- **Ages:** No fixed lifespan bounds. Use only numeric representability, whole non-negative ages and chronological ordering; do not silently truncate long horizons.
- **Payout editing:** No payout-count ceiling. Save validates that row with the shared model validator, accepts it (kept with the other inputs for the tab) and collapses it into an Edit/Remove summary. Cancel restores accepted values or discards a new draft. Calculate from accepted records; open edits must be saved/cancelled first. Enter saves a payout input or calculates elsewhere.
- **Number entry:** Optional zero-based amounts (portfolio, contributions, end reserve, payout amount) start empty with a `0` placeholder; blank means zero. Spending and ages remain required. Normalize redundant leading zeros on blur only, preserving in-progress decimals.
- **Result phases:** Keep the Savings plan / Retirement plan toggle, both from the same engine. Chart actual savings against a distinct minimum-capital target. Monthly saving to target is a total, not a top-up. Preserve phase on recalculation and reset it on Clear.
- **Display:** Whole currency units in results, payouts, charts and yearly tables; keep fractional inputs/rates/model precision. Round the minimum required monthly saving up.
- **Walkthrough video:** Self-hosted native video, one narrated file per language in `public/media/fire-demo/<locale>/` with local subtitles (off by default) and a text version, near the calculator heading. The owner renders them from branded sources kept outside this repository; `VIDEO.md` has the rules, and narration, captions and the text version must say the same thing. User-initiated playback only; pause on closing the demo or leaving the tool. No third-party player, analytics or video-production dependency in the app.

## Runtime behavior

- **Hub and tool pages:** One pre-rendered hub page per locale composed from separate components. Each available tool has its own static page at `/[locale]/tools/[tool]` (`/en/tools/fire`, `/sv/tools/fire`: only the locale prefix differs), generated from `features/tools/catalog.ts` with its own title and description; planned and unknown tools are 404. A tool page uses ToolView (banner, back link to the hub's tools) and the shared header/footer. Old `#fire-calculator` links are not redirected (decision #5). Keep plain-link entry, Back/Forward and context-preserving theme/locale controls. Financial inputs never enter the URL.
- **Static content:** Pre-render `/en`, `/sv` and every available tool page with localized metadata. Public pages are server-rendered HTML: never client-render the page or fetch the body after load.
- **Learn articles (decided in #10, not built yet):** Markdown stored in PostgreSQL and edited by admins at `/admin`. `/[locale]/learn/**` is the only public page route that may read the database (`/api/health` also queries it, by design): Server Components render the Markdown on first request, and the page is cached and revalidated on demand when an article is saved, published or unpublished. A lookup that returns nothing is a 404; a failed lookup is a 503 (`Retry-After`, `no-store`), never a 404. No raw HTML in articles. The closing comment on #10 has the full design and build order.
- **Small enhancements:** `public/site-ui.js` closes the mobile menu and provides theme switching. Dark is the static default; `light`/`dark` are the only accepted URL preference values, carried through locale links with guarded history updates. No browser-storage APIs. Hide the theme control without JavaScript. The hub and tool pages never call the database; builds need no database.
- **Artwork is not MIT:** The marks, favicon and walkthrough video are listed in `ARTWORK.md` and excluded from MIT; they are CC BY-NC 4.0 (issue #87). Keep that list current when artwork is added or moved; the code stays MIT. Branded video sources and promotional material stay outside this public repository; only the rendered files the app serves are committed.
- **Brand:** Direction C (Bright works) as recorded in `DESIGN.md`: charcoal/lime, bold headings, contrasting tool panels, original marks, self-hosted Manrope, CSS tokens.
- **Country-neutral:** Do not assume SEK, a tax jurisdiction, a trading method or financial outputs.
- **Security headers:** `next.config.ts` sends the same site-wide set as vocabulary-training on every route: CSP (`default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`; inline scripts for Next.js hydration, eval only in development), `form-action 'self' https://accounts.google.com` for the Google sign-in redirect, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: same-origin` (account pages override it with `strict-origin`, because recovery URLs carry tokens) and a restrictive `Permissions-Policy`; `poweredByHeader` is off. Self-host every asset; adding an external origin needs a CSP change and a reason.
- **Health endpoint:** `/api/health` runs `SELECT 1` against PostgreSQL (used by Compose and CI health checks); HTTP 200 `status: "ok"` or 503 `status: "error"`, always `Cache-Control: no-store`.
- **Connection handling:** Reuse the Prisma pool across hot reloads, initialize lazily and keep finite connection/query timeouts.
- **Secrets:** Never expose connection strings, credentials or raw database errors. Never put secrets in `NEXT_PUBLIC_` variables.
- **Localization:** English is the default regardless of browser language or old locale cookies; automatic detection stays disabled. The one exception is a language's home domain (`LOCALE_ORIGINS`, decision #83): an unprefixed URL on it redirects to that language (`pengarjobbar.nu/` to `/sv`), done in `proxy.ts` with `homeLocale`; any other host, or one host serving both languages, keeps English. Localized pages live under `src/app/[locale]/`.

## Containers and credentials

- **Paths:** The repository is mounted at `/workspace`; the app works in `/workspace/web`. `node_modules` and `.next` stay in Docker volumes.
- **Compose layout (shared with vocabulary-training):** `compose.yaml` is the base and runs the production build from source (`db`, one-shot `migrate`, `app`). `compose.dev.yaml` only overrides `app` with the `development` target, source mounts and a command that runs `npm ci` when the lockfile changed, then `npm run dev`. `npm run dev` uses webpack because the bind mount from a Windows drive delivers no file events and only webpack honours `WATCHPACK_POLLING` (default `true`, `false` in `.env` on a Linux filesystem); Turbopack never sees the edits there. `compose.images.yaml` runs the published image. Keep shared settings in `compose.yaml`; dev may differ only through the override. One `Dockerfile` holds the `development`, `devcontainer`, `migration` and `production` targets; `.devcontainer/compose.yaml` switches `app` to `devcontainer`.
- **Development tools:** Only the devcontainer builds the `devcontainer` target: `development`'s contents (node_modules from `dependencies`, then the source) on top of a `devcontainer-tools` stage built from `base`, so lockfile and source changes never reinstall the tools. It adds `curl`, `git`, `jq`, `less`, `openssh-client`, `procps` and `ripgrep` from Debian, Playwright's headless Chromium with its system libraries (`PLAYWRIGHT_VERSION` build argument, which must equal `@playwright/test`; `tests/workspace.test.mjs` checks it; browsers in `/ms-playwright`), `postgresql-client-18` from the PostgreSQL apt repository (`trixie-pgdg`, matching the PostgreSQL 18 server) and `gh` from GitHub's apt repository (`cli.github.com/packages`). Both repository keys are downloaded at build time, must match the published fingerprints and are referenced with `signed-by=`; `gnupg` is removed afterwards. Versions are pinned with the `GH_VERSION` and `POSTGRESQL_CLIENT_VERSION` build arguments, which Dependabot cannot bump (the Dockerfile comment says where to look up updates). It also marks `/workspace` as a git `safe.directory`. `development` (plain `compose.dev.yaml`, CI) and the release image do not get these tools; CI builds the `devcontainer` target in the `containers` job.
- **Startup:** `migrate` applies migrations after the database is healthy; `app` starts after it completes. The devcontainer (`compose.yaml` + `compose.dev.yaml` + `.devcontainer/compose.yaml`) keeps the service command, so the dev server starts with the container. It installs Claude Code, ESLint, Prettier (format on save, using the project's pinned Prettier), GitHub Actions and Prisma extensions, keeps Claude Code's configuration in the `claude-config` volume and the GitHub CLI sign-in in `gh-config` and bind-mounts its project memory from `~/.claude-memory/moneyworks` on the host (`%USERPROFILE%\.claude-memory\moneyworks` on Windows; override with `CLAUDE_MEMORY_DIR`). Claude Code on a Windows host shares that memory only after its `projects/<slug>/memory` folder is replaced by a directory junction to the same folder (one-time steps in the README); the devcontainer does not create it. Do not set `autoMemoryDirectory` in `.claude/settings.local.json`: that file is mounted into the container too.
- **Network:** Inside Docker the app listens on 3000 and PostgreSQL on `db:5432`. The app's host port is deliberately uncommon so the stack runs beside other projects: `localhost:3410` (`APP_PORT`; vocabulary-training uses 3420). PostgreSQL publishes no host port; use the Compose network or `docker compose exec db psql`.
- **Persistence:** PostgreSQL 18 uses the `postgres18_data` volume at `/var/lib/postgresql`. All Compose files share the project name `moneyworks` and therefore that volume (deliberate, as in vocabulary-training: switching between source and image builds keeps data); use `COMPOSE_PROJECT_NAME` to isolate a local release test. Preserve it and any retained PostgreSQL 16 volume.
- **Configuration:** Every stack requires a root `.env` copied from `.env.example`; never overwrite it or commit real credentials. Only `POSTGRES_PASSWORD` is mandatory (`${POSTGRES_PASSWORD:?...}`); it must be URL-safe because Compose builds `DATABASE_URL` from it. The database user and name are fixed to `moneyworks` in every stack. Everything else is optional and defaults to off; no hardcoded development secrets. Mail, privacy controller, registration and the Google OAuth client are not environment settings: they are `SiteSetting` rows edited at `/admin`. `.env` adds `SETTINGS_ENCRYPTION_KEY` (encrypts stored secrets, as in vocabulary-training) and `ADMIN_EMAIL`/`ADMIN_PASSWORD` (first admin, created when they are used to sign in on the account page while none exists). `LOCALE_ORIGINS` (optional, `en=<origin>,sv=<origin>`, every locale required) names each language's home domain: `proxy.ts` reads it per request and sends `canonical` plus `hreflang`/`x-default` Link headers on the hub and available tool pages only (`features/site/language-links.ts`; next-intl's same-host `alternateLinks` are off). `app/sitemap.ts` and `app/robots.ts` are built per request too: a language's home domain gets a sitemap of its own languages' pages with `hreflang` alternates and a `Sitemap:` line; other hosts get an empty sitemap. Blank or invalid sends none. Development (`compose.dev.yaml`) ignores the production origins, `AUTH_SECRET` and `SETTINGS_ENCRYPTION_KEY` and reads `DEV_`-prefixed variables instead (like vocabulary-training's `DEV_REQUESTY_*`). The devcontainer (`.devcontainer/compose.yaml`) forces registration on (`ALLOW_REGISTRATION`) and seeds clearly fake privacy details into its own database; never set either in `.env` or a production stack. Shared names with vocabulary-training: `APP_ORIGIN` (single public origin, used in email links), `APP_ORIGIN_ALIASES` (optional extra exact origins; a malformed entry disables accounts with a clear 503; development defaults to `http://127.0.0.1:<APP_PORT>`; `next.config.ts` derives `allowedDevOrigins` from these hosts so dev assets load there), `ADMIN_EMAIL`/`ADMIN_PASSWORD`, `SETTINGS_ENCRYPTION_KEY`, `APP_PORT`, service `app`, `/api/health`. Auth cookies follow the request's own allowed origin: `__Host-`/Secure on HTTPS, development names on loopback HTTP. Editing `.env` does not rotate an existing role's password.
- **Release image:** The root `Dockerfile` (context `web/`) builds a non-root Next.js standalone image that also runs migrations (`prisma migrate deploy` from a copied, lockfile-exact Prisma CLI) and `scripts/cleanup-auth.mjs` as one-shot commands. `compose.images.yaml` runs it with PostgreSQL and no source build; it requires `POSTGRES_PASSWORD` and defaults public signup off. CI publishes it to `ghcr.io/gothenburgoffice/moneyworks` (`sha-<commit>`, `latest`) from `main` only.
- **Hosting stays out of this repository:** It is public and ends at the container: the Dockerfile, the Compose files and the image CI publishes. Never add anything specific to where or how the app is run: host setup, reverse proxy, TLS, backups, scheduling, deploy scripts, domains or provider details. The owner keeps server operations elsewhere.

## Accounts and privacy

- **Static boundary:** Account pages and APIs may be dynamic; the hub and tool pages stay static (Learn articles are the decided exception, see "Runtime behavior"). Never read sessions in the shared layout/header.
- **Identity:** Stable `User.id` owns future data; credential and provider accounts are separate. One user per email address: Google sign-in joins the user with that address only when Google has verified it (never trust an unverified provider address), and new Google users need open registration. One sign-in method per member: linking Google removes the password and recovery cannot add one while Google is on; admins included. An unverified local account linked by Google loses its password and sessions. Google's client ID/secret are `SiteSetting` rows (secret encrypted); no Google name, photo or tokens are stored. `AUTH.md` "Google sign-in" has the rules.
- **Security:** Use Better Auth for hashing, verification, sessions, recovery, origin checks and durable rate limits. Keep auth/mail server-only. Never log credentials or token URLs, disable origin checks or authorize by cookie presence alone. Preserve the body limit, guarded IP-header boundary and fallback limiter.
- **Configuration:** Missing origin/secret disables accounts (and `/admin`); missing mail disables registration and recovery but not sign-in (the first admin must reach `/admin` to set mail up); registration needs mail, real privacy details (reserved example domains never count) and the `/admin` switch. Do not invent operator details or enable public signup with fixture values.
- **Admin:** Admins are ordinary members with `User.isAdmin`; they sign in on the account page, which links them to `/admin`. There is no separate admin sign-in. `/admin` is English-only and `noindex`; the page and its API answer 404 to everyone but a signed-in admin and uses the account forms' origin/size/type checks. Never display stored secrets; show only whether they are set and readable.
- **Account lifecycle:** Members download their data (`/api/account/export`, versioned JSON, never hashes or tokens) and delete their own account at once (password, or a Google sign-in younger than 10 minutes); the user row cascades to everything it owns. Admins manage accounts at `/admin/users`: search, filter, sort, lock (ends sessions) and a 30-day trash that `auth:cleanup` and the list purge. Locked or trashed accounts cannot sign in by any method. Never on yourself, never the last admin who can sign in. `AUTH.md` "Account lifecycle" has the rules.
- **Necessary-only storage:** No analytics, advertising or locale cookies. Keep the native footer cookie/privacy notice; no accept-all banner or consent cookie. Any optional tracking needs a privacy review and a decided issue first.
- **Testing:** Real flows are tested against a disposable database and a loopback capture mailbox, over HTTP (`test:accounts`) and in a browser (`test:e2e:accounts`). Account pages send anti-framing headers; do not weaken cookie/origin/framing protections. `AUTH.md` has setup and verification details.

## Commands

Inside the devcontainer, work in `/workspace/web`; the dev server already runs (`npm run dev` binds to `0.0.0.0:3000` in the container). From the host, prefix commands with `docker compose -f compose.yaml -f compose.dev.yaml exec app`.

```bash
npm run format              # Prettier; CI runs npm run format:check
npm run lint
npm run typecheck
npm run test:ui
npm run test:architecture
npm run test:fire
npm run test:auth-config
npm run test:line-endings
npm run test:smoke          # needs the running app and database
npm run test:e2e            # Playwright; needs the running app (TEST_BASE_URL, default 127.0.0.1:3000)
npm run test:e2e:accounts   # Account pages in Playwright; needs npm run build and a disposable AUTH_TEST_DATABASE_URL
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
- `Scenario.data` holds one tool's inputs; validate it with that tool's model validator for its `schemaVersion` before every write, and authorize every read and write by `User.id`.

## Tests, CI and line endings

- **Triggers:** CI runs on pushes to `main`, pull requests that are not drafts (including when a draft is marked ready for review) and manual dispatch.
- **Branch protection:** `main` requires a pull request (no approving review: the owner is the only collaborator, opens agent pull requests from their own account and cannot approve them), resolved conversations, and the `unit` and `containers` checks passing on a branch up to date with `main`; force pushes and deletion are blocked. The rules are enforced for admins, so nobody, the owner included, can merge with failing checks. `release image` is not required: pull requests skip it, and on `main` it gates publishing. Reintroduce a required review if another collaborator gets write access. Keep the `unit` and `containers` job names stable; renaming one requires updating branch protection.
- **Unit job:** Line endings, Prettier check, ESLint, UI/architecture/FIRE/auth-config tests, type checking, Prisma validation, production build, migrations, account lifecycle and account-page browser tests (Chromium, desktop and mobile, both locales, also without JavaScript) against a disposable database, and a high-severity audit.
- **Container job:** Exercises `core.autocrlf=true`, builds the app and starts disposable app/PostgreSQL containers, runs smoke tests, runs the Playwright browser tests from the runner against that stack (Chromium, desktop and mobile, both locales; report and traces uploaded on failure), checks that a database outage turns the health endpoint to 503 while static pages keep working, then recovery.
- **Release image job:** After `unit` and `containers`, on `main` (pushes and manual runs; skipped on pull requests), builds the release image once, runs it through `compose.images.yaml` (migrations, smoke tests, non-root/no-source checks, auth cleanup dry run, restart persistence) and, on `main` only, pushes that exact image to GHCR and verifies an anonymous pull. Workflow runs on `main` are never cancelled, and release-image runs share one concurrency group. The `unit` and `containers` jobs cache `web/node_modules` with `actions/cache` (keyed on OS, Node version and lockfile) and run `npm ci` only on a miss, matching vocabulary-training.
- **Isolation and cleanup:** `COMPOSE_PROJECT_NAME=moneyworks-ci` (and `moneyworks-release-ci`) with disposable credentials. Keep the `if: always()` cleanup and its verification; never copy that destructive cleanup into normal commands. Preserve failure logs, finite retries and job timeouts.
- **LF rules:** Preserve `.gitattributes` and `.editorconfig`, especially for shell scripts, Dockerfiles, YAML, SQL and Prisma files. If a shell entrypoint is added, test both LF and CRLF inputs.
- **Workflow archives:** `.github/workflows export-ignore` only omits workflows from source archives; keep them tracked.
- **Dependabot:** Review grouped Next/config, React/types, Prisma and Tailwind updates together.

## Coding conventions

- **Formatting:** Prettier owns formatting (`printWidth: 100`, root `.prettierrc.json`, shared with vocabulary-training); `eslint-config-prettier` turns off conflicting lint rules. Run `npm run format` before committing. Whole-repo reformat commits go in `.git-blame-ignore-revs`.
- **TypeScript:** Strict checking, useful explicit types at interfaces and API boundaries, no `any` to silence errors.
- **React:** Prefer Server Components; add client components only for browser interaction or state.
- **Routes:** App Router handlers under `src/app/api/`. Validate inputs and return proper status codes without exposing internal errors.
- **Styling:** Follow the CSS tokens and component classes in `globals.css` and `DESIGN.md`.
- **Reuse:** Extend the existing localized structure and database helper rather than adding parallel infrastructure.
