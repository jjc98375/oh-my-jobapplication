# New Machine Setup Guide

Step-by-step to get all three services running locally from a fresh clone.

## Prerequisites

- **Node.js** 20+ (`node --version`)
- **Python** 3.13 (`python3 --version`)
- **Chrome** browser (for extension development)
- A **Supabase** project (free tier works)
- **Anthropic API key** (for Claude)
- **Google OAuth** credentials (for web app auth)
- **LinkedIn OAuth** credentials (optional, for LinkedIn login)

## 1. Clone & Root Setup

```bash
git clone https://github.com/jjc98375/oh-my-jobapplication.git
cd oh-my-jobapplication
```

## 2. Database — Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run migrations in order:

```bash
# Run these in Supabase SQL Editor (in order):
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_security_fixes.sql
```

3. Note your project's **URL** and **service role key** from Project Settings → API.

## 3. AI Backend (Python FastAPI)

```bash
cd ai-backend

# Create virtualenv
python3 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Edit `ai-backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...           # From console.anthropic.com
AI_API_KEY=any-random-secret-string    # Shared secret with web app
WEB_APP_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

Start the server:

```bash
uvicorn main:app --reload
# Runs on http://localhost:8000
# Health check: http://localhost:8000/health
```

## 4. Web App (Next.js)

```bash
cd web
npm install

# Configure environment
cp .env.local.example .env.local
```

Edit `web/.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# NextAuth
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (create at console.cloud.google.com)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# LinkedIn OAuth (create at linkedin.com/developers)
LINKEDIN_CLIENT_ID=...
LINKEDIN_CLIENT_SECRET=...

# AI backend
AI_BACKEND_URL=http://localhost:8000
AI_API_KEY=any-random-secret-string   # Must match ai-backend AI_API_KEY
```

**Google OAuth setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

**LinkedIn OAuth setup:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create an app, add "Sign In with LinkedIn using OpenID Connect" product
3. Add redirect URL: `http://localhost:3000/api/auth/callback/linkedin`

Start the server:

```bash
npm run dev
# Runs on http://localhost:3000
```

## 5. Chrome Extension

```bash
cd extension
npm install
```

The extension uses Vite env vars. For local development defaults are fine (it points to `localhost:3000` and `localhost:8000` already in `wxt.config.ts`).

Build and load:

```bash
npm run build
# Output at: extension/.output/chrome-mv3/

# Or for live reload during development:
npm run dev
```

**Load in Chrome:**
1. Open Chrome → `chrome://extensions/`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select `extension/.output/chrome-mv3/`

## 6. Verify Everything Works

With all three services running:

1. Visit `http://localhost:3000` — landing page should load
2. Sign in with Google — creates user + profile in Supabase
3. Fill out your profile at `/profile`
4. Open the Chrome extension popup
5. Click "Connect" — it should exchange a token and show as authenticated
6. Paste a LinkedIn jobs URL and click Start

## Running All Services

Open three terminal tabs:

```bash
# Tab 1 — AI Backend
cd ai-backend && source .venv/bin/activate && uvicorn main:app --reload

# Tab 2 — Web App
cd web && npm run dev

# Tab 3 — Extension (watch mode for development)
cd extension && npm run dev
```

## Troubleshooting

**Extension says "Not authenticated"**
- Make sure you're signed in to the web app first
- Check that `AI_API_KEY` matches in both `ai-backend/.env` and `web/.env.local`

**Screening questions fail**
- Check `ANTHROPIC_API_KEY` is valid in `ai-backend/.env`
- Check AI backend is running: `curl http://localhost:8000/health`

**OAuth redirect errors**
- Double-check redirect URIs in Google/LinkedIn developer consoles match exactly
- `NEXTAUTH_URL` must match the URL you're using in the browser

**Supabase connection errors**
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Check migrations ran successfully (look for `users`, `profiles`, `applications` tables)

**Next.js import errors**
- This project uses Next.js 16.2.3 which has breaking changes. Do not assume Next.js 14/15 patterns work. Check `node_modules/next/dist/` if needed.
