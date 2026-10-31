# MoneyWorks

An early-stage, owner-hosted personal-finance site. It is a single-page tool hub with an original MoneyWorks logo, reusable navigation/section components, English and Swedish content, and a real database health check. The pension-aware FIRE calculator is implemented; the crypto-trading tax tool remains planned.

## Direction C starter

The owner-selected Bright works direction uses charcoal and lime, bold two-line headings, an oversized M/W illustration and contrasting planned-tool panels. Dark is the default; a localized theme toggle provides the light counterpart and carries the preference through locale navigation. Theme state uses a validated URL query rather than browser storage; history updates are guarded for restricted previews. English remains default, with Swedish available.

The main content and metadata are pre-rendered by Next.js. Header/navigation, theme toggle, illustration, tools, information, about and footer remain separate Server Components; content does not depend on a client application bundle to be readable. Menu/theme behaviour, focused tool navigation, FIRE calculations and real database status use small enhancement scripts. `PRODUCT.md`, `DESIGN.md` and `FLOWS.md` record scope, visual decisions and verification flows.

The separate public mockup board is a review aid, not this application. Its additional eight tools, blog and video examples have not become implemented features.

## Localized branding

The Swedish preview uses **Pengar jobbar**, with a matching PJ mark; English
retains **MoneyWorks** and its original M/W mark. Shared server-rendered branding
comes from `web/src/content/brand.ts`, including locale-specific favicon paths.
Header, hero, about and footer marks, page/account titles, accessible names and
Swedish account/privacy copy follow the selected language. Narrow Swedish
headers wrap the two-word name without reducing navigation touch targets.

Language links remain on the current domain. Domain defaults, DNS, cross-domain
canonical/hreflang policy and analytics are not configured by this preview change.
The existing narrated video and source archives retain their approved production
branding. GitHub publication and public hosting remain separate approvals.

## FIRE demonstration

All displayed currency amounts use whole units, including pension summaries,
chart ticks and yearly tables. The minimum required monthly saving rounds up;
other amounts round to nearest integers. Fractional inputs, percentage rates and
model precision are retained.

The focused FIRE tool includes a clearly labelled “Watch a 90-second walkthrough”
disclosure above its inputs. It uses native video controls, a self-hosted MP4 and
poster, local English/Swedish subtitle tracks, and a readable text walkthrough.
The narrated walkthrough follows one simple example with large, focused UI crops,
pension editor, pen controls and retirement/savings results. English narration
replaces explanatory text panels; English/Swedish captions are optional and off
by default. Playback is
user-initiated and pauses when the disclosure closes or the user leaves the tool.
There is no third-party player or tracking, and no video-production dependency
was added to the app. Example inputs are illustrative, not recommended assumptions.

## Accounts and cookies

The local account foundation supports public email/password registration after operator configuration, email verification, login/logout and recovery. Account identities are separate from stable user records so Google can be added later with explicit linking. The private area is deliberately empty: saved portfolios and tax workspaces are not implemented.

The homepage remains pre-rendered. A discreet footer notice and native privacy disclosure explain necessary sign-in cookies; no analytics, advertising, locale cookies or unnecessary accept-all banner were added. Real mail and privacy identity/contact settings must be configured before registration becomes available. The embedded review does not collect credentials.

Read `AUTH.md` for configuration, dependency decisions, security boundaries, retention and tests. Only Better Auth and Nodemailer were added as direct runtime dependencies; forms and cookie UI use native HTML. Repository availability does not mean public hosting or registration has been configured.

## Development stack

Versions checked on 2026-10-29. Application packages are pinned in `web/package.json`, with transitive dependencies recorded in `web/package-lock.json`.

| Component | Version |
| --- | --- |
| Node.js | 26.13.0 LTS |
| npm | 12.2.1 |
| Next.js / Next ESLint configuration | 16.4.3 |
| React / React DOM | 19.3.1 |
| next-intl | 4.14.9 |
| Tailwind CSS / PostCSS plugin | 4.3.3 |
| TypeScript | 6.0.3 |
| ESLint | 9.39.5 |
| Prisma CLI / client | 7.10.1 |
| PostgreSQL | 18.6 |

This uses the newest stable versions compatible with the existing stack, not prereleases or forced peer-dependency overrides. TypeScript 7 is not yet supported by the current TypeScript ESLint parser, and ESLint 10 is not yet supported by the React/import plugins used by Next.js. Prisma 8 and PostgreSQL 19 are prereleases at this check.

Release references: [Node.js 26.13.0](https://nodejs.org/en/blog/release/v26.13.0), [PostgreSQL version policy](https://www.postgresql.org/support/versioning/), and [PostgreSQL Docker image](https://hub.docker.com/_/postgres). For JavaScript packages, `npm view <package> version`, `npm view <package> peerDependencies` and `npm view <package> dist-tags` are the version/compatibility checks.

## Owner's environment

Maintain the gitignored root `.env` manually, starting from `.env.example`. There is no credential generator or deployment-onboarding system; the example values are only development defaults, and you should choose your own fixed password before hosting.

Keep `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `DATABASE_URL` consistent. URL-encode special characters in the password inside `DATABASE_URL`; do not URL-encode `POSTGRES_PASSWORD`. Never prefix database secrets with `NEXT_PUBLIC_` or commit `.env`.

PostgreSQL uses these variables when it first initializes an empty database volume. Editing `.env` later does not change an existing database user's password: change it in PostgreSQL too, then update the URL and recreate the web container. Keep any existing manually maintained `.env` when pulling changes.

## Run locally

The host needs Docker with the Compose plugin, not a host installation of Node.js, npm or PostgreSQL.

```bash
git clone https://github.com/GothenburgOffice/moneyworks.git
cd moneyworks
# First setup only; do not overwrite an existing .env.
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

In PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Open [the English page](http://localhost:3000/en) or [the Swedish page](http://localhost:3000/sv); both exposed ports bind to localhost only.

The web service waits for PostgreSQL to become healthy, installs locked dependencies, generates the Prisma client, applies committed migrations and starts the development server. Source files are mounted at `/workspace`, while `node_modules` and `.next` stay in Docker volumes instead of the host filesystem.

The site has one content page per language: navigation, an introduction, a working FIRE card, a planned crypto-tax card, expandable information, an about section and a footer. FIRE opens a focused, pre-rendered tool view at `#fire-calculator`, with its own banner and the shared header/footer. English is the default at `/`, regardless of browser language or an old locale cookie; Swedish is available at `/sv` and English at `/en`. The site is country-neutral and does not assume a currency or tax jurisdiction.

Next.js pre-renders both pages as HTML with localized metadata. Content, section links, language switching and native expandable details work without JavaScript. Small standalone scripts enhance mobile-menu closing and the footer's database status; the entire site is not client-rendered.

The initial migration creates a `Greeting` table containing English and Swedish test rows. The uncached health API reads a test row to verify database access. A failed API or network request changes the translated footer status without hiding or changing the finance-site content.

## Site development

The page composes Server Components from `web/src/components/`: the brand mark, language switcher, site header, introduction, tool panels, information, about and footer. Translated site copy lives in `web/messages/` and is accessed through the typed `web/src/content/site.ts` helper. Shared design tokens and site rules live in `web/src/app/globals.css`; account, privacy and cookie styles are separate under `web/src/styles/`. Manrope is self-hosted with its license under `web/public/fonts/`.

The dynamic account page handles query state and validated session reads, then composes `components/account/` and `components/privacy/`. Those components receive minimal presentation data, not secret-bearing auth configuration or full sessions. Account and privacy copy are separate typed modules. Pure feature models under `features/` handle allowlisted account queries and the approved tool catalogue; the reusable tool card has a neutral content contract rather than a FIRE-specific translation type.

`npm run test:architecture` checks server/import boundaries, query handling, catalogue translations and privacy separation. ESLint rejects auth/database imports from presentation and pure features; the database module is explicitly server-only. These checks complement, rather than replace, browser and account lifecycle tests.

`PRODUCT.md` records the confirmed scope, and `DESIGN.md` records the current preview design. Keep these and the Copilot instructions aligned when the site evolves. Tool details must remain explicitly planned until calculation behaviour is implemented and tested; do not add fake outputs or unusable "Calculate" buttons to this layout.

The pension-aware FIRE calculator is now implemented locally within the one-page
hub; crypto tax remains planned. `FIRE.md` documents both calculation questions,
planned drawdown/preservation, pension ranges, assumptions and the component
walkthrough for adding another tool. `npm run test:fire` builds and syntax-checks
the exact enhancement and runs independent model tests. Prebuild/predev uses the
existing TypeScript compiler to generate one small browser script from the tested
model; no runtime dependency or client-rendered application is introduced.
Financial inputs stay in the page, without saving or network submission.

Current development is preview-first. Changes stay local and unpublished until the owner approves a GitHub commit/push or public publication.

The read-only `/api/health/db` endpoint returns HTTP 200 with `status: "ok"` or HTTP 503 when the database/table/row cannot be read. Responses are not cached, and database credentials or raw connection errors are never included. The API still needs a backend; this is pre-rendered Next.js content with a small live endpoint, not an API-free static export.

## VS Code workspace and devcontainer

Open `moneyworks.code-workspace` from the repository root. It recommends the
requested Claude Code, Docker and GitHub Actions extensions, plus
[Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
for the existing container workflow,
[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
for the project's lint rules, and
[Prisma](https://marketplace.visualstudio.com/items?itemName=Prisma.prisma)
for schema editing. Recommendations do not install extensions automatically.

The workspace points ESLint and VS Code's built-in TypeScript support at `web/`.
The TypeScript SDK is available after the container installs the locked
dependencies; no host Node.js installation or extra React/Next.js extension is
required. No formatter, application dependency or editor task is added.

On first setup, copy `.env.example` to `.env`, then choose **Dev Containers: Reopen in Container**. The devcontainer uses the same services and volume paths as normal Compose, installs dependencies and applies migrations in `/workspace/web`, and leaves starting the web server to your terminal.

```bash
cd /workspace/web
npm run dev -- --hostname 0.0.0.0
```

The TypeScript language service and ESLint use the container's dependencies. After pulling infrastructure updates, choose **Dev Containers: Rebuild Container**.

## Commands

Run these from the repository root with the normal Compose stack running:

```bash
docker compose -f docker-compose.dev.yml exec web npm run lint
docker compose -f docker-compose.dev.yml exec web npm run typecheck
docker compose -f docker-compose.dev.yml exec web npm run build
docker compose -f docker-compose.dev.yml exec web npm run db:validate
docker compose -f docker-compose.dev.yml exec web npm audit
```

To add a package, run `docker compose -f docker-compose.dev.yml exec web npm install --save-exact <package>` and commit both package files. Dependencies are reinstalled with `npm ci` at web-service startup so a stale dependency volume cannot silently retain an older lockfile.

Prisma contains the `Greeting` connection-test model and the account foundation's `User`, `Account`, `Session`, `Verification` and `RateLimit` models. The account migration is additive and preserves `Greeting`. After adding models, run `npm run db:migrate` inside the container and review the resulting migration before any separately authorized commit; `npm run db:setup` regenerates the client and applies available migrations without prompting or resetting data. Prisma 7 keeps the connection URL in `web/prisma.config.ts`, not in the schema.

For a host-side database client, connect to `localhost:5433` using the development credentials in `.env`. Containers connect to `db:5432`; never commit real credentials.

## Existing PostgreSQL 16 volumes

PostgreSQL major versions cannot reuse an older data directory directly. The new service uses a fresh `postgres18_data` volume mounted at `/var/lib/postgresql`, as required by the PostgreSQL 18 Docker image; any old `postgres_data` volume is left untouched.

No PostgreSQL-major-version data migration is included. If you have local data to keep, export it with PostgreSQL 16 tools and restore it into PostgreSQL 18 before removing any old volume; do not use `down --volumes` on a database you want to preserve.

## Maintenance and validation

GitHub Actions runs on pushes to `main`, pull requests and manual **Run workflow** requests. It checks line endings, lint, types, Prisma schema validation, a production build and a high-severity dependency audit.

The container job exercises a Windows-style Git checkout, builds the app image and starts a disposable app/database stack. `npm run test:smoke` verifies the pre-rendered English/Swedish HTML, English-by-default routing and health response, and runs the actual status script against the live endpoint. CI changes a test row and confirms the API reads the new value, then stops PostgreSQL and checks that the enhancement reports failure while the static heading remains available, followed by recovery. Cleanup runs even after failure to remove the CI containers, volumes, network and locally built app image and checks that no project containers, volumes or networks remain. These are GitHub runner resources, not your hosted containers or data.

`.gitattributes` enforces LF for text files, with explicit rules for shell scripts and other Linux container inputs; `.editorconfig` asks editors to preserve LF too. A regression test simulates `core.autocrlf=true` and checks that container inputs remain LF. The startup commands currently live inline in Compose, so there is no shell entrypoint file to fail with a stray `\r`.

The `.github/workflows export-ignore` attribute excludes workflows from Git source archives, not from the repository. Workflows remain tracked so GitHub Actions can run them; they are not added to `.gitignore`. After pulling these rules into an existing Windows checkout, rebuild the devcontainer; if old tracked files still have CRLF, refresh only those files from Git after saving any local edits.

Dependabot checks npm packages, Docker images, Compose images and GitHub Actions weekly. Next/ESLint config, React/types, Prisma and Tailwind packages are grouped to keep related upgrades together; compatibility still needs review. TypeScript and ESLint major upgrades are held until their lint-plugin peers support them; remove those holds in `.github/dependabot.yml` when upgrading.

## Layout

```text
moneyworks/
├── web/                       # Localized static-first tool hub and Prisma schema
├── .devcontainer/             # VS Code development-container configuration
├── .github/                   # CI, dependency updates and architecture notes
├── Dockerfile.dev             # Node/npm development image
├── docker-compose.dev.yml     # App and PostgreSQL services
├── moneyworks.code-workspace  # VS Code folder, web tooling and extension recommendations
└── .env.example               # Local-development configuration template
```

The [architecture notes](.github/copilot-instruction.md) include future plans, not evidence of implemented features. This repository is MIT licensed.
