
# BajetBuddy
"A buddy that reminds your impulse spending"

Malaysia's AI-powered spending intervention engine. Stops bad financial decisions before they happen — using behavioural finance, multimodal AI, and gamification designed for young Malaysians living paycheque to paycheque.

## What it does

- **Bajet Buddy** — pre-purchase AI check that evaluates spend against your salary cycle, BNPL load, and remaining runway before you tap pay
- **Receipt Scanner** — snap a receipt image; Claude vision extracts store, item, amount, and category in seconds
- **Future You Simulator** — models 6-month cashflow scenarios for any planned purchase
- **Persona Engine** — classifies spending behaviour (e.g. "Midnight Shopee Queen") and adapts nudge tone accordingly
- **Gamification** — XP, streaks, loot boxes, and 5 unlockable AI advisor personalities
- **Conversational Onboarding** — 5 questions → instant AI financial roast + persona, before any data is entered
- **Voice Input** — say "I spent RM15 on lunch at Nasi Kandar" and the form fills itself (browser Web Speech API → Claude extraction)
- **Swipe Review** — Tinder-style confirm/dismiss for detected expenses
- **Langganan Radar** — finds recurring subscriptions in your own transaction history and totals what they cost per year
- **FOMO Negotiator** — a 3-way trade-off at the moment of temptation, with a heat gauge and bounty jar
- **Inflasi Watchdog** — maps Malaysian macro shocks (fuel, grain, subsidy caps) onto your personal ledger
- **Embedded Finance** — alt-credit scoring, partner loan referrals, and contextual micro-insurance quotes
- **Pet Companion** — a creature whose mood tracks your spending discipline

---

The problem statement above contains three hidden signals:
"People know what they should do but struggle to act" → Don’t build another budgeting dashboard. Build a behaviour change engine.
"Spending impulsively, avoiding their bank balance" → The enemy is psychological: denial, shame, FOMO, and instant gratification.
"In the moments that matter — not just track what already happened" → Real-time intervention. Pre-purchase, not post-mortem.

## Malaysian Financial Reality

- 73% of Malaysians can't raise RM1,000 in an emergency (BNM Financial Stability Report)
- 47% of EPF withdrawals under i-Sinar/i-Lestari went to daily expenses, not COVID survival
- Average Malaysian carries RM8,000–12,000 in credit card debt
- BNPL (Buy Now Pay Later) — Grab PayLater, Atome, Split — exploded 400% post-2021 among 18–35 year olds
- Touch 'n Go eWallet has 18M+ users — most Malaysians have a digital spending trail they've never analysed
- "Lepak" culture + "makan" culture = social spending pressure is a real Malaysian behaviour trigger

## Agents Behind The System

Instead of treating the AI and the gamification as separate features, the AI Agents act as the **"Game Master" or "Referee"** of the app. They actively monitor user behavior and enforce the rules of the financial game.

---

### 1. Profile & Balance Agent (The "Character Assigner")

- **Primary Role:** Monitors transaction history and dynamically evaluates the user’s financial habits.
- **Gamification Integration:** Dynamically assigns and updates the user's **Character Persona Class** based on real-world spending data.
- **How it works for the Demo:**
    - The agent scans transaction strings. If it detects multiple e-commerce transactions past midnight, it triggers a UI update.
    - *UI Notification Example:* `"That's your third Shopee order this week. Profile updated to Midnight Shopee Queen [Level 2]."`
- **Available Persona Classes:** *Mamak Bro, Gaji Habis Speedrunner, Midnight Shopee Queen, BNPL King, Future Homeowner, Weekend Warrior.*

---

### 2. Finance Planner Agent (The "FOMO Negotiator" & "Enforcer")

- **Primary Role:** Intervenes at the exact moment of financial temptation via Notification (e.g., flash sales, impulse browsing, or budget overruns) to stop users from making bad decisions.
- **Gamification Integration:** Manages the **Overspent Cards (3x)** system and controls **"Tax Mode"** automated savings transfers.
- **The "Negotiation" Logic Pattern:**
    1. *Validate the FOMO:* Acknowledges that the deal or discount feels good.
    2. *Expose the Trap:* Points out the hidden psychological or physical costs of using Buy Now Pay Later (BNPL).
    3. *Offer a 3-Way Trade-off:* Presents the user with interactive operational choices in the UI:
        - **Option A (Buy with Cash):** Burns 1 *Overspent Card* and triggers "Tax Mode" (auto-transfers a 10% penalty fee to a savings *Tabung*).
        - **Option B (Use BNPL):** Allows the purchase but inflicts a character demotion (e.g., changes avatar to *Gaji Habis Speedrunner* with a clown hat) and halves their daily XP multiplier.
        - **Option C (Walk Away / 48-Hour Cooldown):** Rewards patience with **+200 Discipline XP**, a **"FOMO Slayer" badge**, and a small cash reward added to their savings *Tabung*.

---

### 3. OCR Receipt Scanner Agent (The "Automation Engine")

- **Primary Role:** Eliminates the friction of manual data entry by processing unstructured receipt data using multimodal LLM logic.
- **Gamification Integration:** Calculates real-time spending differentials to instantly trigger behavior-based rewards.
- **How it works for the Demo:**
    - The user uploads an image of a receipt. The agent extracts `Total Amount`, `Store Name`, and `Category` strictly as JSON.
    - If the extracted total is *under* the user's category average, the agent pops up on-screen to award **+50 XP** and a flashing **"Budget Warrior" streak milestone**.

---

### 4. Macro-Market Sentinel (The "Inflasi" Watchdog)

- **Primary Role:** Monitors external macroeconomic shifts in Malaysia (e.g., policy updates from PMX, global grain price spikes impacting chicken/egg markets, or changes to the BUDI95 fuel subsidy cap) and directly maps those real-world shifts to the user’s personal ledger.
- **Gamification Integration:** Generates localized **"Inflation Shield" Survival Quests** and dynamically shifts the difficulty of maintaining budget streaks based on real-world market difficulty.
- **How it works for the Demo:**
    - **The Cross-Reference:** The agent looks at the user's transaction tags. If it detects frequent spending at supermarkets (like Mydin or Lotus's) or frequent fuel stops, it flags them as a "Vulnerable Consumer."
    - **The Simulation Event:** For your presentation, you can click a mock trigger representing a major news day in Malaysia (e.g., *"Mat Sabu flags incoming logistics and fertilizer price hikes for the second half of the year"*).
    - **The Active Intervention:** Instead of a generic news notification, the AI sends a highly personalized warning based on their actual buying history.
- **UI Notification / Dialogue Example:** > *"Heads up, Mamak Bro! 🚨 Global grain costs just spiked, meaning eggs and chicken prices are expected to climb next week. Based on your past monthly grocery runs, your usual basket is going to cost you roughly **+RM18 more**.
    
    > **Quest Triggered: 'Inflasi Warrior'** -> Keep your grocery bill under RM150 this week despite the hike to earn **+300 XP** and a locked **'Harga Tetap' Badge**!"*
    
## Monorepo layout

```
apps/web/               Next.js 16 frontend  (@bajetbuddy/web)
apps/api/               FastAPI backend
  app/
    api/routes/         One file per domain (check, receipts, voice, recurring, …)
    services/           Business logic — never in routes
    schemas/            Pydantic request/response models
    agents/             Pre-purchase reasoning pipeline (plain dataclass, NOT LangGraph)
    risk_engine/        Rule-based risk scorer
    nudge_agent/        Claude nudge generator
    lending/            Alt-credit scoring + partner referral (self-contained module)
    insurance/          Contextual micro-insurance quotes (self-contained module)
    core/               Config, auth, DB, cache, logging
  tests/                pytest test suite
  ruff.toml             Explicit lint rule set — see "Linting" below
packages/shared/        TypeScript types & constants (re-exported from apps/web/types)
packages/config/        Shared tsconfig base
supabase/migrations/    Timestamped Postgres migrations
docs/                   Architecture and setup notes
```

### ⚠️ The one trap that will waste your afternoon

The repo root also contains `app/`, `lib/`, `public/` and a root `next.config.ts`.
**That is a dead single-app prototype.** It is not built, not deployed, and not
linted by CI — but a search for `page.tsx` or `mock-data.ts` will surface it and
it looks entirely plausible.

**Rule: every path you edit must start with `apps/`, `packages/`, `supabase/` or
`.github/`.** If you are editing root-level `app/` or `lib/`, stop — you are in
the graveyard and your change will have no effect.

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

> **`NEXT_PUBLIC_API_URL` must include the scheme.** A bare host
> (`api.example.com`) is treated by `fetch()` as a *relative path*, so every API
> call resolves against the site origin and 404s. `lib/constants.ts` now
> defends against this by prefixing `https://`, but set it correctly anyway.
> Leaving it **empty** in production is also valid — that routes calls through
> the `next.config.ts` rewrite proxy instead.

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

Run every npm command **from the repo root** with the workspace flag — paths
break if your shell is inside `apps/api`.

```bash
# Terminal 1 — API (http://localhost:8000). Works with no Supabase creds:
# FORCE_DEMO_USER maps every request to a demo user.
cd apps/api && uvicorn app.main:app --reload

# Terminal 2 — Web (http://localhost:3000). Guest mode works without Supabase.
npm run dev -w @bajetbuddy/web
```

Or with Docker Compose (starts API + Redis; run web separately):

```bash
docker compose up api redis
npm run dev -w @bajetbuddy/web
```

### 5. Verify

- Frontend: http://localhost:3000
- API health: http://localhost:8000/health
- API docs: http://localhost:8000/docs

---

## Scripts

All npm commands run from the repo root.

| Command | Description |
|---------|-------------|
| `npm run dev -w @bajetbuddy/web` | Next.js dev server (Turbopack) |
| `npm run build -w @bajetbuddy/web` | Production build |
| `npm run lint -w @bajetbuddy/web` | ESLint |
| `cd apps/web && npx tsc --noEmit` | TypeScript check (strict) |
| `cd apps/api && uvicorn app.main:app --reload` | FastAPI dev server |
| `cd apps/api && ruff check app` | Python linter |
| `cd apps/api && pytest` | Backend test suite |
| `cd apps/api && python -c "from app.main import app; assert app.title"` | Import smoke test (mirrors CI) |

### Before you push

CI runs exactly two blocking jobs — `web` (ESLint + build) and `api`
(ruff + import smoke test). Reproduce both locally:

```bash
cd apps/api && ruff check app && python -c "from app.main import app; assert app.title"; cd ../..
cd apps/web && npx tsc --noEmit; cd ../..
npm run lint -w @bajetbuddy/web
npm run build -w @bajetbuddy/web
```

### Which CI signals are real

| Check | Verdict |
|-------|---------|
| `web`, `api` (GitHub Actions) | **Blocking — fix these.** |
| `Workers Builds: bajet-buddy` (Cloudflare) | Always fails; there is no `wrangler.toml`. Ignore — do not "fix" it by adding one. |
| Netlify `Pages changed` / `Header rules` / `Redirect rules` | Visual-diff checks that flag on any UI change. |
| Netlify `Deploy Preview` | Real only if the deploy **log** shows a build error. |

### Linting

`apps/api/ruff.toml` pins the rule set explicitly
(`E4, E7, E9, F, I, BLE, PERF, TRY, RUF`) rather than inheriting ruff's
defaults. This is deliberate: an unpinned default set grows on each ruff
release, and in July 2026 exactly that turned `main` red with 161 findings in
files nobody had touched.

Four rules are ignored, each for a stated reason in the config — most notably
`BLE001`, because services deliberately catch broadly so that a Claude,
Supabase or partner-API failure degrades into a fallback instead of 500ing the
request.

Adding a rule family is fine; just fix the fallout in the same PR.

---

## API routes

Generated from the live OpenAPI schema — browse the interactive version at
http://localhost:8000/docs once the API is running.

### Core intervention
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/check` | Pre-purchase AI verdict (5-node reasoning pipeline) |
| POST | `/api/check/chat` | Conversational variant — free-text spend intent |
| POST | `/api/risk/evaluate` | Rule-based risk score only |
| POST | `/api/nudges/generate` | Claude nudge copy for a decision |

### Capture
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/receipts/scan` | Multimodal receipt OCR → structured data |
| POST | `/api/ocr/scan` | Raw OCR endpoint (image or file upload) |
| POST | `/api/voice/parse` | Parse a free-form voice transcript |
| GET/POST | `/api/transactions` | List / create transactions |
| GET | `/api/transactions/summary` | Budget runway summary |
| GET | `/api/transactions/categories` | Per-category budgets and spend |

### Behaviour & insight
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recurring` | Detected recurring subscriptions + annual cost |
| GET | `/api/persona` · POST `/api/persona/analyze` · POST `/api/persona/reroll` | Spending persona |
| POST | `/api/simulations/future-you` | 6-month cashflow simulation |
| POST | `/api/agent1/profile` · `/api/agent1/onboard` | Profile & balance agent |
| GET | `/api/profiling/summary` · POST `/api/profiling/goals/activate` | Progressive profiling |
| POST | `/api/onboarding/roast` | 5-answer financial persona + roast |

### FOMO negotiator
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/fomo/negotiate` · `/api/fomo/resolve` | Open and settle a negotiation |
| GET | `/api/fomo/state` · `/api/fomo/journal` | Heat gauge, bounty jar, history |
| GET/POST | `/api/fomo/pwa-monitor[/report\|/clear]` | App-open lockdown monitor |
| POST | `/api/fomo/scan-patterns` · `/api/fomo/recommend-persona` | Pattern detection |

### Inflasi Watchdog
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/sentinel/dashboard` · `/api/sentinel/quests` | Macro impact + survival quests |
| POST | `/api/sentinel/scan` · `/api/sentinel/simulate-event` | Rescan / trigger a mock macro event |
| POST | `/api/sentinel/quests/{quest_id}/complete` | Complete a quest |

### Embedded finance
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/lending/score` · `/api/lending/offers` | Alt-credit band + partner offers |
| POST | `/api/lending/apply` · GET `/api/lending/applications/{id}` | Referral application |
| POST | `/api/insurance/quote` · `/api/insurance/purchase` | Contextual micro-insurance |
| GET | `/api/insurance/policies` | Held policies |

> BajetBuddy is **not** a lender or insurer — these endpoints refer out to partners.

### Gamification
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/gamification/status` · `/api/gamification/agents` | XP, streak, level, advisor roster |
| POST | `/api/gamification/loot-box` | Open a randomised reward box |
| GET | `/api/buddies/leaderboard` · `/api/buddies/challenges` | Social |
| GET/POST | `/api/freeze/status` · `/activate` · `/override` | Spending freeze |
| GET/POST | `/api/pet/*` | Pet companion profile, XP, nudges |
| POST | `/api/agentcore/chat` | AWS Bedrock AgentCore chat (optional dependency) |

---

## Frontend routes

| Path | Description |
|------|-------------|
| `/` | Marketing landing page |
| `/start` | Guest-mode entry point |
| `/dashboard` | Behaviour dashboard — the financial heartbeat |
| `/check` | Pre-purchase check |
| `/receipts` | Receipt scanner with camera / drag-and-drop |
| `/transactions` | Transaction list + manual entry |
| `/recurring` | Langganan Radar — recurring subscriptions |
| `/budget` | Per-category budget settings |
| `/income` | Income & tax |
| `/swipe` | Swipe-style expense review |
| `/simulator` | Future You cashflow simulator |
| `/sentinel` | Inflasi Watchdog |
| `/lending` | Partner loan offers |
| `/insurance` | Micro-insurance policies |
| `/agents` | AI advisor roster + loot box |
| `/badges` | Badge collection |
| `/profiles` | Spending persona + XP progress |
| `/freeze` | Spending freeze controls |
| `/onboarding` | Conversational 5-question onboarding + roast |
| `/privacy` | Privacy policy |

Auth is a magic link handled by `apps/web/app/auth/callback/route.ts`; there are
no separate `/login` or `/register` pages. Guest mode works with no Supabase
credentials at all.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, Framer Motion, Recharts, Zustand, shadcn-style primitives |
| Backend | FastAPI, Pydantic v2, asyncpg via Supabase client, Redis |
| AI | Anthropic Claude via ILMU gateway (vision, text, structured JSON) |
| Agent pipeline | Hand-rolled 5-node pipeline in `apps/api/app/agents/reasoning_graph.py` — a `GraphState` dataclass walked by a for-loop (observe → load_context → evaluate_risk → generate_nudge → finalize). **Not LangGraph**, and there is no `langgraph` dependency. |
| Auth | Supabase Auth (magic link OTP), `@supabase/ssr` for Next.js |
| Database | Supabase Postgres 15, RLS on all tables, pgvector-ready |
| Cache | Redis with TTL for expensive operations |
| CI | GitHub Actions — `web` (ESLint + build) and `api` (ruff + import smoke test) are the only blocking jobs |

---

## Conventions

- **Backend:** route (thin) → service (all logic, plain async functions) → Supabase/Claude.
  Route handlers validate with a Pydantic schema, call one service function, and return.
  Every new router must be registered in `apps/api/app/main.py` in the same commit.
- **Frontend:** `"use client"` on any component touching hooks, handlers or browser
  APIs. Data-fetching hooks return `{ data, loading, error }` and components render a
  skeleton while loading and an error state with retry. Style only with the design
  tokens in `apps/web/app/globals.css`; use `next/image`, never `<img>`.
- **Next.js 16 specifics:** `proxy.ts` replaces `middleware.ts` (the export is
  `proxy()`), and both `searchParams` and `cookies()` are async — always `await` them.
- **Shared types are double-booked:** response models exist as Pydantic in
  `apps/api/app/schemas/` *and* TypeScript in `packages/shared/src/types.ts`.
  Change both in the same commit, and make new fields optional so old clients and
  prod databases keep working.
- **Claude access goes through the ilmu proxy**, with DeepSeek as the fallback
  provider. Never call Anthropic directly. Model output is never fed straight to
  `json.loads` — slice from the first `{` to the last `}`, because models wrap JSON
  in fences and prose.
- **New Python imports** must be added to `apps/api/requirements.txt` in the same
  commit; CI installs only that file.
- **Migrations** live in `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql` and use
  `ADD COLUMN IF NOT EXISTS`. They are **not** auto-applied to production — say so
  in the PR, and never run one against the live project without approval. Python
  reads must tolerate a missing column (`row.get("col") or 0`).

---

## License

Private — portfolio project.

Built during #seKodlah Techive hackathon with judges from Seedlab MY, CIMB, and Cradle Fund. (May 16th 2026 - May 18th 2026) 
Team Name: Bajet Buddies
- Timothy Lee (https://www.linkedin.com/in/lee-yung-yau-timothy-01a650158/)
- Naufal Hafiz (https://www.linkedin.com/in/naufal-hafiz-011b5a346/)
- Aiman Mohd Hisham (https://www.linkedin.com/in/aiman-mohd-hisham-206296287/) 
