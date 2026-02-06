# GreenLine365 Business Operating System - PRD

## HARD RULES (DO NOT OVERRIDE)
1. **DO NOT use EMERGENT_LLM_KEY for image generation** - Use kie.ai (KIE_API_KEY)
2. **For LLM text analysis: Use OpenRouter with Gemini 3 Pro**
3. **GreenLine365 = Primary admin account, ArtfulPhusion = White-label test tenant**
4. **Florida Two-Party Consent**: Recording disclosure is MANDATORY
5. **Master Term**: "Property Intelligence Engine"

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (Turbopack)
- **Database**: Supabase PostgreSQL with RLS
- **Auth**: Supabase Auth (Google OAuth + Email/Password)
- **AI Voice**: Retell AI + Twilio
- **Calendar**: Cal.com

### RBAC Roles
| Level | Role | Permissions |
|-------|------|-------------|
| 1 | Owner | Full access |
| 2 | Manager | Operations, no Filing Cabinet |
| 3 | Tech | Assigned jobs, upload-only Filing Cabinet |
| 4 | Guest | Read-only Property Passport |

### Database Tables (Property Intelligence)
```
properties → contacts, assets, property_interactions
filing_cabinet (role-based access)
audit_logs (compliance)
team_members (staff management)
contractor_directory (referral network)
referrals (referral tracking)
contractor_reviews (ratings)
```

**IMPORTANT SCHEMA NOTES:**
- Properties: `address_line1` (NOT `address`), `zip_code` (NOT `zip`)
- Assets: `model_number` (NOT `model`), has `warranty_expiry`, `serial_number`
- Use `property_interactions` for service history (NOT `interactions` — that's the chat table)
- Audit logs use `actor_id` (NOT `user_id`) and `details` JSONB (NOT `description`)

---

## What's Been Implemented

### February 6, 2026 — Property Intelligence Module

#### Commander Dashboard (`/admin-v2/commander`)
- KPI strip, property list, quick actions, activity feed, emergency alerts placeholder

#### Property Passport (`/admin-v2/property-passport`)
- Property grid with search, detail view with tabs (Timeline, Assets, Warranty Vault, Contacts)
- Health Score ring, CRS display, warranty status indicators

#### Filing Cabinet (`/admin-v2/filing-cabinet`)
- Upload modal, category tabs, tax year filter, CPA CSV export, soft delete with audit

#### Referral Network (`/admin-v2/referral-network`)
- Contractor Directory with industry filters, star ratings, preferred marking
- Referral Tracker with status flow (suggested → sent → completed)
- Revenue tracking, add contractor modal
- Priority logic: Preferred → Greenline member → Highest rated

#### Sidebar Navigation
- PROPERTY INTEL section: Commander, Passports, Filing Cabinet, Referral Network
- TOOLS section: existing features

#### SQL Migrations
- 016: RBAC profiles, team_members, filing_cabinet, audit_logs enhancement
- 017: contractor_directory, referrals, contractor_reviews with auto-rating trigger
- 018: property_interactions table, performance indexes, auto-update triggers

#### API Endpoints
| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/properties` | GET, POST | Property CRUD + search |
| `/api/filing-cabinet` | GET, POST, DELETE | Document vault |
| `/api/audit-log` | GET, POST | Compliance logging |
| `/api/contractors` | GET, POST, PATCH | Contractor directory |
| `/api/referrals` | GET, POST, PATCH | Referral tracking |

---

## Upcoming Tasks

### P0 - Deploy & Connect
1. Deploy `pre-greeting` Edge Function to Supabase
2. Configure Retell Webhook → pre-greeting function
3. Create Supabase Storage bucket `filing-cabinet`

### P1 - Webhooks
1. Emergency Alert webhook (`/api/emergency-alert`)
2. Call Analyzed webhook (updates CRS post-call)

### P1 - Commander Enhancements
1. Live call monitoring, One-Tap Swap, real-time alerts

### P2 - RBAC Enforcement
1. Team member invite flow, role management in Settings
2. Admin impersonation feature
3. Signed URLs for homeowner Property Passport access

### P2 - Filing Cabinet Enhancements
1. AI OCR receipt scanning, Slack integration, Job Costing AI
2. ZIP + CSV export for CPA

### P2 - Second Brain (Slack)
1. Capture channel, AI categorization, Sunday Recap email

### P3 - Founding 30 Onboarding
1. A2P Wizard, Safe-Way onboarding, Stripe Connect

### P3 - Homeowner Subscription ($9/mo)
1. Public Property Passport, AI proactive monitoring

---

## Key Files
- `/app/admin-v2/commander/page.tsx`
- `/app/admin-v2/property-passport/page.tsx`
- `/app/admin-v2/filing-cabinet/page.tsx`
- `/app/admin-v2/referral-network/page.tsx`
- `/app/admin-v2/components/CollapsibleSidebar.tsx`
- `/app/api/properties/route.ts`
- `/app/api/filing-cabinet/route.ts`
- `/app/api/contractors/route.ts`
- `/app/api/referrals/route.ts`
- `/app/api/audit-log/route.ts`
- `/database/migrations/016_rbac_filing_cabinet_audit.sql`
- `/database/migrations/017_referral_network_ratings.sql`
- `/database/migrations/018_performance_optimizations.sql`
