# Moneyworks web

The application is currently an English/Swedish hello-world page that reads its greeting from PostgreSQL on every request. Development runs inside the Docker/VS Code environment documented in the [repository README](../README.md), not through a host-installed Node.js toolchain.

In the devcontainer, open a terminal in `/workspace/web` and run:

```bash
npm run dev -- --hostname 0.0.0.0
```

Useful checks are `npm run lint`, `npm run typecheck`, `npm run db:validate` and `npm run build`. `npm run db:setup` generates the Prisma client and applies committed migrations; the only model is the `Greeting` connection test, not a financial-data model.
