# GreenLine365 - Product Requirements Document

## Original Problem Statement
GreenLine365 is a directory-first lead generation platform. The initial goal was to fix a failing Vercel deployment, then pivot the homepage from a SaaS landing page to a business directory as the main landing page.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Styling:** Tailwind CSS, Framer Motion
- **Payments:** Stripe (test mode)
- **PWA:** Service Workers (currently disabled)

## Core Architecture
```
/app/webapp/
├── app/
│   ├── page.tsx              # Homepage → renders DirectoryClient
│   ├── directory/
│   │   └── DirectoryClient.tsx  # Main directory component
│   ├── register-business/
│   │   ├── page.tsx           # 2-step business registration (auth + listing)
│   │   └── success/page.tsx   # Post-registration success page
│   ├── pricing/page.tsx       # Public pricing (Free/$39/$59)
│   ├── login/page.tsx         # Email/password + Google OAuth login
│   ├── signup/page.tsx        # Magic Link + Password signup
│   ├── services/page.tsx      # Old homepage content
│   ├── components/
│   │   ├── Navbar.tsx         # Global nav (Directory, Services, Industries, Pricing, Add Your Business)
│   │   └── Footer.tsx         # Global footer
│   ├── api/
│   │   ├── directory/
│   │   │   ├── route.ts       # Directory CRUD API
│   │   │   ├── entitlements/route.ts  # Feature gating per listing
│   │   │   └── feedback/route.ts
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts  # Stripe checkout (Pro $39/Premium $59)
│   │   │   ├── webhook/route.ts   # Stripe webhook handler
│   │   │   └── status/route.ts    # Payment status check
│   │   ├── crm/leads/route.ts     # CRM leads (secured, multi-tenant)
│   │   ├── businesses/route.ts    # User businesses CRUD
│   │   └── pricing-tiers/route.ts # Pricing tiers from DB
│   ├── auth/callback/route.ts     # OAuth callback
│   └── layout.tsx            # Root layout with Navbar + Footer
├── lib/
│   ├── supabase/             # Supabase client (browser + server + middleware)
│   └── feature-gates.ts      # Tier-based feature gating utility
└── public/images/            # Local image assets
```

## What's Been Implemented

### Phase 1: Homepage Pivot to Directory (COMPLETED - Feb 2026)
- Homepage (/) now renders the business directory
- Previous homepage moved to /services
- Global Navbar: Directory, Our Services, Industries, Pricing, "Add Your Business" CTA
- Hero section: Nano Banana AI cityscape backdrop, glass-morphism search, category chips
- 7-Category Mosaic with AI-generated images
- Featured Listings section, Value Proposition, Testimonials

### Phase 2: Branding Refresh (COMPLETED - Feb 2026)
- Replaced neon green with emerald (#10B981)
- Orange (#FF8C00) as CTA/accent color

### Phase 3: P0 Backend Functions (COMPLETED - Feb 2026)
- **User Authentication:** Login (/login), Signup (/signup), Google OAuth, Magic Link, middleware session management
- **Business Registration:** New /register-business page with 2-step flow (account → business info), tier selection via URL params
- **Directory Subscriptions:** Stripe checkout updated to public pricing (Pro $39/mo, Premium $59/mo), webhook handler, payment status check
- **Feature Gating:** Created /lib/feature-gates.ts with tier-based permissions (photos, badges, CTA buttons, analytics, etc.), API endpoint at /api/directory/entitlements
- **Success Flow:** /register-business/success page after listing creation
- **Security:** Multi-tenancy data leak in CRM leads fixed (auth + user_id filtering)

### Phase 4: Documentation & IP (COMPLETED - Feb 2026)
- Extensive strategic docs in /docs/ and /memory/
- Operational Bibles V1 & V2, Pricing Stack, Audit System Spec, Marketing Dashboard Spec

### Phase 6: Directory Restructure — 9 Categories + Subcategories (COMPLETED - Feb 2026)
- **Navbar Simplified**: Directory | Our Services | Person Icon (sign-in) | Add Your Business
- **9 Top-level Categories**: Services, Dining, Health & Wellness, Style & Shopping, Nightlife, Family Entertainment, Destinations, Hotels & Lodging, Professional Services
- **Subcategory Pill Tabs**: Each category has 6-9 subcategory filters (e.g., Services → HVAC, Plumbing, Electrical, Roofing...)
- **Removed**: Industries dropdown, Pricing link, Sign In text, Price filter, Specialty dropdown
- **Database prep**: destination_zone and subcategory fields ready for Phase 2

## Upcoming Phases
### Phase 2: Destination Guides (PLANNED)
- Mini-directories per destination (St. Pete Beach, Sarasota, Ybor City, Clearwater, Key West)
- Sections: Stay, Eat & Drink, Things To Do, Beaches & Nature, Family Fun, Shopping, Nightlife, Getting Around, Events & Festivals, Local Essentials, Insider Tips
- Businesses can appear in both main directory AND destination guides
- **Color Palette**: Midnight blue (#0D1B2A) + champagne gold (#C9A96E) + brushed silver
- **Typography**: Montserrat (headings) + Inter (body)
- **Glassmorphism**: backdrop-blur mega-menu dropdowns with animated open/close
- **Featured Listings Sections**: Premier Partners, Property Intelligence Verified, Recently Added
- **Property Intelligence Badge**: Metallic shield badge for CRM + Mid-Tier+ subscribers
- **Weighted Search Ranking**: Property Intel > Paid Tiers > Free listings
- **Navbar**: Gold accents, "LIVE" indicator, gold CTA buttons
- **Price Filter**: Toggle button group, Ghost buttons for actions

## Pricing Structure
### Public Directory Tiers (displayed on /pricing)
- **Free:** $0 — basic listing, grayed badges
- **Pro:** $39/mo — 2 photos, Verified badge, CTA buttons, priority search
- **Premium:** $59/mo — all Google photos, featured placement, badge earning, analytics

### Internal Backend Services (NOT public — see /docs/PRICING_STACK.md)
- Backend service bundles: $1,500-$2,500/mo
- $400 Digital Infrastructure Audit
- Transaction fees: $0.60/interaction (waived for backend subscribers)

## Known Issues (Prioritized)

### P1: Knowledge Base Not Saving
- Users cannot save/edit Knowledge Base entries

### P2: Service Worker Disabled
- Disabled due to redirect loop bug

## Prioritized Backlog

### P0 - DONE
- [x] User Authentication (login, signup, Google OAuth, magic link)
- [x] Business Registration flow (/register-business)
- [x] Directory Subscriptions (Stripe Pro $39/Premium $59)
- [x] Feature Gating (tier-based permissions)
- [x] Multi-tenancy security fix in CRM
- [x] Photo Gating by Tier (Free=1 photo, Pro=2, Premium=all) — Feb 2026
- [x] Stripe Live Mode (sk_live_, webhook signature verification) — Feb 2026
- [x] CRM Enrichment Pipeline (Google Places, website audit, email scraper) — 234/234 leads COMPLETE

### P1 - Next Up
- [ ] Transaction Fee Logic ($0.60/interaction for non-backend subscribers)
- [ ] Marketplace Backend (purchase/activate add-ons)
- [ ] Coupon Engine (QR codes, redemption tracking)
- [ ] Fix Knowledge Base saving

### P2 - Future
- [ ] Digital Infrastructure Audit (Google Places API, AI analysis, PDF generation)
- [ ] Gamified Badge System (polls, sentiment scoring, decay logic)
- [ ] Business Owner Dashboard ("Marketing Command Center" + "Reputation Hub")
- [ ] Service Worker fix
- [ ] Map Integration with tiered pins
- [ ] AI Review Responder

### P3 - Backlog
- [ ] Headless WordPress CMS integration
- [ ] 3rd Party Integrations (Google API, Twilio, SendGrid, Cal.com)

## Documentation Index
- `/app/memory/PRD.md` — This file
- `/app/memory/OPERATIONAL_BIBLE.md` — Vol 1
- `/app/memory/OPERATIONAL_BIBLE_V2.md` — Vol 2
- `/app/memory/PRICING_STACK.md` — Full tiered pricing
- `/app/memory/SETUP_MILESTONE_AGREEMENT.md` — Legal template
- `/app/memory/MARKETING_DASHBOARD_SPEC.md` — Marketing spec
- `/app/memory/AUDIT_SYSTEM_SPEC.md` — Audit system spec

## Testing
- Test report: /app/test_reports/iteration_9.json
- Backend: 12/12 photo gating + Stripe live tests passed (100%)
- Previous: /app/test_reports/iteration_8.json — 21/21 backend, 45/45 frontend
- Code audit: Feb 2026 — 0 TypeScript errors, removed 3 dead API routes, 2 unused deps, 3 orphan files
- Bentley UI: /app/test_reports/iteration_10.json — 12/12 backend, 95% frontend (proxy issue)
