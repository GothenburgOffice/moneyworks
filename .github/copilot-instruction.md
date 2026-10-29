# Moneyworks Copilot Instructions

Moneyworks is an owner-hosted personal-finance project in its initial development stage. It currently implements a database-backed English/Swedish hello-world page, a database health endpoint and Docker/VS Code development infrastructure, not a finished financial application.

## Maintain these instructions

- **Keep guidance current:** Update this file alongside meaningful changes to application behavior, dependencies, containers, credentials, migrations, tests or CI. Update the root README when its user-facing commands or behavior change.
- **Separate fact from plans:** Describe existing files and implemented behavior accurately. Future ideas below are not completed functionality or authority to build a feature without a request.
- **Use executable sources:** Treat `web/package.json`, `web/package-lock.json`, Docker/Compose configuration, Prisma schema/migrations and `.github/workflows/ci.yml` as the authorities for current versions and commands. Do not preserve stale prose when those files change.
- **Preserve entry points:** Keep this singularly named file as the detailed reference. `.github/copilot-instructions.md` is the standard Copilot discovery entry point and directs agents here; avoid maintaining two divergent full copies.
- **Keep changes scoped:** Preserve unrelated work, inspect the current Git diff and report which checks actually ran. Do not claim local checks, CI or deployment succeeded without confirming the corresponding result.

## Project scope and stack

- **Repository:** `hkarn/moneyworks`, MIT licensed.
- **Hosting:** Maintained and hosted by its owner. Do not add deployment wizards, credential generators or general third-party onboarding unless requested.
- **Application:** Next.js App Router, React, strict TypeScript, Tailwind CSS and `next-intl`, with `en` and `sv` locales.
- **Database:** Self-hosted PostgreSQL using Prisma and `@prisma/adapter-pg`. Only the small `Greeting` connection-test model exists.
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
    │   │   ├── [locale]/         # Localized layout and database-backed page
    │   │   ├── api/health/db/     # Read-only database health route
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   └── page.tsx
    │   ├── generated/prisma/     # Generated locally; gitignored
    │   ├── i18n/                 # Routing, navigation and translation loading
    │   ├── lib/db.ts             # Shared lazy Prisma client and greeting query
    │   └── proxy.ts              # Next.js locale routing proxy
    └── tests/                    # LF regression and live-server smoke tests
```

There are no implemented calculator, account, forum, GraphQL or authentication subsystems. Do not describe proposed component folders, production infrastructure or future libraries as already present.

## Runtime behavior

- **Minimal page:** Render only "Hello world!" / "Hej världen!" followed by the translated database connection status. The heading comes from translation messages and remains visible even if the database is down; do not add a timestamp, database-sourced heading or explanatory text.
- **Real database reads:** The localized home page reads the `Greeting` row for its locale on every request to determine the connection status. Keep the page dynamic and uncached, and show an unavailable status if the database, table or row cannot be read.
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
- **No speculative production setup:** Only development Docker configuration is implemented. Production images, reverse proxies, TLS, backups and future authentication secrets must be designed when requested, not described as deployed or required today.

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
- **Container job:** Exercises `core.autocrlf=true`, builds the app and starts disposable app/PostgreSQL containers. `npm run test:smoke` verifies both minimal language pages, English-by-default routing and database health. CI also tests a direct query, a changed database row through the health endpoint, visible failure in both languages and recovery.
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
- **Styling:** Follow the current Tailwind-based presentation and responsive behavior. Optional UI/state libraries are not installed requirements.
- **Changes:** Extend the existing localized structure and shared database helper rather than introducing duplicate infrastructure without a concrete need.

## Future direction, not implemented

Retain these as development ideas, not a binding implementation sequence or assumed approved architecture:

- **Calculators:** FIRE projections from spending, withdrawal rate and savings; compound-interest tools; tax helpers such as average purchase-price calculations.
- **Persistence:** A future user/scenario data model, saved calculations and account-specific views.
- **Authentication:** Registration/login, with Auth.js previously suggested but not implemented.
- **Community:** Blog/forum posts, comments, likes and moderation.
- **Optional technology:** Context or Zustand, shadcn/ui, GraphQL, additional services/mobile clients and shared types are possible future choices, not dependencies to add preemptively.
- **Hosting work:** A production image, reverse proxy, HTTPS and backups need a separate owner-directed implementation. Prior provider suggestions do not establish a selected provider.

Last updated: 2026-10-29. Maintainer: Håkan Arnoldson (`hkarn`).
