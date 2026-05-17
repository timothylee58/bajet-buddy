
# BajetBuddy
"A buddy that reminds your impulse spending"

AI-powered spending intervention for Malaysia — Next.js web app, FastAPI API, Supabase (Postgres + Auth), Redis.

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

## Agents Behind The System

# 🤖 AI Agent Architecture & Core Mechanics

Instead of treating the AI and the gamification as separate features, the AI Agents act as the **"Game Master" or "Referee"** of the app. They actively monitor user behavior and enforce the rules of the financial game.

---

## 1. Profile & Balance Agent (The "Character Assigner")

- **Primary Role:** Monitors transaction history and dynamically evaluates the user’s financial habits.
- **Gamification Integration:** Dynamically assigns and updates the user's **Character Persona Class** based on real-world spending data.
- **How it works for the Demo:**
    - The agent scans transaction strings. If it detects multiple e-commerce transactions past midnight, it triggers a UI update.
    - *UI Notification Example:* `"That's your third Shopee order this week. Profile updated to Midnight Shopee Queen [Level 2]."`
- **Available Persona Classes:** *Mamak Bro, Gaji Habis Speedrunner, Midnight Shopee Queen, BNPL King, Future Homeowner, Weekend Warrior.*

---

## 2. Finance Planner Agent (The "FOMO Negotiator" & "Enforcer")

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

## 3. OCR Receipt Scanner Agent (The "Automation Engine")

- **Primary Role:** Eliminates the friction of manual data entry by processing unstructured receipt data using multimodal LLM logic.
- **Gamification Integration:** Calculates real-time spending differentials to instantly trigger behavior-based rewards.
- **How it works for the Demo:**
    - The user uploads an image of a receipt. The agent extracts `Total Amount`, `Store Name`, and `Category` strictly as JSON.
    - If the extracted total is *under* the user's category average, the agent pops up on-screen to award **+50 XP** and a flashing **"Budget Warrior" streak milestone**.Here is the next agent profile formatted perfectly for your **Notion** workspace.

---

## 4. Macro-Market Sentinel (The "Inflasi" Watchdog)

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
