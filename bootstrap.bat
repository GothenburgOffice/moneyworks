@echo off
echo Cleaning up conflicting files...
del /q .env .env.example Dockerfile.dev README.md bootstrap.sh docker-compose.dev.yml 2>nul

echo.
echo Pulling Node 20 Alpine and generating Next.js project...
echo This may take a few minutes...
echo.

docker run --rm -v %cd%:/app -w /app node:20-alpine sh -c "npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias --yes && npm install prisma @prisma/client apollo-server @as-integrations/next graphql"

echo.
echo Next.js generated! Now pull the Docker files from GitHub:
echo git pull origin main
