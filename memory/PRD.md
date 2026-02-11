# GreenLine365 - Product Requirements Document

## Original Problem Statement
GreenLine365 is a directory-first lead generation platform. The initial goal was to fix a failing Vercel deployment, then pivot the homepage from a SaaS landing page to a business directory as the main landing page.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS, Framer Motion
- **PWA:** Service Workers (currently disabled)

## Core Architecture
```
/app/webapp/
├── app/
│   ├── page.tsx              # Homepage → renders DirectoryClient
│   ├── directory/
│   │   └── DirectoryClient.tsx  # Main directory component
│   ├── services/page.tsx     # Old homepage content
│   ├── components/
│   │   ├── Navbar.tsx        # Global nav (Directory, Services, Industries, Pricing)
│   │   └── Footer.tsx        # Global footer
│   ├── api/
│   │   ├── directory/route.ts # Directory CRUD API
│   │   └── crm/leads/route.ts # CRM leads (has security issue)
│   └── layout.tsx            # Root layout with Navbar + Footer
├── lib/supabase/             # Supabase client
└── public/images/            # Local image assets
```

## What's Been Implemented

### Phase 1: Homepage Pivot to Directory (COMPLETED - Feb 2026)
- Homepage (`/`) now renders the business directory
- Previous homepage moved to `/services`
- Global Navbar updated: Directory, Our Services, Industries, Pricing, **"Add Your Business"** CTA
- Hero section: Nano Banana AI cityscape backdrop (85vh immersive), glass-morphism search, category chips, "LIVE DIRECTORY" trust badge
- **7-Category Mosaic** with Nano Banana AI-generated images (photorealistic, vibrant):
  1. Family Entertainment (Kayak rentals, zoos, mini-golf)
  2. Destinations (Hotels, resorts, vacation rentals)
  3. Services (HVAC, Plumbing, Electrical, Roofing) - **Core Moat**
  4. Dining (Cafes, casual & fine dining)
  5. Nightlife (Bars, pubs, clubs, lounges)
  6. Style & Shopping (Boutiques, salons, specialty retail)
  7. Health & Wellness (Gyms, spas, clinics, wellness centers)
- **Featured Listings section** (Showcase) - pulls top businesses from Supabase
- Value Proposition section
- Testimonials with auto-rotation
- Removed duplicate inline nav/footer (uses global components)
- Fixed navbar spacing with dark hero background

### Color Scheme Update (Feb 2026)
- Replaced neon green (#00FF00) with **emerald (#10B981)** across entire app
- Orange (#FF8C00) remains as CTA/accent color — no more green/orange clash
- "Add Your Business" CTA uses orange gradient (consistent with directory theme)
- Badge glow, gradients, and CSS variables all updated

## Known Issues (Prioritized)

### P0 - SECURITY: Multi-Tenancy Data Leak
- `crm_leads` table missing `business_id` column
- API at `/api/crm/leads` fetches ALL leads without tenant filtering
- **Fix:** Add `business_id` column, update API to filter by tenant, audit RLS

### P1: Knowledge Base Not Saving
- Users cannot save/edit Knowledge Base entries
- Needs investigation of API endpoint and frontend state

### P2: Service Worker Disabled
- Disabled in `/lib/use-service-worker.ts` due to redirect loop bug
- Root cause: faulty fetch handler in `/public/sw.js`
- No PWA features (offline caching) currently

## Prioritized Backlog

### P0 - Security
- [x] Fix multi-tenancy data leak in CRM (FIXED Feb 2026 — added auth + user_id filtering to GET/POST/PUT on /api/crm/leads)

### P1 - Core Features
- [ ] Fix Knowledge Base saving
- [ ] Build PUBLIC Pricing Page — Directory tiers ONLY:
  - [x] Free Tier (Ghost badges, basic listing) — BUILT
  - [x] Pro Tier ($39/mo — 2 images, Verified badge, CTA buttons) — BUILT
  - [x] Premium Tier ($59/mo — all Google photos, Featured placement, analytics) — BUILT
  - [x] Badge visual ("Earned, Never Bought" with ghost/active demo) — BUILT
  - [x] Directory Marketplace add-ons section (QR Kit $199, Poll Templates, Featured Boost, etc.) — BUILT
  - NOTE: Backend service pricing ($1,500-$2,500/mo bundles, $400 audits, setup fees) is INTERNAL ONLY — stored in docs for AI chat widget / sales team reference. NOT displayed on website.
- [ ] Admin Dashboard (GHL Clone) - listing management, CSV imports, lead tagging

### P1 - Revenue Features (INTERNAL DOCS — Not displayed on website)
These docs power the AI chat widget and sales team. They are reference material, NOT public pages:
- [x] $400 Digital Infrastructure Audit System (see AUDIT_SYSTEM_SPEC.md)
- [x] Marketing & Reputation Dashboard (see MARKETING_DASHBOARD_SPEC.md)
- [x] Backend service bundles $1,500-$2,500/mo (see PRICING_STACK.md)
- [x] Setup milestone fees & agreement (see SETUP_MILESTONE_AGREEMENT.md)
- [x] Operational Bibles V1 & V2 (see OPERATIONAL_BIBLE.md, OPERATIONAL_BIBLE_V2.md)

### P2 - Enhancements
- [ ] Service Worker permanent fix
- [ ] Outreach & Workflows - email templates, team inbox
- [ ] AI Helpers - URL scraping, blog generation
- [ ] Map Integration - tiered pin visuals
- [ ] Coupon & Deal Engine with QR redemption
- [ ] AI Review Responder (Brand Voice)
- [ ] Google Business Profile API integration

### P3 - Future
- [ ] Headless WordPress CMS integration

## Documentation Index
- `/app/memory/PRD.md` — This file (core product requirements)
- `/app/memory/OPERATIONAL_BIBLE.md` — Vol 1: Property Intelligence, Badge System, Seal of Approval, Sales Loop
- `/app/memory/OPERATIONAL_BIBLE_V2.md` — Vol 2: Advanced reputation architecture, sales workflows, financial infrastructure
- `/app/memory/PRICING_STACK.md` — Full tiered pricing, bundles, milestone setup fees, add-on marketplace
- `/app/memory/SETUP_MILESTONE_AGREEMENT.md` — Legal template: 50/50 payment milestone agreement with A2P safeguard
- `/app/memory/MARKETING_DASHBOARD_SPEC.md` — Marketing Command Center spec
- `/app/memory/AUDIT_SYSTEM_SPEC.md` — $400 Audit System + CRM Enrichment spec
