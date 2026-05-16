# BajetBuddy — setup & deployment

## Local development

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations from `supabase/migrations/` (SQL editor or `supabase db push`).
3. Optional: `supabase db seed` using `supabase/seed.sql` for dev data.
4. Copy **Project URL**, **anon key** (web), and **service role key** (API only).

### API (`apps/api`)

```bash
cd apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp ../../.env.example .env   # edit with real values
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Without Supabase credentials, the API runs in **mock mode** (health works; DB routes may no-op).

### Web (`apps/web`)

```bash
# from repo root after npm install
cp .env.example apps/web/.env.local   # fill NEXT_PUBLIC_* vars
npm run dev
```

If you still have `.env.local` at the repo root from an older layout, move it to `apps/web/.env.local`.

### Redis

Used for caching and rate limiting. Local options:

- `docker compose up redis`
- Or install Redis locally and set `REDIS_URL=redis://localhost:6379` in `apps/api/.env`

## Docker Compose

```bash
docker compose up --build
```

Services:

- `api` — FastAPI on port 8000
- `redis` — port 6379
- `web` — optional; often run via `npm run dev` for faster HMR

## CI

GitHub Actions (`.github/workflows/ci.yml`):

- Web: `npm ci`, lint, `next build` with placeholder env vars
- API: `ruff check`, import smoke test

## Deploy

### Vercel (frontend)

1. Import repo; **root directory** = repository root (npm workspaces).
2. Build command: `npm run build -w @bajetbuddy/web` (or use root `vercel.json`).
3. Set environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (production API URL).

### Railway (API)

1. New service from repo; set **root** to `apps/api` or use Dockerfile at `apps/api/Dockerfile`.
2. `railway.toml` configures health check on `/health`.
3. Set env: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ILMU_API_KEY`, `ILMU_ANTHROPIC_BASE_URL`, `ILMU_MODEL`, `REDIS_URL`, `ALLOWED_ORIGINS` (include your Vercel domain), `ENVIRONMENT=production`.

4. Update `ALLOWED_ORIGINS` on the API to include your Vercel preview and production URLs.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Add frontend origin to `ALLOWED_ORIGINS` in API env |
| API mock mode | Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` |
| Workspace install fails | Run `npm install` from repo root; delete stale root `node_modules` if you migrated from flat layout |
| httpx conflicts | Use `supabase>=2.15.0` in `requirements.txt` (repo default) |
