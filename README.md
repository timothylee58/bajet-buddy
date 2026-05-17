
## BajetBuddy
"A buddy that reminds your impulse spending"

Malaysia's AI-powered spending intervention engine. Stops bad financial decisions before they happen — using behavioural finance, multimodal AI, and gamification designed for young Malaysians living paycheque to paycheque.

## What it does

- **Belanja Guard** — pre-purchase AI check that evaluates spend against your salary cycle, BNPL load, and remaining runway before you tap pay
- **Receipt Scanner** — snap a receipt image; Claude vision extracts store, item, amount, and category in seconds
- **Voice Input** — say "I spent RM15 on lunch at Nasi Kandar" and the form fills itself
- **Future You Simulator** — models 6-month cashflow scenarios for any planned purchase
- **Persona Engine** — classifies spending behaviour (e.g. "Midnight Shopee Queen") and adapts nudge tone accordingly
- **Gamification** — XP, streaks, loot boxes, and 5 unlockable AI advisor personalities
- **Tinder-style Swipe Review** — confirm or dismiss detected recurring expenses in seconds
- **Conversational Onboarding** — 5 questions → instant AI financial roast + persona, before any data is entered

---

The problem statement contains three hidden signals:
"People know what they should do but struggle to act" → Don’t build another budgeting dashboard. Build a behaviour change engine.
"Spending impulsively, avoiding their bank balance" → The enemy is psychological: denial, shame, FOMO, and instant gratification.
"In the moments that matter — not just track what already happened" → Real-time intervention. Pre-purchase, not post-mortem.

## Malaysian Financial Reality 
#Problem Statement
- 73% of Malaysians can't raise RM1,000 in an emergency (BNM Financial Stability Report)
- 47% of EPF withdrawals under i-Sinar/i-Lestari went to daily expenses, not COVID survival
- Average Malaysian carries RM8,000–12,000 in credit card debt
- BNPL (Buy Now Pay Later) — Grab PayLater, Atome, Split — exploded 400% post-2021 among 18–35 year olds
- Touch 'n Go eWallet has 18M+ users — most Malaysians have a digital spending trail they've never analysed
- "Lepak" culture + "makan" culture = social spending pressure is a real Malaysian behaviour trigger


## Monorepo layout

```
apps/web/               Next.js 16 frontend  (@bajetbuddy/web)
apps/api/               FastAPI backend
  app/
    api/routes/         One file per domain (check, receipts, voice, …)
    services/           Business logic — never in routes
    schemas/            Pydantic request/response models
    agents/             LangGraph reasoning graph
    risk_engine/        Rule-based risk scorer
    nudge_agent/        Claude nudge generator
    core/               Config, auth, DB, cache, logging
  tests/                pytest test suite
packages/shared/        TypeScript types & constants (re-exported from apps/web/types)
packages/config/        Shared tsconfig base
supabase/               Postgres migrations & seed SQL
docs/                   Architecture and setup notes
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| Python | 3.11+ |
| Docker | any (optional — for Redis + containerised API) |
| Supabase project | cloud or local CLI |

---

## Quick start

### 1. Install

```bash
npm install                              # installs all workspaces
pip install -r apps/api/requirements.txt
```

### 2. Environment variables

Copy `.env.example` files and fill in your values.

**`apps/web/.env.local`**
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**`apps/api/.env`**
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
ILMU_API_KEY=your-ilmu-key
ILMU_ANTHROPIC_BASE_URL=https://api.ilmu.ai/anthropic
ILMU_MODEL=nemo-super
ANTHROPIC_API_KEY=your-anthropic-key   # fallback if ILMU not configured
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=["http://localhost:3000"]
```

### 3. Database

```bash
npx supabase db push
# or apply supabase/migrations manually via the Supabase dashboard SQL editor
```

### 4. Run locally

```bash
# Terminal 1 — API (http://localhost:8000)
cd apps/api && uvicorn app.main:app --reload

# Terminal 2 — Web (http://localhost:3000)
npm run dev
```

Or with Docker Compose (starts API + Redis; run web separately):

```bash
docker compose up api redis
npm run dev
```

### 5. Verify

- Frontend: http://localhost:3000
- API health: http://localhost:8000/health
- API docs: http://localhost:8000/docs

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `cd apps/api && uvicorn app.main:app --reload` | FastAPI dev server |
| `cd apps/api && ruff check app` | Python linter |
| `cd apps/web && npx tsc --noEmit` | TypeScript check |
| `cd apps/api && pytest` | Backend test suite |

---

## API routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/check` | Pre-purchase AI verdict (LangGraph pipeline) |
| POST | `/api/receipts/scan` | Multimodal receipt OCR → structured data |
| POST | `/api/voice/parse` | Parse free-form voice transcript |
| POST | `/api/onboarding/roast` | 5-answer financial persona + roast |
| GET | `/api/budget/summary` | Current budget runway |
| GET | `/api/transactions` | Recent transactions |
| GET | `/api/persona` | Active spending persona |
| POST | `/api/persona/analyze` | Re-analyse persona from transactions |
| POST | `/api/simulations/future-you` | 6-month cashflow simulation |
| GET | `/api/buddies/leaderboard` | XP leaderboard |
| GET/POST | `/api/freeze/*` | Spending freeze status / activate / override |
| GET | `/api/gamification/status` | XP, streak, level |
| POST | `/api/gamification/loot-box` | Open a randomised reward box |
| GET | `/api/gamification/agents` | AI advisor roster with unlock state |

---

## Frontend routes

| Path | Description |
|------|-------------|
| `/dashboard` | Behavior dashboard — financial heartbeat, Sarah demo |
| `/check` | Belanja Guard pre-purchase check |
| `/receipts` | Receipt scanner with camera / drag-and-drop |
| `/swipe` | Tinder-style recurring expense review |
| `/simulator` | Future You cashflow simulator |
| `/persona` | Spending persona + XP progress |
| `/agents` | AI advisor roster + loot box |
| `/buddies` | Leaderboard + challenges |
| `/freeze` | Spending freeze controls |
| `/onboarding` | Conversational 5-question onboarding + roast |
| `/login` | Magic-link auth |
| `/register` | New account |

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts, Zustand, shadcn-style primitives |
| Backend | FastAPI, Pydantic v2, asyncpg via Supabase client, Redis |
| AI | Anthropic Claude via ILMU gateway (vision, text, structured JSON) |
| Agent pipeline | LangGraph reasoning graph (5 nodes: observe → load_context → evaluate_risk → generate_nudge → finalize) |
| Auth | Supabase Auth (magic link OTP), `@supabase/ssr` for Next.js |
| Database | Supabase Postgres 15, RLS on all tables, pgvector-ready |
| Cache | Redis with TTL for expensive operations |
| CI | GitHub Actions (lint + build for web; ruff + smoke test for api) |

---

## License

Private — portfolio project.
