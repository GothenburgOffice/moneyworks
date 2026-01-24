#!/bin/sh
docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c "npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias --yes && npm install prisma @prisma/client apollo-server @as-integrations/next graphql"
