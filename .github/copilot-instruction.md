# Moneyworks - Copilot Instructions

**Project**: Moneyworks - Open-source financial tools site (FIRE and other calculators + forum/blog)  
**Stack**: Next.js 15 (latest) + TypeScript + Tailwind CSS + PostgreSQL 16 + Prisma ORM  
**Deployment**: Docker Compose (dev) + VPS (production)  
**License**: MIT (open-source, attribution required)

---

## Repository Information

- **GitHub**: <https://github.com/hkarn/moneyworks>
- **Owner**: hkarn
- **Name**: moneyworks

---

## Project Architecture

### Directory Structure

```text
moneyworks/
├── web/                          # Next.js application
│   ├── src/
│   │   ├── app/                  # App Router (Next.js 15)
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── page.tsx          # Home page
│   │   │   ├── api/              # API routes (REST/GraphQL)
│   │   │   └── [feature]/        # Feature routes (e.g., calculator, forum)
│   │   ├── components/           # React components
│   │   ├── lib/                  # Utilities, helpers
│   │   └── styles/               # Global CSS
│   ├── public/                   # Static assets
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   ├── package.json              # Latest versions
│   └── tsconfig.json
├── Dockerfile.dev                # Development image (Node 20 Alpine)
├── docker-compose.dev.yml        # Dev environment orchestration
├── .env                          # Dev environment variables (local only)
├── .env.example                  # Template for developers
├── .gitignore                    # Excludes node_modules, .env, build artifacts
├── .dockerignore                 # Excludes unnecessary files from Docker builds
├── LICENSE                       # MIT License
└── README.md                     # Project documentation
```

### Docker Setup (Development)

**Dev Environment**: Two containers via `docker-compose.dev.yml`

- **web**: Next.js on port 3000 (Node 20 Alpine)
- **db**: PostgreSQL 16 on port 5432

**Key Points**:

- Node modules in Docker volumes (not on host)
- Hot reload enabled for Next.js
- Database credentials from `.env` (never committed)
- Postgres persists data in `postgres_data/` volume

**Commands**:

```bash
# Start dev environment (runs both web + db)
docker compose -f docker-compose.dev.yml up --build

# Install new packages inside Docker
docker compose -f docker-compose.dev.yml exec web npm install <package>

# Run Prisma commands inside Docker
docker compose -f docker-compose.dev.yml exec web npx prisma migrate dev
docker compose -f docker-compose.dev.yml exec web npx prisma studio

# Access PostgreSQL from host
psql -h localhost -p 5432 -U postgres -d moneyworks

# Stop containers
docker compose -f docker-compose.dev.yml down
```

---

## Technology Stack & Patterns

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React Context or Zustand (TBD)
- **UI Components**: shadcn/ui (optional, for rapid development)

### Backend

- **API Layer**: Next.js API Routes (Route Handlers in `app/api/`)
- **Database**: PostgreSQL 16 (self-hosted via Docker)
- **ORM**: Prisma (type-safe queries, migrations)
- **Authentication**: Auth.js (future phase)
- **GraphQL**: Optional (@apollo/server, currently installed but not in use)

### Development Workflow

1. Edit files locally in `web/` directory
2. Next.js hot-reload automatically in Docker
3. Test via `http://localhost:3000`
4. Use Prisma Studio for database exploration: `npx prisma studio`
5. Commit to GitHub (MIT-licensed, open-source)

---

## Key Features to Build

### Phase 1: MVP

- [ ] FIRE Calculator page (`/calculators/fire`)
  - Input: annual spending, withdrawal rate, current savings
  - Output: years to retirement, retirement date
  - Store scenarios in database (optional for v1)
- [ ] Database schema (User, FireScenario models)
- [ ] API endpoint: POST `/api/calculators/fire` (accept params, return projection)

### Phase 2: Persistence & Auth

- [ ] User registration/login (Auth.js)
- [ ] Save FIRE scenarios to user account
- [ ] Display saved scenarios
- [ ] Compound interest calculator

### Phase 3: Community

- [ ] Blog/forum for financial discussions
- [ ] Post, comments, like functionality
- [ ] Moderation system
- [ ] Various tax calculators and tools (average pruschase price calculator for tax purposed for instance)

---

## Coding Standards

### TypeScript

- **Strict mode**: `strict: true` in `tsconfig.json`
- Always use type annotations for function parameters and returns
- Use interfaces for component props

### React/Next.js

- **Use Server Components** by default (`app/` directory)
- Client components only when needed (interactions, state, hooks)
- Keep components small and focused
- Use TypeScript for props interfaces

### File Organization

```text
src/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   ├── api/
│   │   ├── calculator/      # Feature API routes
│   │   │   └── route.ts
│   │   └── users/
│   │       └── route.ts
│   └── calculator/
│       └── page.tsx         # Feature page
├── components/
│   ├── Calculator.tsx       # Feature components
│   └── ui/                  # Reusable UI components
├── lib/
│   ├── utils.ts             # Utilities
│   └── api.ts               # API client helpers
├── styles/
│   └── globals.css
└── types/
    └── index.ts             # Shared types
```

### API Routes

- **Location**: `src/app/api/[feature]/route.ts`
- **Pattern**: RESTful endpoints (GET, POST, PUT, DELETE)
- **Error handling**: Consistent HTTP status codes and error messages
- **Validation**: Validate input data before processing

---

## Deployment (Future)

### Production Docker Setup

- VPS provider: Hetzner, DigitalOcean, or Oracle Cloud Always Free
- Production Dockerfile (`Dockerfile.prod`): Multi-stage build
- Nginx reverse proxy (terminate TLS, route to Next.js)
- Database backups: Automated snapshots
- HTTPS: Let's Encrypt via Certbot

### Environment Variables

**Development** (`.env`):

POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=moneyworks
DATABASE_URL=postgresql://postgres:password@db:5432/moneyworks

**Production** (VPS `.env`, never committed):

POSTGRES_USER=`<secure-user>`
POSTGRES_PASSWORD=`<password>`
POSTGRES_DB=moneyworks
DATABASE_URL=postgresql://`<user>:<password>`@localhost:5432/moneyworks
NEXTAUTH_SECRET=`<generated-secret>`
NEXTAUTH_URL=`<https://moneyworks.com>`

---

## Common Tasks

- **New API endpoint**: Create `src/app/api/[feature]/route.ts` with TypeScript types and error handling
- **New page**: Create `src/app/[feature]/page.tsx` as Server Component, use Client Components for interactivity
- **Database changes**: Update `prisma/schema.prisma`, run `npx prisma migrate dev --name [description]`
- **Forms**: Handle loading/error states, validate input, integrate with API

---

## Key Constraints & Decisions

1. **No local Node.js**: Everything runs in Docker (node:20-alpine)
2. **PostgreSQL self-hosted**: Via Docker, not managed service (DBA experience)
3. **MIT License**: Open-source, requires attribution, allows commercial use
4. **Latest versions**: Dependencies use `latest` tags to stay current
5. **Monorepo-ready**: Structure allows future services (API, mobile) without refactor
6. **Mobile-first design**: Tailwind responsive classes, future React Native support via shared types

---

## Debugging

```bash
# View logs
docker compose -f docker-compose.dev.yml logs -f web

# Enter container
docker compose -f docker-compose.dev.yml exec web sh

# Rebuild
docker compose -f docker-compose.dev.yml down -v && docker compose -f docker-compose.dev.yml up --build

# Database access
docker compose -f docker-compose.dev.yml exec db psql -U postgres -d moneyworks
```

---

## Resources

- [Next.js Docs](https://nextjs.org/docs) • [Prisma Docs](https://www.prisma.io/docs) • [Tailwind Docs](https://tailwindcss.com/docs)

---

**Last Updated**: January 24, 2026  
**Maintainer**: Håkan Arnoldson (hkarn)  
**License**: MIT
