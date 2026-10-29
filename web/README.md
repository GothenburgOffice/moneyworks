# Moneyworks web

The application is currently an English/Swedish hello-world page. Development runs inside the Docker/VS Code environment documented in the [repository README](../README.md), not through a host-installed Node.js toolchain.

In the devcontainer, open a terminal in `/workspace/web` and run:

```bash
npm run dev -- --hostname 0.0.0.0
```

Useful checks are `npm run lint`, `npm run typecheck`, `npm run db:validate` and `npm run build`. The empty Prisma schema is infrastructure for future development, not an implemented financial-data model.
