# Moneyworks

Open-source personal finance tools and calculators.

## Tech Stack

Next.js 15, TypeScript, Tailwind CSS, PostgreSQL 16, Prisma ORM - all running in Docker.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/moneyworks.git
cd moneyworks
cp .env.example .env

# Start development
docker compose -f docker-compose.dev.yml up --build
# Open http://localhost:3000
```

## Development

All development happens inside Docker - no local Node.js needed.

```bash
# Install packages
docker compose -f docker-compose.dev.yml exec web npm install <package>

# Database migrations
docker compose -f docker-compose.dev.yml exec web npx prisma migrate dev
```

## Project Structure

```text
moneyworks/
├── web/                      # Next.js app (to be created)
├── Dockerfile.dev
├── docker-compose.dev.yml
└── .github/
    └── copilot-instruction.md  # Architecture & patterns
```

See [.github/copilot-instruction.md](.github/copilot-instruction.md) for detailed architecture, roadmap, and coding standards.

## License

MIT
