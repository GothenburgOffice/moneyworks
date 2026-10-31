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
cp .env.example .env    # first time only; PowerShell: Copy-Item .env.example .env
```

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

Then open <http://localhost:3000/en> or <http://localhost:3000/sv>. Both ports
bind to localhost only. PostgreSQL is reachable from host tools at
`localhost:5433`, and from containers at `db:5432`.

## Commands

Run inside the devcontainer from `/workspace/web`, or from the host with
`docker compose -f docker-compose.dev.yml exec web <command>`.

| Command | Purpose |
| --- | --- |
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

Maintain the gitignored root `.env` by hand, starting from `.env.example`. The
example values are development defaults only.

- Keep `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` and `DATABASE_URL`
  consistent. URL-encode special characters in the password inside
  `DATABASE_URL` only.
- PostgreSQL reads these values only when it first creates the volume. To change
  the password later, change it in PostgreSQL too, then recreate the web
  container.
- Account and mail settings are described in [AUTH.md](AUTH.md). Registration
  stays disabled until mail and privacy contact details are configured.
- Never prefix secrets with `NEXT_PUBLIC_` or commit `.env`.

Database data lives in the `postgres18_data` volume. `docker compose down` keeps
it; do not use `down --volumes` on data you want to keep.

## Repository layout

```text
moneyworks/
├── web/                       # Next.js app, Prisma schema, tests
├── .devcontainer/             # VS Code devcontainer on top of the dev Compose stack
├── .github/                   # CI, Dependabot, contributor/agent instructions
├── Dockerfile.dev             # Debian-based Node development image
├── docker-compose.dev.yml     # web and PostgreSQL services
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
