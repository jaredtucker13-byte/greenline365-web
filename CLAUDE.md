# CLAUDE.md — Agent Entry Point for GreenLine365

> **Last updated:** 2026-02-27
> **Platform:** GreenLine365 — Community Operating System for local businesses
> **Stack:** Next.js 16 + React 19 / Supabase / Stripe / Vercel
> **Status:** ~70% production ready. Directory live. Engines 2 & 3 in planning.

---

## Quick Context

GreenLine365 is a **city-wide operating system** with 3 engines:
1. **Directory Engine** (LIVE) — Business discovery, listings, reviews, subscriptions ($0/$45/$89)
2. **Lifestyle & Entertainment Engine** (PLANNED) — Social discovery loops, scavenger hunts
3. **Competitive League Engine** (PLANNED) — Amateur sports management, leaderboards

All code lives in `webapp/`. The app runs on Next.js App Router.

---

## Repository Structure

```
greenline365-web/
├── CLAUDE.md              ← YOU ARE HERE — read this first
├── ROADMAP.md             ← Full 3-engine vision + revenue model
├── memory/                ← Product specs & business logic (see memory/INDEX.md)
│   ├── INDEX.md           ← Navigation map for this folder
│   ├── PRD.md             ← Original product requirements
│   ├── OPERATIONAL_BIBLE_V2.md  ← Current business rules (supersedes V1)
│   ├── PRICING_STACK.md   ← Tier pricing logic
│   └── ...
├── docs/                  ← Technical docs & reports (see docs/INDEX.md)
│   ├── INDEX.md           ← Navigation map for this folder
│   ├── reports/           ← Progress reports (latest: 2026-02-27)
│   ├── brainstorming/     ← Feature brainstorming docs
│   └── ...
├── webapp/                ← All application code
│   ├── app/               ← Next.js App Router pages + API routes
│   ├── components/        ← React components
│   ├── lib/               ← Utilities, hooks, services
│   ├── database/          ← Migration SQL files + setup docs
│   ├── supabase/          ← Edge functions + config
│   ├── config/            ← Marketing skills, feature config
│   └── public/            ← Static assets
```

---

## Key Files by Topic

### If you need to understand the PRODUCT:
- `memory/PRD.md` — Original requirements + completed phases
- `memory/OPERATIONAL_BIBLE_V2.md` — Current business rules (badges, reputation, sales)
- `memory/PRICING_STACK.md` — Tier pricing and entitlements
- `ROADMAP.md` — Full 3-engine vision, revenue model, future plans

### If you need to understand the CODEBASE:
- `docs/reports/progress-report-2026-02-27.md` — Latest full status audit
- `webapp/FEATURE_INVENTORY.md` — Marketing-oriented feature list
- `webapp/DESIGN_SYSTEM.md` — UI patterns, colors, typography
- `webapp/IMPLEMENTATION_ROADMAP.md` — Build order + dependencies

### If you need to understand the DATABASE:
- `webapp/database/DATABASE_DOCUMENTATION.md` — Schema docs
- `webapp/database/MULTI_TENANT_SETUP.md` — Multi-tenant architecture
- `webapp/database/MIGRATION_CHECKLIST.md` — Which migrations have run
- SQL files: `webapp/database/migrations/` or `webapp/supabase/migrations/`

### If you need to understand SPECIFIC FEATURES:
- Directory: `webapp/app/directory/` + `webapp/app/api/directory/`
- Portal: `webapp/app/portal/` + `webapp/app/api/portal/`
- Blog: `webapp/app/admin-v2/blog-polish/` + `webapp/app/api/blog/`
- Email: `webapp/lib/email/` + `webapp/app/api/email/`
- CRM: `webapp/app/admin-v2/crm/` + `webapp/app/api/crm/`
- Voice AI: `webapp/app/api/retell/` + `docs/retell-ai-agent-base-template.md`
- QR System: `webapp/lib/qr/` + `webapp/app/api/qr/`
- Home Ledger: `webapp/app/admin-v2/property-passport/` + `webapp/app/api/properties/`

---

## Architecture Decisions

- **Auth:** Supabase SSR auth with cookie-based sessions. Middleware at `webapp/lib/supabase/middleware.ts`
- **AI Models:** All LLM calls go through OpenRouter (`webapp/lib/chat/model-selector.ts`). Supports GPT-4o, Claude, Perplexity Sonar.
- **Feature Gating:** Tier-based feature gates in `webapp/lib/feature-gates.ts`. Three tiers: free, pro ($45/mo), premium ($89/mo).
- **Email:** SendGrid primary, Gmail SMTP fallback. Senders in `webapp/lib/email/`.
- **Image Generation:** OpenAI GPT Image 1 via direct API calls.
- **QR Codes:** Self-hosted using `qrcode` npm package. No external API dependency.
- **Styling:** Tailwind CSS 3.4. "Bentley Standard" dark theme with gold (#C9A84C) accents on charcoal/midnight blue.

---

## Conventions

- **Routing:** Next.js App Router. Pages at `app/[route]/page.tsx`, APIs at `app/api/[route]/route.ts`
- **Components:** Shared UI in `webapp/components/ui/os/`. Page-specific components inline.
- **Database:** Supabase PostgreSQL. Migrations in numbered SQL files. Use `supabase` client from `webapp/lib/supabase/`.
- **Environment:** All secrets in `.env.local` (not committed). Key vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY`.

---

## Current Priorities (Feb 2026)

1. **Founding Members Program** — Build DB schema + enrollment API + homepage counter (0% done)
2. **Email Automation Layer** — Auto-triggers, sequence scheduler, SendGrid webhooks (25% done)
3. **`/home-ledger` Landing Page** — Currently 404, needs full marketing page (0% done)
4. **Production Hardening** — SendGrid key, migration 012, real analytics data

---

## What NOT to Touch

- `webapp/config/marketing-skills/` — Large skill library, reference only
- `webapp/database/` docs — Setup guides for reference, don't modify
- Any file with `_V1` suffix — Superseded by V2 versions
- `memory/OPERATIONAL_BIBLE.md` — Superseded by `OPERATIONAL_BIBLE_V2.md`
