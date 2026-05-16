#Requires -Version 5.1
<#
.SYNOPSIS
    BajetBuddy — GitHub remote monorepo setup script
    Run from inside your local repo root (where .git already exists)

.DESCRIPTION
    As project manager this script handles:
      1. Validates your local git state is clean and ready
      2. Creates the GitHub remote repo via gh CLI
      3. Adds branch protection rules on main
      4. Creates develop branch and sets it as default for PRs
      5. Writes all GitHub Actions workflow files
      6. Writes .gitignore, README, docker-compose, and .env templates
      7. Commits everything and pushes to remote
      8. Prints the live remote URL and next steps

.USAGE
    # Save as Setup-GitHubRemote.ps1 in your repo root, then:
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    .\Setup-GitHubRemote.ps1

.PREREQUISITES
    - git           : https://git-scm.com
    - GitHub CLI    : winget install GitHub.cli  (then: gh auth login)
    - Node.js 20+   : https://nodejs.org
    - Python 3.11+  : https://python.org
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Config — edit these before running ────────────────────────────────────────
$REPO_NAME    = "bajet-buddy"
$GITHUB_USER  = "YOUR_GITHUB_USERNAME"    # <-- change this
$DESCRIPTION  = "Malaysian AI-powered personal finance intervention app"
$VISIBILITY   = "public"                  # public | private
$DEFAULT_BRANCH = "main"
$DEV_BRANCH     = "develop"
# ──────────────────────────────────────────────────────────────────────────────

function Write-Step([string]$msg) {
    Write-Host "`n━━━ $msg" -ForegroundColor Cyan
}
function Write-Ok([string]$msg) {
    Write-Host "  ✓ $msg" -ForegroundColor Green
}
function Write-Warn([string]$msg) {
    Write-Host "  ⚠ $msg" -ForegroundColor Yellow
}
function Write-Fail([string]$msg) {
    Write-Host "  ✗ $msg" -ForegroundColor Red
    exit 1
}

# ── Guard: ensure we're inside a git repo ─────────────────────────────────────
Write-Step "Validating local repository"

if (-not (Test-Path ".git")) {
    Write-Fail "No .git folder found. Run this script from your repo root."
}
Write-Ok ".git folder detected"

# ── Guard: ensure gh CLI is authenticated ─────────────────────────────────────
try {
    $null = gh auth status 2>&1
    Write-Ok "GitHub CLI authenticated"
} catch {
    Write-Fail "GitHub CLI not authenticated. Run: gh auth login"
}

# ── Guard: check for uncommitted changes ──────────────────────────────────────
$status = git status --porcelain
if ($status) {
    Write-Warn "You have uncommitted local changes. They will be included in the initial push."
}

# ── Step 1: Write .gitignore ──────────────────────────────────────────────────
Write-Step "Writing .gitignore"

$gitignore = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/
dist/

# Python
__pycache__/
*.py[cod]
*`$py.class
*.so
.Python
venv/
env/
.venv/
*.egg-info/
.pytest_cache/
.ruff_cache/
htmlcov/
.coverage
coverage.xml

# Environment — never commit real secrets
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local
!.env.example

# IDEs
.vscode/settings.json
.idea/
*.swp
*.swo
*.suo
.vs/

# OS
.DS_Store
Thumbs.db
desktop.ini

# Docker
.docker/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Testing
playwright-report/
test-results/
.playwright/

# Vercel
.vercel/

# Railway
.railway/

# Misc
*.tsbuildinfo
next-env.d.ts
"@

Set-Content -Path ".gitignore" -Value $gitignore -Encoding UTF8
Write-Ok ".gitignore written"

# ── Step 2: Write README.md ───────────────────────────────────────────────────
Write-Step "Writing README.md"

$readme = @"
# BajetBuddy

> Malaysia's first AI-powered behavioural finance intervention engine.
> Stops bad spending decisions **before** they happen — not after.

## Demo story
Sarah, 26, fresh grad in PJ, earns RM3,200/month. It's Day 18.
She has RM340 left for 7 days and tries to buy a RM189 dress on Shopee.
BajetBuddy fires a `Jangan dulu` nudge. She saves to wishlist instead.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | FastAPI (Python 3.11) |
| AI Agent | LangGraph + Claude API (claude-sonnet-4) |
| Database | Supabase PostgreSQL + pgvector + RLS |
| Cache | Redis |
| Auth | Supabase Auth (magic link) |
| Deploy | Vercel (FE) + Railway (BE) |
| CI/CD | GitHub Actions |

## Quick start

```powershell
# Clone
git clone https://github.com/$GITHUB_USER/$REPO_NAME.git
cd $REPO_NAME

# Frontend
cd frontend
npm install
npm run dev        # http://localhost:3000

# Backend (new terminal)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload   # http://localhost:8000

# Full stack via Docker
docker-compose up
```

## Environment setup

1. Copy `frontend/.env.example` → `frontend/.env.local`
2. Copy `backend/.env.example` → `backend/.env`
3. Fill in real Supabase URL/keys and Anthropic API key
4. Run `supabase/schema.sql` in your Supabase SQL Editor

## Branch strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production — protected, requires PR |
| `develop` | Integration — base branch for all feature PRs |
| `feat/*` | Feature branches — branch from develop |
| `fix/*` | Bug fixes |
| `chore/*` | Non-functional changes |

## Architecture

```
Browser (Next.js PWA) → FastAPI (Railway)
                              ↓
                    LangGraph Agent Pipeline
                    context → risk → nudge → persona
                              ↓
                    Claude API (bilingual BM/EN nudge)
                              ↓
                    Supabase PostgreSQL (RLS)
                    Redis (nudge dedup + cache)
```
"@

Set-Content -Path "README.md" -Value $readme -Encoding UTF8
Write-Ok "README.md written"

# ── Step 3: Write .env.example files ──────────────────────────────────────────
Write-Step "Writing .env.example files"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path "frontend" | Out-Null
New-Item -ItemType Directory -Force -Path "backend" | Out-Null

$frontendEnvExample = @"
# BajetBuddy — Frontend environment variables
# Copy this file to .env.local and fill in real values
# NEVER commit .env.local to git

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
"@

$backendEnvExample = @"
# BajetBuddy — Backend environment variables
# Copy this file to .env and fill in real values
# NEVER commit .env to git

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key
REDIS_URL=redis://localhost:6379
SECRET_KEY=change-this-to-a-random-64-char-string
ENVIRONMENT=development
ALLOWED_ORIGINS=["http://localhost:3000"]
"@

Set-Content -Path "frontend\.env.example" -Value $frontendEnvExample -Encoding UTF8
Set-Content -Path "backend\.env.example"  -Value $backendEnvExample  -Encoding UTF8
Write-Ok "frontend/.env.example written"
Write-Ok "backend/.env.example written"

# ── Step 4: Write docker-compose.yml ──────────────────────────────────────────
Write-Step "Writing docker-compose.yml"

$dockerCompose = @"
version: "3.9"

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file: ./backend/.env
    depends_on:
      redis:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --maxmemory 128mb --maxmemory-policy allkeys-lru --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

volumes:
  redis_data:
"@

Set-Content -Path "docker-compose.yml" -Value $dockerCompose -Encoding UTF8
Write-Ok "docker-compose.yml written"

# ── Step 5: Write GitHub Actions workflows ────────────────────────────────────
Write-Step "Writing GitHub Actions workflows"

New-Item -ItemType Directory -Force -Path ".github\workflows" | Out-Null

$frontendCI = @"
name: Frontend CI

on:
  push:
    branches: [main, develop]
    paths: [frontend/**]
  pull_request:
    branches: [main, develop]
    paths: [frontend/**]

jobs:
  lint-and-build:
    name: Lint and build
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: `${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: `${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_API_URL: `${{ secrets.NEXT_PUBLIC_API_URL }}

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    needs: lint-and-build
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npx playwright test
        env:
          NEXT_PUBLIC_SUPABASE_URL: `${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: `${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_API_URL: `${{ secrets.NEXT_PUBLIC_API_URL }}

      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: frontend/playwright-report/
          retention-days: 7
"@

$backendCI = @"
name: Backend CI

on:
  push:
    branches: [main, develop]
    paths: [backend/**]
  pull_request:
    branches: [main, develop]
    paths: [backend/**]

jobs:
  test:
    name: Pytest
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    defaults:
      run:
        working-directory: backend

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: backend/requirements.txt

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Run tests with coverage
        run: pytest tests/ -v --cov=app --cov-report=xml --cov-fail-under=70
        env:
          SUPABASE_URL: `${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: `${{ secrets.SUPABASE_SERVICE_KEY }}
          ANTHROPIC_API_KEY: `${{ secrets.ANTHROPIC_API_KEY }}
          REDIS_URL: redis://localhost:6379
          SECRET_KEY: test-secret-key-ci
          ENVIRONMENT: test

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        if: always()
        with:
          file: backend/coverage.xml
          flags: backend

  deploy:
    name: Deploy to Railway
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Deploy
        run: railway up --service bajetbuddy-backend
        env:
          RAILWAY_TOKEN: `${{ secrets.RAILWAY_TOKEN }}

      - name: Health check
        run: |
          sleep 15
          curl --fail https://api.bajetbuddy.app/health || exit 1
"@

$prTemplate = @"
## Summary
<!-- What does this PR do? One sentence. -->

## Type of change
- [ ] feat: new feature
- [ ] fix: bug fix
- [ ] chore: non-functional change
- [ ] docs: documentation only
- [ ] refactor: code change, no feature

## Checklist
- [ ] Tests pass locally (`pytest` / `npm run test`)
- [ ] No console errors in browser
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] `.env.example` updated if new env vars added
- [ ] PR targets `develop`, not `main`

## Demo / screenshots
<!-- For frontend changes: attach a screenshot or screen recording -->

## Related issues
Closes #
"@

Set-Content -Path ".github\workflows\frontend.yml" -Value $frontendCI -Encoding UTF8
Set-Content -Path ".github\workflows\backend.yml"  -Value $backendCI  -Encoding UTF8

New-Item -ItemType Directory -Force -Path ".github\PULL_REQUEST_TEMPLATE" | Out-Null
Set-Content -Path ".github\PULL_REQUEST_TEMPLATE\pull_request_template.md" -Value $prTemplate -Encoding UTF8

Write-Ok ".github/workflows/frontend.yml"
Write-Ok ".github/workflows/backend.yml"
Write-Ok ".github/PULL_REQUEST_TEMPLATE/pull_request_template.md"

# ── Step 6: Stage and commit everything locally ────────────────────────────────
Write-Step "Staging and committing local files"

git add --all
$commitMsg = "chore: initial monorepo scaffold — gitignore, README, CI/CD, docker-compose, env templates"

try {
    git commit -m $commitMsg
    Write-Ok "Initial commit created"
} catch {
    Write-Warn "Nothing new to commit (files may already be committed). Continuing."
}

# ── Step 7: Create GitHub remote repo ─────────────────────────────────────────
Write-Step "Creating GitHub remote repository"

$repoExists = gh repo view "$GITHUB_USER/$REPO_NAME" 2>&1
if ($repoExists -notmatch "error|not found") {
    Write-Warn "Repo $GITHUB_USER/$REPO_NAME already exists on GitHub. Skipping creation."
} else {
    gh repo create "$GITHUB_USER/$REPO_NAME" `
        --$VISIBILITY `
        --description "$DESCRIPTION" `
        --source=. `
        --remote=origin `
        --push
    Write-Ok "GitHub repo created: https://github.com/$GITHUB_USER/$REPO_NAME"
}

# ── Step 8: Ensure remote is set and push ────────────────────────────────────
Write-Step "Pushing to remote"

$remotes = git remote
if ($remotes -notcontains "origin") {
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    Write-Ok "Remote 'origin' added"
}

git push --set-upstream origin $DEFAULT_BRANCH 2>&1
Write-Ok "Pushed $DEFAULT_BRANCH to origin"

# ── Step 9: Create develop branch ─────────────────────────────────────────────
Write-Step "Creating develop branch"

$branches = git branch --list $DEV_BRANCH
if ($branches) {
    Write-Warn "Branch '$DEV_BRANCH' already exists locally. Pushing to remote."
    git push origin $DEV_BRANCH 2>&1
} else {
    git checkout -b $DEV_BRANCH
    git push --set-upstream origin $DEV_BRANCH
    git checkout $DEFAULT_BRANCH
    Write-Ok "Branch '$DEV_BRANCH' created and pushed"
}

# ── Step 10: Branch protection on main ────────────────────────────────────────
Write-Step "Configuring branch protection on main"

try {
    gh api "repos/$GITHUB_USER/$REPO_NAME/branches/$DEFAULT_BRANCH/protection" `
        --method PUT `
        --field required_status_checks='{"strict":true,"contexts":["Lint and build","Pytest"]}' `
        --field enforce_admins=$false `
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' `
        --field restrictions=$null `
        --field allow_force_pushes=$false `
        --field allow_deletions=$false | Out-Null
    Write-Ok "Branch protection rules set on '$DEFAULT_BRANCH'"
    Write-Ok "  Requires: 1 approving review, CI passing, no force push"
} catch {
    Write-Warn "Could not set branch protection (requires GitHub Pro/Teams or public repo with admin rights). Set manually in Settings → Branches."
}

# ── Step 11: Add GitHub repo secrets reminder ─────────────────────────────────
Write-Step "Repository secrets — action required"

$secrets = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_API_URL",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "ANTHROPIC_API_KEY",
    "RAILWAY_TOKEN"
)

Write-Host ""
Write-Host "  Add these secrets at:" -ForegroundColor Yellow
Write-Host "  https://github.com/$GITHUB_USER/$REPO_NAME/settings/secrets/actions" -ForegroundColor Blue
Write-Host ""
foreach ($s in $secrets) {
    Write-Host "    $_  = <fill in>" -ForegroundColor White
}

# Attempt to open the secrets page automatically
Start-Process "https://github.com/$GITHUB_USER/$REPO_NAME/settings/secrets/actions"

# ── Done ──────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host " BajetBuddy monorepo is live on GitHub!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host " Remote URL  : https://github.com/$GITHUB_USER/$REPO_NAME" -ForegroundColor Cyan
Write-Host " Main branch : $DEFAULT_BRANCH  (protected)"
Write-Host " Dev branch  : $DEV_BRANCH      (base for all PRs)"
Write-Host " Actions     : https://github.com/$GITHUB_USER/$REPO_NAME/actions"
Write-Host ""
Write-Host " Next steps (in order):" -ForegroundColor Yellow
Write-Host "  1. Add the 7 GitHub secrets listed above"
Write-Host "  2. Connect Vercel to this repo  → https://vercel.com/new"
Write-Host "     Root directory: frontend"
Write-Host "  3. Connect Railway to this repo → https://railway.app/new"
Write-Host "     Root directory: backend"
Write-Host "  4. Run the Supabase schema:    supabase/schema.sql"
Write-Host "  5. Start coding on develop:"
Write-Host "     git checkout $DEV_BRANCH"
Write-Host "     git checkout -b feat/phase-3-langgraph-agent"
Write-Host ""
Write-Host " Branch workflow:" -ForegroundColor Yellow
Write-Host "  feat/* → develop (PR) → main (PR, protected)"
Write-Host ""
