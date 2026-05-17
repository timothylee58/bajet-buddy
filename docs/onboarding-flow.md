# Onboarding Flow — Step by Step

> Sandbox-first, OCR Agent (Agent 4) prompted early, manual entry always available, local data persistence.

---

## Flow Overview

```
Landing Page
  ├── "Try Guest Mode" → jump straight in
  ├── "Login" → existing magic-link flow
  └── "Register" → existing magic-link flow

Guest enters
  → Step 1: Welcome + OCR Agent pitch
  → Step 2: 5 conversational onboarding questions (Layer 0)
  → Step 3: Instant Persona Roast + estimated budget
  → Step 4: Drop into full app (all features unlocked)
  → Step 5: Ongoing — snap receipts / key in manually / voice
  → Step 6: CloudSyncBanner triggers at XP ≥ 100 → register to save

All data stored in localStorage until user registers.
```

---

## Step 0 — Landing Page (First Impression)

### What the user sees

A single screen with no navigation chrome:

```
          💚 BajetBuddy
    Duit smart, hidup lega.

    ┌──────────────────────────────┐
    │  🎮  Try Guest Mode          │
    │  No sign-up. Jump straight   │
    │  in. Data saved locally.     │
    └──────────────────────────────┘

    ────────── or ──────────

    [ Sign in with Email ]
    [ Create Account ]

    "Already have progress? Sign in to restore it."
```

### Implementation notes

- This replaces the current `app/page.tsx` redirect to `/dashboard`.
- `Try Guest Mode` sets a `guest_mode: true` flag in localStorage.
- App shell renders without auth guard when guest mode is active.
- Auth layout (login/register) remains unchanged as secondary entry points.

---

## Step 1 — Welcome + OCR Agent Pitch (15 seconds)

### What the user sees

A single card immediately after tapping "Try Guest Mode":

```
┌─────────────────────────────────────────────┐
│                                             │
│         📸  Snap, Upload, or Drop PDFs        │
│                                             │
│  BajetBuddy reads your receipts and bank    │
│  statements so you don't have to type.      │
│                                             │
│  Just snap a photo of any receipt or upload │
│  a PDF statement, and we'll log it.         │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  📷  Try with a file now            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ───────────── or ─────────────             │
│                                             │
│  [ Skip → answer a few fun questions ]      │
│  [ Skip → go straight to the app ]          │
│                                             │
└─────────────────────────────────────────────┘
```

### Behavior

| User action | Result |
|---|---|
| Tap "Try with a receipt now" | Opens camera / file picker → Receipt Scanner Agent processes image → redirect to transaction review screen |
| Tap "Skip → questions" | Proceed to Step 2 (onboarding chat) |
| Tap "Skip → app" | Jump directly to Step 4 (dashboard) |

### Implementation notes

- This is **not a modal** — it's a full-screen interstitial that only appears once (flag in localStorage: `onboarding.ocr_pitch_seen`).
- If the user picks the OCR path and completes at least 1 scan, the onboarding questions (Step 2) are skipped. The answers are inferred from the scanned data.
- The camera button uses `<input type="file" accept="image/*,application/pdf" capture="environment">` for mobile; a file drop zone for desktop.

---

## Step 2 — 5 Conversational Onboarding Questions (Layer 0, ~2 minutes)

### What the user sees

A chat-style UI. The Profile Agent (Agent 1) asks one question at a time. The user types or taps a quick reply.

```
┌─────────────────────────────────────────────┐
│  🧠  Profile Agent                          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Hey! Before we start, let me learn  │    │
│  │ a bit about your spending style.    │    │
│  │ Just 5 quick questions — no          │    │
│  │ right answers.                       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ Q1 of 5                             │    │
│  │                                     │    │
│  │ How much do you spend on coffee     │    │
│  │ or boba in a typical week?          │    │
│  │                                     │    │
│  │ [ < RM20 ]  [ RM20-50 ]  [ > RM50 ] │    │
│  │                                     │    │
│  │ or type your own answer...          │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ ⏭  12 XP earned                    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### The 5 questions (from Progressive Profiling doc)

| # | Question | Quick-tap options |
|---|----------|-------------------|
| 1 | "How much do you spend on coffee / boba in a typical week?" | `< RM20` / `RM20–50` / `> RM50` |
| 2 | "What's your biggest guilt purchase — the thing you buy then hide the receipt?" | `Shopee haul` / `GrabFood` / `Steam games` / `Sneakers` |
| 3 | "Do you check your bank balance before or after ordering GrabFood?" | `Before` / `After` / `Never` |
| 4 | "Shopee sale notification at 2 AM — swipe buy or swipe ignore?" | `Swipe buy` / `Swipe ignore` / `Add to cart first` |
| 5 | "If you found RM200 in your pocket right now, where would it go?" | `Savings` / `Treat myself` / `Pay a bill` |

### Data collected per question

- Q1 → `coffee_boba_weekly_estimate` (numeric range)
- Q2 → `impulse_category_lean` (category)
- Q3 → `balance_check_behavior` (enum)
- Q4 → `late_night_impulse_tolerance` (enum)
- Q5 → `savings_disposition` (enum)

Each answer yields **12 XP** (×5 = 60 XP total). Completing all 5 awards a bonus **+140 XP** = **200 XP total** (enough to trigger the CloudSyncBanner at 100 XP).

### Implementation notes

- Answers are sent to `/api/agents` with the Profile Agent tool (`assignProfile`).
- The agent returns a persona assignment + roast text + estimated budget breakdown.
- All answers are saved to localStorage immediately after each question (no data loss on accidental close).
- User can skip any question (defaults to "Prefer not to say" which still yields a generic persona).
- Progress bar at bottom: `●●●●○  4 of 5 questions answered`.

---

## Step 3 — Persona Roast + Estimated Budget (30 seconds)

### What the user sees

A celebratory reveal screen:

```
┌─────────────────────────────────────────────┐
│                                             │
│           🎉  Your Financial Persona        │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🍜  Mamak Bro [Level 1]            │   │
│   │                                     │   │
│   │  "Your Nasi Kandar budget could     │   │
│   │   fund a small warung. But hey,     │   │
│   │   at least you're loyal to your     │   │
│   │   mamak."                           │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   Estimated Monthly Spending                │
│   ┌─────────────────────────────────────┐   │
│   │  🍔 Food           RM600  ████████  │   │
│   │  🛍️ Shopping       RM350  █████     │   │
│   │  🚗 Transport      RM200  ███       │   │
│   │  📱 Bills          RM300  ████      │   │
│   │  💰 Savings        RM150  ██        │   │
│   │                                     │   │
│   │  ⚠️ Based on Malaysian averages +   │   │
│   │  your answers. Gets smarter as you  │   │
│   │  log real transactions.             │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  🚀  Enter BajetBuddy               │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   +200 XP earned!  🎉                        │
│                                             │
└─────────────────────────────────────────────┘
```

### Behavior

- Tapping "Enter BajetBuddy" proceeds to Step 4.
- Persona data and estimated budget are saved to localStorage: `profile.persona`, `profile.estimated_budget`.
- The estimated budget is displayed on the dashboard as semi-transparent bars that get replaced by real data as transactions are logged (UX Rule #3 from PP doc: "Estimates are better than blanks").

---

## Step 4 — Full App Access (All Features Unlocked)

### What the user sees

The standard app shell with BottomNav:

```
┌─────────────────────────────────────────────┐
│  💚 BajetBuddy           ⚡ Streak: Day 1    │
├─────────────────────────────────────────────┤
│                                             │
│  Dashboard (default tab)                    │
│  ┌─────────────────────────────────────┐    │
│  │  Financial Heartbeat                │    │
│  │  [Runway chart with estimated data] │    │
│  │                                     │    │
│  │  ⚠️ Progress at Risk!              │    │  ← CloudSyncBanner
│  │  You earned 200 XP as a guest.      │    │     (appears at XP ≥ 100)
│  │  [Sync to Cloud →]                  │    │
│  │                                     │    │
│  │  Budget Ring                        │    │
│  │  Recent Transactions (empty state)  │    │
│  └─────────────────────────────────────┘    │
│                                             │
├─────────────────────────────────────────────┤
│  🏠 Home  ✅ Check  ❄️ Freeze  🧠 Persona ⋯ │
└─────────────────────────────────────────────┘
```

### All features available immediately

| Tab | Feature | Data source |
|-----|---------|-------------|
| 🏠 Home | Behavior Dashboard | Estimated budget (bleeds into real data) |
| ✅ Check | Spend Check (NumPad → verdict) | Mock/default context until real data exists |
| ❄️ Freeze | Freeze status + override | localStorage `freeze_events` |
| 🧠 Persona | PersonaCard + XP bar | `profile.persona` from onboarding |
| 📊 Simulator | Future You Simulator | Default Sarah-like scenario |
| 👥 Buddies | Leaderboard + Challenges | localStorage `challenges` |
| 🧭 Onboarding | Progressive Profiling layers | Real-time layer status |

### Empty state rule

The dashboard never shows zeros. Instead:
- If no transactions exist → show "Snap your first receipt 👇" prompt card
- The budget ring shows estimated values with a "Estimated — log transactions to refine" label
- The empty transaction list shows: "No transactions yet. Tap + to add one manually, or 📸 snap a receipt."

---

## Step 5 — Ongoing: Three Ways to Log Transactions

### 5a. OCR Receipt Scan (Agent 4 — Primary, 3 seconds)

```
User taps the camera FAB (bottom-right floating button on Dashboard and Transactions)
  → Camera opens / file picker
  → User snaps receipt or selects image
  → Image sent to Receipt Scanner Agent (game-master.ts: scanReceipt)
  → Agent extracts: { totalAmount, storeName, category }
  → Transaction review card slides up:

  ┌─────────────────────────────────────┐
  │  📋 Review Transaction              │
  │                                     │
  │  Store    Mydin Supermarket         │
  │  Amount   RM 250.00                 │
  │  Category Groceries         [Edit]  │
  │  Date     17 May 2026        [Edit] │
  │                                     │
  │  [ ✅ Confirm ]   [ ✏️ Edit ]       │
  └─────────────────────────────────────┘

  → User confirms → transaction saved to localStorage
  → XP Toast: "+20 XP — Budget Warrior!" (if under category average)
  → Dashboard updates immediately
```

### 5b. Manual Entry (Fallback, 15 seconds)

```
User taps "+" button on Dashboard or goes to Check tab
  → NumPad appears (existing CheckScreen)
  → Enter amount → pick category → add optional note
  → Tap "Log Transaction"
  → Saved to localStorage immediately
  → +10 XP (manual entry gives less XP than OCR to incentivize scanning)
```

### 5c. Voice Logging (Phase 4, Post-MVP)

```
User taps mic button
  → Web Speech API listens
  → User says: "I spent RM15 on Nasi Kandar at Pelita"
  → LLM parses: { amount: 15, category: "food", merchant: "Pelita", description: "Nasi Kandar" }
  → Auto-logged with +15 XP
```

### Data flow (all paths)

```
OCR / Manual / Voice
       │
       ▼
  localStorage.transactions[]  ←── immediate save
       │
       ▼
  Dashboard re-renders         ←── real-time
       │
       ▼
  Profile Agent re-evaluates   ←── on each transaction
  (persona may upgrade)
```

---

## Step 6 — CloudSyncBanner (Convert Guest → Registered User)

### Trigger conditions

The banner appears when **all** of these are true:
- User is in guest mode (`guest_mode: true`)
- User has ≥ 100 XP
- User has not dismissed the banner in this session

### What the user sees

```
┌─────────────────────────────────────────────┐
│  ⚠️  Progress at Risk!                      │
│                                             │
│  You earned 340 XP as a guest. If you       │
│  clear your browser or uninstall, your      │
│  Mamak Bro stats, 12 transactions, and      │
│  7-day streak will vanish forever.          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ☁️  Sync to Cloud (Free)           │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [ Dismiss ]                                │
└─────────────────────────────────────────────┘
```

### Behavior

| Action | Result |
|---|---|
| Tap "Sync to Cloud" | Opens register modal (email → magic link). On successful auth, all localStorage data is migrated to Supabase. Guest flag cleared. |
| Tap "Dismiss" | Banner hides for this session. Reappears next visit. |
| User registers | localStorage data is bulk-inserted: `transactions[]`, `profile.persona`, `profile.estimated_budget`, `freeze_events[]`, `gamification.xp`, `gamification.streak`. |

### Migration function (pseudocode)

```typescript
async function migrateGuestToCloud(userId: string) {
  const local = {
    transactions: JSON.parse(localStorage.getItem('bb_transactions') || '[]'),
    persona: JSON.parse(localStorage.getItem('bb_persona') || '{}'),
    xp: Number(localStorage.getItem('bb_xp') || '0'),
    streak: Number(localStorage.getItem('bb_streak') || '0'),
  };

  await fetch('/api/migrate', {
    method: 'POST',
    body: JSON.stringify(local),
  });

  // Clear guest flags
  localStorage.removeItem('guest_mode');
  localStorage.setItem('user_id', userId);
}
```

---

## localStorage Schema

All guest data lives under the `bb_` prefix:

| Key | Shape |
|-----|-------|
| `guest_mode` | `"true"` |
| `onboarding.ocr_pitch_seen` | `"true"` |
| `onboarding.questions_answered` | `"true"` |
| `onboarding.answers` | `[{ question: 1, answer: "...", xp: 12 }, ...]` |
| `bb_persona` | `{ type, name, emoji, description, level, confidence }` |
| `bb_estimated_budget` | `{ food, shopping, transport, bills, savings }` |
| `bb_transactions` | `[{ id, date, amount, category, description, source: "ocr"|"manual"|"voice" }]` |
| `bb_xp` | `420` |
| `bb_streak` | `7` |
| `bb_badges` | `["7_day_streak", "budget_warrior"]` |
| `bb_freeze_events` | `[{ type, reason, activated_at, ... }]` |

---

## What stays unchanged

- Magic-link login/register pages (`/login`, `/register`) — still accessible from landing page
- All existing feature screens (Dashboard, Check, Freeze, Persona, Simulator, Buddies, Onboarding)
- All existing hooks (`useDashboardPulse`, `usePersona`, `useFreeze`, `useGamification`, `useProgressiveProfiling`)
- Game Master tools in `lib/agents/game-master.ts`
- FastAPI backend routes

### What changes / is new

| Change | File(s) affected |
|---|---|
| Landing page replaces redirect | `app/page.tsx` |
| Guest mode bypasses auth guard | `app/(app)/layout.tsx` (conditional) |
| localStorage context provider | New: `lib/local-storage-context.tsx` |
| OCR pitch interstitial | New: `components/features/onboarding/OCRPitchCard.tsx` |
| Onboarding chat UI (5 questions) | New: `components/features/onboarding/OnboardingChat.tsx` |
| Persona roast reveal screen | New: `components/features/onboarding/PersonaRoast.tsx` |
| Camera/receipt upload widget | New: `components/features/check/ReceiptCapture.tsx` |
| Transaction review card | New: `components/features/check/TransactionReviewCard.tsx` |
| CloudSyncBanner | New: `components/features/onboarding/CloudSyncBanner.tsx` |
| Migration endpoint | New: `apps/api/app/api/routes/migrate.py` |
