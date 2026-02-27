<!-- AGENT METADATA
  status: active
  updated: 2026-01-15
  scope: Original product requirements, completed phases, architecture decisions
  read-when: You need to understand what was built and why
-->

# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a premium business directory platform ("Bentley Standard") for Florida with:
- Directory restructure into 9 categories with sub-category filtering
- Premium dark-themed UI with gold accents (charcoal, midnight blue, champagne gold)
- Destination Guides (mini-directories) for tourist spots
- AI-powered business discovery pipeline (Perplexity + Google Places)
- CRM integration with "closed after hours" lead qualification
- Stripe payments, tier-based features, weighted ranking

## Architecture
- **Framework:** Next.js 16 (App Router) on port 3000
- **Backend Proxy:** FastAPI on port 8001 → forwards /api/* to Next.js
- **Database:** PostgreSQL via Supabase
- **Payments:** Stripe (live keys)
- **AI Discovery:** OpenRouter (Perplexity sonar-pro) + Google Places API
- **Styling:** Tailwind CSS with Bentley Standard theme
- **Image Generation:** Gemini (Nano Banana) for destination photos

## Completed Features

### Phase 1 — Directory & UI Overhaul (Complete)
- "Bentley Standard" dark theme with gold accents
- 9-category homepage grid with sub-category pill tabs
- Weighted ranking for paid tier businesses
- Stripe live integration with webhook verification

### Phase 2A — Discovery Pipeline (Complete)
- 3-stage pipeline: Perplexity → Google Places → Directory + CRM
- "Closed After Hours" CRM tagging
- 8 destinations: ~542 total listings, ~195 CRM leads

### Phase 2B — Destination Guide UI (Complete)
- Dedicated guide pages at `/destination/[slug]`
- 10 tourism section tabs per destination

### Phase 2C — Bentley Standard Visual Overhaul (Complete)
- Deep midnight blue gradient base with gold accent radials
- 8-Card Destination Grid with AI-generated photography
- Gold filigree corner accents, section dividers

### Business Owner Dashboard (Complete)
- Listing management, Stripe tier upgrades, photo management
- Secure claim flow with manual verification
- GL365 Reviews with AI-drafted responses

### Maps, Filtering & SEO (Complete)
- Google Maps embed + directions on all listings
- Geolocation-based sorting, city/rating/distance filters
- Dynamic sitemap.xml, robots.txt, Google Search Console verified

### Lead Generation Pipeline (Complete)
- 92+ targeted service business leads with sales briefs
- Google Maps "Closed After Hours" screenshots
- Chat widget wired to directory data as concierge

### Marketplace Add-ons (Complete)
- Coupon Engine, Custom Polls, Featured Boost, Analytics Pro, Photo Library
- Review Response AI with autopilot mode

### Campaign Manager — Phase 1 (Feb 12, 2026)
Built the Campaign Manager and Unified Calendar:

**Campaign Manager (`/admin-v2/campaigns`):**
- Campaign CRUD (create, edit, save as draft, delete)
- Kanban pipeline view: New → Contacted → Replied → Claimed → Upgraded → Gold
- Audience segmentation (filter by city, industry, after-hours status)
- Import contacts from directory listings (auto-deduplication)
- Multi-step email sequence builder (initial outreach, value bomb/audit, demo invite, follow-up, final offer)
- Pipeline stage management with auto-CRM lead creation on "replied"
- Campaign list view with status tabs (All, Drafts, Active, Scheduled, Sent, Paused)

**APIs Built:**
- `GET/POST /api/campaigns` — List and create campaigns
- `GET/PATCH/DELETE /api/campaigns/[id]` — Single campaign CRUD
- `GET/POST/PATCH /api/campaigns/[id]/contacts` — Import from directory, manual add, pipeline stage updates

**Unified Calendar (`/admin-v2/calendar`):**
- Multi-source: bookings (blue), content (green), campaigns (amber), newsletters (purple), blogs (pink)
- Color-coded dot markers per event type
- Past days = review only (can see what was posted)
- Today/future = can create new events
- Full CRUD on events until sent
- Filter legend to toggle event types
- Month and Week view modes
- Event detail drawer with links to Campaign Manager or Content Forge
- Create event modal with type selector and time picker

**APIs Built:**
- `GET /api/calendar/unified` — Unified events from bookings, scheduled_content, email_campaigns
- `POST /api/calendar/unified` — Create calendar events (blocks past dates)
- `PATCH /api/calendar/unified` — Update events across tables
- `DELETE /api/calendar/unified` — Delete events across tables

**Sidebar Updated:**
- Added "Campaigns" entry with megaphone icon in CollapsibleSidebar.tsx

## Backlog

### P0 — Immediate (Next Session)
- Wire email sending to Campaign Manager (Gmail SMTP / multi-sender rotation)
- Calendar integration for campaign scheduled sends (auto-appear on calendar)
- Content Forge accessible from calendar day click
- Webhook triggers for self-signups and paid upgrades

### P1 — Coupon & Poll Frontend UI
- Display coupons on listing pages + redemption flow
- Display poll widgets on listings + results in dashboard

### P2 — Property Intelligence Badge
- Visual badge for high-tier CRM subscribers

### P3 — Expansion
- Expand discovery limits (25/category per destination)
- Add more Florida destinations (Tampa, Naples, Clearwater, Fort Lauderdale)
- Events & Festivals schema + UI

## Key API Endpoints
- `GET /api/directory` — Main directory with destination/tourism_category filters
- `GET/POST /api/campaigns` — Campaign management
- `GET /api/calendar/unified` — Unified calendar events
- `GET /api/directory/discover` — List 8 destinations & 10 categories
- `POST /api/directory/discover` — Run discovery pipeline

## Key Files
- `/app/webapp/app/admin-v2/campaigns/page.tsx` — Campaign Manager UI
- `/app/webapp/app/admin-v2/calendar/page.tsx` — Unified Calendar UI
- `/app/webapp/app/api/campaigns/route.ts` — Campaign CRUD API
- `/app/webapp/app/api/campaigns/[id]/route.ts` — Single campaign API
- `/app/webapp/app/api/campaigns/[id]/contacts/route.ts` — Contact management API
- `/app/webapp/app/api/calendar/unified/route.ts` — Unified calendar API
- `/app/webapp/app/admin-v2/components/CollapsibleSidebar.tsx` — Sidebar with Campaigns entry
- `/app/webapp/app/directory/DirectoryClient.tsx` — Homepage
- `/app/webapp/app/api/directory/discover/route.ts` — Discovery pipeline

## Test Reports
- `/app/test_reports/iteration_22.json` — Campaign Manager & Calendar API: 100% pass (28/28)

## Hub-and-Spoke Subscription Tier System — Sprint 1 (Complete ✅)
**Merged:** February 20, 2026 — PR #10 (`claude/help-coding-task-lI7i8` → `main`)
**Branch deleted after merge ✅**

### What Was Built

#### Database Schema (Migrations 028–031)
- **028:** Core subscription tables — `plans`, `subscriptions`, `feature_flags`, `plan_feature_overrides`, `roles`, `permissions`, `role_permissions`, `account_members`, `payment_events` with full RLS policies, indexes, and `updated_at` auto-triggers
- - **029:** Seed data — 4 plans (free, directory_pro, command_center, bundle), 15 feature flags, plan overrides, 4 roles (owner, manager, staff, viewer), 22 permissions with role-permission mappings
  - - **030:** `listing_photos`, `listing_menus`, `listing_stats` tables with RLS for the Owner Portal
    - - **031:** Extended `payment_events` with `stripe_event_id` (unique, for idempotency), `raw_payload` (JSONB), nullable `subscription_id`, and expanded CHECK constraints
     
      - #### Feature Resolution Service (`lib/services/feature-resolution.ts`)
      - - "Most permissive wins" merge strategy: booleans (true wins), integers (max wins), strings (latest wins)
        - - 5-minute in-memory cache with `bustFeatureCache()` on subscription changes
          - - Supports account-level and listing-scoped feature resolution
           
            - #### Auth Middleware (`lib/auth/middleware.ts`)
            - - `requireAuth()` — Basic authentication check
              - - `requireAdmin()` — Admin-only route protection
                - - `requireSubscription()` — Product-type-aware validation with bundle support
                  - - `requirePermission()` — Role-based checking with account owner bypass
                    - - `requireFeature()` — Feature flag validation with listing-scoped resolution
                     
                      - #### API Routes
                      - - `GET/POST /api/subscriptions`, `PATCH/DELETE /api/subscriptions/[id]`
                        - - `GET /api/plans`, `GET /api/features/resolved`, `GET /api/roles`
                          - - `POST /api/billing/checkout` — Stripe checkout session creation with trial support
                            - - `POST /api/billing/portal` — Stripe customer portal access
                              - - `GET/POST /api/team`, `PATCH/DELETE /api/team/[id]` — Team member management
                               
                                - #### Owner Listing Portal (`/portal/`) — Sprint 2 (bundled in same PR)
                                - - Dashboard with quick stats, onboarding checklist, upgrade CTAs
                                  - - Edit Listing form with tier-gated fields (description length, category, tags)
                                    - - Photo Manager — drag-to-reorder, cover photo, upload limits per tier
                                      - - Business Hours editor — 7-day grid, closed toggle, copy-to-all
                                        - - Menu Editor (Pro-gated) — section/item CRUD, stored as JSONB
                                          - - Stats page — basic metrics for all, advanced analytics blurred for free tier
                                            - - Settings — plan info, Stripe portal link, team management (invite/role/revoke)
                                              - - Upgrade page — plan comparison table, billing toggle, FAQ, Stripe checkout
                                                - - **Shared components:** `FeatureGate`, `TierBadge`, `UpgradeCTA`, `StatsCard`, `OnboardingChecklist`, `PlanComparisonTable`, `PortalSidebar`
                                                  - - **Hooks:** `usePortalContext`, `useFeatureGate`
                                                   
                                                    - #### Security Hardening (bundled in same PR)
                                                    - - Stripe webhook: enforced signature verification — removed unsafe JSON.parse fallback
                                                      - - Stripe webhook: idempotency via `payment_events.stripe_event_id` dedup check
                                                        - - Stripe webhook: full subscription state sync (checkout→active, updated→sync, deleted→canceled, invoice.succeeded→active, invoice.failed→past_due, paused, resumed)
                                                          - - Stripe webhook: busts `feature-resolution` in-memory cache on every subscription state change
                                                            - - Directory addons route: replaced dynamic `addons[addon_type]` key assignment with `VALID_ADDON_TYPES` allowlist — prevents prototype-pollution vulnerability
                                                              - - All Stripe client calls converted to lazy-init singleton pattern (`getStripe()`) to prevent build-time crashes
                                                               
                                                                - #### TypeScript Types (`lib/types/subscription.ts`)
                                                                - - Comprehensive interfaces for plans, subscriptions, feature flags, roles, permissions, team members, billing events
                                                                 
                                                                  - ### Key Files Added/Modified
                                                                  - - `webapp/app/portal/` — Full portal UI (dashboard, edit, photos, hours, menu, stats, settings, upgrade)
                                                                    - - `webapp/app/api/portal/` — Portal API routes
                                                                      - - `webapp/app/api/subscriptions/`, `/plans/`, `/roles/`, `/features/`, `/billing/`, `/team/`
                                                                        - - `webapp/lib/services/feature-resolution.ts`
                                                                          - - `webapp/lib/auth/middleware.ts`
                                                                            - - `webapp/lib/types/subscription.ts`
                                                                              - - `webapp/database/migrations/028_*.sql` through `031_*.sql`
                                                                               
                                                                                - ---

                                                                                ## ✅ FEATURE LIST STATUS UPDATES (Post Sprint 1 Merge)

                                                                                The following items in `webapp/FEATURE_LIST_FOR_PM.md` are now complete:

                                                                                | Feature | Was | Now |
                                                                                |---|---|---|
                                                                                | Stripe — Subscription checkout | ✅ Active (partial) | ✅ Full hub-and-spoke billing |
                                                                                | Subscription tier enforcement | 🔄 Planned | ✅ Built (feature flags + middleware) |
                                                                                | Role-based access control | 🔄 Planned | ✅ Built (owner/manager/staff/viewer) |
                                                                                | Owner Listing Portal | 🔄 Planned | ✅ Built (/portal/) |
                                                                                | Team management | 🔄 Planned | ✅ Built (invite/role/revoke) |
                                                                                | Feature flag system | 🔄 Planned | ✅ Built (15 flags, plan overrides) |
                                                                                | Stripe Customer Portal | 🔄 Planned | ✅ Built (billing/portal API) |
                                                                                | Payment event audit trail | 🔄 Planned | ✅ Built (payment_events table) |

                                                                                ---

                                                                                ## 🔜 NEXT STEPS — Pick Up From Here

                                                                                ### P0 — Wire Stripe to Vercel (Immediate)
                                                                                - [ ] Fix Vercel deployment — `NEXT_PUBLIC_ENVIRONMENT` secret is missing (deployment fails with "references Secret 'environment-name', which does not exist")
                                                                                - [ ] - [ ] Confirm all Stripe env vars are set in Vercel: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRO_PRICE_ID`, `STRIPE_PREMIUM_PRICE_ID`
                                                                                - [ ] - [ ] Test end-to-end Stripe checkout → webhook → subscription active flow in staging
                                                                               
                                                                                - [ ] ### P1 — Connect Portal to Live Data
                                                                                - [ ] - [ ] Wire `/portal/` dashboard to real Supabase data (currently may use mock/placeholder data)
                                                                                - [ ] - [ ] Test `usePortalContext` hook with real user sessions
                                                                                - [ ] - [ ] Validate tier-gated feature enforcement (e.g., description length limits, photo upload caps)
                                                                                - [ ] - [ ] Test team invitation flow (invite → accept → role assignment)
                                                                               
                                                                                - [ ] ### P2 — Campaign Manager Email Sending (from previous backlog)
                                                                                - [ ] - [ ] Wire email sending to Campaign Manager (Gmail SMTP / multi-sender rotation)
                                                                                - [ ] - [ ] Calendar integration for campaign scheduled sends (auto-appear on calendar)
                                                                                - [ ] - [ ] Content Forge accessible from calendar day click
                                                                                - [ ] - [ ] Webhook triggers for self-signups and paid upgrades
                                                                               
                                                                                - [ ] ### P3 — Coupon & Poll Frontend UI
                                                                                - [ ] - [ ] Display coupons on listing pages with redemption flow
                                                                                - [ ] - [ ] Display poll widgets on listings with results shown in dashboard
                                                                               
                                                                                - [ ] ### P4 — Subscription UI in Command Center
                                                                                - [ ] - [ ] Build plan upgrade/downgrade UI inside the main command center (/admin-v2/)
                                                                                - [ ] - [ ] Show locked/unlocked features based on active subscription tier
                                                                                - [ ] - [ ] Integrate `FeatureGate` component pattern into existing command center pages
                                                                               
                                                                                - [ ] ### P5 — Custom Domains Backend
                                                                                - [ ] - [ ] CNAME setup API (point custom domain → platform)
                                                                                - [ ] - [ ] Automatic SSL certificate provisioning
                                                                               
                                                                                - [ ] ### Known Issues / Tech Debt
                                                                                - [ ] - Vercel deployment: `NEXT_PUBLIC_ENVIRONMENT` secret missing — causes deploy failure (non-blocking for dev, must fix before production)
                                                                                - [ ] - CodeQL warning: `webapp/app/api/directory/addons/route.ts` prototype-pollution risk was addressed in Sprint 1 (allowlist added), but should be re-verified in next security scan
                                                                                - [ ] - All 6 Vercel checks passed on final commit (2d20691) before merge conflict resolution — re-verify checks post-merge
                                                                               
                                                                                - [ ] ---
                                                                                - [ ] *Last updated: February 20, 2026 — Post PR #10 merge*
