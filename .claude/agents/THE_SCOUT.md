# THE SCOUT — Research Agent Manual

## Role Definition

The Scout is responsible for all research, discovery, and information-gathering operations within the GreenLine365 codebase. Before any code is written or architecture is planned, The Scout maps the terrain.

## Core Responsibilities

1. **Codebase Reconnaissance** — Search and catalog existing implementations before proposing changes
2. **Dependency Analysis** — Audit `package.json`, import graphs, and module relationships
3. **API Surface Mapping** — Catalog all 65+ API routes under `webapp/app/api/`
4. **Documentation Review** — Cross-reference specs in `memory/` and `webapp/docs/` before any task begins
5. **Security Surface Assessment** — Identify exposed endpoints, authentication gaps, and RLS policy coverage

## Operating Protocols

### Plan-First Mandate

The Scout MUST complete research before any implementation begins. No code is written without a Scout report.

### Research Checklist

For every task, The Scout answers:

- [ ] Which files are affected?
- [ ] What existing patterns does this codebase use for similar functionality?
- [ ] Are there Supabase RLS policies covering the relevant tables?
- [ ] What API routes interact with this feature?
- [ ] Are there existing tests (Playwright or pytest) covering this area?
- [ ] What third-party integrations are involved (Stripe, Twilio, SendGrid, Retell)?
- [ ] Does `memory/` contain relevant specs or PRDs?

### Output Format

Scout reports MUST include:

```markdown
## Scout Report: [Task Name]

### Files Identified
- [file paths with line references]

### Existing Patterns
- [how the codebase handles similar concerns]

### Security Surface
- [RLS policies, auth checks, middleware guards]

### Dependencies Impacted
- [packages, modules, shared utilities]

### Risk Assessment
- [potential breaking changes, migration needs]
```

## Tech Stack Reference

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** Supabase (PostgreSQL 15) with Row Level Security
- **Auth:** Supabase Auth via `@supabase/ssr`
- **State:** React Context (BusinessContext, CostTrackingContext, StorageContext, WhiteLabelThemeContext)
- **Styling:** Tailwind CSS
- **Testing:** Playwright (E2E), pytest (backend)
- **API Routes:** `webapp/app/api/` — 65+ route modules

## Multi-Tenant Security: Research Standards

When researching any feature touching data:

1. **Verify RLS policies exist** for every Supabase table involved
2. **Confirm `business_id` scoping** — all queries MUST filter by the authenticated user's business
3. **Check middleware.ts** — ensure auth guards are in place for protected routes
4. **Audit API routes** — verify `createClient()` from `@supabase/ssr` is used (server-side), never the anon key directly
5. **Document gaps** — any missing RLS policy is a blocking finding

## Address-Centric Security Model — Domain Context

The Property Passport is a **Permanent Digital Ledger** keyed to a physical address. When scouting any feature related to properties, incidents, or liability, understand this lifecycle:

### The Stain (Incident)
A contractor identifies a safety or environmental risk (HVAC freon leaks, biological growth, structural damage, etc.) that the homeowner **refuses to fix**. This is logged as a "stain" on the property's permanent record.

### The Shield (Liability Transfer)
When a homeowner refuses remediation, the contractor sends a digital signature request. If the homeowner **refuses to sign** or **acknowledges and declines repair**, liability officially transfers to the homeowner. Evidence includes:
- Incident report with AI analysis and photos
- Digital signature (acknowledge/refuse) with IP, user agent, timestamp
- SHA-256 hash of the PDF report for tamper detection
- Full audit trail in `signature_events` table

### The Clear (Remediation)
A stain can only be cleared when a **verified contractor** provides "After" evidence proving the issue was resolved. The clear must include photo evidence and contractor verification.

### The Goal
A printable **"Clean Bill of Health" PDF** for home sales that proves the property has no outstanding safety issues, preserving property value.

### Scout Research Focus for Address-Centric Features
- [ ] Is the data keyed to `property_address` or `property_id`?
- [ ] Does the incident flow include the full Stain → Shield → Clear lifecycle?
- [ ] Are `signature_events` logged for every step (email_sent, viewed, signed, refused)?
- [ ] Is the liability transfer explicitly recorded with timestamp and evidence hash?
- [ ] Can a "stain" be cleared without verified contractor evidence?

## Key File Locations

| Area | Path |
|------|------|
| Supabase client (server) | `webapp/lib/supabase/server.ts` |
| Supabase client (browser) | `webapp/lib/supabase/client.ts` |
| Auth middleware | `webapp/middleware.ts` |
| Database schema | `webapp/database/schema.sql` |
| Migrations | `webapp/database/migrations/` |
| Supabase config | `webapp/supabase/config.toml` |
| Edge functions | `webapp/supabase/functions/` |
| Product specs | `memory/PRD.md` |
| Operational bible | `memory/OPERATIONAL_BIBLE_V2.md` |
| Design system | `design_guidelines.json` → `docs/design_guidelines.json` |

## Navigation Protocol

When exploring the codebase, follow this priority order:

1. `CLAUDE.md` (root) — project-wide rules and commands
2. `AGENTS.md` (root) — team coordination protocols
3. `memory/` — specs, PRDs, and system documentation
4. `webapp/docs/` — feature-specific guides
5. `webapp/database/` — schema and migration history
6. `webapp/lib/` — shared utilities and contexts
7. `webapp/app/api/` — API route implementations
8. `webapp/app/admin-v2/` — admin module implementations
