# Agent Context — oh-my-jobapplication

Read this before starting any work. It gives you the project state, key decisions already made, and what comes next.

## What This Project Is

AI-powered job application automation. A Chrome extension scrapes job listings from LinkedIn (and eventually other boards), fills out application forms using the user's stored profile, and answers screening questions using Claude AI. A Next.js web app handles auth + profile management + dashboard. A FastAPI backend runs the AI calls.

Full design spec: [`docs/superpowers/specs/2026-04-12-oh-my-jobapplication-design.md`](docs/superpowers/specs/2026-04-12-oh-my-jobapplication-design.md)
Implementation plan: [`docs/superpowers/plans/2026-04-13-mvp-implementation.md`](docs/superpowers/plans/2026-04-13-mvp-implementation.md)

## Current State (as of 2026-04-17)

**Phase 1 MVP is complete and merged to `main`.** All core functionality works:

- Google + LinkedIn OAuth via NextAuth 5
- Manual profile builder (web app)
- Chrome extension popup with Start/Pause/Resume/Stop controls
- LinkedIn Easy Apply adapter (scraping + form detection + field filling)
- AI screening question generation via Claude (with profile-based fallback)
- Field mapping service (profile → form fields)
- Daily limit enforcement (10 apps/day, atomic DB counter)
- Extension auth via token exchange endpoint (`/api/extension/token`)
- Dashboard showing applied/pending/failed applications
- Security hardened (code review addressed critical issues in `e13d747`)

## What's Next — Phase 2

1. **Stripe payments** — $9.99/week subscription for +10 daily apps
2. **Resume upload** — drag & drop PDF/DOCX with AI parsing to populate profile
3. **EEO data fields** — gender, ethnicity, veteran status, disability status (stored separately, encrypted at rest)

## Architecture in One Paragraph

The extension's background service worker orchestrates the apply loop. It reads the job URL from the popup, passes it to a content script, which uses a platform adapter (currently only `linkedin.ts`) to scrape listings and fill forms. Form fields and screening questions go to the FastAPI AI backend (`/screening/answer`, `/mapping/fields`). The backend calls Claude API and returns answers + field mappings. The extension fills fields, submits, and reports the result to the web app's `/api/applications` endpoint. Daily limits are enforced at the DB level with an atomic `increment_apps_today()` Postgres function.

## Key File Locations

| What | Where |
|------|-------|
| Apply loop orchestration | `extension/src/entrypoints/background.ts` |
| LinkedIn scraping + form fill | `extension/src/adapters/linkedin.ts` |
| Platform auto-detection | `extension/src/adapters/detector.ts` |
| AI question generation | `ai-backend/services/question_generator.py` |
| Profile → field mapping | `ai-backend/services/field_mapper.py` |
| Pydantic schemas | `ai-backend/models/schemas.py` |
| NextAuth config | `web/src/lib/auth.ts` |
| Supabase client | `web/src/lib/supabase.ts` |
| Extension token exchange | `web/src/app/api/extension/token/route.ts` |
| DB migrations | `supabase/migrations/` |

## Key Technical Decisions

- **WXT** (not plain Webpack/Vite) for extension bundling — handles Manifest V3 complexity, HMR, and React integration cleanly.
- **NextAuth 5 beta** — required for React 19 / Next.js 16 compatibility. Note: API differs from v4. Check `node_modules/next-auth/` before writing auth code.
- **Extension token auth** — the extension can't share browser cookies with the web app in Manifest V3. Instead, the web app issues a long-lived `extension_token` stored in the `users` table, exchanged via `/api/extension/token`.
- **Profile-first, AI-second** — `question_generator.py` first tries to answer screening questions from the user's stored profile (keyword matching), only falling back to Claude for questions it can't answer. Reduces API costs.
- **Atomic daily limit** — `increment_apps_today()` Postgres function does `UPDATE ... RETURNING` to prevent race conditions. Daily reset runs via `pg_cron` at midnight UTC.
- **No EEO table yet** — the design spec includes an `eeo_data` table but it's not in the migrations yet. Placeholder for Phase 2.

## Critical Warnings

- **Next.js 16.2.3** has breaking changes from training data. Always read `node_modules/next/dist/` or use the web docs before writing Next.js code. Do not rely on memorized Next.js patterns.
- **NextAuth 5 beta** — `auth()` is now a server-side function, session config differs from v4. Check existing `web/src/lib/auth.ts` patterns before adding auth logic.
- **React 19** — some patterns (e.g., `use()` hook, server actions) differ from React 18. Follow existing code patterns.
- **Supabase service role key** is only used server-side (API routes). Never expose it client-side.
- **Extension host permissions** are hardcoded to `localhost:3000` and `localhost:8000` in `wxt.config.ts` — update for production deployment.

## Environment Variables

See [`SETUP.md`](SETUP.md) for the full list. Three separate `.env` files needed:
- `ai-backend/.env` (copy from `.env.example`)
- `web/.env.local` (copy from `.env.local.example`)
- Extension uses Vite env vars in `wxt.config.ts` (no separate file needed for local dev)

## Running Locally

```bash
# Terminal 1 — AI backend
cd ai-backend && source .venv/bin/activate && uvicorn main:app --reload

# Terminal 2 — Web app
cd web && npm run dev

# Terminal 3 — Extension (watch mode)
cd extension && npm run dev
# Then load extension/.output/chrome-mv3/ as unpacked extension in Chrome
```

## Repository

- GitHub: https://github.com/jjc98375/oh-my-jobapplication
- Main branch: `main`
- Worktrees live in `.claude/worktrees/` (managed by oh-my-claudecode)
