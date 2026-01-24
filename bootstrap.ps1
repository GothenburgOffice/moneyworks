# Clean up conflicting files
Write-Host "Cleaning up conflicting files..."
Get-Item .env, .env.example, Dockerfile.dev, README.md, bootstrap.bat, bootstrap.sh, docker-compose.dev.yml -ErrorAction SilentlyContinue | Remove-Item -Force

Write-Host ""
Write-Host "Pulling Node 20 Alpine and generating Next.js project..."
Write-Host "This may take a few minutes..."
Write-Host ""

# Run Docker to generate Next.js
docker run --rm -v ${pwd}:/app -w /app node:20-alpine sh -c "npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias --yes && npm install prisma @prisma/client apollo-server @as-integrations/next graphql"

Write-Host ""
Write-Host "Next.js generated! Now pull the Docker files from GitHub:"
Write-Host "git pull origin main"
