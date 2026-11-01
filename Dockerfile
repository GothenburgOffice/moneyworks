# syntax=docker/dockerfile:1
# Release image. Build from the repository root with web/ as the context:
#   docker build --file Dockerfile --tag moneyworks web
FROM node:22.23.4-trixie-slim AS dependencies
WORKDIR /app
RUN npm install --global npm@12.2.1
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
COPY . .
# Generating the Prisma client reads the config, which requires a URL; the
# build never connects to it.
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=postgresql://build:unused@localhost:5432/build
RUN npm run build

# Only the Prisma CLI and its locked dependencies, for one-shot migrations.
FROM dependencies AS migration-tools
RUN npm query "#prisma, #prisma *" > /tmp/prisma-cli.json \
    && node -e 'const fs = require("node:fs"); for (const { location } of JSON.parse(fs.readFileSync("/tmp/prisma-cli.json"))) fs.cpSync(location, `/migrate/${location}`, { recursive: true });'

FROM node:22.23.4-trixie-slim AS production
# Prisma's migration engine links against OpenSSL.
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
