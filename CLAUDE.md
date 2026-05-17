@AGENTS.md

## Code style

- No comments explaining what the code does — well-named identifiers do that
- Add a comment only when the WHY is non-obvious: a hidden constraint, a subtle invariant, a framework workaround
- No multi-line docstrings or comment blocks
- No emojis in code unless the feature explicitly displays them (e.g. persona emoji fields)

## Commit hygiene

- Run `ruff check app` and `npx tsc --noEmit` before every commit
- Commit `tsconfig.tsbuildinfo` and `next-env.d.ts` when they change — the stop hook enforces this
- Never commit `.env` files, `__pycache__/`, or `.next/` — all are in `.gitignore`

## PR workflow

- All work goes to `claude/nextjs-app-router-migration-sEMx8`
- Open a draft PR immediately after the first push
- Watch CI — fix `web` and `api` job failures before reporting work as done

## Priority verification checklist

Before marking any feature complete:

- [ ] `ruff check app` — zero errors
- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npm run build -w @bajetbuddy/web` — zero errors, all routes listed
- [ ] No `<img>` tags — use `next/image` `<Image>`
- [ ] No arrow functions passed as props from Server Components to Client Components
- [ ] New FastAPI routes registered in `app/main.py`
- [ ] New `python-multipart` or other runtime deps added to `requirements.txt`
- [ ] `"use client"` on every page/component that uses hooks or event handlers
