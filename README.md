# MoneyWorks

A self-hosted, country-neutral personal-finance tool hub in English
(**MoneyWorks**) and Swedish (**Pengar jobbar**).

- **Working:** a pension-aware FIRE calculator (portfolio needed or earliest
  retirement age, planned drawdown or capital preservation, manual pension
  streams), with a narrated walkthrough video.
- **Foundation:** email/password accounts with verification and recovery,
  optional Google sign-in, a data download and self-service account deletion,
  and user management (lock, 30-day trash) for admins.
- **Planned:** Learn articles edited at `/admin` (decided in #10), a crypto-tax
  tool, production hosting and more.

Work is tracked in [GitHub issues](https://github.com/GothenburgOffice/moneyworks/issues).
Issues labelled [`decision`](https://github.com/GothenburgOffice/moneyworks/issues?q=label%3Adecision)
are the decision log: open ones need answering before dependent work starts,
closed ones record what was decided.

Pages are server-rendered HTML (the hub and tool pages are pre-rendered and
never read the database) and their content is readable without JavaScript; a small script adds theme switching, and tools such as the FIRE
calculator run as React client components that need JavaScript.
Financial inputs never leave the browser.

## Documentation

| File                                                               | Contents                                                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| [DESIGN.md](DESIGN.md)                                             | Visual system (direction C, "Bright works")                                               |
| [FIRE.md](FIRE.md)                                                 | FIRE model semantics, assumptions and how to add a tool                                   |
| [AUTH.md](AUTH.md)                                                 | Accounts, privacy, operator configuration and security boundaries                         |
| [SECURITY.md](SECURITY.md)                                         | Supported versions and how to report a vulnerability privately                            |
| [.github/copilot-instructions.md](.github/copilot-instructions.md) | Engineering rules for contributors and coding agents (imported by [CLAUDE.md](CLAUDE.md)) |

## Stack

Next.js 16 (App Router), React 19, TypeScript 6, Tailwind CSS 4, next-intl,
Prisma 7, PostgreSQL 18, Better Auth. Runs on Node.js 22.13 or newer; the dev
container, release image and CI all use Node 22. Exact versions are pinned
in [web/package.json](web/package.json), the [Dockerfile](Dockerfile) and
[compose.yaml](compose.yaml).

## Getting started

The host needs only Docker with the Compose plugin; Node.js, npm and
PostgreSQL run in containers. Every stack needs a `.env`; only
`POSTGRES_PASSWORD` must be set in it (see [Configuration](#configuration)).

```bash
git clone https://github.com/GothenburgOffice/moneyworks.git
cd moneyworks
cp .env.example .env    # PowerShell: Copy-Item .env.example .env
```

### Option A: VS Code devcontainer (recommended)

1. Open `moneyworks.code-workspace` and install the recommended extensions
   (Dev Containers in particular).
2. Run **Dev Containers: Reopen in Container**. It starts PostgreSQL, applies
   migrations, installs dependencies when the lockfile changed and starts the
   dev server, plus the Claude Code, ESLint, Prettier, GitHub Actions and
   Prisma extensions.
3. Open <http://localhost:3410/en>.

The devcontainer builds the Dockerfile's `devcontainer` stage: the development
image plus `git`, the GitHub CLI (`gh`), `curl`, `jq`, `ripgrep` (`rg`), `less`,
`ps`, `ssh`, `psql` and Playwright's headless Chromium for `npm run test:e2e`.
psql 18 (matching the database) comes from the
PostgreSQL apt repository and `gh` from GitHub's, both checked against their
published signing-key fingerprints and pinned with the `POSTGRESQL_CLIENT_VERSION`
and `GH_VERSION` build arguments. The plain development stack and the release
image do not include these tools. Run `gh auth login` once inside the container;
like Claude Code's sign-in, it is kept in a Docker volume. Claude Code's project
memory lives in `~/.claude-memory/moneyworks` on the host (override with
`CLAUDE_MEMORY_DIR`), so all of these survive rebuilds. After pulling changes to
Docker or devcontainer files, run **Dev Containers: Rebuild Container**.

File changes do not raise events inside the container when the checkout is on a
Windows drive, so the dev server (`next dev --webpack`) polls for them by default.
Turbopack ignores polling, which is why development uses webpack. For faster
reloads on Windows, clone the repository inside WSL2 (for example
`~/src/moneyworks` in Ubuntu), open that folder in VS Code through WSL, reopen it
in the container and set `WATCHPACK_POLLING=false` in `.env`. Then `~` is the WSL2
home, so Claude Code's memory folder is `~/.claude-memory/moneyworks` there unless
`CLAUDE_MEMORY_DIR` points elsewhere.

#### Sharing Claude Code memory with the host (optional, Windows)

The container always uses the folder above. Claude Code running directly on
Windows keeps its own memory under
`%USERPROFILE%\.claude\projects\<slug>\memory`, where `<slug>` is the repository
path with every non-alphanumeric character replaced by `-` (check the real
folder name; the drive letter's case can differ). To make both use one memory,
replace that folder with a junction once, in PowerShell:

```powershell
$memory = Join-Path $env:USERPROFILE '.claude-memory\moneyworks'   # or $env:CLAUDE_MEMORY_DIR
$old = Join-Path $env:USERPROFILE '.claude\projects\<slug>\memory'
New-Item -ItemType Directory -Force $memory | Out-Null
if (Test-Path $old) { Copy-Item "$old\*" $memory -Recurse; Rename-Item $old 'memory.bak' }
New-Item -ItemType Junction -Path $old -Target $memory
```

Check that the junction lists your files, then delete `memory.bak`. To remove or
retarget the junction, use `cmd /c rmdir "<path>"`: in Windows PowerShell 5.1,
`Remove-Item -Recurse` on a junction can delete the files it points to. Do not
set `autoMemoryDirectory` in `.claude/settings.local.json` instead, because that
file is mounted into the container too.

### Option B: plain Compose

```bash
docker compose -f compose.yaml -f compose.dev.yaml up --build
```

Then open <http://localhost:3410/en> or <http://localhost:3410/sv>. The port
binds to localhost only and is deliberately uncommon so the stack runs beside
other projects. PostgreSQL has no host port: containers reach it at `db:5432`,
and `docker compose exec db psql -U moneyworks` opens a SQL prompt.

`compose.yaml` alone builds and runs the production image from source;
`compose.dev.yaml` only switches the app to the development build target and
mounts the source.

## Commands

Run inside the devcontainer from `/workspace/web`, or from the host with
`docker compose -f compose.yaml -f compose.dev.yaml exec app <command>`.

| Command                                         | Purpose                                             |
| ----------------------------------------------- | --------------------------------------------------- |
| `npm run format` / `npm run format:check`       | Format with Prettier / check formatting (CI)        |
| `npm run lint` / `npm run typecheck`            | ESLint and TypeScript                               |
| `npm run test:fire`                             | FIRE model tests (also rebuilds the browser script) |
| `npm run test:ui` / `npm run test:architecture` | Enhancement scripts and import boundaries           |
| `npm run test:auth-config`                      | Auth configuration and cookie attributes            |
| `npm run test:smoke`                            | Live pages and health check (app must be running)   |
| `npm run test:e2e`                              | Playwright browser tests (app must be running)      |
| `npm run test:e2e:accounts`                     | Account pages in Chromium (disposable DB, AUTH.md)  |
| `npm run build`                                 | Production build                                    |
| `npm run db:migrate -- --name <name>`           | Create a migration after a schema change            |
| `npm run db:setup`                              | Generate the Prisma client and apply migrations     |
| `npm install --save-exact <pkg>`                | Add a dependency; commit both package files         |

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs all checks, the
account lifecycle against a disposable database and a full container stack
test on every pull request. A `@claude` mention in an issue runs
[.github/workflows/claude.yml](.github/workflows/claude.yml), which reviews the
issue against the code and answers in a comment: already done, or a plan.
Writers only, and read-only: it can't push or open pull requests.

## Configuration

Copy `.env.example` to the gitignored root `.env` before starting any stack.

- `POSTGRES_PASSWORD` is the only required value. Use a long, random URL-safe
  password (letters, digits, `-` and `_`): Compose also puts it in the
  database URL. The database user and name are both `moneyworks`.
- PostgreSQL reads the password only when it first creates the volume. To
  change it later, change it in PostgreSQL too, then recreate the app container.
- `APP_PORT` (default 3410) sets the app's host port and `APP_ORIGIN` its
  public URL. `APP_ORIGIN_ALIASES` optionally lists extra exact origins (for
  example another domain); development accepts `http://127.0.0.1:<APP_PORT>` by
  default. The dev server allows its scripts and hot reload on these origins'
  hosts (Next.js `allowedDevOrigins`); other hosts get a 403 for dev resources.
- `LOCALE_ORIGINS` optionally names each language's home domain, for example
  `en=https://moneyworks.example,sv=https://pengarjobbar.example`. Every domain
  still serves every language; the hub and tool pages then send `canonical` and
  `hreflang` Link headers pointing at each language's own domain, and each
  domain's `/sitemap.xml` (named in `/robots.txt`) lists its languages' pages.
  Language links still stay on the current domain. It is read at
  request time, so the published image needs no rebuild. Blank or invalid sends
  no such links.
- Everything else is optional and off by default. Account and mail settings
  are described in [AUTH.md](AUTH.md). Mail, the privacy controller, Google sign-in and public
  registration are not in `.env`: an admin sets them at `/admin` (first sign in
  on the account page with `ADMIN_EMAIL` and `ADMIN_PASSWORD`; sign-in works before
  mail does), and they are stored in the database.
  Registration stays off until mail and real privacy details are saved there;
  the devcontainer always allows it and fills in clearly fake privacy details.
- Development ignores the production `APP_ORIGIN`, `APP_ORIGIN_ALIASES`,
  `LOCALE_ORIGINS`, `AUTH_SECRET` and `SETTINGS_ENCRYPTION_KEY` in `.env`. It reads `DEV_`-prefixed
  versions instead (listed at the end of `.env.example`). Mail settings live in
  the database the stack opens. Every stack with the same project name shares
  that database (see below), so on a machine that also runs a production stack,
  give one of them its own `COMPOSE_PROJECT_NAME` or dev uses its mail settings.
- Never prefix secrets with `NEXT_PUBLIC_` or commit `.env`.

Database data lives in the `postgres18_data` volume. `docker compose down` keeps
it; do not use `down --volumes` on data you want to keep.

All three Compose files use the project name `moneyworks`, so they share that
volume. On a server, switching between `compose.yaml` (built from source) and
`compose.images.yaml` (published image) keeps your data. On a development
machine, the release stack therefore opens the development database; set
`COMPOSE_PROJECT_NAME` (for example `moneyworks-release`) to give it its own.

## Release image

The [Dockerfile](Dockerfile)'s `production` target builds the release image:
the Next.js standalone server running as a non-root user, plus the tooling to
apply migrations. CI tests it and publishes it from `main` as
`ghcr.io/gothenburgoffice/moneyworks` (`latest` and `sha-<commit>`).

[compose.images.yaml](compose.images.yaml) runs that image with PostgreSQL and
no source build. It applies migrations before the app starts; public signup
stays off until an admin switches it on at `/admin`:

```bash
docker compose -f compose.images.yaml up --detach --wait
```

To try a local build, run
`docker build --file Dockerfile --target production --tag moneyworks:local web`
and set `MONEYWORKS_IMAGE=moneyworks:local`. Expired auth records are removed
with `docker compose -f compose.images.yaml run --rm app node scripts/cleanup-auth.mjs --apply`.
A real deployment still needs HTTPS, backups and scheduling, tracked in
[#11](https://github.com/GothenburgOffice/moneyworks/issues/11).

## Repository layout

```text
moneyworks/
├── web/                       # Next.js app, Prisma schema, tests
├── .devcontainer/             # VS Code devcontainer on top of the dev Compose stack
├── .github/                   # CI, Dependabot, contributor/agent instructions
├── Dockerfile                 # development, devcontainer, migration and production targets
├── compose.yaml               # PostgreSQL, migrations and the app built from source
├── compose.dev.yaml           # Development override: dev target and source mounts
├── compose.images.yaml        # Published release image with PostgreSQL
├── moneyworks.code-workspace  # VS Code workspace and extension recommendations
└── .env.example               # Template for the required .env
```

`notes/` and `CLAUDE.local.md` are gitignored for private working notes.

## Contributing

Outside pull requests are only reviewed for `help wanted` issues, or issues
where a maintainer approved the plan in a comment first. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
