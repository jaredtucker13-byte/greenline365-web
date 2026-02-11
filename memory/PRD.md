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
- Global Navbar updated: Directory, Our Services, Industries, Pricing
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

### Testing Status
- All 14 frontend tests passed (iteration_7)
- Search, category filtering, featured listings, back navigation all verified

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
- [ ] Fix multi-tenancy data leak in CRM

### P1 - Core Features
- [ ] Fix Knowledge Base saving
- [ ] Pricing Tiers & Stripe Integration ($0/$30/$50)
- [ ] Admin Dashboard (GHL Clone) - listing management, CSV imports, lead tagging

### P2 - Enhancements
- [ ] Service Worker permanent fix
- [ ] Outreach & Workflows - email templates, team inbox
- [ ] AI Helpers - URL scraping, blog generation
- [ ] Map Integration - tiered pin visuals

### P3 - Future
- [ ] Headless WordPress CMS integration
