# oh-my-jobapplication — Design Spec

## Overview

A Chrome extension + web app that automates job applications. Users paste job listing page URLs (LinkedIn tracker, Jobright recommendations, Indeed search results), and an AI-powered browser agent scrapes the listings, generates tailored answers to screening questions, fills out application forms, and submits — all inside the user's own browser.

## Product Tiers & Pricing

| Tier | How it works | Pricing |
|------|-------------|---------|
| **Main product** (browser agent) | Chrome extension applies through user's browser, 10 apps/day base | Free base, +$9.99/week for 10 more daily |
| **Fully autonomous** (server-side) | Server-side agent hits major ATS platforms, batch applies | $25/20, $45/50, $100/100 apps (Phase 4) |

No free "smart assist" tier — competitors (Simplify, JobBright) already serve that market.

## Architecture — Extension-First (Hybrid)

Three components working together:

### 1. Chrome Extension (TypeScript) — The Brain

The extension handles all browser automation: scraping job listing pages, detecting form fields, filling applications, and submitting.

**Internal structure:**

- **Popup UI** — URL input field, Start/Pause/Stop/Skip controls, live status feed, daily application count, settings.
- **Service Worker** — Orchestrates the apply loop, manages the job queue, communicates with the web app API and AI backend, tracks daily limits, handles pause/resume state.
- **Content Scripts** — Injected into job pages. Scrapes job listings, detects form fields and question types, fills inputs and selects, clicks submit buttons, detects login walls and CAPTCHAs.

**Platform adapters** — Each supported platform has its own adapter that understands that site's specific DOM structure for scraping listings and filling forms:

- **LinkedIn** — Jobs tracker page, Easy Apply multi-step modals.
- **Indeed** — Search results, Indeed Apply flow, screening questions.
- **Jobright** — Recommendations page, external redirects to various ATS forms.
- **Greenhouse** — Standard application form, file upload, custom questions.
- **Lever** — Apply form, resume upload, custom fields.
- **Generic Fallback** — AI-powered field detection for unknown sites. Best-effort form matching.

MVP ships with LinkedIn adapter only. Other adapters added in Phase 3.

### 2. Next.js Web App (TypeScript) — Dashboard & Auth

Handles everything that isn't browser automation:

- **Authentication** — Google + LinkedIn social login (NextAuth).
- **Profile management** — Manual entry of personal info, work experience, education, skills, job preferences, EEO data. Resume drag-and-drop import (Phase 2).
- **Dashboard** — Minimal: application list with status (applied/pending/failed), basic stats, daily count.
- **Payments** — Stripe integration for $9.99/week subscription (Phase 2).
- **Extension communication** — API endpoints for the extension to report application results and fetch user profile data.

Deployed on Vercel.

### 3. Python FastAPI — AI Engine

Handles compute-heavy AI operations:

- **Screening question answer generation** — Takes the job description + user profile and generates tailored answers to company-specific questions ("Why do you want to work here?", "Describe your experience with X", custom free-text questions).
- **Field mapping** — Maps user profile fields to application form fields.
- **Profile-based auto-fill** — Work authorization, salary range, years of experience, start date, EEO fields.
- **Resume parsing** — Extracts structured data from PDF/DOCX resumes (Phase 2).
- **AI provider** — Claude or OpenAI API.

Deployed on Railway or Render.

### 4. PostgreSQL (Supabase) — Database

Five core tables:

**users**
- `id` (uuid, PK), `email`, `name`, `avatar_url`, `auth_provider` (google|linkedin), `daily_limit` (int, default 10), `apps_today` (int, resets to 0 at midnight UTC daily via scheduled cron job), `created_at`

**profiles**
- `user_id` (FK → users), `phone`, `location`, `resume_url`, `work_experience` (jsonb[]), `education` (jsonb[]), `skills` (string[]), `work_authorization`, `salary_expectation` (jsonb: min/max/currency), `willing_to_relocate` (boolean)

**eeo_data** (stored separately for sensitive data isolation, encrypted at rest)
- `user_id` (FK → users), `gender`, `ethnicity`, `veteran_status`, `disability_status`

**subscriptions**
- `id` (uuid, PK), `user_id` (FK → users), `plan` (weekly_10), `stripe_sub_id`, `status` (active|cancelled|expired), `current_period_end`, `created_at`

**applications**
- `id` (uuid, PK), `user_id` (FK → users), `job_url`, `company_name`, `job_title`, `job_description` (text), `status` (applied|pending|failed|skipped), `failure_reason` (nullable), `questions_answered` (jsonb[] — Q&A pairs), `source_url` (original listing page), `platform` (linkedin|indeed|jobright|other), `applied_at`

**Relationships:**
- users 1:1 profiles
- users 1:1 eeo_data
- users 1:0..1 subscriptions (active)
- users 1:N applications

## User Flow

1. **Sign up** — User visits web app, clicks "Sign in with Google" or "Sign in with LinkedIn", account created instantly.
2. **Build profile** — Two paths: drag & drop resume for AI parsing (Phase 2), or manual step-by-step entry (personal info → experience → education → skills → EEO → job preferences).
3. **Install extension** — Web app prompts user to install Chrome extension. Extension authenticates by reading the auth token from the web app (via shared cookie or token exchange through the web app API). User stays logged in across both.
4. **Paste job listing URL** — User pastes a URL into the extension popup (e.g., `linkedin.com/jobs-tracker/`, `jobright.ai/jobs/recommend`, `indeed.com/jobs?q=...`).
5. **Agent applies** — Extension takes over. User watches in real-time:
   - Scrapes page for job listings
   - Opens first job application
   - Detects form fields and screening questions
   - Sends questions to AI engine, gets tailored answers
   - Fills all fields (profile data + AI answers)
   - Uploads resume if required
   - Submits, moves to next job
   - Login wall detected → pauses and alerts user → resumes after manual login
   - CAPTCHA encountered → pauses, shows to user for manual solve
6. **Track on dashboard** — Extension reports results. Dashboard shows: applied, pending, failed (with reason), plus daily count toward limit.

**User controls** available anytime during step 5: Pause, Resume, Stop, Skip this job.

## The Apply Loop (Extension)

1. Navigate to pasted URL → detect which platform adapter to use.
2. Adapter scrapes page → extracts list of job postings (title, company, apply link).
3. Queue jobs → check daily limit → pick next job.
4. Open job application page → detect form type (Easy Apply modal, ATS page, etc.).
5. Extract all form fields + screening questions → send to AI engine.
6. AI returns: field mappings (profile → form) + generated answers for screening questions.
7. Fill all fields → upload resume → handle multi-step forms (Next/Continue buttons).
8. Submit → report result to web app API → increment daily count → next job.

**Error handling:**
- Login wall detected → pause, notify user, wait for resume.
- CAPTCHA encountered → pause, show to user for manual solve.
- Form field not matched → skip field, log for review, continue.
- Submission fails → mark as failed with reason, move to next.

## Screening Question Types

**Profile-based (auto-fill from stored data):**
- Work authorization status
- Expected salary / range
- Willing to relocate
- Years of experience
- Start date availability
- EEO: gender, ethnicity, veteran status, disability status

**AI-generated (tailored per job description):**
- "Why do you want to work at [Company]?"
- "Describe your experience with [Tech/Skill]"
- "What makes you a good fit for this role?"
- "Tell us about a challenge you faced"
- Custom company-specific free-text questions
- Multi-choice and dropdown matching

## Infrastructure & Costs

| Service | Purpose | Cost at 1,000 users |
|---------|---------|---------------------|
| Vercel | Next.js web app | Free – $20/mo |
| Railway or Render | Python AI backend | $5 – $20/mo |
| Supabase | PostgreSQL + Auth | Free – $25/mo |
| **Infrastructure total** | | **~$30–65/mo** |
| **AI API calls** | 10K screening question generations/day | **~$3,000–9,000/mo** |

AI API costs are the primary expense. Pricing must cover this.

## Phased Roadmap

### Phase 1 — MVP

- **Web App:** Landing page, Google + LinkedIn auth, manual profile builder, minimal dashboard (application list + status), extension install prompt.
- **Extension:** Popup with URL input + Start/Stop, LinkedIn Easy Apply adapter only, basic form field detection + filling, daily limit enforcement (10/day), status reporting to web app.
- **AI Backend:** Screening question answer generation, basic field mapping, single AI provider.
- **Database:** Users, profiles, applications tables. Supabase setup. No payments.

**MVP is done when:**
- User can sign up with Google or LinkedIn.
- User can fill out their profile manually.
- User can install the Chrome extension and it authenticates.
- User can paste a LinkedIn jobs tracker URL.
- Extension scrapes jobs, fills Easy Apply forms with AI-generated answers, and submits.
- Dashboard shows list of applied/pending/failed applications.
- Daily limit of 10 applications is enforced.

### Phase 2 — Monetization

- Stripe payments ($9.99/week for +10 daily apps).
- Resume drag & drop with AI parsing.
- EEO data fields with encryption.

### Phase 3 — Scale

- Indeed, Jobright, Greenhouse, Lever platform adapters.
- Generic AI-powered fallback for unknown sites.
- Dashboard analytics (success rates, response tracking).

### Phase 4 — Future

- Fully autonomous server-side tier (Playwright/Puppeteer) with credit packs ($25/20, $45/50, $100/100).
- Smart job matching — AI recommends which jobs to apply for based on profile fit.

## Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| Web App | Next.js (App Router), TypeScript, Vercel |
| Auth | NextAuth (Google + LinkedIn providers) |
| Extension | Chrome Extension (Manifest V3), TypeScript |
| AI Backend | Python, FastAPI |
| AI Provider | Claude or OpenAI API |
| Database | PostgreSQL via Supabase |
| Payments | Stripe (Phase 2) |
| File Storage | Supabase Storage (resumes) |
