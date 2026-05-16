# BajetBuddy

AI-powered spending intervention for Malaysia — Next.js web app, FastAPI API, Supabase (Postgres + Auth), Redis.

## Monorepo layout

```
apps/web/          Next.js frontend (@bajetbuddy/web)
apps/api/          FastAPI backend
packages/shared/   Shared TypeScript types & constants
packages/config/   Shared tsconfig base
supabase/          Migrations & seed
docs/              Setup & architecture notes
```

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker (optional, for Redis + containerized API)
- [Supabase](https://supabase.com) project (or local Supabase CLI)

## Quick start

1. **Clone and install**

   ```bash
   npm install
   pip install -r apps/api/requirements.txt
   ```

2. **Environment**

   Copy `.env.example` and fill values:

   - `apps/web/.env.local` — `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_API_URL`
   - `apps/api/.env` — `SUPABASE_*`, `ILMU_API_KEY`, `REDIS_URL`, `ALLOWED_ORIGINS`

3. **Database**

   ```bash
   npx supabase db push   # or apply supabase/migrations via dashboard SQL
   ```

4. **Run locally**

   ```bash
   # Terminal 1 — API (port 8000)
   cd apps/api && uvicorn app.main:app --reload

   # Terminal 2 — Web (port 3000)
   npm run dev
   ```

   Or with Docker Compose (API + Redis; web still via `npm run dev`):

   ```bash
   docker compose up api redis
   ```

5. **Verify**

   - Web: http://localhost:3000
   - API health: http://localhost:8000/health

See [docs/setup.md](docs/setup.md) for deployment (Vercel + Railway).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build (web) |
| `npm run lint` | ESLint (web) |

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts, shadcn-style UI primitives
- **Backend:** FastAPI, Pydantic, Anthropic SDK routed to ILMU, Supabase Python client, Redis
- **Data:** Supabase Postgres with RLS, pgvector-ready schema

## License

Private — portfolio project.
