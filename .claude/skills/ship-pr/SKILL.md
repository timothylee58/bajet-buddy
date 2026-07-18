---
name: ship-pr
description: Commit, push, open a draft PR, and babysit it to merge for Bajet Buddy — including the exact CI-noise triage table (which failing checks are real vs. permanent noise) and the review-bot protocol. Use whenever work is ready to leave the working tree, or when watching a PR for CI/review events.
---

# Ship a PR (and keep it alive)

## 1. Pre-flight gates — run all, from repo root

```bash
cd apps/api && ruff check app && python -c "from app.main import app; assert app.title"; cd ../..
cd apps/web && npx tsc --noEmit; cd ../..
npm run lint -w @bajetbuddy/web
npm run build -w @bajetbuddy/web
```

Zero errors on all four or you don't commit. `tsc` often touches
`apps/web/tsconfig.tsbuildinfo` — stage it. Never stage `.env`,
`__pycache__/`, `.next/`.

## 2. Commit

- From the **repo root** (staging `apps/web/...` paths fails from `apps/api`).
- Message: `feat:|fix:|chore:|ci:` + imperative one-liner, then bullet points
  of what changed and why. No model names in commits.
- Escape the route-group parens in shell paths: `apps/web/app/\(app\)/...`

## 3. Push and open the PR

- `git push -u origin <session-branch>` (retry ×4 with backoff on network
  errors only).
- If the branch's previous PR **merged**, the branch is dead — restart it
  first: `git fetch origin main && git checkout -B <branch> origin/main`,
  then cherry-pick/re-apply, force-with-lease push, and open a NEW PR.
- Open a **draft** PR immediately. Body = Summary bullets + Test plan
  checklist. If a migration is included, add a line: "Apply
  `supabase/migrations/<file>` to the linked project."

## 4. CI triage — memorize this table

| Check | Meaning | Action |
|---|---|---|
| `web` (GitHub Actions) | eslint + next build | **Blocking — fix.** |
| `api` (GitHub Actions) | ruff + import smoke test | **Blocking — fix.** |
| `Workers Builds: bajet-buddy` | Cloudflare, no `wrangler.toml` exists | **Permanent failure. Ignore. Never add a wrangler.toml to "fix" it.** |
| Netlify `Pages changed` | visual diff | Fails whenever UI changes. **Ignore.** |
| Netlify `Header rules` / `Redirect rules` | visual diff | Same. **Ignore.** |
| Netlify `Deploy Preview` ❌ | maybe real | Open the deploy **log**. Real build error → fix. Otherwise noise. |

Debugging `web` failures: reproduce locally with the CI env
(`NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key npm run build -w
@bajetbuddy/web`). Most failures are prerender crashes: a missing
`"use client"`, localStorage read outside a mounted guard, or a function
passed server→client.

## 5. Review-bot protocol (Gemini Code Assist, every PR)

The bot reviews within minutes. Its comments are usually legitimate
null-safety / data-integrity / state-sync catches.

1. Read all comments first; group them.
2. Apply the valid ones as ONE commit: `fix: address review on <topic>`.
3. Re-run the pre-flight gates before pushing (a review fix that breaks tsc
   costs a full round-trip).
4. Skip invalid/duplicate comments silently — don't reply-argue with a bot.
5. If a comment has two materially different readings, or asks for an
   architectural change, STOP and ask the user, quoting both readings.

## 6. Babysit until merged

- Subscribe to PR activity if available; otherwise re-check periodically.
- Every event: triage with the table above. Fix blocking failures, push,
  repeat. Do not narrate ignored noise beyond one line.
- Terminal states: merged (report + remind about any unapplied migration) or
  closed. Same blocking job failing 3× on the same error after your best
  fixes → stop and report the diagnosis instead of looping.
