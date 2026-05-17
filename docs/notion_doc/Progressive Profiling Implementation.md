# Progressive Profiling — Implementation Plan

> **Goal:** Eliminate the Cold Start Problem by collecting user financial data through zero-friction, inherently rewarding touchpoints — no forced manual entry.

---

## 1. The Core Principle: Data Comes *From* Value, Not *Before* Value

Traditional finance apps demand full transaction history before showing anything useful. Users bounce.
BajetBuddy inverts this: every interaction the user *wants* to have also yields data the AI needs.

```
Traditional:  Download → Fill forms → Import CSV → Wait → See dashboard
BajetBuddy:  Download → Answer 5 fun questions → Instant persona roast → Keep playing
```

---

## 2. Progressive Profiling Layers (Build User Data Over Time)

Each layer adds data depth without the user feeling interrogated.

### Layer 0 — Instant Gratification (Onboarding, 3 minutes)
**What the user does:** Answers 5 conversational, personality-driven questions via a chat-style UI.

**Questions (delivered by the Profile Agent):**
1. "How much do you spend on coffee / boba in a typical week?"
2. "What's your biggest guilt purchase — the thing you buy then hide the receipt?"
3. "Do you check your bank balance before or after ordering GrabFood?"
4. "Shopee sale notification at 2 AM — swipe buy or swipe ignore?"
5. "If you found RM200 in your pocket right now, where would it go?"

**Data collected:** Spending personality vector (impulse tolerance, category lean, savings disposition, time-of-day risk profile).

**Immediate reward:** An AI-generated **Financial Persona Roast** (e.g., "You're a Level 1 Mamak Bro — your Nasi Kandar budget could fund a small warung.") + an estimated monthly spending pie chart based on Malaysian averages skewed by their answers.

### Layer 1 — Passive Capture (Ongoing, 3 seconds per entry)
**What the user does:** Snaps a receipt photo, speaks a voice note, or forwards a digital receipt via WhatsApp/Telegram.

| Input Method | Friction | Tech Stack | Priority |
|---|---|---|---|
| Receipt OCR Scan | Open camera → snap → done | Tesseract.js / Google Cloud Vision | **P1 — Sprint 1** |
| Voice Expense Logging | Tap mic → "I spent RM15 on Nasi Kandar" → done | Web Speech API → LLM parse | **P1 — Sprint 2** |
| Telegram/WhatsApp Bot | Forward receipt screenshot or text | Telegram Bot API + webhook | P2 — Post-MVP |
| Browser Extension (email receipt parsing) | Auto-forward Shopee/Grab emails | Gmail API / Resend webhook | P3 — Premium tier |

**Data collected:** Structured transactions (amount, category, store, timestamp).

**Immediate reward:** XP awarded per receipt scanned. If the amount is under category average → **+50 XP** + "Budget Warrior" streak badge. Every 5 scans → **Loot Box** (random in-app coins, agent trial unlock, avatar accessory).

### Layer 2 — Recurring Pattern Detection (Passive, triggers after 2+ weeks of data)
**What the user does:** Nothing. The system watches.

**What the AI detects:**
- Fixed subscriptions (Netflix, TNB, Digi bill)
- Recurring merchants (Mydin every Sunday, Shell every Friday)
- Time-of-day patterns (all Shopee orders after 11 PM)

**Data collected:** Recurring expense schedule, subscription inventory, impulse time-zones.

**Immediate reward:** The Profile Agent auto-assigns/upgrades their **Character Persona Class** with a push notification: *"That's your fourth 2 AM Shopee order. Profile updated: Midnight Shopee Queen [Level 2]."*

### Layer 3 — Goal-Directed Data (User-initiated, high-commitment)
**What the user does:** Casually types a savings goal into the Tabung Builder chat.

> "I want to save up for a mechanical keyboard."

**Data collected:** Savings capacity, goal horizon, willingness to accept behavioral rules.

**Immediate reward:** A named Tabung with a gamified rule (`"Daily XP doubles if you don't spend past 10 PM"`) and a progress bar that fills with every logged saving.

---

## 3. Gamification Engine — Making Data Entry Inherently Rewarding

### 3.1 XP & Leveling System
| Action | XP Earned |
|---|---|
| Scan a receipt | 20 XP |
| Voice-log an expense | 15 XP |
| 7-day logging streak | +100 XP (bonus) |
| Stay under category budget for a week | +80 XP |
| Complete onboarding questions | +200 XP (one-time) |
| Walk away from a FOMO purchase (Option C) | +200 Discipline XP |

### 3.2 Streak System
- **Daily Log Streak:** Log at least 1 transaction per day. Streak multiplier: 1.0× → 1.5× → 2.0× (caps at 7 days).
- **Budget Warrior Streak:** Stay under budget in a category. Unlocks badge at 3, 7, 14, 30 days.
- **Broken Streak Consequence:** Virtual pet / avatar gets sad. No data loss, purely emotional.

### 3.3 Unlockable AI Agents (Revenue + Retention)
| Agent | Unlock Condition |
|---|---|
| Accountant (Basic) | Default — everyone gets this |
| Gordon Ramsay (Aggressive) | Maintain 7-day logging streak |
| Financial Therapist (Empathetic) | Complete 5 Tabung goals |
| Mak Cik Kiah (Malaysian auntie roasts) | Spend RM500+ at Pasar Malam category |
| Crypto Bro (High-risk humor) | Invest/save RM1000+ cumulatively |
| Inflasi Sentinel (Market-aware) | Reach Level 10 |

Each agent has a distinct voice, avatar, and intervention style. They are characters, not just tools.

### 3.4 Overspent Cards & Tax Mode
- Every user starts with **3 Overspent Cards** (free passes for impulse buys).
- Using one → triggers "Tax Mode" (10% of purchase auto-allocated to savings Tabung).
- Cards regenerate at 1 per month. Premium users get 5.

---

## 4. Technical Architecture — Progressive Profiling Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    CAPTURE LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Camera   │  │ Mic      │  │ Telegram Bot         │   │
│  │ (OCR)    │  │ (Voice)  │  │ (Forward Receipt)    │   │
│  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘   │
└───────┼─────────────┼───────────────────┼───────────────┘
        │             │                   │
        ▼             ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                  PROCESSING LAYER                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Receipt Scanner Agent (multimodal LLM)           │   │
│  │  Input: Image / Voice text / Forwarded message    │   │
│  │  Output: Structured JSON {amount, store, cat}     │   │
│  └──────────────────────┬───────────────────────────┘   │
│                         ▼                                │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Profile & Balance Agent                          │   │
│  │  Reads: Transaction stream + time-of-day          │   │
│  │  Outputs: Persona update, XP award, badge trigger │   │
│  └──────────────────────┬───────────────────────────┘   │
└─────────────────────────┼───────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   STORAGE LAYER                           │
│  ┌──────────────────┐  ┌────────────────────────────┐   │
│  │ Supabase (PG)    │  │ Redis (Streak counters,     │   │
│  │ Transactions     │  │ session cache, XP queue)    │   │
│  │ User profiles    │  │                             │   │
│  │ Tabung goals     │  │                             │   │
│  │ Agent unlocks    │  │                             │   │
│  └──────────────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Design Decisions
- **All capture methods → same processing pipeline.** Whether it's OCR, voice, or bot, the Receipt Scanner Agent normalizes everything to the same structured transaction format. Add a new capture method without touching downstream logic.
- **Agents are stateless functions.** They read from the DB, compute, and write back. The `tools` in `lib/agents/game-master.ts` are already structured this way — extend them, don't rewrite.
- **Streaks and XP are computed at read-time.** Redis holds counters; the Profile Agent recalculates on every transaction event. No cron jobs needed for MVP.

---

## 5. Implementation Phases

### Phase 1 — Onboarding + Manual Entry (Sprint 1, 1 week)
**Goal:** Get the foundational UI and data model in place so users can at least log transactions manually and get AI feedback.

- [x] Next.js project scaffolded
- [x] AI agent route (`/api/agents`) working with DeepSeek
- [x] Mock data available
- [ ] Build onboarding chat UI (5 conversational questions → persona roast)
- [ ] Build manual transaction form (amount, category, description, date)
- [ ] Transaction list + basic dashboard (monthly summary, category breakdown)
- [ ] Profile Agent persona assignment displayed in UI
- [ ] Supabase schema: `transactions`, `user_profiles`, `tabung_goals`

**Data collected:** Layer 0 (personality vector) + manual transactions.

### Phase 2 — Receipt OCR + Gamification Core (Sprint 2, 1 week)
**Goal:** Remove typing friction. Add the XP loop that makes logging addictive.

- [ ] Camera capture widget (take photo or upload receipt image)
- [ ] Receipt Scanner Agent integration (image → structured JSON)
- [ ] Transaction review screen ("Tinder-style" swipe to confirm/correct)
- [ ] XP system: award XP per receipt, display level + progress bar
- [ ] Streak tracker (daily log streak + budget warrior streak)
- [ ] Basic badge system (3 badges: 7-day streak, Budget Warrior, FOMO Slayer)
- [ ] Finance Planner Agent intervention UI (FOMO negotiation dialog)

**Data collected:** Layer 1 (receipt-sourced transactions).

### Phase 3 — Tabung Builder + Agent Unlocks (Sprint 3, 1 week)
**Goal:** Drive retention through personalized goals and collectible AI agents.

- [ ] Conversational Tabung Builder chat UI
- [ ] Tabung progress visualization (progress bar, rule display)
- [ ] Agent unlock system (check conditions on each transaction)
- [ ] Agent selection UI (switch between unlocked agents)
- [ ] Virtual avatar / pet that reacts to streak status
- [ ] Overspent Cards + Tax Mode mechanic

**Data collected:** Layer 3 (goal-directed savings behavior).

### Phase 4 — Voice Logging + Market Sentinel (Post-MVP)
**Goal:** Add voice input and make the app feel alive with real-world context.

- [ ] Voice expense logging (Web Speech API → LLM parse)
- [ ] "Simulate Market Shift" toggle for Macro-Market Sentinel demo
- [ ] Personalized inflation alerts based on user's grocery/fuel history
- [ ] Subscription detection (auto-identify recurring bills)

**Data collected:** Layer 2 (recurring patterns) + voice transactions.

### Phase 5 — Messaging Bot + Email Parsing (Premium Tier)
- [ ] Telegram bot webhook (forward receipts → auto-log)
- [ ] Gmail Resend integration (auto-parse Shopee/Grab email receipts)
- [ ] Premium tier gating for email parsing + extra Overspent Cards

---

## 6. The "No Force Labor" Guarantee — UX Rules

1. **Never show an empty state.** If zero transactions exist, show the onboarding chat or a "Snap your first receipt!" prompt. Never a blank dashboard.
2. **Every data-capture action gives immediate feedback.** Scan → instant XP popup + category trend update. No batch processing, no "your data is being analyzed" spinner.
3. **Estimates are better than blanks.** The 5 onboarding questions generate an estimated budget breakdown. As real data comes in, estimates fade out and real numbers fade in. The user never sees zero.
4. **Gamification is not a skin — it's the skeleton.** XP, streaks, badges, and agent unlocks are not a layer on top. They *are* the data capture mechanism. Logging a transaction *is* the game action.
5. **The AI roasts you, not nags you.** Notifications are character-driven ("Yo Mamak Bro, your Nasi Kandar budget just died") — never corporate-sounding ("You have exceeded your Food & Beverage budget by 12%").

---

## 7. Success Metrics (Hackathon Demo)

| Metric | Target |
|---|---|
| Onboarding completion rate | > 80% of installs |
| Receipt scan → confirmed transaction time | < 5 seconds |
| Day-1 retention (user returns within 24h) | > 50% |
| Transactions logged per active user per day | ≥ 2 |
| AI agent interactions per session | ≥ 1 |

---

## 8. Next Actions (Immediate)

1. Build the onboarding chat UI (`app/page.tsx` → replace starter template with conversational onboarding)
2. Define Supabase schema for `transactions`, `user_profiles`, `tabung_goals`
3. Extend the existing `game-master.ts` tools to support the onboarding question flow
4. Implement the manual transaction entry form as a fallback while OCR is built
