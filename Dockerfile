# syntax=docker/dockerfile:1
# One Dockerfile for every stack; web/ is the build context:
#   docker build --file Dockerfile --target production --tag moneyworks web
# Node 22 is the oldest supported line, so newer-only APIs fail in development.
FROM node:22.23.4-trixie-slim AS base
# Prisma's migration engine links against OpenSSL.
RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global npm@12.2.1

FROM base AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# compose.dev.yaml mounts the repository at /workspace and works in web/.
FROM dependencies AS development
RUN apt-get update \
    && apt-get install --yes --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace/web
RUN mv /app/node_modules ./
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Tools for working inside the VS Code dev container. They build on `base`, not on
# `dependencies`, so neither lockfile nor source changes reinstall them; `devcontainer`
# then adds node_modules and the source like `development` does. psql 18 (matching the
# database) and gh come from the PostgreSQL project's and GitHub's signed apt
# repositories, since Debian's are behind. Each downloaded key must hold only the
# fingerprints those projects publish (postgresql.org/download/linux/debian and
# cli.github.com docs/install_linux.md). Dependabot cannot bump apt packages: look up
# new versions with `apt-cache madison gh postgresql-client-18` in this stage, or at
# github.com/cli/cli/releases. A pinned version that leaves the repository fails the
# build. /workspace is a bind mount, so git would otherwise refuse it as owned by
# another user.
FROM base AS devcontainer-tools
ARG GH_VERSION=2.103.3
ARG POSTGRESQL_CLIENT_VERSION=18.6-1.pgdg13+2
ARG POSTGRESQL_FINGERPRINT=B97B0AFCAA1A47F044F244A07FCC7D46ACCC4CF8
ARG GH_FINGERPRINTS="2C6106201985B60E6C7AC87323F3D4EA75716059 7F38BBB59D064DBCB3D84D725612B36462313325"
RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl gnupg \
    && install -d /etc/apt/keyrings \
    && export GNUPGHOME="$(mktemp -d)" \
    && check_keys() { \
        keys="$(gpg --show-keys --with-colons "$1" \
            | awk -F: '$1 == "pub" { p = 1; next } p && $1 == "fpr" { print $10; p = 0 }')"; \
        test -n "$keys" || { echo "No keys in $1" >&2; return 1; }; \
        for key in $keys; do \
            case " $2 " in *" $key "*) ;; *) echo "Unexpected key $key in $1" >&2; return 1 ;; esac; \
        done; \
    } \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        -o /etc/apt/keyrings/postgresql.asc \
    && check_keys /etc/apt/keyrings/postgresql.asc "$POSTGRESQL_FINGERPRINT" \
    && echo "deb [signed-by=/etc/apt/keyrings/postgresql.asc] https://apt.postgresql.org/pub/repos/apt trixie-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
        -o /etc/apt/keyrings/githubcli.gpg \
    && check_keys /etc/apt/keyrings/githubcli.gpg "$GH_FINGERPRINTS" \
    && echo "deb [signed-by=/etc/apt/keyrings/githubcli.gpg] https://cli.github.com/packages stable main" \
        > /etc/apt/sources.list.d/github-cli.list \
    && rm -rf "$GNUPGHOME" \
    && apt-get purge --yes --auto-remove gnupg \
    && apt-get update \
    && apt-get install --yes --no-install-recommends \
        "gh=$GH_VERSION" git jq less openssh-client \
        "postgresql-client-18=$POSTGRESQL_CLIENT_VERSION" procps ripgrep \
    && rm -rf /var/lib/apt/lists/* \
    && git config --system --add safe.directory /workspace
# Headless Chromium and its system libraries for `npm run test:e2e`, in a shared path
# outside the node_modules volume. PLAYWRIGHT_VERSION must equal @playwright/test in
# package.json (tests/workspace.test.mjs checks it); bump both together.
ARG PLAYWRIGHT_VERSION=1.64.1
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx --yes "playwright@$PLAYWRIGHT_VERSION" install --with-deps --only-shell chromium \
    && rm -rf /var/lib/apt/lists/* /root/.npm

# The dev container only (.devcontainer/compose.yaml): development plus the tools above.
FROM devcontainer-tools AS devcontainer
WORKDIR /workspace/web
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["npm", "run", "dev"]

# One-shot `prisma migrate deploy` for compose.yaml and compose.dev.yaml.
FROM dependencies AS migration
COPY prisma ./prisma
COPY prisma.config.ts ./
ENV CHECKPOINT_DISABLE=1
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

FROM dependencies AS builder
COPY . .
# Generating the Prisma client reads the config, which requires a URL; the
# build never connects to it.
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgresql://build:unused@localhost:5432/build
RUN npm run build

# Only the Prisma CLI and its locked dependencies, for the release image.
FROM dependencies AS migration-tools
RUN npm query "#prisma, #prisma *" > /tmp/prisma-cli.json \
    && node -e 'const fs = require("node:fs"); for (const { location } of JSON.parse(fs.readFileSync("/tmp/prisma-cli.json"))) fs.cpSync(location, `/migrate/${location}`, { recursive: true });'

FROM node:22.23.4-trixie-slim AS production
RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 CHECKPOINT_DISABLE=1 \
    HOSTNAME=0.0.0.0 PORT=3000
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# The same image runs migrations and auth cleanup as one-shot commands:
#   node migrate/node_modules/prisma/build/index.js migrate deploy --config migrate/prisma.config.ts
#   node scripts/cleanup-auth.mjs [--apply]
COPY --from=migration-tools /migrate/node_modules ./migrate/node_modules
COPY --from=builder /app/prisma ./migrate/prisma
COPY --from=builder /app/prisma.config.ts ./migrate/prisma.config.ts
COPY --from=builder /app/scripts/cleanup-auth.mjs ./scripts/cleanup-auth.mjs
LABEL org.opencontainers.image.source="https://github.com/GothenburgOffice/moneyworks" \
      org.opencontainers.image.title="MoneyWorks" \
      org.opencontainers.image.description="Self-hosted personal-finance tool hub" \
      org.opencontainers.image.licenses="MIT"
USER node
EXPOSE 3000
CMD ["node", "server.js"]
