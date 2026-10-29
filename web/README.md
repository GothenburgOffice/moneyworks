# Moneyworks web

The page contains only a localized hello-world heading and a live PostgreSQL connection status. English is always the default; Swedish is available at `/sv`. Development runs inside the Docker/VS Code environment documented in the [repository README](../README.md), not through a host-installed Node.js toolchain.

In the devcontainer, open a terminal in `/workspace/web` and run:

```bash
npm run dev -- --hostname 0.0.0.0
```

Useful checks are `npm run lint`, `npm run typecheck`, `npm run db:validate` and `npm run build`. `npm run db:setup` generates the Prisma client and applies committed migrations; the only model is the `Greeting` connection test, not a financial-data model.

With the app and database running, `npm run test:smoke` checks both languages, minimal page content, default routing and database health. Set `TEST_BASE_URL` to test a server other than `http://127.0.0.1:3000`.
