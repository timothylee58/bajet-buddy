# Agent & AI Guidelines

## Next.js version warning

This project runs **Next.js 16** — not the version in your training data. APIs, file conventions, and runtime behaviour differ. Before writing any Next.js code:

1. Check `node_modules/next/dist/docs/` for the actual API surface
2. Treat any Next.js knowledge from before 2025 as potentially stale
3. Heed all deprecation notices in build output

Key differences from Next.js 15:
- `middleware.ts` is replaced by `proxy.ts` — the export is `proxy()`, not `middleware()`
- `searchParams` in page props is now `Promise<...>` — always `await` it
- `cookies()` from `next/headers` is async — always `await` it

---

## Repository structure

```
apps/web/               Next.js 16 frontend
  app/
    (app)/              Authenticated route group — protected by proxy.ts
    (auth)/             Public auth pages (login, register)
    auth/callback/      Supabase OAuth callback route
  components/
    features/           Feature-colocated components
    layout/             TopBar, BottomNav
    ui/                 Primitive components (Button, etc.)
  hooks/                Client-side data hooks (always "use client")
  lib/
    api.ts              Typed fetch wrappers for FastAPI
    constants.ts        API_URL, CATEGORIES, VERDICT_CONFIG, LEVELS
    supabase/           client.ts (browser) and server.ts (RSC/actions)
    utils.ts            cn(), formatRM(), clamp()
  types/index.ts        Re-exports from @bajetbuddy/shared
  proxy.ts              Auth guard + session refresh (Next.js 16 middleware)

apps/api/               FastAPI backend
  app/
    api/routes/         One router per domain — no business logic here
    services/           All business logic — async def only
    schemas/            Pydantic models for request/response
    agents/             LangGraph reasoning graph
    risk_engine/        Rule-based risk scorer
    nudge_agent/        Claude nudge generation
    core/               config.py, auth.py, database.py, cache.py, logging_config.py

packages/shared/        Shared TypeScript types & constants
supabase/               Migrations
```

---

## Frontend rules

### Server vs Client Components

- Pages are Server Components by default — only add `"use client"` when the component uses hooks, browser APIs, or event handlers
- Never pass functions as props from a Server Component to a Client Component — this fails static prerendering
- Hooks belong in `/hooks/` and must be called only from Client Components
- All files in `/hooks/` carry `"use client"` at the top

### TypeScript

- `strict: true` is enforced — no implicit `any`
- Types live in `packages/shared/src/types.ts`; import via `@/types`
- Use `interface` for objects, `type` for unions and aliases

### Styling

- Tailwind CSS 4 — no config file needed, classes apply directly
- No custom CSS files — Tailwind classes only
- Component library: shadcn-style primitives in `components/ui/`
- Palette: zinc (neutral), emerald (positive/primary), amber (warning), red (danger)

### Data fetching

- Server Components: use `fetch()` directly
- Client Components: use hooks in `/hooks/` or `fetch` inside `useEffect`/handlers
- No React Query currently — local state + hooks pattern

### Image handling

- Always use `next/image` `<Image>` — never bare `<img>` tags

---

## Backend rules

### FastAPI

- All route handlers must be `async def`
- No business logic in route files — call into `/services/`
- Every file starts with `from __future__ import annotations`
- Auth: `current_user: AuthenticatedUser = Depends(get_current_user)` on every protected route

### Pydantic

- All request/response models live in `app/schemas/`
- Use `Field(..., description="...")` for documented fields
- Use `Literal[...]` for enum-like string fields

### Services

- Services are plain async functions — no classes
- Use `get_settings()` (cached via `@lru_cache`) for config
- Anthropic client pattern:
  ```python
  settings = get_settings()
  client = anthropic.AsyncAnthropic(
      api_key=settings.ilmu_api_key or settings.anthropic_api_key,
      base_url=settings.ilmu_anthropic_base_url,
  )
  model = settings.ilmu_model or "claude-opus-4-5"
  ```
- Always strip markdown fences when parsing Claude JSON responses

### Linting

- `ruff check app` must pass before every commit
- No unused imports — ruff catches them as errors

---

## AI / LLM pipeline

The pre-purchase check runs a 5-node LangGraph reasoning graph:

```
observe_transaction_intent
        ↓
  load_context          (budget summary, freeze state, persona)
        ↓
  evaluate_risk         (rule engine + Claude enrichment)
        ↓
  generate_nudge        (Claude — Manglish/BM/EN tone, VERDICT_CONFIG)
        ↓
  finalize_action       (XP award, freeze snapshot, pipeline trace)
```

### Prompt conventions

- System prompt establishes Malaysian/Manglish persona
- Always request JSON-only responses for structured extraction
- Strip ` ```json ` fences before `json.loads()`
- Model IDs: prefer `settings.ilmu_model` → fallback `"claude-opus-4-5"`

---

## Gamification system

XP events and their values:

| Event | XP |
|-------|----|
| `boleh` verdict | +10 |
| `fikir_dulu` verdict | +5 |
| `jangan_dulu` verdict | 0 |
| Receipt scan under category average | +50 |
| Loot box common | +10 |
| Loot box rare | +25 |
| Loot box epic | +50 |
| Loot box legendary | +100 |

Unlock conditions for AI advisors:

| Agent | Condition |
|-------|-----------|
| The Accountant | Always unlocked |
| Gordon Ramsay Mode | 7-day streak |
| Kakak Kedai | 5 receipts scanned |
| Crypto Bro | 500 XP (Level 3) |
| Financial Therapist | Onboarding complete |

---

## CI checks

Every PR runs two jobs:

**`web`** — `npm ci` → `eslint` → `next build`
**`api`** — `pip install -r requirements.txt` → `ruff check app` → `python -c "from app.main import app; assert app.title"`

Both must pass before merging. Run locally:

```bash
# Web
npm run lint -w @bajetbuddy/web
npm run build -w @bajetbuddy/web

# API
cd apps/api && ruff check app
cd apps/api && python -c "from app.main import app; assert app.title"
```

---

## Adding a new feature

1. **Schema** — add Pydantic models to `apps/api/app/schemas/<feature>.py`
2. **Service** — implement async business logic in `apps/api/app/services/<feature>_service.py`
3. **Route** — add a thin router in `apps/api/app/api/routes/<feature>.py`
4. **Register** — import and `include_router` in `apps/api/app/main.py`
5. **Frontend** — create `apps/web/components/features/<feature>/` with `"use client"` components
6. **Page** — add `apps/web/app/(app)/<feature>/page.tsx`
7. **API helper** — add a typed fetch wrapper to `apps/web/lib/api.ts`
8. **Verify** — `ruff check app` + `tsc --noEmit` + `next build` all green
