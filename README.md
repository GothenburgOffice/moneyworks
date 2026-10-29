# Moneyworks

An early-stage personal-finance web application hosted and maintained by its owner. Currently this is an English/Swedish database-backed hello-world page plus a Docker-first development environment; calculators, authentication, accounts and community features are not implemented.

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
git clone https://github.com/hkarn/moneyworks.git
cd moneyworks
# First setup only; do not overwrite an existing .env.
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

In PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Open [the English page](http://localhost:3000/en) or [the Swedish page](http://localhost:3000/sv); both exposed ports bind to localhost only.

The web service waits for PostgreSQL to become healthy, installs locked dependencies, generates the Prisma client, applies committed migrations and starts the development server. Source files are mounted at `/workspace`, while `node_modules` and `.next` stay in Docker volumes instead of the host filesystem.

The initial migration creates a `Greeting` table containing English and Swedish messages. Every page request reads its greeting from this table and shows the check time; changing the row changes the page without rebuilding. A failed query shows an explicit database-unavailable message, never a fake success.

The read-only `/api/health/db` endpoint performs the same database read, returning HTTP 200 with `status: "ok"` or HTTP 503 when the database/table/row cannot be read. Responses are not cached, and database credentials or raw connection errors are never included.

## VS Code devcontainer

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

Prisma contains only the small `Greeting` connection-test model so far. After adding models, run `npm run db:migrate` inside the container and commit the resulting migration; `npm run db:setup` regenerates the client and applies already committed migrations without prompting or resetting data. Prisma 7 keeps the connection URL in `web/prisma.config.ts`, not in the schema.

For a host-side database client, connect to `localhost:5433` using the development credentials in `.env`. Containers connect to `db:5432`; never commit real credentials.

## Existing PostgreSQL 16 volumes

PostgreSQL major versions cannot reuse an older data directory directly. The new service uses a fresh `postgres18_data` volume mounted at `/var/lib/postgresql`, as required by the PostgreSQL 18 Docker image; any old `postgres_data` volume is left untouched.

Since this repository is still a hello-world scaffold, no application-data migration is included. If you have local data to keep, export it with PostgreSQL 16 tools and restore it into PostgreSQL 18 before removing any old volume; do not use `down --volumes` on a database you want to preserve.

## Maintenance and validation

GitHub Actions runs on pushes to `main`, pull requests and manual **Run workflow** requests. It checks line endings, lint, types, Prisma schema validation, a production build and a high-severity dependency audit.

The container job exercises a Windows-style Git checkout, builds the app image, starts a disposable app/database stack, verifies both database-backed language pages, changes a database row and confirms the rendered page changes, then stops PostgreSQL and checks that both the page and health endpoint report failure before testing recovery. A cleanup step runs even after a test failure to remove the CI stack's containers, volumes, network and locally built app image, then checks that no project containers, volumes or networks remain. These are GitHub runner resources, not your hosted containers or data.

`.gitattributes` enforces LF for text files, with explicit rules for shell scripts and other Linux container inputs; `.editorconfig` asks editors to preserve LF too. A regression test simulates `core.autocrlf=true` and checks that container inputs remain LF. The startup commands currently live inline in Compose, so there is no shell entrypoint file to fail with a stray `\r`.

The `.github/workflows export-ignore` attribute excludes workflows from Git source archives, not from the repository. Workflows remain tracked so GitHub Actions can run them; they are not added to `.gitignore`. After pulling these rules into an existing Windows checkout, rebuild the devcontainer; if old tracked files still have CRLF, refresh only those files from Git after saving any local edits.

Dependabot checks npm packages, Docker images, Compose images and GitHub Actions weekly. Next/ESLint config, React/types, Prisma and Tailwind packages are grouped to keep related upgrades together; compatibility still needs review. TypeScript and ESLint major upgrades are held until their lint-plugin peers support them; remove those holds in `.github/dependabot.yml` when upgrading.

## Layout

```text
moneyworks/
├── web/                       # Localized hello-world Next.js app and Prisma schema
├── .devcontainer/             # VS Code development-container configuration
├── .github/                   # CI, dependency updates and architecture notes
├── Dockerfile.dev             # Node/npm development image
├── docker-compose.dev.yml     # App and PostgreSQL services
└── .env.example               # Local-development configuration template
```

The [architecture notes](.github/copilot-instruction.md) include future plans, not evidence of implemented features. This repository is MIT licensed.
