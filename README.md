# MoneyWorks

A self-hosted, country-neutral personal-finance tool hub in English
(**MoneyWorks**) and Swedish (**Pengar jobbar**).

- **Working:** a pension-aware FIRE calculator (portfolio needed or earliest
  retirement age, planned drawdown or capital preservation, manual pension
  streams), with a narrated walkthrough video.
- **Foundation:** email/password accounts with verification and recovery, and
  an intentionally empty private area.
- **Planned:** a crypto-tax tool, production hosting and more.

Work is tracked in [GitHub issues](https://github.com/GothenburgOffice/moneyworks/issues).
Issues labelled [`decision`](https://github.com/GothenburgOffice/moneyworks/issues?q=label%3Adecision)
are the decision log: open ones need answering before dependent work starts,
closed ones record what was decided.

Pages are pre-rendered by Next.js and readable without JavaScript; small
scripts add theme switching, the database status and FIRE calculations.
Financial inputs never leave the browser.

## Documentation

| File | Contents |
| --- | --- |
| [DESIGN.md](DESIGN.md) | Visual system (direction C, "Bright works") |
| [FIRE.md](FIRE.md) | FIRE model semantics, assumptions and how to add a tool |
| [AUTH.md](AUTH.md) | Accounts, privacy, operator configuration and security boundaries |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Engineering rules for contributors and coding agents (imported by [CLAUDE.md](CLAUDE.md)) |

## Stack

Next.js 16 (App Router), React 19, TypeScript 6, Tailwind CSS 4, next-intl,
Prisma 7, PostgreSQL 18, Better Auth. Runs on Node.js 22.12 or newer; the dev
container uses Node 22 and CI also tests the current LTS. Exact versions are pinned
in [web/package.json](web/package.json), [Dockerfile.dev](Dockerfile.dev) and
[docker-compose.dev.yml](docker-compose.dev.yml).

## Getting started

The host needs only Docker with the Compose plugin; Node.js, npm and
PostgreSQL run in containers.

```bash
git clone https://github.com/GothenburgOffice/moneyworks.git
cd moneyworks
```

No `.env` is needed for local runs; see [Configuration](#configuration).

### Option A: VS Code devcontainer (recommended)

1. Open `moneyworks.code-workspace` and install the recommended extensions
   (Dev Containers in particular).
2. Run **Dev Containers: Reopen in Container**. It installs dependencies and
   applies migrations, plus the Claude Code, ESLint and Prisma extensions.
3. Start the app in the container terminal:

   ```bash
   cd /workspace/web
   npm run dev -- --hostname 0.0.0.0
   ```

Claude Code's sign-in is kept in a Docker volume, so it survives rebuilds.
After pulling changes to Docker or devcontainer files, run **Dev Containers:
Rebuild Container**.

### Option B: plain Compose

```bash
docker compose -f docker-compose.dev.yml up --build
```

Then open <http://localhost:3410/en> or <http://localhost:3410/sv>. The port
binds to localhost only and is deliberately uncommon so the stack runs beside
other projects. PostgreSQL has no host port: containers reach it at `db:5432`,
and `docker compose -f docker-compose.dev.yml exec db psql -U postgres -d moneyworks`
opens a SQL prompt.

## Commands

Run inside the devcontainer from `/workspace/web`, or from the host with
`docker compose -f docker-compose.dev.yml exec web <command>`.

| Command | Purpose |
| --- | --- |
| `npm run format` / `npm run format:check` | Format with Prettier / check formatting (CI) |
| `npm run lint` / `npm run typecheck` | ESLint and TypeScript |
| `npm run test:fire` | FIRE model tests (also rebuilds the browser script) |
| `npm run test:ui` / `npm run test:architecture` | Enhancement scripts and import boundaries |
| `npm run test:auth-config` | Auth configuration and cookie attributes |
| `npm run test:smoke` | Live pages and health check (app must be running) |
| `npm run build` | Production build |
| `npm run db:migrate -- --name <name>` | Create a migration after a schema change |
| `npm run db:setup` | Generate the Prisma client and apply migrations |
| `npm install --save-exact <pkg>` | Add a dependency; commit both package files |

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all checks, the
account lifecycle against a disposable database and a full container stack
test on every pull request.

## Configuration

`docker-compose.dev.yml` has development defaults, so local runs need no
`.env`. To override something (ports, database password, account settings),
copy `.env.example` to the gitignored root `.env` and uncomment only what you
change.

- `MONEYWORKS_WEB_PORT` (default 3410) sets the app's host port.
  `AUTH_BASE_URL` follows it unless set.
- `DATABASE_URL` is built from `POSTGRES_USER`, `POSTGRES_PASSWORD` and
  `POSTGRES_DB`. Set it yourself only if the password needs URL-encoding.
- PostgreSQL reads these values only when it first creates the volume. To change
  the password later, change it in PostgreSQL too, then recreate the web
  container.
- Account and mail settings are described in [AUTH.md](AUTH.md). Registration
  stays disabled until mail and privacy contact details are configured.
- Never prefix secrets with `NEXT_PUBLIC_` or commit `.env`.

Database data lives in the `postgres18_data` volume. `docker compose down` keeps
it; do not use `down --volumes` on data you want to keep.

## Release image

The root [Dockerfile](Dockerfile) builds a production image: the Next.js
standalone server running as a non-root user, plus the tooling to apply
migrations. CI tests it and publishes it from `main` as
`ghcr.io/gothenburgoffice/moneyworks` (`latest` and `sha-<commit>`).

[docker-compose.images.yml](docker-compose.images.yml) runs that image with
PostgreSQL and no source checkout. It needs `POSTGRES_PASSWORD` in `.env`,
applies migrations before the app starts, and keeps public signup off unless
`AUTH_PUBLIC_SIGNUP=true`:

```bash
docker compose -f docker-compose.images.yml up --detach --wait
```

To try a local build, run `docker build --file Dockerfile --tag moneyworks:local web`
and set `MONEYWORKS_IMAGE=moneyworks:local`. Expired auth records are removed
with `docker compose -f docker-compose.images.yml run --rm web node scripts/cleanup-auth.mjs --apply`.
A real deployment still needs HTTPS, backups and scheduling, tracked in
[#11](https://github.com/GothenburgOffice/moneyworks/issues/11).

## Repository layout

```text
moneyworks/
├── web/                       # Next.js app, Prisma schema, tests
├── .devcontainer/             # VS Code devcontainer on top of the dev Compose stack
├── .github/                   # CI, Dependabot, contributor/agent instructions
├── Dockerfile                 # Release image
├── Dockerfile.dev             # Debian-based Node development image
├── docker-compose.dev.yml     # web and PostgreSQL services
├── docker-compose.images.yml  # Release image with PostgreSQL
├── moneyworks.code-workspace  # VS Code workspace and extension recommendations
└── .env.example               # Local configuration template
```

`notes/` and `CLAUDE.local.md` are gitignored for private working notes.

## Contributing

Outside pull requests are only reviewed for `help wanted` issues, or issues
where a maintainer approved the plan in a comment first. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
