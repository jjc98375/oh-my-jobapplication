# oh-my-jobapplication

AI-powered job application automation platform. A Chrome extension + web app that automatically applies to job listings on LinkedIn (and eventually Indeed, Jobright, Greenhouse, Lever). The extension runs inside the user's browser, fills out application forms, answers screening questions using Claude AI, and tracks daily limits.

## Architecture

Three components working together:

```
┌─────────────────────────────────────────────────────┐
│  Chrome Extension (TypeScript + WXT)                 │
│  - Popup UI: URL input, Start/Pause/Stop, live log   │
│  - Content script: scrape jobs, fill forms, submit   │
│  - Background worker: apply loop, queue, daily limit │
│  - Platform adapters: LinkedIn (MVP), more in Ph3    │
└───────────────┬─────────────────────┬───────────────┘
                │                     │
                ▼                     ▼
┌──────────────────────┐   ┌──────────────────────────┐
│  Next.js Web App     │   │  Python FastAPI Backend   │
│  (TypeScript)        │   │  (AI Engine)              │
│  - Auth (NextAuth)   │   │  - /screening/answer      │
│  - Profile editor    │   │  - /mapping/fields        │
│  - Dashboard         │   │  - Claude API integration │
│  - Extension token   │   │                           │
│    exchange API      │   │                           │
└──────────┬───────────┘   └──────────────────────────┘
           │
           ▼
┌──────────────────────┐
│  Supabase (Postgres) │
│  - users             │
│  - profiles          │
│  - applications      │
└──────────────────────┘
```

## Project Status

**Phase 1 (MVP) — Complete**
- Google + LinkedIn OAuth, manual profile builder, minimal dashboard
- Chrome extension with LinkedIn Easy Apply adapter
- AI screening question generation + field mapping
- Daily limit enforcement (10 apps/day), pause/resume/stop controls
- Extension authenticates via token exchange with web app

**Phase 2 — Next**
- Stripe payments ($9.99/week for +10 daily apps)
- Resume drag & drop with AI parsing
- EEO data fields with encryption

**Phase 3 — Planned**
- Indeed, Jobright, Greenhouse, Lever adapters
- Generic AI-powered fallback for unknown job sites
- Dashboard analytics

**Phase 4 — Future**
- Server-side autonomous tier (Playwright/Puppeteer) with credit packs

## Directory Structure

```
oh-my-jobapplication/
├── ai-backend/          # Python FastAPI — AI screening & field mapping
│   ├── main.py          # App entrypoint, CORS, API key auth
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── screening.py # POST /screening/answer
│   │   └── mapping.py   # POST /mapping/fields
│   ├── services/
│   │   ├── question_generator.py  # Claude API calls
│   │   └── field_mapper.py        # Profile → form field mapping
│   ├── models/schemas.py
│   └── tests/
│
├── web/                 # Next.js 16 App Router — dashboard & auth
│   ├── src/app/
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/page.tsx # Application list + stats
│   │   ├── profile/page.tsx   # Profile editor
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # OAuth
│   │       ├── extension/token/route.ts     # Token exchange
│   │       ├── profile/route.ts
│   │       └── applications/route.ts
│   ├── src/lib/
│   │   ├── auth.ts        # NextAuth config
│   │   ├── supabase.ts    # Supabase client
│   │   └── types.ts
│   └── .env.local.example
│
├── extension/           # Chrome Extension (Manifest V3, WXT)
│   ├── src/entrypoints/
│   │   ├── popup/App.tsx        # Popup UI
│   │   ├── content/index.ts     # Content script
│   │   └── background.ts        # Service worker / apply loop
│   ├── src/adapters/
│   │   ├── base.ts              # PlatformAdapter interface
│   │   ├── linkedin.ts          # LinkedIn Easy Apply
│   │   └── detector.ts          # Auto-detect platform
│   ├── src/lib/
│   │   ├── api.ts               # HTTP client
│   │   ├── storage.ts           # Chrome storage wrapper
│   │   └── types.ts
│   └── wxt.config.ts
│
├── supabase/migrations/
│   ├── 001_initial_schema.sql   # users, profiles, applications
│   └── 002_security_fixes.sql   # extension_token, daily limit fn
│
├── docs/superpowers/
│   ├── specs/2026-04-12-oh-my-jobapplication-design.md
│   └── plans/2026-04-13-mvp-implementation.md
│
├── AGENTS.md            # Context for AI agents (read this first)
└── SETUP.md             # New machine setup guide
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Web app | Next.js 16.2.3, React 19, TypeScript, TailwindCSS 4 |
| Auth | NextAuth 5.0 beta (Google + LinkedIn OAuth) |
| Extension | WXT 0.20.21, React 19, Manifest V3 |
| AI backend | Python 3.13, FastAPI 0.115.0, Uvicorn |
| AI provider | Claude (Anthropic SDK 0.39.0) |
| Database | Supabase (PostgreSQL) |
| Deployment | Vercel (web), Railway/Render (AI backend) |

## Quick Start

See [SETUP.md](SETUP.md) for detailed new-machine setup instructions.

**TL;DR:**
```bash
# 1. AI Backend
cd ai-backend && cp .env.example .env  # fill in keys
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload

# 2. Web App
cd web && cp .env.local.example .env.local  # fill in keys
npm install && npm run dev

# 3. Extension
cd extension && npm install
npm run build  # loads into .output/
# Load .output/chrome-mv3/ as unpacked extension in Chrome
```
