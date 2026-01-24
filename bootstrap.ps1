# Clean up ONLY the bootstrap scripts (not Docker files which we need)
Write-Host "Cleaning up bootstrap scripts..."
Get-Item bootstrap.bat, bootstrap.sh -ErrorAction SilentlyContinue | Remove-Item -Force

Write-Host ""
Write-Host "Pulling Node 20 Alpine and generating Next.js project..."
Write-Host "This may take a few minutes..."
Write-Host ""

# Run Docker to generate Next.js
docker run --rm -v ${pwd}:/app -w /app node:20-alpine sh -c "npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias --yes && npm install prisma @prisma/client apollo-server @as-integrations/next graphql"

Write-Host ""
Write-Host "✅ Next.js generated successfully!"
Write-Host ""
Write-Host "Next step: Start the Docker dev environment:"
Write-Host "  docker compose -f docker-compose.dev.yml up --build"
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser"
