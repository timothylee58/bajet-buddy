# Bajet Buddy — Operating Manual

AI-powered spending intervention app for young Malaysians. Next.js 16 frontend
(`apps/web`, deployed on Netlify), FastAPI backend (`apps/api`, deployed on
Railway), shared TypeScript types (`packages/shared`), Supabase for auth + DB.
Product copy is Manglish/BM-flavored on purpose.

This file is canonical. `AGENTS.md` and `DESIGN.md` are older docs kept for
other tools — where they conflict with this file or with the code, **this file
and the code win**. Known conflicts: `DESIGN.md` lists `tertiary: #d97706`, but
`apps/web/app/globals.css` defines `--tertiary: #7C5CFF` — globals.css is the
truth. `AGENTS.md` calls the check pipeline a "LangGraph reasoning graph" — it
is NOT LangGraph (see Backend below).

---

## Map — and the one trap that ruins everything

```
apps/web/               ← THE frontend. Next.js 16. Edit here.
apps/api/               ← THE backend. FastAPI. Edit here.
packages/shared/        ← TS types & constants, source-imported (no build step)
supabase/migrations/    ← timestamped SQL migrations
app/  lib/  public/     ← ☠️ DEAD legacy prototype at repo ROOT. Never edit.
next.config.ts, tsconfig.json (root)  ← belong to the dead prototype too
```

**MISTAKE #0 — "Editing the ghost app."** The repo root contains a leftover
single-app Next.js prototype (`app/`, `lib/`, `public/`, root `next.config.ts`).
It is not built, not deployed, not linted by CI. A file search for `page.tsx`
or `mock-data.ts` will surface it and it looks plausible.
**Rule: every path you edit must start with `apps/`, `packages/`, `supabase/`,
or `.github/`. If you find yourself in root-level `app/` or `lib/`, stop —
you're in the graveyard.**

Other repo facts:

- npm workspaces monorepo. Run all npm commands **from the repo root** with
  `-w @bajetbuddy/web`. Run all git commands from the repo root (paths like
  `apps/web/...` break if your cwd is `apps/api`).
- `packages/shared` is imported as raw TS source (`"main": "./src/index.ts"`).
  No build step; editing `types.ts` is immediately visible to the web app.
- `apps/web/types/index.ts` just re-exports `@bajetbuddy/shared`. Import types
  via `@/types`, never via relative paths into `packages/`.

---

## Code style (all languages)

- No comments explaining what the code does — well-named identifiers do that.
- Add a comment only when the WHY is non-obvious: a hidden constraint, a
  subtle invariant, a framework workaround.
- No multi-line docstrings or comment blocks.
- No emojis in code unless the feature explicitly displays them (e.g. persona
  emoji fields).

---

## Frontend conventions (`apps/web`)

### Next.js 16 — your training data is stale

1. **`proxy.ts` replaces `middleware.ts`.** The export is `proxy()`, not
   `middleware()`. The existing `apps/web/proxy.ts` refreshes the Supabase
   session and gates authed routes — the `await supabase.auth.getUser()` call
   in it must never be removed.
2. **`searchParams` in page props is a `Promise`** — always `await` it.
3. **`cookies()` from `next/headers` is async** — always `await` it.
4. When unsure about an API, check `node_modules/next/dist/docs/` instead of
   guessing from memory.

### Named mistakes → rules

- **"The silent server crash."** Pages are Server Components by default. Any
  component using hooks, event handlers, or browser APIs without `"use client"`
  fails at build/prerender, not in the editor.
  **Rule: `"use client"` on the first line of every component that touches
  `useState`/`useEffect`/handlers/`window`/`localStorage`. All files in
  `apps/web/hooks/` carry it.**
- **"The hydration flash."** `useGuestMode` reads `localStorage`; on the server
  it returns `isGuest: false`, so SSR HTML and first client render disagree →
  two screens stacked / flash of wrong page (this bug shipped once already).
  **Rule: any render branch that depends on `useGuestMode` (or any
  localStorage-derived state) must sit behind a `mounted` guard
  (`useEffect(() => setMounted(true), [])`) or be loaded with
  `next/dynamic` + `ssr: false` (see `DashboardClient.tsx`).**
- **"Function over the wire."** Passing a function prop from a Server Component
  to a Client Component fails static prerendering with a cryptic error.
  **Rule: props crossing the server→client boundary must be serializable.**
- **"The easing string."** This Framer Motion version's `Easing` type rejects
  plain strings: `transition={{ ease: "easeOut" }}` fails `tsc`.
  **Rule: omit `ease` from transition objects (or use spring configs, which
  are fine — see `VerdictOverlay.tsx`).**
- **"The bare img."** **Rule: `next/image` `<Image>` only; never `<img>`.**
- **"Inventing colors."** **Rule: style with the design tokens from
  `apps/web/app/globals.css` only** — `primary` (#BA6200 orange), `tertiary` (#7C5CFF
  violet), `surface-muted`, `text-muted`, `border-border`, `font-headline`
  (Fredoka), `font-sans` (Nunito Sans), `chunky-shadow`, `active-press`.
  Tailwind 4, no config file, no custom CSS files.
- **"Trusting fetch to succeed."** Every data-fetching hook returns
  `{ data, loading, error }` and components render `Skeleton*` while loading
  and `DataError` (with retry) on error — see `useBudget.ts`,
  `BehaviorDashboard.tsx`. **Rule: new hooks/components follow that triple;
  wrap new page sections in `ErrorBoundary` if they can throw.**
- Data fetching: Server Components use `fetch()` directly; Client Components
  use hooks in `apps/web/hooks/` or the typed wrappers in
  `apps/web/lib/api.ts`. No React Query.
- `apps/web/lib/api.ts` `apiFetch` already attaches the Supabase bearer token
  and strips trailing slashes from `API_URL`. **Rule: new backend calls get a
  typed wrapper in `apps/web/lib/api.ts`; never `fetch(API_URL + ...)`
  inline.**
- TypeScript is `strict`. Use `interface` for objects, `type` for unions.

---

## Backend conventions (`apps/api`)

### Architecture in one breath

Route (thin) → service (all logic, plain async functions) → Supabase/Claude.
The pre-purchase check runs a 5-node pipeline in
`apps/api/app/agents/reasoning_graph.py`: `observe → load_context → evaluate_risk →
generate_nudge → finalize`. **It is a plain `GraphState` dataclass walked by a
for-loop — not LangGraph. Do not add a `langgraph` dependency or rewrite it
with one.**

### Named mistakes → rules

- **"The unregistered router."** A new route file that isn't imported and
  `include_router`-ed in `apps/api/app/main.py` produces 404s with zero errors.
  **Rule: every new router is registered in `apps/api/app/main.py` with prefix
  `/api/<domain>` in the same commit that creates it.**
- **"Fat routes."** **Rule: route handlers are `async def`, validate with a
  Pydantic model from `apps/api/app/schemas/`, call one service function,
  return. No business logic in `apps/api/app/api/routes/`. Services are plain
  async functions — no classes.**
- **"Trusting the mock profile."** `_observe_transaction_intent` hardcodes a
  demo profile ("Sarah", income 3200). `apps/api/app/core/auth.py` has
  `FORCE_DEMO_USER = True` mapping everyone to
  `00000000-0000-0000-0000-000000000001`.
  **Rules: (a) for real user attributes, fetch from the `profiles` table (see
  `budget_service.fetch_work_hours_profile`) or use
  `state.budget_summary["total_income"]` — never extend the mock dict;
  (b) never flip `FORCE_DEMO_USER` or remove the demo fallback without asking.**
- **"Assuming the DB column exists."** Prod Supabase may not have the latest
  migration applied. **Rule: every DB read of a new column must tolerate
  missing/None (`row.get("col") or 0`), and every Claude/profile-derived
  number must tolerate `None` before arithmetic (`x or 0.0`) — a `TypeError`
  in the nudge path 500s the whole check.**
- **"Calling Anthropic directly."** Claude goes through the ilmu proxy.
  **Rule — the only correct client construction:**
  ```python
  settings = get_settings()
  client = anthropic.AsyncAnthropic(
      api_key=settings.ilmu_api_key or settings.anthropic_api_key,
      base_url=settings.ilmu_anthropic_base_url,
  )
  model = settings.ilmu_model if settings.ilmu_api_key else "claude-sonnet-4-5"
  ```
  DeepSeek is the fallback provider in `apps/api/app/nudge_agent/service.py`;
  keep that path working.
- **"json.loads on raw Claude output."** Models wrap JSON in ``` fences and
  prose. **Rule: parse by slicing first `{` to last `}` (see
  `_parse_ai_response`) or strip fences explicitly — never `json.loads(text)`
  directly.**
- **"The missing dep."** CI installs only `requirements.txt`. **Rule: any new
  import (e.g. `python-multipart`) goes into `apps/api/requirements.txt` in
  the same commit.** Keep it lean — heavy deps once caused deploy timeouts.
- Every file starts with `from __future__ import annotations`. Protected
  routes take `current_user: AuthenticatedUser = Depends(get_current_user)`
  (or `get_optional_user` with the demo-id fallback). Config via cached
  `get_settings()`. Pydantic fields use `Field(..., description=...)` and
  `Literal[...]` for enums.

### Shared-type double bookkeeping

`CheckResponse` (and friends) exist twice: Pydantic in
`apps/api/app/schemas/` and TS in `packages/shared/src/types.ts`.
**Rule: any change to a response model updates both in the same commit, with
new fields optional (`x: float | None = None` / `x?: number | null`) so old
clients and prod DBs don't break.**

### Database migrations

**Rule:** new columns/tables get a file
`supabase/migrations/YYYYMMDDHHMMSS_<name>.sql` using
`ADD COLUMN IF NOT EXISTS` plus `CHECK` constraints for bounded values.
Migrations in the repo are **not** auto-applied to prod — say so in the PR
("apply migration X"). Never run a migration against the live Supabase
project without explicit approval.

---

## Gamification constants (do not invent values)

XP: `boleh` +10, `fikir_dulu` +5, `jangan_dulu` 0, receipt under category
average +50, loot box common/rare/epic/legendary +10/+25/+50/+100.
Advisor unlocks: Accountant always; Gordon Ramsay 7-day streak; Kakak Kedai
5 receipts; Crypto Bro 500 XP; Financial Therapist onboarding complete.

---

## Quality bar per deliverable

Not adjectives — checks. Do not report a deliverable done unless every box
for its type passes.

**Any commit:**
- [ ] `cd apps/api && ruff check app` → zero errors
- [ ] `cd apps/web && npx tsc --noEmit` → zero errors
- [ ] Changed `tsconfig.tsbuildinfo` / `next-env.d.ts` are committed
- [ ] No `.env`, `__pycache__/`, `.next/` staged
- [ ] Commit message is `feat:|fix:|chore:|ci:` + imperative summary

**Frontend change (additionally):**
- [ ] `npm run build -w @bajetbuddy/web` from repo root → zero errors, the
      route you touched appears in the route list
- [ ] Every new hooks/handlers component has `"use client"`
- [ ] No `<img>`, no non-token colors, no custom CSS files
- [ ] localStorage-dependent render paths have a mounted guard or `ssr:false`
- [ ] New fetches: loading skeleton + error state + retry exist

**Backend change (additionally):**
- [ ] New router registered in `apps/api/app/main.py`; new deps in
      `apps/api/requirements.txt`
- [ ] `python -c "from app.main import app; assert app.title"` passes (CI's
      smoke test)
- [ ] Nullable inputs guarded before arithmetic; Claude JSON parsed via
      brace-slice
- [ ] Response-model change mirrored in `packages/shared/src/types.ts`

**Schema change (additionally):**
- [ ] Timestamped migration file with `IF NOT EXISTS` + `CHECK` constraints
- [ ] Python reads tolerate the column being absent
- [ ] PR body says the migration must be applied

**Feature (full-stack) — the 8-step order is mandatory:**
schema → service → route → register in `apps/api/app/main.py` → shared TS
types → `apps/web/lib/api.ts` wrapper → component(s) under
`apps/web/components/features/<feature>/` → page under
`apps/web/app/(app)/<feature>/page.tsx`, then all checks above.

---

## Git, PRs, and CI

- Work on the session's assigned `claude/*` branch (given in the session
  prompt — the branch name in older docs is stale). Never push to `main`.
- Push, then open a **draft PR** immediately.
- **Which CI signals are real:**
  - `web` and `api` GitHub Actions jobs — **blocking. Fix these.**
  - `Workers Builds: bajet-buddy` (Cloudflare) — **always fails** (no
    `wrangler.toml`). Ignore; do not "fix" it by adding one.
  - Netlify `Pages changed` / `Header rules` / `Redirect rules` — visual-diff
    checks that **fail whenever UI changes**. Ignore.
  - Netlify `Deploy Preview` — real only if the deploy **log** shows a build
    error; a ❌ caused by the visual-diff checks is noise.
- A review bot (Gemini Code Assist, active until 2026-07-17) comments on every
  PR. Its comments are usually valid null-safety/data-integrity catches:
  apply the good ones in a single `fix: address review` commit, push, and
  skip the rest silently. Don't argue with it in comments.
- After a PR merges, the branch is dead: restart it from main
  (`git fetch origin main && git checkout -B <branch> origin/main`) before
  new work. Never stack commits on merged history.

---

## When uncertain — exact escalation rules

**Proceed without asking** when the action is reversible and in-scope:
choosing file/component names, adding optional fields, picking which existing
pattern to follow, fixing lint/type errors, addressing clear review comments,
retrying flaky CI.

**Decide yourself, but flag it in the PR body** when the spec conflicts with
codebase reality — follow the codebase and write one sentence explaining the
deviation. (Precedent: a spec said to store work-hours on `budgets`; they went
on `profiles` because income already lives there.)

**Stop and ask first** — no exceptions:
1. Applying anything to the **live Supabase project** (migrations, SQL,
   RLS changes).
2. Touching auth semantics: `FORCE_DEMO_USER`, the `apps/web/proxy.ts`
   public-route list, token handling.
3. Deleting user-facing routes/pages, or renaming API paths the deployed
   frontend calls.
4. Adding a paid dependency/service or any credential.
5. A review comment with two materially different readings — ask, citing both
   readings, rather than guessing.
6. Anything that would force-push over commits you didn't write.

**Report and stop** (don't loop): the same CI job failing 3× on the same
error after your best fix; a failure whose cause is outside the repo
(Netlify/Railway account config, quota, DNS). State the diagnosis, the
evidence, and what you'd try next.

---

## Verification commands (copy-paste)

```bash
# from repo root
cd apps/api && ruff check app && python -c "from app.main import app; assert app.title"; cd ../..
cd apps/web && npx tsc --noEmit; cd ../..
npm run lint -w @bajetbuddy/web
npm run build -w @bajetbuddy/web

# run locally
npm run dev -w @bajetbuddy/web          # web on :3000 (guest mode works without Supabase env)
cd apps/api && uvicorn app.main:app --reload --port 8000   # api (demo user, no Supabase needed)
```
