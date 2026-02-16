# CLAUDE.md — GreenLine365 Technical Source of Truth

This file is the authoritative reference for all AI agents and developers working in this repository. Read this first before any other file.

## Project Overview

**GreenLine365** is a multi-tenant SaaS platform for real estate professionals, providing marketing automation, CRM, content management, AI-powered communications, and business intelligence.

- **Production URL:** Deployed via Vercel
- **Primary Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase
- **Architecture:** Multi-tenant with Row Level Security (RLS) enforced at the database layer

## Repository Structure

```
greenline365-web/
├── .claude/                    # Agent configuration and manuals
│   └── agents/                 # Specialized agent manuals
│       ├── THE_SCOUT.md        # Research agent
│       ├── THE_ARCHITECT.md    # Planning agent
│       ├── THE_IMPLEMENTER.md  # Engineering agent
│       └── THE_AUDITOR.md      # Compliance/QA agent
├── CLAUDE.md                   # THIS FILE — technical source of truth
├── AGENTS.md                   # Team hierarchy and protocols
├── backend/                    # FastAPI proxy server
│   ├── server.py               # Proxy to Next.js (port 3000)
│   ├── requirements.txt
│   └── tests/
├── docs/                       # Project-level documentation
│   ├── design_guidelines.json  # Design system specification
│   └── notes/                  # Development notes and test results
├── memory/                     # Specs, PRDs, and system documentation
│   ├── PRD.md
│   ├── OPERATIONAL_BIBLE_V2.md
│   ├── PRICING_STACK.md
│   └── [other spec files]
├── scripts/                    # Standalone utility scripts
├── tests/                      # Root-level integration tests (pytest)
├── test_reports/               # Test execution artifacts
└── webapp/                     # Main Next.js application
    ├── app/                    # Next.js App Router pages and API routes
    │   ├── api/                # 65+ API route modules
    │   ├── admin-v2/           # 29 admin modules
    │   └── [pages]/            # Public and authenticated pages
    ├── components/             # Reusable UI components
    ├── config/                 # Feature configurations
    ├── database/               # Schema and migrations
    ├── docs/                   # Feature-specific documentation
    ├── lib/                    # Shared utilities and contexts
    ├── public/                 # Static assets
    ├── scripts/                # Build and seed scripts
    ├── services/               # Backend service modules
    ├── supabase/               # Supabase config, functions, migrations
    └── tests/                  # Playwright E2E tests
```

## Build Commands

All commands run from the `webapp/` directory unless noted otherwise.

```bash
# Development
npm run dev                     # Start Next.js dev server

# Type Checking
npm run typecheck               # tsc --noEmit (MUST pass before commit)

# Linting
npm run lint                    # ESLint (MUST pass before commit)

# Pre-Build Validation
npm run prebuild:check          # Runs typecheck + lint together

# Production Build
npm run build                   # next build

# Start Production Server
npm run start                   # next start

# Database Seeding
npm run supabase:seed           # node scripts/seed-simple.js

# E2E Testing
npx playwright test             # Run all Playwright tests
npx playwright test --ui        # Run with Playwright UI

# Backend (from backend/ directory)
pip install -r requirements.txt # Install Python dependencies
python server.py                # Start FastAPI proxy
pytest tests/ -v                # Run backend tests

# Root-level tests (from project root)
pytest tests/ -v                # Run integration tests
```

## Linting Rules

- **ESLint 9** with Next.js core-web-vitals and TypeScript configs
- **TypeScript strict mode** enabled — no `any` types, no `@ts-ignore` without justification
- **Husky** pre-commit hooks enforce quality gates
- Run `npm run prebuild:check` before every commit

### ESLint Configuration

Located at `webapp/eslint.config.mjs`:
- Extends: `next/core-web-vitals`, `next/typescript`
- Global ignores: `.next/` build output

### TypeScript Configuration

Located at `webapp/tsconfig.json`:
- Target: ES2017
- Strict: true
- Path aliases: `@/*` → project root
- JSX: react-jsx (React 17+ transform)

## Security Guardrails

### Multi-Tenant Isolation (CRITICAL)

This is a multi-tenant application. Data isolation is enforced at the database level via Supabase Row Level Security (RLS).

**Mandatory rules:**

1. **Every table with tenant data MUST have RLS enabled**
2. **Every RLS policy MUST filter by `business_id`** via `auth.uid()` lookup
3. **Never trust client-provided `business_id`** — always derive from the authenticated session
4. **Never use the Supabase `service_role` key** in API routes
5. **Never disable RLS** for convenience, testing, or any other reason

### Authentication

- Auth is handled by **Supabase Auth** via `@supabase/ssr`
- Server-side: use `createClient()` from `lib/supabase/server.ts`
- Client-side: use `createBrowserClient()` from `lib/supabase/client.ts`
- Middleware guard: `webapp/middleware.ts` protects authenticated routes
- Every API route MUST call `supabase.auth.getUser()` before data access

### Input Validation

- Use **Zod** for all API request body validation
- Sanitize URL parameters before database queries
- Validate file uploads for type, size, and content
- Never construct SQL with string concatenation — always use the Supabase client

### OWASP Top 10 Prevention

| Threat | Mitigation |
|--------|------------|
| Injection | Parameterized queries via Supabase client |
| Broken Auth | Supabase Auth + middleware guards |
| Sensitive Data Exposure | Server-side rendering, env vars for secrets |
| XXE | No XML parsing in the application |
| Broken Access Control | RLS policies + API auth checks |
| Misconfig | TypeScript strict, ESLint enforced |
| XSS | React auto-escaping, no raw HTML injection |
| Insecure Deserialization | Zod validation at API boundaries |
| Vulnerable Components | Regular dependency audits |
| Logging | Audit logger at `lib/audit-logger.ts` |

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.0.10 | Framework |
| react | 19.2.1 | UI library |
| @supabase/supabase-js | 2.89.0 | Database client |
| @supabase/ssr | 0.8.0 | Server-side auth |
| zod | (latest) | Input validation |
| stripe | 20.3.1 | Payments |
| twilio | 5.11.2 | SMS/Voice |
| @sendgrid/mail | 8.1.6 | Email delivery |
| retell-sdk | 4.66.0 | AI voice calls |
| posthog-js | (latest) | Analytics |
| @playwright/test | 1.57.0 | E2E testing |
| tailwindcss | (latest) | Styling |

## Environment Variables

Required environment variables (never commit these):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Server-only service role key
- `STRIPE_SECRET_KEY` — Stripe API key
- `SENDGRID_API_KEY` — SendGrid email key
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — Twilio credentials
- `RETELL_API_KEY` — Retell AI voice API key
- `NEXT_PUBLIC_POSTHOG_KEY` — PostHog analytics key

## Agent Navigation Guide

When starting any task, agents should read files in this order:

1. **`CLAUDE.md`** (this file) — Project rules, commands, security policies
2. **`AGENTS.md`** — Team roles, communication protocols, Plan-First mandate
3. **`.claude/agents/[ROLE].md`** — Role-specific instructions
4. **`memory/`** — Specs and PRDs relevant to the task
5. **`webapp/docs/`** — Feature-specific documentation
6. **`webapp/lib/`** — Shared utilities to understand existing patterns
7. **Task-specific source files** — The actual code being modified
