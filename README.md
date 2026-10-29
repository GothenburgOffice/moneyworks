# Moneyworks

An early-stage personal-finance web application. Currently this is an English/Swedish hello-world page plus a Docker-first development environment; calculators, authentication, accounts and community features are not implemented.

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

## Quick start

The host needs Docker with the Compose plugin, not a host installation of Node.js, npm or PostgreSQL.

```bash
git clone https://github.com/hkarn/moneyworks.git
cd moneyworks
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

In PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Open [the English page](http://localhost:3000/en) or [the Swedish page](http://localhost:3000/sv); both exposed ports bind to localhost only.

The web service waits for PostgreSQL to become healthy, installs the locked dependencies and starts the development server. Source files are mounted at `/workspace`, while `node_modules` and `.next` stay in Docker volumes instead of the host filesystem.

## VS Code devcontainer

Copy `.env.example` to `.env`, then choose **Dev Containers: Reopen in Container**. The devcontainer uses the same services and volume paths as normal Compose, installs dependencies in `/workspace/web`, and leaves starting the web server to your terminal.

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

Prisma is configured for PostgreSQL, but the schema deliberately contains no application models yet. After adding models, run `npm run db:generate` and `npm run db:migrate` inside the container; Prisma 7 keeps the connection URL in `web/prisma.config.ts`, not in the schema.

For a host-side database client, connect to `localhost:5433` using the development credentials in `.env`. Containers connect to `db:5432`; never commit real credentials.

## Existing PostgreSQL 16 volumes

PostgreSQL major versions cannot reuse an older data directory directly. The new service uses a fresh `postgres18_data` volume mounted at `/var/lib/postgresql`, as required by the PostgreSQL 18 Docker image; any old `postgres_data` volume is left untouched.

Since this repository is still a hello-world scaffold, no application-data migration is included. If you have local data to keep, export it with PostgreSQL 16 tools and restore it into PostgreSQL 18 before removing any old volume; do not use `down --volumes` on a database you want to preserve.

## Maintenance and validation

GitHub Actions runs lint, type checking, Prisma schema validation, a production build and a high-severity dependency audit. A separate job builds the development image, starts both services, checks both locale pages and executes a database query through Prisma.

Dependabot checks npm packages, Docker images, Compose images and GitHub Actions weekly. Next/ESLint config, React/types, Prisma and Tailwind packages are grouped to keep related upgrades together; compatibility still needs review.

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
