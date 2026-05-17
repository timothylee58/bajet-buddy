# BajetBuddy — Project Kanban

> Mapped from Notion vision docs against current codebase (17 May 2026)

---

## ✅ Done (16 items)

| # | Item |
|---|------|
| 1 | Monorepo scaffold — Next.js 16 + FastAPI + Supabase + Redis, CI/CD (GitHub Actions) |
| 2 | Supabase Auth — magic-link login/register pages, auth callback, client/server libs |
| 3 | App shell layout — TopBar + BottomNav (Dashboard, Check, Freeze, Persona, More), BM/EN toggle |
| 4 | AI Agent route (`/api/agents`) with DeepSeek, Game Master tools (5 agents: Profile, Finance Planner, Tabung Builder, Receipt Scanner, Market Sentinel) |
| 5 | Mock data — 18 transactions (Apr–Mar 2026), habit analysis, Sarah demo profile |
| 6 | **Behavior Dashboard (Belanja Guard)** — Financial Heartbeat, Budget Ring, BNPL cards, Spending Timeline, Category Bars, StreakXPBar, interactive Shopee intervention simulation |
| 7 | **Spend Check flow** — NumPad amount entry, category picker, verdict overlay (BOLEH / FIKIR_DULU / JANGAN_DULU), freeze status, budget impact bar, Sarah demo deep link |
| 8 | **Freeze system** — soft/hard freeze screen, XP-cost override modal with gamification hook integration |
| 9 | **Persona page** — PersonaCard, XPProgressBar, AchievementGrid, persona signals display |
| 10 | **Future You Simulator** — 3-scenario BNPL/cash/save comparison with Recharts cashflow projections + stress scores |
| 11 | **Buddies page** — Leaderboard, ChallengeCard with participants + days-left display |
| 12 | **Progressive Profiling Onboarding** — 4-layer data-collection UI (Layer 0–3), goal cards, agent unlock cards, status badges |
| 13 | Gamification primitives — XPToast, StreakFlame, XPProgressBar components; `useGamification` hook |
| 14 | Supabase Phase 1 schema — BNPL commitments, wishlists, freeze events, persona snapshots, buddy relationships, challenges, nudge events (all with RLS) |
| 15 | FastAPI backend — 10 route modules + 9 service modules wired (check, transactions, persona, buddies, freeze, gamification, risk, nudges, simulations, profiling) |
| 16 | Shared TypeScript types package + constants |

---

## 🔨 In Progress (7 items)

Agent logic exists in `lib/agents/game-master.ts` and backend services, but frontend UI is missing or partially wired.

| # | Item | Gap |
|---|------|-----|
| 17 | Receipt OCR scanner UI | Camera capture / image upload widget not built (Receipt Scanner Agent tool exists) |
| 18 | Conversational Tabung Builder page | Natural-language savings goal chat UI not built (`buildTabung` tool exists) |
| 19 | Agent unlock / selection UI | Unlock conditions defined in Progressive Profiling UI; no visual collectible store or agent switching |
| 20 | Overspent Cards (3x) + Tax Mode mechanic | Defined in Finance Planner Agent spec; no UI implementation |
| 21 | Market Sentinel toggle | `triggerMarketAlert` tool exists; no "Simulate Subsidy/Market Shift Alert" demo trigger button |
| 22 | Hooks → real API wiring | Many hooks fall back to mock data; API routes exist but frontend not fully connected |
| 23 | Sandbox / Guest Mode | Auth currently required for app layout; no "Try Guest Mode (No Sign-Up)" landing page or `localStorage` persistence |

---

## ⬜ To Do (10 items)

From Notion docs — not yet started.

| # | Item | Phase / Sprint |
|---|------|----------------|
| 24 | Onboarding chat UI — 5 conversational questions → instant Persona Roast → estimated budget pie chart | Sprint 1 |
| 25 | Loot box mechanic — randomized reward (coins, agent trial, avatar accessory) every 5 receipt scans | Sprint 2 |
| 26 | Virtual avatar / pet — reacts to streak status (hungry when idle, happy when logging), village building rewards | Sprint 3 |
| 27 | Market Sentinel demo — trigger button that fires personalized inflation alert + "Inflasi Warrior" quest | Post-MVP |
| 28 | Voice expense logging — Web Speech API → LLM parse → auto-log transaction | Post-MVP |
| 29 | Telegram / WhatsApp bot — forward receipt screenshot → auto-log via webhook | Premium tier |
| 30 | Email receipt parsing — Gmail / Resend integration for auto-parsing Shopee/Grab emails | Premium tier |
| 31 | Subscription detection — auto-identify recurring bills (Netflix, TNB, Digi) from transaction patterns | Post-MVP |
| 32 | Supabase realtime subscriptions — live dashboard updates on transaction events | Sprint 2 |
| 33 | Freemium gating — 2-month free AI agent trial → paid subscription for premium agents + email parsing | Post-launch |

---

## Summary

| Status | Count |
|--------|-------|
| ✅ Done | 16 |
| 🔨 In Progress | 7 |
| ⬜ To Do | 10 |
| **Total** | **33** |
| **Completion** | **~48%** |

### Highest-estimate remaining work

1. **Receipt OCR pipeline** — camera widget + Tesseract/Cloud Vision integration (~3 days)
2. **Sandbox / Guest Mode** — "gradual engagement" login-bypass flow from Sandbox Mode doc (~2 days)
3. **Hooks → real API wiring** — connect existing hooks to FastAPI endpoints (~2 days)
