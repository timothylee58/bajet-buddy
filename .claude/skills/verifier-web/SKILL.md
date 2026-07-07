---
name: verifier-web
description: Launch the Bajet Buddy web app (local dev server or deployed Netlify URL) and drive it in a real browser with Playwright to verify a change at its surface — capturing screenshots as evidence. Use when asked to verify, test, screenshot, or reproduce UI behavior, or before claiming any frontend change works.
---

# Verify the web app by driving it

Type-checks and builds prove compilation, not behavior. The worst shipped
bugs here (two pages rendering on one screen) passed both. Evidence means:
the app ran, you drove it, you captured what you saw.

## 1. Pick a target

| Target | When | URL |
|---|---|---|
| Local dev server | verifying uncommitted changes | `http://localhost:3000` |
| Netlify production | reproducing a reported live bug | `https://bajet-buddy.netlify.app` |
| Netlify deploy preview | verifying a pushed PR | link in the PR's netlify bot comment |

## 2. Launch locally (for uncommitted work)

```bash
# terminal 1 — web (guest mode works with placeholder env)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
NEXT_PUBLIC_API_URL=http://localhost:8000 \
npm run dev -w @bajetbuddy/web

# terminal 2 — api, only if the flow calls the backend
cd apps/api && uvicorn app.main:app --port 8000
```

Facts that make this work without secrets:
- `proxy.ts` skips session refresh when Supabase env is missing → all routes
  reachable.
- The API forces the demo user (`FORCE_DEMO_USER` in `core/auth.py`) and
  falls back to demo data when Supabase is absent.
- AI endpoints without an `ILMU_API_KEY`/`DEEPSEEK_API_KEY` use fallback
  responses — verdict flows still complete.

Run both as background processes; wait for "Ready" / "Uvicorn running"
before driving.

## 3. Drive with Playwright

Write a script in the scratchpad (never in the repo). In managed
environments use the pre-installed browser:

```js
const { chromium } = require("playwright");
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSERS_PATH
    ? "/opt/pw-browsers/chromium" : undefined,
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
```

**Mobile viewport (390×844) is mandatory** — this is a mobile-first app;
desktop-only verification misses the layout bugs that matter.

Key surfaces and how to reach them:
- `/` marketing landing → CTA to `/start` (guest onboarding)
- Guest mode: `localStorage.setItem("bb_guest_mode", "true")` then reload —
  unlocks the `(app)` shell without auth
- `/check` → Manual tab → enter amount/merchant → submit → assert
  `[data-testid="verdict-overlay"]` and `[data-testid="verdict-label"]`
- `/dashboard`, `/income`, `/budget` — data screens with skeleton/error states

## 4. What to check (beyond "it renders")

1. **The changed flow end-to-end** — click what a user clicks; don't curl
   the API underneath a UI change.
2. **Hydration integrity** — screenshot immediately after load AND after
   500ms; a difference = flash/stacked-screens regression.
3. **One adversarial probe minimum** — empty input, huge amount (RM999999),
   rapid double-submit, or reload mid-flow.
4. **Console errors** — collect `page.on("console")` and
   `page.on("pageerror")`; any red error is a finding even if pixels look
   right.

## 5. Evidence and verdict

- Save screenshots to the scratchpad with descriptive names
  (`check-verdict-boleh.png`, `income-sliders.png`) and send the decisive
  one to the user.
- Report as: **Verdict (PASS/FAIL/BLOCKED)** → steps taken → what each
  showed → findings (anything that made you pause, even off-scope).
- No partial pass: if 1 of 4 steps failed, the verdict is FAIL with the
  capture attached.
- If the server won't start or the page won't load, that's BLOCKED — report
  exactly where it stopped; it is not a pass and not a code verdict.
