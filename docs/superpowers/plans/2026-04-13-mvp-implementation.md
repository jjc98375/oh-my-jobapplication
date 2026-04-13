# oh-my-jobapplication MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working MVP where a user can sign up, fill out their profile, install a Chrome extension, paste a LinkedIn jobs tracker URL, and have the agent auto-apply to jobs with AI-generated screening question answers — with a dashboard showing results and a 10/day limit.

**Architecture:** Extension-first hybrid. Chrome extension (Manifest V3 via WXT) handles browser automation and applies through the user's own browser. Next.js web app handles auth, profile, and dashboard. Python FastAPI backend handles AI operations (screening question generation, field mapping). PostgreSQL via Supabase for storage.

**Tech Stack:** Next.js 15 (App Router), NextAuth v5, TypeScript, Supabase (PostgreSQL), Python 3.12+, FastAPI, Anthropic Claude API, WXT (Chrome extension framework), React, Tailwind CSS.

---

## File Structure

```
oh-my-jobapplication/
├── .gitignore
├── README.md
│
├── web/                                    # Next.js web app
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── .env.local.example
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                  # Root layout with navbar
│   │   │   ├── page.tsx                    # Landing page
│   │   │   ├── api/
│   │   │   │   ├── auth/[...nextauth]/
│   │   │   │   │   └── route.ts            # NextAuth route handler
│   │   │   │   ├── profile/
│   │   │   │   │   └── route.ts            # GET/PUT user profile
│   │   │   │   ├── applications/
│   │   │   │   │   └── route.ts            # GET/POST applications
│   │   │   │   └── extension/
│   │   │   │       └── token/
│   │   │   │           └── route.ts        # Token exchange for extension
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                # Application list + stats
│   │   │   └── profile/
│   │   │       └── page.tsx                # Profile builder form
│   │   ├── lib/
│   │   │   ├── auth.ts                     # NextAuth config
│   │   │   ├── supabase.ts                 # Supabase server client
│   │   │   └── types.ts                    # Shared TypeScript types
│   │   └── components/
│   │       ├── navbar.tsx                   # Top navigation bar
│   │       ├── profile-form.tsx            # Profile form component
│   │       └── application-list.tsx        # Application list component
│   └── tests/
│       ├── api/
│       │   ├── profile.test.ts             # Profile API tests
│       │   └── applications.test.ts        # Applications API tests
│       └── setup.ts                        # Test setup
│
├── ai-backend/                             # Python FastAPI
│   ├── requirements.txt
│   ├── main.py                             # FastAPI app + CORS
│   ├── routers/
│   │   └── screening.py                    # POST /screening/answer
│   ├── services/
│   │   ├── question_generator.py           # Claude API for answers
│   │   └── field_mapper.py                 # Profile → form mapping
│   ├── models/
│   │   └── schemas.py                      # Pydantic request/response models
│   └── tests/
│       ├── test_screening.py
│       └── test_field_mapper.py
│
├── extension/                              # Chrome extension (WXT)
│   ├── package.json
│   ├── wxt.config.ts
│   ├── tsconfig.json
│   ├── src/
│   │   ├── entrypoints/
│   │   │   ├── popup/                      # Extension popup
│   │   │   │   ├── index.html
│   │   │   │   ├── App.tsx
│   │   │   │   ├── main.tsx
│   │   │   │   └── style.css
│   │   │   ├── background.ts               # Service worker
│   │   │   └── content/                    # Content scripts
│   │   │       └── index.ts
│   │   ├── lib/
│   │   │   ├── api.ts                      # API client (web app + AI)
│   │   │   ├── storage.ts                  # Chrome storage helpers
│   │   │   └── types.ts                    # Extension-specific types
│   │   └── adapters/
│   │       ├── base.ts                     # Base adapter interface
│   │       ├── detector.ts                 # URL → adapter matching
│   │       └── linkedin.ts                 # LinkedIn scraping + form filling
│   └── tests/
│       └── adapters/
│           └── linkedin.test.ts
│
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-04-12-oh-my-jobapplication-design.md
        └── plans/
            └── 2026-04-13-mvp-implementation.md
```

---

## Task 1: Project Scaffold + Git Setup

**Files:**
- Create: `.gitignore`
- Create: `web/package.json` (via CLI)
- Create: `ai-backend/requirements.txt`
- Create: `extension/package.json` (via CLI)

- [ ] **Step 1: Create root .gitignore**

```gitignore
# Dependencies
node_modules/
__pycache__/
*.pyc
.venv/

# Environment
.env
.env.local
.env.*.local

# Build output
.next/
out/
dist/
.output/

# IDE
.vscode/
.idea/
*.swp

# OS
.DS_Store
Thumbs.db

# Supabase
.superpowers/

# Extension
extension/.wxt/
```

- [ ] **Step 2: Scaffold Next.js web app**

Run:
```bash
cd oh-my-jobapplication
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

Expected: `web/` directory created with Next.js boilerplate.

- [ ] **Step 3: Scaffold Python AI backend**

Run:
```bash
mkdir -p ai-backend/{routers,services,models,tests}
touch ai-backend/{routers,services,models,tests}/__init__.py
```

Create `ai-backend/requirements.txt`:
```
fastapi==0.115.0
uvicorn==0.32.0
anthropic==0.39.0
pydantic==2.9.0
python-dotenv==1.0.1
pytest==8.3.0
httpx==0.27.0
```

Run:
```bash
cd ai-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Expected: Virtual environment created, dependencies installed.

- [ ] **Step 4: Scaffold Chrome extension with WXT**

Run:
```bash
cd oh-my-jobapplication
npx wxt@latest init extension --template react
```

Expected: `extension/` directory created with WXT boilerplate (popup, background, content script entry points).

- [ ] **Step 5: Commit scaffold**

```bash
git add .gitignore web/ ai-backend/ extension/
git commit -m "chore: scaffold project — Next.js web app, Python AI backend, Chrome extension"
```

---

## Task 2: Supabase Database Schema

**Files:**
- Create: `web/src/lib/supabase.ts`
- Create: `web/.env.local.example`
- Supabase dashboard: SQL editor

- [ ] **Step 1: Create Supabase project**

Go to [supabase.com](https://supabase.com), create a new project called `oh-my-jobapplication`. Copy the project URL and anon key.

Create `web/.env.local.example`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# AI Backend
AI_BACKEND_URL=http://localhost:8000
```

Copy to `.env.local` and fill in real values.

- [ ] **Step 2: Create database tables**

Run this SQL in the Supabase SQL editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL CHECK (auth_provider IN ('google', 'linkedin')),
  daily_limit INTEGER NOT NULL DEFAULT 10,
  apps_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  location TEXT,
  work_experience JSONB NOT NULL DEFAULT '[]'::jsonb,
  education JSONB NOT NULL DEFAULT '[]'::jsonb,
  skills TEXT[] NOT NULL DEFAULT '{}',
  work_authorization TEXT,
  salary_expectation JSONB,
  willing_to_relocate BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Applications table
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_url TEXT NOT NULL,
  company_name TEXT,
  job_title TEXT,
  job_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('applied', 'pending', 'failed', 'skipped')),
  failure_reason TEXT,
  questions_answered JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_url TEXT,
  platform TEXT DEFAULT 'other' CHECK (platform IN ('linkedin', 'indeed', 'jobright', 'other')),
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(user_id, status);

-- Auto-create profile when user is created
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_user();

-- Reset daily application counts at midnight UTC
-- (Use Supabase pg_cron extension or external cron)
-- For MVP: reset via API call or Supabase Edge Function on schedule
```

- [ ] **Step 3: Create Supabase server client**

Create `web/src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

- [ ] **Step 4: Install Supabase client dependency**

Run:
```bash
cd web
npm install @supabase/supabase-js
```

- [ ] **Step 5: Commit database setup**

```bash
git add web/src/lib/supabase.ts web/.env.local.example
git commit -m "feat: add Supabase database schema and client"
```

---

## Task 3: Web App — NextAuth Setup (Google + LinkedIn)

**Files:**
- Create: `web/src/lib/auth.ts`
- Create: `web/src/app/api/auth/[...nextauth]/route.ts`
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Install NextAuth dependencies**

Run:
```bash
cd web
npm install next-auth@5 @auth/core
```

- [ ] **Step 2: Create NextAuth config**

Create `web/src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import { supabase } from "./supabase";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user.email || !account) return false;

      const provider = account.provider as "google" | "linkedin";

      // Upsert user in Supabase
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            email: user.email,
            name: user.name ?? user.email,
            avatar_url: user.image ?? null,
            auth_provider: provider,
          },
          { onConflict: "email" }
        );

      if (error) {
        console.error("Failed to upsert user:", error);
        return false;
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        // Fetch Supabase user ID and attach to token
        const { data } = await supabase
          .from("users")
          .select("id, daily_limit, apps_today")
          .eq("email", user.email)
          .single();

        if (data) {
          token.userId = data.id;
          token.dailyLimit = data.daily_limit;
          token.appsToday = data.apps_today;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.user.dailyLimit = token.dailyLimit as number;
        session.user.appsToday = token.appsToday as number;
      }
      return session;
    },
  },
});
```

- [ ] **Step 3: Create NextAuth route handler**

Create `web/src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create shared types**

Create `web/src/lib/types.ts`:

```typescript
// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      dailyLimit: number;
      appsToday: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    dailyLimit?: number;
    appsToday?: number;
  }
}

// Database types
export interface Profile {
  user_id: string;
  phone: string | null;
  location: string | null;
  work_experience: WorkExperience[];
  education: Education[];
  skills: string[];
  work_authorization: string | null;
  salary_expectation: SalaryExpectation | null;
  willing_to_relocate: boolean;
}

export interface WorkExperience {
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string | null;
  gpa: string | null;
}

export interface SalaryExpectation {
  min: number;
  max: number;
  currency: string;
}

export interface Application {
  id: string;
  user_id: string;
  job_url: string;
  company_name: string | null;
  job_title: string | null;
  job_description: string | null;
  status: "applied" | "pending" | "failed" | "skipped";
  failure_reason: string | null;
  questions_answered: QuestionAnswer[];
  source_url: string | null;
  platform: "linkedin" | "indeed" | "jobright" | "other";
  applied_at: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  type: "profile" | "ai_generated";
}
```

- [ ] **Step 5: Update root layout with session provider**

Replace `web/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "oh-my-jobapplication",
  description: "AI-powered job application automation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Create navbar with sign-in/sign-out**

Create `web/src/components/navbar.tsx`:

```tsx
import { auth, signIn, signOut } from "@/lib/auth";

export async function Navbar() {
  const session = await auth();

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <a href="/" className="font-bold text-xl">
          oh-my-jobapplication
        </a>
        <div className="flex items-center gap-4">
          {session?.user ? (
            <>
              <a href="/dashboard" className="text-sm hover:underline">
                Dashboard
              </a>
              <a href="/profile" className="text-sm hover:underline">
                Profile
              </a>
              <span className="text-sm text-gray-500">
                {session.user.appsToday}/{session.user.dailyLimit} today
              </span>
              <form
                action={async () => {
                  "use server";
                  await signOut();
                }}
              >
                <button className="text-sm text-red-600 hover:underline">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <div className="flex gap-2">
              <form
                action={async () => {
                  "use server";
                  await signIn("google");
                }}
              >
                <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  Sign in with Google
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await signIn("linkedin");
                }}
              >
                <button className="px-3 py-1.5 bg-sky-700 text-white text-sm rounded hover:bg-sky-800">
                  Sign in with LinkedIn
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 7: Verify auth flow starts**

Run:
```bash
cd web && npm run dev
```

Open `http://localhost:3000`. Verify the navbar renders with sign-in buttons. (Sign-in will fail without OAuth credentials configured — that's expected. The flow is wired up.)

- [ ] **Step 8: Commit auth setup**

```bash
git add web/src/lib/auth.ts web/src/lib/types.ts web/src/app/api/auth/ web/src/app/layout.tsx web/src/components/navbar.tsx
git commit -m "feat: add NextAuth with Google + LinkedIn providers and user sync"
```

---

## Task 4: Web App — Profile API Routes

**Files:**
- Create: `web/src/app/api/profile/route.ts`
- Test: `web/tests/api/profile.test.ts`

- [ ] **Step 1: Write the profile API tests**

Create `web/tests/setup.ts`:

```typescript
import { vi } from "vitest";

// Mock supabase for tests
export const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  update: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/supabase", () => ({
  supabase: mockSupabase,
}));
```

Create `web/tests/api/profile.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockSupabase } from "../setup";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { GET, PUT } from "@/app/api/profile/route";

const mockAuth = vi.mocked(auth);

describe("GET /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns profile for authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
    } as any);

    mockSupabase.single.mockResolvedValue({
      data: {
        user_id: "user-1",
        phone: "555-1234",
        location: "NYC",
        work_experience: [],
        education: [],
        skills: ["TypeScript"],
        work_authorization: "US Citizen",
        salary_expectation: null,
        willing_to_relocate: false,
      },
      error: null,
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.phone).toBe("555-1234");
    expect(body.skills).toEqual(["TypeScript"]);
  });
});

describe("PUT /api/profile", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates profile for authenticated user", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "user-1", email: "test@test.com", name: "Test" },
    } as any);

    mockSupabase.single.mockResolvedValue({
      data: { user_id: "user-1", phone: "555-9999" },
      error: null,
    });

    const req = new Request("http://localhost/api/profile", {
      method: "PUT",
      body: JSON.stringify({ phone: "555-9999", location: "LA" }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Install vitest and run tests to verify they fail**

Run:
```bash
cd web
npm install -D vitest @vitejs/plugin-react
```

Add to `web/package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

Create `web/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Run:
```bash
cd web && npm test
```

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement profile API routes**

Create `web/src/app/api/profile/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Only allow updating specific fields
  const allowedFields = [
    "phone",
    "location",
    "work_experience",
    "education",
    "skills",
    "work_authorization",
    "salary_expectation",
    "willing_to_relocate",
  ];

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd web && npm test
```

Expected: PASS — both GET and PUT tests pass.

- [ ] **Step 5: Commit profile API**

```bash
git add web/src/app/api/profile/ web/tests/ web/vitest.config.ts
git commit -m "feat: add profile GET/PUT API routes with tests"
```

---

## Task 5: Web App — Profile Builder Page

**Files:**
- Create: `web/src/components/profile-form.tsx`
- Create: `web/src/app/profile/page.tsx`

- [ ] **Step 1: Create the profile form component**

Create `web/src/components/profile-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Profile, WorkExperience, Education } from "@/lib/types";

export function ProfileForm({ initial }: { initial: Profile }) {
  const [profile, setProfile] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved!" : "Failed to save.");
  }

  function updateField<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((prev) => ({ ...prev, [key]: value }));
  }

  function addExperience() {
    updateField("work_experience", [
      ...profile.work_experience,
      { title: "", company: "", start_date: "", end_date: null, description: "" },
    ]);
  }

  function updateExperience(index: number, field: keyof WorkExperience, value: string | null) {
    const updated = [...profile.work_experience];
    updated[index] = { ...updated[index], [field]: value };
    updateField("work_experience", updated);
  }

  function removeExperience(index: number) {
    updateField("work_experience", profile.work_experience.filter((_, i) => i !== index));
  }

  function addEducation() {
    updateField("education", [
      ...profile.education,
      { school: "", degree: "", field: "", start_date: "", end_date: null, gpa: null },
    ]);
  }

  function updateEducation(index: number, field: keyof Education, value: string | null) {
    const updated = [...profile.education];
    updated[index] = { ...updated[index], [field]: value };
    updateField("education", updated);
  }

  function removeEducation(index: number) {
    updateField("education", profile.education.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-8">
      {/* Personal Info */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              className="w-full border rounded px-3 py-2"
              value={profile.phone ?? ""}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="City, State"
              value={profile.location ?? ""}
              onChange={(e) => updateField("location", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Work Experience */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Work Experience</h2>
          <button onClick={addExperience} className="text-sm text-blue-600 hover:underline">
            + Add Experience
          </button>
        </div>
        {profile.work_experience.map((exp, i) => (
          <div key={i} className="border rounded p-4 mb-3 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Experience #{i + 1}</span>
              <button onClick={() => removeExperience(i)} className="text-sm text-red-500">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Job Title" className="border rounded px-3 py-2" value={exp.title} onChange={(e) => updateExperience(i, "title", e.target.value)} />
              <input placeholder="Company" className="border rounded px-3 py-2" value={exp.company} onChange={(e) => updateExperience(i, "company", e.target.value)} />
              <input type="date" className="border rounded px-3 py-2" value={exp.start_date} onChange={(e) => updateExperience(i, "start_date", e.target.value)} />
              <input type="date" className="border rounded px-3 py-2" value={exp.end_date ?? ""} onChange={(e) => updateExperience(i, "end_date", e.target.value || null)} />
            </div>
            <textarea placeholder="Description" className="w-full border rounded px-3 py-2" rows={3} value={exp.description} onChange={(e) => updateExperience(i, "description", e.target.value)} />
          </div>
        ))}
      </section>

      {/* Education */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Education</h2>
          <button onClick={addEducation} className="text-sm text-blue-600 hover:underline">
            + Add Education
          </button>
        </div>
        {profile.education.map((edu, i) => (
          <div key={i} className="border rounded p-4 mb-3 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Education #{i + 1}</span>
              <button onClick={() => removeEducation(i)} className="text-sm text-red-500">Remove</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="School" className="border rounded px-3 py-2" value={edu.school} onChange={(e) => updateEducation(i, "school", e.target.value)} />
              <input placeholder="Degree" className="border rounded px-3 py-2" value={edu.degree} onChange={(e) => updateEducation(i, "degree", e.target.value)} />
              <input placeholder="Field of Study" className="border rounded px-3 py-2" value={edu.field} onChange={(e) => updateEducation(i, "field", e.target.value)} />
              <input placeholder="GPA" className="border rounded px-3 py-2" value={edu.gpa ?? ""} onChange={(e) => updateEducation(i, "gpa", e.target.value || null)} />
            </div>
          </div>
        ))}
      </section>

      {/* Skills */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Skills</h2>
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          placeholder="Comma-separated: TypeScript, React, Python..."
          value={profile.skills.join(", ")}
          onChange={(e) =>
            updateField("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
          }
        />
      </section>

      {/* Job Preferences */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Job Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Work Authorization</label>
            <select
              className="w-full border rounded px-3 py-2"
              value={profile.work_authorization ?? ""}
              onChange={(e) => updateField("work_authorization", e.target.value)}
            >
              <option value="">Select...</option>
              <option value="US Citizen">US Citizen</option>
              <option value="Permanent Resident">Permanent Resident</option>
              <option value="H1B Visa">H1B Visa</option>
              <option value="OPT/CPT">OPT/CPT</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="relocate"
              checked={profile.willing_to_relocate}
              onChange={(e) => updateField("willing_to_relocate", e.target.checked)}
            />
            <label htmlFor="relocate" className="text-sm">Willing to relocate</label>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {message && <span className="text-sm text-green-600">{message}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the profile page**

Create `web/src/app/profile/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ProfileForm } from "@/components/profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (!profile) redirect("/");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      <p className="text-gray-500 mb-8">
        Fill out your information below. The AI agent will use this to fill job applications.
      </p>
      <ProfileForm initial={profile} />
    </div>
  );
}
```

- [ ] **Step 3: Verify profile page renders**

Run:
```bash
cd web && npm run dev
```

Navigate to `http://localhost:3000/profile` (will redirect to `/` if not logged in — expected). Verify no build errors.

- [ ] **Step 4: Commit profile builder**

```bash
git add web/src/components/profile-form.tsx web/src/app/profile/
git commit -m "feat: add profile builder page with work experience, education, and skills"
```

---

## Task 6: Web App — Applications API Routes

**Files:**
- Create: `web/src/app/api/applications/route.ts`
- Create: `web/src/app/api/extension/token/route.ts`

- [ ] **Step 1: Create applications API routes**

Create `web/src/app/api/applications/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const offset = parseInt(url.searchParams.get("offset") ?? "0");

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("applied_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also fetch today's count
  const { count } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .gte("applied_at", new Date().toISOString().split("T")[0]);

  return NextResponse.json({ applications: data, todayCount: count ?? 0 });
}

export async function POST(req: Request) {
  // Called by the Chrome extension to report application results
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify extension token
  const { data: userData, error: authError } = await supabase
    .from("users")
    .select("id, daily_limit, apps_today")
    .eq("id", token)
    .single();

  if (authError || !userData) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // Check daily limit
  if (userData.apps_today >= userData.daily_limit) {
    return NextResponse.json({ error: "Daily limit reached" }, { status: 429 });
  }

  const body = await req.json();

  const { data, error } = await supabase
    .from("applications")
    .insert({
      user_id: userData.id,
      job_url: body.job_url,
      company_name: body.company_name ?? null,
      job_title: body.job_title ?? null,
      job_description: body.job_description ?? null,
      status: body.status ?? "applied",
      failure_reason: body.failure_reason ?? null,
      questions_answered: body.questions_answered ?? [],
      source_url: body.source_url ?? null,
      platform: body.platform ?? "other",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment daily count
  if (body.status === "applied") {
    await supabase
      .from("users")
      .update({ apps_today: userData.apps_today + 1 })
      .eq("id", userData.id);
  }

  return NextResponse.json(data, { status: 201 });
}
```

- [ ] **Step 2: Create extension token exchange endpoint**

Create `web/src/app/api/extension/token/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // For MVP, the extension token is the user's Supabase ID.
  // In production, generate a proper JWT with expiry.
  return NextResponse.json({
    token: session.user.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      dailyLimit: session.user.dailyLimit,
      appsToday: session.user.appsToday,
    },
  });
}
```

- [ ] **Step 3: Commit application API and token exchange**

```bash
git add web/src/app/api/applications/ web/src/app/api/extension/
git commit -m "feat: add applications API (GET/POST) and extension token exchange"
```

---

## Task 7: Web App — Dashboard + Landing Page

**Files:**
- Create: `web/src/components/application-list.tsx`
- Create: `web/src/app/dashboard/page.tsx`
- Modify: `web/src/app/page.tsx`

- [ ] **Step 1: Create application list component**

Create `web/src/components/application-list.tsx`:

```tsx
import type { Application } from "@/lib/types";

const statusColors: Record<Application["status"], string> = {
  applied: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
  skipped: "bg-gray-100 text-gray-800",
};

export function ApplicationList({ applications }: { applications: Application[] }) {
  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-lg">No applications yet.</p>
        <p className="text-sm mt-2">Paste a job listing URL in the Chrome extension to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div key={app.id} className="border rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{app.job_title ?? "Untitled"}</div>
            <div className="text-sm text-gray-500">
              {app.company_name ?? "Unknown company"} &middot; {app.platform}
            </div>
            {app.failure_reason && (
              <div className="text-sm text-red-500 mt-1">{app.failure_reason}</div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[app.status]}`}>
              {app.status}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(app.applied_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create dashboard page**

Create `web/src/app/dashboard/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { ApplicationList } from "@/components/application-list";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const { data: applications } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", session.user.id)
    .order("applied_at", { ascending: false })
    .limit(50);

  // Today's stats
  const todayStart = new Date().toISOString().split("T")[0];
  const { count: todayCount } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .gte("applied_at", todayStart);

  const { count: totalApplied } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "applied");

  const { count: totalFailed } = await supabase
    .from("applications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)
    .eq("status", "failed");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {todayCount ?? 0}/{session.user.dailyLimit}
          </div>
          <div className="text-sm text-gray-500 mt-1">Applied Today</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{totalApplied ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Total Applied</div>
        </div>
        <div className="border rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-600">{totalFailed ?? 0}</div>
          <div className="text-sm text-gray-500 mt-1">Failed</div>
        </div>
      </div>

      {/* Extension install prompt */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800">
          <strong>Chrome Extension:</strong> Install the oh-my-jobapplication extension to start auto-applying.
          {" "}
          <a href="#" className="underline">Get the extension →</a>
        </p>
      </div>

      {/* Application list */}
      <h2 className="text-lg font-semibold mb-4">Recent Applications</h2>
      <ApplicationList applications={applications ?? []} />
    </div>
  );
}
```

- [ ] **Step 3: Create landing page**

Replace `web/src/app/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="text-center py-20">
      <h1 className="text-5xl font-bold mb-4">
        Auto-Apply to Jobs with AI
      </h1>
      <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto">
        Paste a job listing URL, and our AI agent applies for you —
        filling forms, answering screening questions, and submitting applications
        in your browser.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/api/auth/signin"
          className="px-8 py-3 bg-blue-600 text-white text-lg rounded-lg hover:bg-blue-700"
        >
          Get Started Free
        </a>
      </div>
      <p className="text-sm text-gray-400 mt-4">10 applications/day free. No credit card required.</p>

      {/* How it works */}
      <div className="mt-20 grid grid-cols-3 gap-8 max-w-3xl mx-auto text-left">
        <div>
          <div className="text-3xl mb-2">1.</div>
          <h3 className="font-semibold mb-1">Fill Your Profile</h3>
          <p className="text-sm text-gray-500">Add your experience, education, and skills. The agent uses this to fill applications.</p>
        </div>
        <div>
          <div className="text-3xl mb-2">2.</div>
          <h3 className="font-semibold mb-1">Paste a URL</h3>
          <p className="text-sm text-gray-500">Copy a job listing page from LinkedIn, Indeed, or any job board into the extension.</p>
        </div>
        <div>
          <div className="text-3xl mb-2">3.</div>
          <h3 className="font-semibold mb-1">Watch It Apply</h3>
          <p className="text-sm text-gray-500">The agent fills forms, answers questions, and submits. Pause or stop anytime.</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify pages render**

Run:
```bash
cd web && npm run dev
```

Check `http://localhost:3000` (landing page) and `http://localhost:3000/dashboard` (redirects if not logged in).

- [ ] **Step 5: Commit dashboard and landing page**

```bash
git add web/src/app/page.tsx web/src/app/dashboard/ web/src/components/application-list.tsx
git commit -m "feat: add dashboard with application list, stats, and landing page"
```

---

## Task 8: AI Backend — FastAPI Scaffold + Health Check

**Files:**
- Create: `ai-backend/main.py`
- Create: `ai-backend/models/schemas.py`
- Create: `ai-backend/.env.example`

- [ ] **Step 1: Create Pydantic schemas**

Create `ai-backend/models/schemas.py`:

```python
from pydantic import BaseModel


class WorkExperience(BaseModel):
    title: str
    company: str
    start_date: str
    end_date: str | None = None
    description: str


class Education(BaseModel):
    school: str
    degree: str
    field: str
    start_date: str
    end_date: str | None = None
    gpa: str | None = None


class SalaryExpectation(BaseModel):
    min: int
    max: int
    currency: str = "USD"


class UserProfile(BaseModel):
    phone: str | None = None
    location: str | None = None
    work_experience: list[WorkExperience] = []
    education: list[Education] = []
    skills: list[str] = []
    work_authorization: str | None = None
    salary_expectation: SalaryExpectation | None = None
    willing_to_relocate: bool = False


class FormField(BaseModel):
    field_id: str
    label: str
    field_type: str  # "text", "textarea", "select", "radio", "checkbox"
    options: list[str] | None = None  # For select/radio fields
    required: bool = False


class ScreeningRequest(BaseModel):
    job_title: str
    company_name: str
    job_description: str
    questions: list[FormField]
    user_profile: UserProfile


class FieldAnswer(BaseModel):
    field_id: str
    answer: str
    source: str  # "profile" or "ai_generated"


class ScreeningResponse(BaseModel):
    answers: list[FieldAnswer]
```

- [ ] **Step 2: Create FastAPI app with health check**

Create `ai-backend/.env.example`:
```
ANTHROPIC_API_KEY=your-api-key
WEB_APP_URL=http://localhost:3000
```

Create `ai-backend/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers.screening import router as screening_router

load_dotenv()

app = FastAPI(title="oh-my-jobapplication AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(screening_router, prefix="/screening", tags=["screening"])


@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 3: Create empty screening router (placeholder for next task)**

Create `ai-backend/routers/__init__.py` (empty file).

Create `ai-backend/routers/screening.py`:

```python
from fastapi import APIRouter

from models.schemas import ScreeningRequest, ScreeningResponse

router = APIRouter()


@router.post("/answer", response_model=ScreeningResponse)
async def answer_screening_questions(request: ScreeningRequest) -> ScreeningResponse:
    # Implemented in Task 9
    raise NotImplementedError("Screening endpoint not yet implemented")
```

- [ ] **Step 4: Verify server starts**

Run:
```bash
cd ai-backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Open `http://localhost:8000/health`. Expected: `{"status": "ok"}`.
Open `http://localhost:8000/docs`. Expected: Swagger UI with screening endpoint listed.

- [ ] **Step 5: Commit AI backend scaffold**

```bash
git add ai-backend/main.py ai-backend/models/ ai-backend/routers/ ai-backend/.env.example
git commit -m "feat: add FastAPI AI backend scaffold with health check and schemas"
```

---

## Task 9: AI Backend — Screening Question Answer Generation

**Files:**
- Create: `ai-backend/services/question_generator.py`
- Modify: `ai-backend/routers/screening.py`
- Test: `ai-backend/tests/test_screening.py`

- [ ] **Step 1: Write the screening test**

Create `ai-backend/tests/__init__.py` (empty file).

Create `ai-backend/tests/test_screening.py`:

```python
import pytest
from unittest.mock import patch, AsyncMock
from httpx import AsyncClient, ASGITransport

from main import app
from models.schemas import ScreeningRequest, UserProfile, FormField


@pytest.fixture
def sample_request() -> dict:
    return ScreeningRequest(
        job_title="Software Engineer",
        company_name="Acme Corp",
        job_description="We are looking for a software engineer with Python and React experience.",
        questions=[
            FormField(
                field_id="q1",
                label="Why do you want to work at Acme Corp?",
                field_type="textarea",
                required=True,
            ),
            FormField(
                field_id="q2",
                label="Years of experience",
                field_type="text",
                required=True,
            ),
            FormField(
                field_id="q3",
                label="Work Authorization",
                field_type="select",
                options=["US Citizen", "Green Card", "H1B", "Other"],
                required=True,
            ),
        ],
        user_profile=UserProfile(
            work_experience=[
                {
                    "title": "Senior Developer",
                    "company": "BigTech Inc",
                    "start_date": "2020-01",
                    "end_date": None,
                    "description": "Built Python microservices and React dashboards",
                }
            ],
            skills=["Python", "React", "TypeScript"],
            work_authorization="US Citizen",
        ),
    ).model_dump()


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


@pytest.mark.asyncio
@patch("services.question_generator.generate_answers")
async def test_screening_answer(mock_generate: AsyncMock, sample_request: dict):
    mock_generate.return_value = [
        {"field_id": "q1", "answer": "I am excited about Acme Corp because...", "source": "ai_generated"},
        {"field_id": "q2", "answer": "5", "source": "profile"},
        {"field_id": "q3", "answer": "US Citizen", "source": "profile"},
    ]

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/screening/answer", json=sample_request)

    assert res.status_code == 200
    data = res.json()
    assert len(data["answers"]) == 3
    assert data["answers"][0]["source"] == "ai_generated"
    assert data["answers"][2]["answer"] == "US Citizen"
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd ai-backend
source .venv/bin/activate
pip install pytest-asyncio
python -m pytest tests/test_screening.py -v
```

Expected: FAIL — `generate_answers` not found / screening endpoint raises NotImplementedError.

- [ ] **Step 3: Create the question generator service**

Create `ai-backend/services/__init__.py` (empty file).

Create `ai-backend/services/question_generator.py`:

```python
import os
from anthropic import AsyncAnthropic
from models.schemas import UserProfile, FormField, FieldAnswer


client = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))

# Fields that can be answered directly from profile data
PROFILE_MAPPED_KEYWORDS = {
    "work authorization": "work_authorization",
    "authorized to work": "work_authorization",
    "salary": "salary_expectation",
    "compensation": "salary_expectation",
    "relocate": "willing_to_relocate",
    "relocation": "willing_to_relocate",
    "phone": "phone",
    "location": "location",
}


def try_profile_answer(question: FormField, profile: UserProfile) -> str | None:
    """Try to answer a question directly from profile data."""
    label_lower = question.label.lower()

    for keyword, field in PROFILE_MAPPED_KEYWORDS.items():
        if keyword in label_lower:
            value = getattr(profile, field, None)
            if value is None:
                continue

            if isinstance(value, bool):
                return "Yes" if value else "No"

            if field == "salary_expectation" and value:
                return f"{value.get('min', 0)}-{value.get('max', 0)} {value.get('currency', 'USD')}"

            return str(value)

    # Years of experience
    if "years" in label_lower and "experience" in label_lower:
        if profile.work_experience:
            from datetime import datetime

            total_years = 0
            for exp in profile.work_experience:
                try:
                    start = datetime.strptime(exp.start_date, "%Y-%m")
                    end = datetime.now() if not exp.end_date else datetime.strptime(exp.end_date, "%Y-%m")
                    total_years += (end - start).days / 365
                except ValueError:
                    continue
            return str(round(total_years))

    # Select/radio with matching option
    if question.options and profile.work_authorization:
        for option in question.options:
            if profile.work_authorization.lower() in option.lower():
                return option

    return None


async def generate_answers(
    job_title: str,
    company_name: str,
    job_description: str,
    questions: list[FormField],
    profile: UserProfile,
) -> list[FieldAnswer]:
    """Generate answers for screening questions using profile data + AI."""
    answers: list[FieldAnswer] = []
    ai_questions: list[FormField] = []

    # First pass: try profile-based answers
    for q in questions:
        profile_answer = try_profile_answer(q, profile)
        if profile_answer:
            answers.append(FieldAnswer(field_id=q.field_id, answer=profile_answer, source="profile"))
        else:
            ai_questions.append(q)

    # Second pass: AI-generated answers for remaining questions
    if ai_questions:
        profile_summary = _build_profile_summary(profile)
        questions_text = "\n".join(
            f"- Question ID: {q.field_id}\n  Label: {q.label}\n  Type: {q.field_type}"
            + (f"\n  Options: {', '.join(q.options)}" if q.options else "")
            for q in ai_questions
        )

        prompt = f"""You are filling out a job application. Answer each screening question based on the candidate's profile and the job description.

JOB: {job_title} at {company_name}
JOB DESCRIPTION: {job_description}

CANDIDATE PROFILE:
{profile_summary}

QUESTIONS:
{questions_text}

For each question, provide a concise, professional answer that highlights relevant experience from the profile. For select/radio questions, choose the best matching option.

Respond in this exact format for each question (one per line):
FIELD_ID|ANSWER

Example:
q1|I am excited about this role because my 5 years of Python experience align perfectly with your needs.
q2|React"""

        message = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text
        for line in response_text.strip().split("\n"):
            if "|" in line:
                field_id, answer = line.split("|", 1)
                field_id = field_id.strip()
                # Only add if this is a question we asked about
                if any(q.field_id == field_id for q in ai_questions):
                    answers.append(FieldAnswer(field_id=field_id, answer=answer.strip(), source="ai_generated"))

    return answers


def _build_profile_summary(profile: UserProfile) -> str:
    """Build a text summary of the user's profile for the AI prompt."""
    parts = []

    if profile.skills:
        parts.append(f"Skills: {', '.join(profile.skills)}")

    if profile.location:
        parts.append(f"Location: {profile.location}")

    for exp in profile.work_experience:
        duration = f"{exp.start_date} - {exp.end_date or 'present'}"
        parts.append(f"Experience: {exp.title} at {exp.company} ({duration}): {exp.description}")

    for edu in profile.education:
        parts.append(f"Education: {edu.degree} in {edu.field} from {edu.school}")

    return "\n".join(parts) if parts else "No profile details provided."
```

- [ ] **Step 4: Update screening router to use the service**

Replace `ai-backend/routers/screening.py`:

```python
from fastapi import APIRouter

from models.schemas import ScreeningRequest, ScreeningResponse
from services.question_generator import generate_answers

router = APIRouter()


@router.post("/answer", response_model=ScreeningResponse)
async def answer_screening_questions(request: ScreeningRequest) -> ScreeningResponse:
    answers = await generate_answers(
        job_title=request.job_title,
        company_name=request.company_name,
        job_description=request.job_description,
        questions=request.questions,
        user_profile=request.user_profile,
    )
    return ScreeningResponse(answers=answers)
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
cd ai-backend && python -m pytest tests/test_screening.py -v
```

Expected: PASS — health check passes, screening endpoint works with mocked AI.

- [ ] **Step 6: Commit screening question service**

```bash
git add ai-backend/services/ ai-backend/routers/screening.py ai-backend/tests/
git commit -m "feat: add AI screening question answering with profile-based and AI-generated answers"
```

---

## Task 10: AI Backend — Field Mapping Service

**Files:**
- Create: `ai-backend/services/field_mapper.py`
- Create: `ai-backend/routers/mapping.py`
- Test: `ai-backend/tests/test_field_mapper.py`

- [ ] **Step 1: Write the field mapper test**

Create `ai-backend/tests/test_field_mapper.py`:

```python
import pytest
from services.field_mapper import map_profile_to_fields
from models.schemas import UserProfile, FormField


def test_maps_name_fields():
    profile = UserProfile(phone="555-1234", location="New York, NY")
    fields = [
        FormField(field_id="phone", label="Phone Number", field_type="text"),
        FormField(field_id="city", label="City", field_type="text"),
    ]
    result = map_profile_to_fields(fields, profile, user_name="John Doe", user_email="john@test.com")

    phone_mapping = next(r for r in result if r["field_id"] == "phone")
    assert phone_mapping["value"] == "555-1234"


def test_maps_email_field():
    profile = UserProfile()
    fields = [
        FormField(field_id="email", label="Email Address", field_type="text"),
    ]
    result = map_profile_to_fields(fields, profile, user_name="John Doe", user_email="john@test.com")

    email_mapping = next(r for r in result if r["field_id"] == "email")
    assert email_mapping["value"] == "john@test.com"


def test_unmapped_fields_return_empty():
    profile = UserProfile()
    fields = [
        FormField(field_id="custom", label="Favorite Color", field_type="text"),
    ]
    result = map_profile_to_fields(fields, profile, user_name="Test", user_email="t@t.com")
    assert len(result) == 0  # Unknown fields are not mapped
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd ai-backend && python -m pytest tests/test_field_mapper.py -v
```

Expected: FAIL — `map_profile_to_fields` not found.

- [ ] **Step 3: Implement field mapper**

Create `ai-backend/services/field_mapper.py`:

```python
from models.schemas import UserProfile, FormField


# Label keywords → profile field or special value
FIELD_MAPPING: dict[str, str] = {
    "first name": "_first_name",
    "last name": "_last_name",
    "full name": "_full_name",
    "name": "_full_name",
    "email": "_email",
    "phone": "phone",
    "phone number": "phone",
    "mobile": "phone",
    "city": "location",
    "location": "location",
    "address": "location",
}


def map_profile_to_fields(
    fields: list[FormField],
    profile: UserProfile,
    user_name: str,
    user_email: str,
) -> list[dict]:
    """Map profile data to form fields based on label matching."""
    results = []

    name_parts = user_name.split(" ", 1)
    first_name = name_parts[0]
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    special_values = {
        "_first_name": first_name,
        "_last_name": last_name,
        "_full_name": user_name,
        "_email": user_email,
    }

    for field in fields:
        label_lower = field.label.lower().strip()
        value = None

        # Check direct label match
        for keyword, target in FIELD_MAPPING.items():
            if keyword in label_lower:
                if target.startswith("_"):
                    value = special_values.get(target)
                else:
                    value = getattr(profile, target, None)
                break

        if value is not None:
            results.append({"field_id": field.field_id, "value": str(value)})

    return results
```

- [ ] **Step 4: Add mapping endpoint to router**

Create `ai-backend/routers/mapping.py`:

```python
from fastapi import APIRouter
from pydantic import BaseModel

from models.schemas import UserProfile, FormField
from services.field_mapper import map_profile_to_fields

router = APIRouter()


class MappingRequest(BaseModel):
    fields: list[FormField]
    user_profile: UserProfile
    user_name: str
    user_email: str


class MappingResponse(BaseModel):
    mappings: list[dict]


@router.post("/fields", response_model=MappingResponse)
async def map_fields(request: MappingRequest) -> MappingResponse:
    mappings = map_profile_to_fields(
        fields=request.fields,
        profile=request.user_profile,
        user_name=request.user_name,
        user_email=request.user_email,
    )
    return MappingResponse(mappings=mappings)
```

Add to `ai-backend/main.py` (after the screening router import):

```python
from routers.mapping import router as mapping_router
# ...
app.include_router(mapping_router, prefix="/mapping", tags=["mapping"])
```

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
cd ai-backend && python -m pytest tests/ -v
```

Expected: PASS — all tests pass.

- [ ] **Step 6: Commit field mapper**

```bash
git add ai-backend/services/field_mapper.py ai-backend/routers/mapping.py ai-backend/main.py ai-backend/tests/test_field_mapper.py
git commit -m "feat: add field mapping service for profile-to-form field matching"
```

---

## Task 11: Chrome Extension — WXT Scaffold + Popup UI

**Files:**
- Modify: `extension/wxt.config.ts`
- Create: `extension/src/entrypoints/popup/App.tsx`
- Create: `extension/src/entrypoints/popup/style.css`
- Create: `extension/src/lib/types.ts`
- Create: `extension/src/lib/storage.ts`

- [ ] **Step 1: Configure WXT**

Update `extension/wxt.config.ts`:

```typescript
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "oh-my-jobapplication",
    description: "AI-powered job application automation",
    permissions: ["storage", "activeTab", "tabs"],
    host_permissions: ["https://www.linkedin.com/*", "http://localhost:3000/*", "http://localhost:8000/*"],
  },
});
```

- [ ] **Step 2: Create extension types**

Create `extension/src/lib/types.ts`:

```typescript
export interface AuthState {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    dailyLimit: number;
    appsToday: number;
  };
}

export interface JobListing {
  title: string;
  company: string;
  applyUrl: string;
  description?: string;
}

export interface ApplyStatus {
  state: "idle" | "running" | "paused" | "stopped";
  currentJob: JobListing | null;
  queue: JobListing[];
  completed: number;
  failed: number;
  dailyCount: number;
  dailyLimit: number;
  logs: LogEntry[];
}

export interface LogEntry {
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warning";
}
```

- [ ] **Step 3: Create storage helpers**

Create `extension/src/lib/storage.ts`:

```typescript
import { storage } from "wxt/storage";
import type { AuthState, ApplyStatus } from "./types";

export const authStorage = storage.defineItem<AuthState | null>("local:auth", {
  fallback: null,
});

export const statusStorage = storage.defineItem<ApplyStatus>("local:status", {
  fallback: {
    state: "idle",
    currentJob: null,
    queue: [],
    completed: 0,
    failed: 0,
    dailyCount: 0,
    dailyLimit: 10,
    logs: [],
  },
});
```

- [ ] **Step 4: Build popup UI**

Create `extension/src/entrypoints/popup/style.css`:

```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 360px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; font-size: 14px; }

.container { padding: 16px; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.header h1 { font-size: 16px; font-weight: 700; }
.status-badge { font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600; }
.status-idle { background: #e5e7eb; color: #374151; }
.status-running { background: #d1fae5; color: #065f46; }
.status-paused { background: #fef3c7; color: #92400e; }

.stats { display: flex; gap: 12px; margin-bottom: 16px; }
.stat { flex: 1; text-align: center; padding: 8px; background: #f9fafb; border-radius: 8px; }
.stat-value { font-size: 20px; font-weight: 700; }
.stat-label { font-size: 11px; color: #6b7280; }

.url-input { width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; margin-bottom: 12px; }
.url-input:focus { outline: none; border-color: #3b82f6; }

.controls { display: flex; gap: 8px; margin-bottom: 16px; }
.btn { flex: 1; padding: 8px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px; }
.btn-primary { background: #3b82f6; color: white; }
.btn-primary:hover { background: #2563eb; }
.btn-primary:disabled { background: #93c5fd; cursor: not-allowed; }
.btn-danger { background: #ef4444; color: white; }
.btn-secondary { background: #e5e7eb; color: #374151; }

.logs { max-height: 200px; overflow-y: auto; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px; }
.log-entry { font-size: 12px; padding: 2px 0; color: #374151; }
.log-success { color: #059669; }
.log-error { color: #dc2626; }
.log-warning { color: #d97706; }

.auth-prompt { text-align: center; padding: 20px; }
.auth-prompt a { color: #3b82f6; text-decoration: underline; }
```

Replace `extension/src/entrypoints/popup/App.tsx`:

```tsx
import { useState, useEffect } from "react";
import { authStorage, statusStorage } from "@/lib/storage";
import type { AuthState, ApplyStatus } from "@/lib/types";
import "./style.css";

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [status, setStatus] = useState<ApplyStatus | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([authStorage.getValue(), statusStorage.getValue()]).then(
      ([a, s]) => {
        setAuth(a);
        setStatus(s);
        setLoading(false);
      }
    );

    // Watch for status changes from service worker
    const unwatch = statusStorage.watch((newStatus) => {
      if (newStatus) setStatus(newStatus);
    });

    return () => unwatch();
  }, []);

  if (loading) return <div className="container">Loading...</div>;

  if (!auth) {
    return (
      <div className="container auth-prompt">
        <h1>oh-my-jobapplication</h1>
        <p style={{ margin: "12px 0", color: "#6b7280" }}>
          Sign in on the web app first, then click below to connect.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={async () => {
            // Open web app to get token
            const tab = await browser.tabs.create({
              url: "http://localhost:3000/api/extension/token",
            });
          }}
        >
          Connect Account
        </button>
      </div>
    );
  }

  if (!status) return null;

  const canStart = status.state === "idle" && url.trim() !== "";
  const isRunning = status.state === "running";
  const isPaused = status.state === "paused";

  return (
    <div className="container">
      <div className="header">
        <h1>oh-my-jobapplication</h1>
        <span className={`status-badge status-${status.state}`}>{status.state}</span>
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat">
          <div className="stat-value">{status.dailyCount}/{status.dailyLimit}</div>
          <div className="stat-label">Today</div>
        </div>
        <div className="stat">
          <div className="stat-value">{status.completed}</div>
          <div className="stat-label">Applied</div>
        </div>
        <div className="stat">
          <div className="stat-value">{status.queue.length}</div>
          <div className="stat-label">Queued</div>
        </div>
      </div>

      {/* URL Input */}
      <input
        className="url-input"
        placeholder="Paste LinkedIn jobs tracker URL..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isRunning || isPaused}
      />

      {/* Controls */}
      <div className="controls">
        {status.state === "idle" && (
          <button
            className="btn btn-primary"
            disabled={!canStart}
            onClick={() => {
              browser.runtime.sendMessage({ type: "START", url: url.trim() });
            }}
          >
            Start Applying
          </button>
        )}
        {isRunning && (
          <>
            <button
              className="btn btn-secondary"
              onClick={() => browser.runtime.sendMessage({ type: "PAUSE" })}
            >
              Pause
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => browser.runtime.sendMessage({ type: "SKIP" })}
            >
              Skip
            </button>
            <button
              className="btn btn-danger"
              onClick={() => browser.runtime.sendMessage({ type: "STOP" })}
            >
              Stop
            </button>
          </>
        )}
        {isPaused && (
          <>
            <button
              className="btn btn-primary"
              onClick={() => browser.runtime.sendMessage({ type: "RESUME" })}
            >
              Resume
            </button>
            <button
              className="btn btn-danger"
              onClick={() => browser.runtime.sendMessage({ type: "STOP" })}
            >
              Stop
            </button>
          </>
        )}
      </div>

      {/* Current Job */}
      {status.currentJob && (
        <div style={{ padding: "8px", background: "#eff6ff", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" }}>
          Applying to: <strong>{status.currentJob.title}</strong> at {status.currentJob.company}
        </div>
      )}

      {/* Logs */}
      <div className="logs">
        {status.logs.length === 0 && (
          <div className="log-entry" style={{ color: "#9ca3af" }}>No activity yet.</div>
        )}
        {status.logs.slice(-20).reverse().map((log, i) => (
          <div key={i} className={`log-entry log-${log.type}`}>
            <span style={{ color: "#9ca3af", marginRight: "6px" }}>{log.time}</span>
            {log.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify extension builds**

Run:
```bash
cd extension && npm run build
```

Expected: Build succeeds, output in `extension/.output/`.

- [ ] **Step 6: Commit popup UI**

```bash
git add extension/wxt.config.ts extension/src/
git commit -m "feat: add Chrome extension popup UI with URL input, controls, and status feed"
```

---

## Task 12: Chrome Extension — Auth (Token Exchange)

**Files:**
- Create: `extension/src/lib/api.ts`
- Modify: `extension/src/entrypoints/background.ts`

- [ ] **Step 1: Create API client**

Create `extension/src/lib/api.ts`:

```typescript
import { authStorage } from "./storage";

const WEB_APP_URL = "http://localhost:3000";
const AI_BACKEND_URL = "http://localhost:8000";

async function getToken(): Promise<string | null> {
  const auth = await authStorage.getValue();
  return auth?.token ?? null;
}

export async function fetchExtensionToken(): Promise<boolean> {
  try {
    const res = await fetch(`${WEB_APP_URL}/api/extension/token`, {
      credentials: "include",
    });
    if (!res.ok) return false;

    const data = await res.json();
    await authStorage.setValue({ token: data.token, user: data.user });
    return true;
  } catch {
    return false;
  }
}

export async function reportApplication(application: {
  job_url: string;
  company_name?: string;
  job_title?: string;
  job_description?: string;
  status: string;
  failure_reason?: string;
  questions_answered?: Array<{ question: string; answer: string; type: string }>;
  source_url?: string;
  platform?: string;
}) {
  const token = await getToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${WEB_APP_URL}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(application),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return res.json();
}

export async function getScreeningAnswers(request: {
  job_title: string;
  company_name: string;
  job_description: string;
  questions: Array<{ field_id: string; label: string; field_type: string; options?: string[]; required?: boolean }>;
  user_profile: Record<string, unknown>;
}) {
  const res = await fetch(`${AI_BACKEND_URL}/screening/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`AI backend error: ${res.status}`);
  return res.json();
}

export async function getFieldMappings(request: {
  fields: Array<{ field_id: string; label: string; field_type: string; options?: string[] }>;
  user_profile: Record<string, unknown>;
  user_name: string;
  user_email: string;
}) {
  const res = await fetch(`${AI_BACKEND_URL}/mapping/fields`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`AI backend error: ${res.status}`);
  return res.json();
}

export async function getUserProfile(): Promise<Record<string, unknown> | null> {
  const token = await getToken();
  if (!token) return null;

  const res = await fetch(`${WEB_APP_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return null;
  return res.json();
}
```

- [ ] **Step 2: Set up background service worker with auth handling**

Create or replace `extension/src/entrypoints/background.ts`:

```typescript
import { authStorage, statusStorage } from "@/lib/storage";
import { fetchExtensionToken } from "@/lib/api";

export default defineBackground(() => {
  // Listen for messages from popup
  browser.runtime.onMessage.addListener(async (message) => {
    switch (message.type) {
      case "AUTH_CHECK":
        return await fetchExtensionToken();

      case "START":
        // Apply loop implemented in Task 14
        console.log("START received, URL:", message.url);
        break;

      case "PAUSE":
        const pauseStatus = await statusStorage.getValue();
        await statusStorage.setValue({ ...pauseStatus, state: "paused" });
        break;

      case "RESUME":
        const resumeStatus = await statusStorage.getValue();
        await statusStorage.setValue({ ...resumeStatus, state: "running" });
        break;

      case "STOP":
        const stopStatus = await statusStorage.getValue();
        await statusStorage.setValue({
          ...stopStatus,
          state: "idle",
          currentJob: null,
          queue: [],
        });
        break;

      case "SKIP":
        // Handled in apply loop
        break;
    }
  });

  // Try to authenticate on install/startup
  browser.runtime.onInstalled.addListener(async () => {
    await fetchExtensionToken();
  });
});
```

- [ ] **Step 3: Verify extension builds with auth**

Run:
```bash
cd extension && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit auth setup**

```bash
git add extension/src/lib/api.ts extension/src/entrypoints/background.ts
git commit -m "feat: add extension auth with token exchange and API client"
```

---

## Task 13: Chrome Extension — LinkedIn Adapter

**Files:**
- Create: `extension/src/adapters/base.ts`
- Create: `extension/src/adapters/detector.ts`
- Create: `extension/src/adapters/linkedin.ts`
- Create: `extension/src/entrypoints/content/index.ts`

- [ ] **Step 1: Define base adapter interface**

Create `extension/src/adapters/base.ts`:

```typescript
import type { JobListing } from "@/lib/types";

export interface FormField {
  fieldId: string;
  label: string;
  fieldType: "text" | "textarea" | "select" | "radio" | "checkbox" | "file";
  options?: string[];
  required: boolean;
  element: HTMLElement;
}

export interface PlatformAdapter {
  /** Check if this adapter handles the current URL */
  matches(url: string): boolean;

  /** Scrape job listings from the current page */
  scrapeListings(): Promise<JobListing[]>;

  /** Navigate to a job's apply page and detect when it's ready */
  openApplication(job: JobListing): Promise<boolean>;

  /** Extract all form fields from the current application page */
  extractFormFields(): Promise<FormField[]>;

  /** Fill a single form field with a value */
  fillField(field: FormField, value: string): Promise<void>;

  /** Upload resume file to a file input */
  uploadResume(field: FormField, resumeUrl: string): Promise<void>;

  /** Click the submit/next button */
  clickSubmit(): Promise<boolean>;

  /** Check if we hit a login wall */
  detectLoginWall(): boolean;

  /** Check if a CAPTCHA is present */
  detectCaptcha(): boolean;

  /** Get the platform name */
  platformName(): string;
}
```

- [ ] **Step 2: Create URL detector**

Create `extension/src/adapters/detector.ts`:

```typescript
import type { PlatformAdapter } from "./base";
import { LinkedInAdapter } from "./linkedin";

const adapters: PlatformAdapter[] = [
  new LinkedInAdapter(),
  // Future: IndeedAdapter, JobrightAdapter, etc.
];

export function detectAdapter(url: string): PlatformAdapter | null {
  return adapters.find((adapter) => adapter.matches(url)) ?? null;
}
```

- [ ] **Step 3: Implement LinkedIn adapter**

Create `extension/src/adapters/linkedin.ts`:

```typescript
import type { JobListing } from "@/lib/types";
import type { PlatformAdapter, FormField } from "./base";

export class LinkedInAdapter implements PlatformAdapter {
  matches(url: string): boolean {
    return url.includes("linkedin.com/jobs") || url.includes("linkedin.com/my-items/saved-jobs");
  }

  platformName(): string {
    return "linkedin";
  }

  async scrapeListings(): Promise<JobListing[]> {
    const listings: JobListing[] = [];

    // LinkedIn jobs list items
    const jobCards = document.querySelectorAll<HTMLElement>(
      ".jobs-search-results__list-item, .job-card-container, [data-job-id]"
    );

    for (const card of jobCards) {
      const titleEl = card.querySelector<HTMLElement>(
        ".job-card-list__title, .artdeco-entity-lockup__title a, a[data-control-name='jobPosting_title']"
      );
      const companyEl = card.querySelector<HTMLElement>(
        ".job-card-container__primary-description, .artdeco-entity-lockup__subtitle"
      );

      if (titleEl) {
        const title = titleEl.textContent?.trim() ?? "Untitled";
        const company = companyEl?.textContent?.trim() ?? "Unknown";
        const href = titleEl.closest("a")?.href ?? titleEl.querySelector("a")?.href;

        if (href) {
          listings.push({ title, company, applyUrl: href });
        }
      }
    }

    return listings;
  }

  async openApplication(job: JobListing): Promise<boolean> {
    // Navigate to job page
    window.location.href = job.applyUrl;

    // Wait for page to load and Easy Apply button to appear
    return new Promise((resolve) => {
      const check = setInterval(() => {
        const easyApplyBtn = document.querySelector<HTMLButtonElement>(
          ".jobs-apply-button, button[aria-label*='Easy Apply']"
        );
        if (easyApplyBtn) {
          clearInterval(check);
          easyApplyBtn.click();

          // Wait for modal to open
          setTimeout(() => resolve(true), 1500);
        }
      }, 500);

      // Timeout after 15 seconds
      setTimeout(() => {
        clearInterval(check);
        resolve(false);
      }, 15000);
    });
  }

  async extractFormFields(): Promise<FormField[]> {
    const fields: FormField[] = [];

    // Text inputs
    const inputs = document.querySelectorAll<HTMLInputElement>(
      ".jobs-easy-apply-modal input[type='text'], .jobs-easy-apply-modal input[type='tel'], .jobs-easy-apply-modal input[type='email'], .jobs-easy-apply-modal input[type='number']"
    );

    for (const input of inputs) {
      const label = this.findLabel(input);
      fields.push({
        fieldId: input.id || input.name || `input-${fields.length}`,
        label: label,
        fieldType: "text",
        required: input.required,
        element: input,
      });
    }

    // Textareas
    const textareas = document.querySelectorAll<HTMLTextAreaElement>(
      ".jobs-easy-apply-modal textarea"
    );

    for (const textarea of textareas) {
      const label = this.findLabel(textarea);
      fields.push({
        fieldId: textarea.id || textarea.name || `textarea-${fields.length}`,
        label: label,
        fieldType: "textarea",
        required: textarea.required,
        element: textarea,
      });
    }

    // Selects
    const selects = document.querySelectorAll<HTMLSelectElement>(
      ".jobs-easy-apply-modal select"
    );

    for (const select of selects) {
      const label = this.findLabel(select);
      const options = Array.from(select.options)
        .filter((o) => o.value)
        .map((o) => o.textContent?.trim() ?? o.value);

      fields.push({
        fieldId: select.id || select.name || `select-${fields.length}`,
        label: label,
        fieldType: "select",
        options,
        required: select.required,
        element: select,
      });
    }

    // Radio groups
    const radioGroups = document.querySelectorAll<HTMLElement>(
      ".jobs-easy-apply-modal fieldset, .jobs-easy-apply-modal [role='radiogroup']"
    );

    for (const group of radioGroups) {
      const legend = group.querySelector("legend, label")?.textContent?.trim() ?? "";
      const radios = group.querySelectorAll<HTMLInputElement>("input[type='radio']");
      const options = Array.from(radios).map(
        (r) => r.closest("label")?.textContent?.trim() ?? r.value
      );

      if (radios.length > 0) {
        fields.push({
          fieldId: radios[0].name || `radio-${fields.length}`,
          label: legend,
          fieldType: "radio",
          options,
          required: radios[0].required,
          element: group,
        });
      }
    }

    // File inputs (resume upload)
    const fileInputs = document.querySelectorAll<HTMLInputElement>(
      ".jobs-easy-apply-modal input[type='file']"
    );

    for (const input of fileInputs) {
      fields.push({
        fieldId: input.id || input.name || `file-${fields.length}`,
        label: "Resume Upload",
        fieldType: "file",
        required: input.required,
        element: input,
      });
    }

    return fields;
  }

  async fillField(field: FormField, value: string): Promise<void> {
    const el = field.element;

    if (field.fieldType === "text" || field.fieldType === "textarea") {
      const input = el as HTMLInputElement | HTMLTextAreaElement;
      // Use native setter to trigger React/LinkedIn's change handlers
      const nativeSetter = Object.getOwnPropertyDescriptor(
        field.fieldType === "textarea" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
        "value"
      )?.set;

      if (nativeSetter) {
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else if (field.fieldType === "select") {
      const select = el as HTMLSelectElement;
      const option = Array.from(select.options).find(
        (o) => o.textContent?.trim().toLowerCase() === value.toLowerCase() || o.value.toLowerCase() === value.toLowerCase()
      );
      if (option) {
        select.value = option.value;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    } else if (field.fieldType === "radio") {
      const radios = el.querySelectorAll<HTMLInputElement>("input[type='radio']");
      for (const radio of radios) {
        const label = radio.closest("label")?.textContent?.trim() ?? radio.value;
        if (label.toLowerCase().includes(value.toLowerCase())) {
          radio.click();
          break;
        }
      }
    }
  }

  async uploadResume(_field: FormField, _resumeUrl: string): Promise<void> {
    // MVP: skip resume upload — LinkedIn Easy Apply uses the user's uploaded resume
    // In Phase 2, implement downloading and uploading a resume file
  }

  clickSubmit(): Promise<boolean> {
    return new Promise((resolve) => {
      // LinkedIn Easy Apply has multi-step forms with "Next" and "Submit application" buttons
      const submitBtn = document.querySelector<HTMLButtonElement>(
        "button[aria-label='Submit application'], button[aria-label='Review your application']"
      );
      const nextBtn = document.querySelector<HTMLButtonElement>(
        "button[aria-label='Continue to next step']"
      );

      const btn = submitBtn ?? nextBtn;
      if (btn) {
        btn.click();
        setTimeout(() => resolve(true), 1000);
      } else {
        resolve(false);
      }
    });
  }

  detectLoginWall(): boolean {
    return (
      document.querySelector(".login__form, .join-form") !== null ||
      window.location.href.includes("/login") ||
      window.location.href.includes("/checkpoint")
    );
  }

  detectCaptcha(): boolean {
    return (
      document.querySelector("[data-captcha], .captcha, iframe[src*='captcha']") !== null
    );
  }

  private findLabel(element: HTMLElement): string {
    // Try aria-label
    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    // Try associated <label>
    const id = element.id;
    if (id) {
      const label = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`);
      if (label) return label.textContent?.trim() ?? "";
    }

    // Try parent label
    const parentLabel = element.closest("label");
    if (parentLabel) return parentLabel.textContent?.trim() ?? "";

    // Try preceding sibling or nearby text
    const prev = element.previousElementSibling;
    if (prev && (prev.tagName === "LABEL" || prev.tagName === "SPAN")) {
      return prev.textContent?.trim() ?? "";
    }

    return element.getAttribute("placeholder") ?? "";
  }
}
```

- [ ] **Step 4: Create content script entry point**

Create or replace `extension/src/entrypoints/content/index.ts`:

```typescript
import { detectAdapter } from "@/adapters/detector";

export default defineContentScript({
  matches: ["*://www.linkedin.com/*"],
  main() {
    // Listen for commands from the service worker
    browser.runtime.onMessage.addListener(async (message) => {
      const adapter = detectAdapter(window.location.href);

      switch (message.type) {
        case "SCRAPE_LISTINGS":
          if (!adapter) return { listings: [], error: "No adapter for this URL" };
          if (adapter.detectLoginWall()) return { listings: [], error: "LOGIN_WALL" };
          if (adapter.detectCaptcha()) return { listings: [], error: "CAPTCHA" };
          const listings = await adapter.scrapeListings();
          return { listings };

        case "EXTRACT_FIELDS":
          if (!adapter) return { fields: [], error: "No adapter" };
          const fields = await adapter.extractFormFields();
          // Serialize fields (can't send DOM elements via message)
          return {
            fields: fields.map((f) => ({
              fieldId: f.fieldId,
              label: f.label,
              fieldType: f.fieldType,
              options: f.options,
              required: f.required,
            })),
          };

        case "FILL_FIELD":
          if (!adapter) return { success: false };
          // Re-extract to get DOM references
          const allFields = await adapter.extractFormFields();
          const field = allFields.find((f) => f.fieldId === message.fieldId);
          if (field) {
            await adapter.fillField(field, message.value);
            return { success: true };
          }
          return { success: false };

        case "CLICK_SUBMIT":
          if (!adapter) return { success: false };
          const submitted = await adapter.clickSubmit();
          return { success: submitted };

        case "OPEN_APPLICATION":
          if (!adapter) return { success: false };
          const opened = await adapter.openApplication(message.job);
          return { success: opened };

        case "CHECK_LOGIN_WALL":
          if (!adapter) return { loginWall: false, captcha: false };
          return {
            loginWall: adapter.detectLoginWall(),
            captcha: adapter.detectCaptcha(),
          };
      }
    });
  },
});
```

- [ ] **Step 5: Verify extension builds**

Run:
```bash
cd extension && npm run build
```

Expected: Build succeeds with content script and adapters compiled.

- [ ] **Step 6: Commit LinkedIn adapter**

```bash
git add extension/src/adapters/ extension/src/entrypoints/content/
git commit -m "feat: add LinkedIn adapter with scraping, form detection, and field filling"
```

---

## Task 14: Chrome Extension — Apply Loop + Daily Limits

**Files:**
- Modify: `extension/src/entrypoints/background.ts`

- [ ] **Step 1: Implement the full apply loop in the service worker**

Replace `extension/src/entrypoints/background.ts`:

```typescript
import { authStorage, statusStorage } from "@/lib/storage";
import {
  fetchExtensionToken,
  getScreeningAnswers,
  getFieldMappings,
  getUserProfile,
  reportApplication,
} from "@/lib/api";
import type { JobListing, LogEntry, ApplyStatus } from "@/lib/types";

let skipRequested = false;

function log(message: string, type: LogEntry["type"] = "info"): LogEntry {
  const entry: LogEntry = {
    time: new Date().toLocaleTimeString(),
    message,
    type,
  };
  return entry;
}

async function addLog(entry: LogEntry) {
  const status = await statusStorage.getValue();
  const logs = [...status.logs.slice(-50), entry]; // Keep last 50
  await statusStorage.setValue({ ...status, logs });
}

async function updateStatus(updates: Partial<ApplyStatus>) {
  const current = await statusStorage.getValue();
  await statusStorage.setValue({ ...current, ...updates });
}

async function waitForState(targetState: string): Promise<boolean> {
  return new Promise((resolve) => {
    const check = async () => {
      const status = await statusStorage.getValue();
      if (status.state === targetState) {
        resolve(true);
      } else if (status.state === "idle") {
        resolve(false); // Stopped
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

async function applyToJob(
  tabId: number,
  job: JobListing,
  profile: Record<string, unknown>,
  auth: { token: string; user: { name: string; email: string } },
  sourceUrl: string
): Promise<{ success: boolean; error?: string }> {
  await addLog(log(`Applying to: ${job.title} at ${job.company}`));
  await updateStatus({ currentJob: job });

  try {
    // Step 1: Open the application
    const openResult = await browser.tabs.sendMessage(tabId, {
      type: "OPEN_APPLICATION",
      job,
    });

    if (!openResult?.success) {
      return { success: false, error: "Could not open application page" };
    }

    // Wait for page to settle
    await new Promise((r) => setTimeout(r, 2000));

    // Step 2: Check for login wall / captcha
    const wallCheck = await browser.tabs.sendMessage(tabId, {
      type: "CHECK_LOGIN_WALL",
    });

    if (wallCheck?.loginWall) {
      await addLog(log("Login required — please log in and click Resume", "warning"));
      await updateStatus({ state: "paused" });
      const resumed = await waitForState("running");
      if (!resumed) return { success: false, error: "Stopped by user" };
    }

    if (wallCheck?.captcha) {
      await addLog(log("CAPTCHA detected — please solve it and click Resume", "warning"));
      await updateStatus({ state: "paused" });
      const resumed = await waitForState("running");
      if (!resumed) return { success: false, error: "Stopped by user" };
    }

    // Step 3: Extract form fields
    const fieldsResult = await browser.tabs.sendMessage(tabId, {
      type: "EXTRACT_FIELDS",
    });

    if (!fieldsResult?.fields?.length) {
      return { success: false, error: "No form fields found" };
    }

    // Step 4: Get field mappings from AI backend
    const mappingResult = await getFieldMappings({
      fields: fieldsResult.fields,
      user_profile: profile,
      user_name: auth.user.name,
      user_email: auth.user.email,
    });

    // Step 5: Get screening question answers
    const screeningQuestions = fieldsResult.fields.filter(
      (f: any) =>
        (f.fieldType === "textarea" || f.fieldType === "radio" || f.fieldType === "select") &&
        !mappingResult.mappings.find((m: any) => m.field_id === f.fieldId)
    );

    let screeningAnswers: any[] = [];
    if (screeningQuestions.length > 0) {
      const screeningResult = await getScreeningAnswers({
        job_title: job.title,
        company_name: job.company,
        job_description: job.description ?? "",
        questions: screeningQuestions,
        user_profile: profile,
      });
      screeningAnswers = screeningResult.answers ?? [];
    }

    // Step 6: Fill all fields
    const allAnswers = [
      ...mappingResult.mappings.map((m: any) => ({
        field_id: m.field_id,
        value: m.value,
      })),
      ...screeningAnswers.map((a: any) => ({
        field_id: a.field_id,
        value: a.answer,
      })),
    ];

    for (const answer of allAnswers) {
      await browser.tabs.sendMessage(tabId, {
        type: "FILL_FIELD",
        fieldId: answer.field_id,
        value: answer.value,
      });
      await new Promise((r) => setTimeout(r, 300)); // Small delay between fills
    }

    // Step 7: Submit (handle multi-step forms)
    let submitted = false;
    for (let step = 0; step < 5; step++) {
      // Max 5 steps
      const result = await browser.tabs.sendMessage(tabId, {
        type: "CLICK_SUBMIT",
      });

      if (!result?.success) {
        break;
      }

      await new Promise((r) => setTimeout(r, 2000));

      // Check if we're done (no more submit/next buttons, or success message)
      const moreFields = await browser.tabs.sendMessage(tabId, {
        type: "EXTRACT_FIELDS",
      });

      if (!moreFields?.fields?.length) {
        submitted = true;
        break;
      }

      // Fill any new fields on this step
      // (Simplified: in production, repeat the AI call for new fields)
    }

    return { success: submitted };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener(async (message) => {
    switch (message.type) {
      case "AUTH_CHECK":
        return await fetchExtensionToken();

      case "START":
        await startApplyLoop(message.url);
        break;

      case "PAUSE":
        await updateStatus({ state: "paused" });
        await addLog(log("Paused by user", "warning"));
        break;

      case "RESUME":
        await updateStatus({ state: "running" });
        await addLog(log("Resumed", "info"));
        break;

      case "STOP":
        await updateStatus({ state: "idle", currentJob: null, queue: [] });
        await addLog(log("Stopped by user", "warning"));
        break;

      case "SKIP":
        skipRequested = true;
        await addLog(log("Skipping current job...", "warning"));
        break;
    }
  });

  browser.runtime.onInstalled.addListener(async () => {
    await fetchExtensionToken();
  });
});

async function startApplyLoop(url: string) {
  const authState = await authStorage.getValue();
  if (!authState) {
    await addLog(log("Not authenticated — please connect your account", "error"));
    return;
  }

  // Fetch user profile
  const profile = await getUserProfile();
  if (!profile) {
    await addLog(log("Could not fetch profile — please fill out your profile first", "error"));
    return;
  }

  await updateStatus({
    state: "running",
    completed: 0,
    failed: 0,
    dailyCount: authState.user.appsToday,
    dailyLimit: authState.user.dailyLimit,
    logs: [],
  });

  await addLog(log(`Starting — navigating to ${url}`));

  // Open URL in a new tab
  const tab = await browser.tabs.create({ url, active: true });
  if (!tab.id) {
    await addLog(log("Failed to open tab", "error"));
    await updateStatus({ state: "idle" });
    return;
  }

  // Wait for page to load
  await new Promise((resolve) => {
    const listener = (tabId: number, info: any) => {
      if (tabId === tab.id && info.status === "complete") {
        browser.tabs.onUpdated.removeListener(listener);
        resolve(true);
      }
    };
    browser.tabs.onUpdated.addListener(listener);
    setTimeout(() => resolve(false), 30000);
  });

  await new Promise((r) => setTimeout(r, 2000)); // Extra settle time

  // Scrape job listings
  await addLog(log("Scraping job listings..."));

  const scrapeResult = await browser.tabs.sendMessage(tab.id!, {
    type: "SCRAPE_LISTINGS",
  });

  if (scrapeResult?.error === "LOGIN_WALL") {
    await addLog(log("Login required — please log in to LinkedIn and click Resume", "warning"));
    await updateStatus({ state: "paused" });
    return;
  }

  if (!scrapeResult?.listings?.length) {
    await addLog(log("No job listings found on this page", "error"));
    await updateStatus({ state: "idle" });
    return;
  }

  const listings: JobListing[] = scrapeResult.listings;
  await addLog(log(`Found ${listings.length} jobs`, "success"));
  await updateStatus({ queue: listings });

  // Apply loop
  for (let i = 0; i < listings.length; i++) {
    const status = await statusStorage.getValue();

    // Check if stopped
    if (status.state === "idle") break;

    // Check if paused
    if (status.state === "paused") {
      const resumed = await waitForState("running");
      if (!resumed) break;
    }

    // Check daily limit
    if (status.dailyCount >= status.dailyLimit) {
      await addLog(log(`Daily limit reached (${status.dailyLimit})`, "warning"));
      break;
    }

    // Check skip
    if (skipRequested) {
      skipRequested = false;
      await addLog(log(`Skipped: ${listings[i].title}`, "warning"));
      continue;
    }

    const job = listings[i];
    const result = await applyToJob(tab.id!, job, profile, authState, url);

    if (result.success) {
      await addLog(log(`Applied: ${job.title} at ${job.company}`, "success"));
      await updateStatus({
        completed: status.completed + 1,
        dailyCount: status.dailyCount + 1,
        queue: listings.slice(i + 1),
      });

      // Report to web app
      try {
        await reportApplication({
          job_url: job.applyUrl,
          company_name: job.company,
          job_title: job.title,
          job_description: job.description,
          status: "applied",
          source_url: url,
          platform: "linkedin",
        });
      } catch (err) {
        console.error("Failed to report application:", err);
      }
    } else {
      await addLog(log(`Failed: ${job.title} — ${result.error}`, "error"));
      await updateStatus({
        failed: status.failed + 1,
        queue: listings.slice(i + 1),
      });

      try {
        await reportApplication({
          job_url: job.applyUrl,
          company_name: job.company,
          job_title: job.title,
          status: "failed",
          failure_reason: result.error,
          source_url: url,
          platform: "linkedin",
        });
      } catch (err) {
        console.error("Failed to report application:", err);
      }
    }

    // Small delay between applications
    await new Promise((r) => setTimeout(r, 2000));
  }

  const finalStatus = await statusStorage.getValue();
  await addLog(
    log(
      `Done — ${finalStatus.completed} applied, ${finalStatus.failed} failed`,
      "success"
    )
  );
  await updateStatus({ state: "idle", currentJob: null });
}
```

- [ ] **Step 2: Verify extension builds**

Run:
```bash
cd extension && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit apply loop**

```bash
git add extension/src/entrypoints/background.ts
git commit -m "feat: add full apply loop with daily limits, pause/resume/stop, and error handling"
```

---

## Task 15: Integration Smoke Test

**Files:** None (manual testing)

- [ ] **Step 1: Start all services**

Terminal 1 — Web app:
```bash
cd web && npm run dev
```

Terminal 2 — AI backend:
```bash
cd ai-backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000
```

Terminal 3 — Extension dev:
```bash
cd extension && npm run dev
```

- [ ] **Step 2: Load extension in Chrome**

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension/.output/chrome-mv3-dev/`

- [ ] **Step 3: Verify end-to-end flow**

1. Open `http://localhost:3000` — landing page renders
2. Click "Sign in with Google" — redirects through OAuth (requires real credentials in `.env.local`)
3. After sign-in, redirected to `/dashboard` — empty application list
4. Navigate to `/profile` — fill out name, phone, skills, work experience
5. Click extension icon — should show popup with "Connect Account" or logged-in state
6. Paste a LinkedIn jobs tracker URL — click "Start Applying"
7. Extension navigates to LinkedIn, scrapes listings, starts applying
8. Dashboard refreshes to show application entries

- [ ] **Step 4: Verify daily limit enforcement**

Open extension popup — verify daily count shows `X/10`. After 10 successful applications, the extension should stop with "Daily limit reached" message.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: integration smoke test and final cleanup"
```

---

## Summary

| Task | Component | What It Builds |
|------|-----------|---------------|
| 1 | All | Project scaffold (Next.js, FastAPI, WXT) |
| 2 | Database | Supabase schema (users, profiles, applications) |
| 3 | Web App | NextAuth with Google + LinkedIn, user sync |
| 4 | Web App | Profile GET/PUT API routes |
| 5 | Web App | Profile builder page (form UI) |
| 6 | Web App | Applications API (GET/POST) + extension token exchange |
| 7 | Web App | Dashboard + landing page |
| 8 | AI Backend | FastAPI scaffold + Pydantic schemas |
| 9 | AI Backend | Screening question answer generation (Claude API) |
| 10 | AI Backend | Field mapping service (profile → form) |
| 11 | Extension | WXT scaffold + popup UI |
| 12 | Extension | Auth (token exchange with web app) |
| 13 | Extension | LinkedIn adapter (scraping + form filling) |
| 14 | Extension | Apply loop + daily limits + pause/resume/stop |
| 15 | All | Integration smoke test |
