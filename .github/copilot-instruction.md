# Moneyworks - Copilot Instructions

**Project**: Moneyworks - Open-source financial tools site (FIRE and other calculators + forum/blog)  
**Stack**: Next.js 16.4.3 + React 19.3.1 + TypeScript 6.0.3 + Tailwind CSS 4.3.3 + PostgreSQL 18.6 + Prisma 7.10.1
**Deployment**: Docker Compose (dev) + VPS (production)  
**License**: MIT (open-source, attribution required)

**Implementation status**: Localized database-backed hello-world page, a read-only `/api/health/db` check and development infrastructure only. Prisma has a small `Greeting` test model; the feature/API/component directories and roadmap below are future plans, not completed functionality. This is owner-hosted: maintain a gitignored root `.env` manually from `.env.example`, with no credential generator or general deployment wizard. See the root README for current commands and compatibility exceptions.

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
│   │   ├── app/                  # App Router (Next.js 16)
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
├── Dockerfile.dev                # Development image (Node 26.13.0 Alpine)
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

- **web**: Next.js on localhost port 3000 (Node 26.13.0 Alpine, npm 12.2.1)
- **db**: PostgreSQL 18.6 on container port 5432, host localhost port 5433

**Key Points**:

- Node modules in Docker volumes (not on host)
- Hot reload enabled for Next.js
- Database credentials from `.env` (never committed)
- Postgres persists data in the `postgres18_data` volume at `/var/lib/postgresql`; the old PostgreSQL 16 volume is not reused or deleted

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
psql -h localhost -p 5433 -U postgres -d moneyworks

# Stop containers
docker compose -f docker-compose.dev.yml down
```

---

## Technology Stack & Patterns

### Frontend

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React Context or Zustand (TBD)
- **UI Components**: shadcn/ui (optional, for rapid development)

### Backend

- **API Layer**: Next.js API Routes (Route Handlers in `app/api/`)
- **Database**: PostgreSQL 18.6 (self-hosted via Docker)
- **ORM**: Prisma (type-safe queries, migrations)
- **Authentication**: Auth.js (future phase)
- **GraphQL**: Future option only; no GraphQL packages or endpoints are implemented

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

1. **No local Node.js**: Everything runs in Docker (node:26.13.0-alpine)
2. **PostgreSQL self-hosted**: Via Docker, not managed service (DBA experience)
3. **MIT License**: Open-source, requires attribution, allows commercial use
4. **Current compatible stable versions**: Pin exact package versions and commit the lockfile; review grouped Dependabot updates rather than using floating `latest` tags or forced peer overrides
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
