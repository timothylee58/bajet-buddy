---
name: new-feature
description: Build a full-stack Bajet Buddy feature end-to-end (FastAPI schema → service → route → shared types → api.ts wrapper → component → page) in the mandatory order, with every repo trap pre-empted. Use for any request that adds user-visible functionality touching both apps/api and apps/web.
---

# New full-stack feature

Work in this exact order. Each step names the trap it prevents. Skipping the
order is how features ship half-wired (a route that 404s, a type that only
exists in Python, a page that crashes at prerender).

Substitute `<feature>` with a short snake_case name throughout.

## 0. Scope check (30 seconds, saves an hour)

- Re-read the request. List the API endpoints, DB columns, and screens it
  implies. If a screen is mentioned with no data source, or a data source with
  no screen, the feature is full-stack — follow all steps. Backend-only or
  frontend-only requests skip the irrelevant half but NEVER skip step 7.
- Confirm every file you plan to touch starts with `apps/`, `packages/`, or
  `supabase/`. Root-level `app/` and `lib/` are a dead prototype — never edit.

## 1. Schema (Pydantic) — `apps/api/app/schemas/<feature>.py`

- First line: `from __future__ import annotations`
- Request model + response model. `Field(..., description="...")` on
  documented fields, `Literal[...]` for enum-like strings.
- Any field a prod DB or old client might not supply is optional with a
  default: `x: float | None = None`.

## 2. Service — `apps/api/app/services/<feature>_service.py`

- Plain `async def` functions. No classes. All business logic lives here.
- Config: `settings = get_settings()` (cached).
- Supabase reads: `get_supabase()` may return `None` (no env) — return a sane
  fallback. Column reads use `row.get("col") or 0` because prod may not have
  the migration applied yet.
- Claude calls use the ilmu proxy pattern:
  ```python
  client = anthropic.AsyncAnthropic(
      api_key=settings.ilmu_api_key or settings.anthropic_api_key,
      base_url=settings.ilmu_anthropic_base_url,
  )
  model = settings.ilmu_model or "claude-opus-4-5"
  ```
  Parse responses by slicing first `{` to last `}` before `json.loads` —
  never parse raw model text.
- Guard every number that could be `None` before arithmetic (`x or 0.0`).
  A `TypeError` here 500s the endpoint.

## 3. Route — `apps/api/app/api/routes/<feature>.py`

- Thin: validate with the schema, call one service function, return.
- Auth: `current_user: AuthenticatedUser = Depends(get_current_user)` on
  protected routes; `get_optional_user` + demo-id fallback
  (`"00000000-0000-0000-0000-000000000001"`) if guests may call it.

## 4. Register — `apps/api/app/main.py` (THE most-forgotten step)

- Import the router and `app.include_router(<feature>.router,
  prefix="/api/<feature>", tags=["<feature>"])`.
- An unregistered router fails silently as 404s. Do this in the same edit
  session as step 3, never "later".

## 5. DB migration (only if new columns/tables)

- `supabase/migrations/YYYYMMDDHHMMSS_<feature>.sql` (use current UTC).
- `ADD COLUMN IF NOT EXISTS ... DEFAULT ...` plus `CHECK` constraints for
  bounded values (hours, percentages, amounts ≥ 0).
- Do NOT apply it to the live Supabase project. Note in the PR body that it
  must be applied.

## 6. Shared types — `packages/shared/src/types.ts`

- Mirror every Pydantic response model in TypeScript. New fields optional:
  `x?: number | null`.
- This package is source-imported — no build step needed. The web app imports
  it via `@/types`, never via a relative path.

## 7. Frontend

a. **API wrapper** — `apps/web/lib/api.ts`: one typed function per endpoint
   using the existing `apiFetch<T>` (it already handles auth headers and
   URL joining). Never inline `fetch(API_URL + ...)` in components.

b. **Components** — `apps/web/components/features/<feature>/`:
   - `"use client"` first line on anything with hooks/handlers.
   - Data fetching returns the `{ data, loading, error }` triple; render
     `Skeleton*` while loading, `DataError` with retry on error.
   - If any render branch depends on `useGuestMode` or localStorage, put it
     behind a `mounted` guard or load with `next/dynamic` + `ssr: false`.
   - Styling: `globals.css` tokens only — `primary`, `tertiary`,
     `surface-muted`, `text-muted`, `border-border`, `font-headline`,
     `font-sans`, `chunky-shadow`, `active-press`. No `<img>` — use
     `next/image`. No custom CSS files.
   - Framer Motion: never `ease: "easeOut"` string in transitions (fails
     tsc). Springs are fine.

c. **Page** — `apps/web/app/(app)/<feature>/page.tsx` (authed) or under
   `apps/web/app/` root (public — then also add the path to the public list
   in `apps/web/proxy.ts`). Copy tone: Manglish where the product is playful.

## 8. Verify (all must pass before you claim done)

```bash
cd apps/api && ruff check app && python -c "from app.main import app; assert app.title"; cd ../..
cd apps/web && npx tsc --noEmit; cd ../..
npm run build -w @bajetbuddy/web    # your route must appear in the route list
```

Then commit (conventional prefix, include changed `tsconfig.tsbuildinfo`),
push to the session branch, open a draft PR. Follow the `ship-pr` skill for
the PR/CI protocol.
