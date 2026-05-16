
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
=======
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
>>>>>>> 1d43a42bf1f5f81df1efa4c06bb3091a1081453b
