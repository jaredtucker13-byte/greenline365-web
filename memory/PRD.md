# GreenLine365 - Product Requirements Document

## Original Problem Statement
Build a premium business directory platform ("Bentley Standard") for Florida with:
- Directory restructure into 9 categories with sub-category filtering
- Premium dark-themed UI with gold accents (charcoal, midnight blue, champagne gold)
- Destination Guides (mini-directories) for tourist spots
- AI-powered business discovery pipeline
- CRM integration with "closed after hours" lead qualification
- Stripe payments, tier-based features, weighted ranking

## Architecture
- **Framework:** Next.js 14 (App Router) on port 3000
- **Backend Proxy:** FastAPI on port 8001 → forwards /api/* to Next.js
- **Database:** PostgreSQL via Supabase
- **Payments:** Stripe (live keys)
- **AI Discovery:** OpenRouter (Perplexity sonar-pro) + Google Places API
- **Styling:** Tailwind CSS with Bentley Standard theme

## Completed Features

### Phase 1 — Directory & UI Overhaul (Complete)
- "Bentley Standard" dark theme with gold accents
- Simplified Navbar (Directory | Our Services | Add Your Business)
- 9-category homepage grid with sub-category pill tabs
- Weighted ranking for paid tier businesses
- Stripe live integration with webhook verification

### Phase 2A — Discovery Pipeline (Complete — Feb 12, 2026)
- **3-stage worker pipeline:**
  1. Perplexity sonar-pro via OpenRouter discovers businesses by destination + category
  2. Google Places API enriches with address, phone, photos, hours, ratings
  3. Auto-populates directory_listings (free tier, unclaimed) + crm_leads
- **"Closed After Hours" CRM tag:** Businesses closing before 6pm or no weekends → flagged for AI agent upsell
- **6 Florida destinations populated:** St. Pete Beach (32), Key West (26), Sarasota (26), Ybor City (19), Daytona (25), Orlando (24) = **152 total listings**
- **CRM leads:** 146 leads with 82 tagged "closed_after_hours"
- **API endpoints:** GET/POST `/api/directory/discover`, GET `/api/directory/guide`

### Phase 2B — Destination Guide UI (Complete — Feb 12, 2026)
- Dedicated guide pages at `/destination/[slug]` for all 6 destinations
- Hero section with unique gradient per destination
- 10 tourism section tabs (Stay, Eat & Drink, Quick Eats, Things To Do, Beaches & Nature, Family Fun, Shopping, Essentials, Nightlife, Getting Around)
- Listing cards with Google Places photos, ratings, call/visit/maps buttons
- "Explore Destinations" grid on homepage linking to all guides
- Cross-destination navigation at bottom of guide pages

## Backlog

### P0 — Immediate
- Expand discovery: run pipeline with higher limits (currently 3/category, target 25/category)

### P1 — Data & Content
- Classify existing pre-discovery listings with subcategory + destination_zone tags
- Add more Florida destinations (Miami, Tampa, Naples, Clearwater, etc.)

### P2 — Events & Festivals
- Schema for event-specific data (dates, tickets, location)
- UI for events within destination guides
- Link businesses to events (Daytona 500, F1, etc.)

### P3 — Monetization
- Destination Sponsorship feature
- "Local's Pick" badge for premium businesses
- Featured placement within destination guides

## Key API Endpoints
- `GET /api/directory` — Main directory with destination/tourism_category filters
- `GET /api/directory/discover` — List available destinations & categories
- `POST /api/directory/discover` — Run discovery pipeline for a destination
- `GET /api/directory/guide?destination={slug}` — All guide data for a destination
- `POST /api/webhooks/stripe` — Stripe webhook
- `POST /api/checkout-sessions` — Stripe checkout

## Key Files
- `/app/webapp/app/api/directory/discover/route.ts` — Discovery pipeline
- `/app/webapp/app/api/directory/guide/route.ts` — Guide data endpoint
- `/app/webapp/app/destination/[slug]/DestinationGuideClient.tsx` — Guide UI
- `/app/webapp/app/directory/DirectoryClient.tsx` — Homepage with destination grid
- `/app/backend/server.py` — FastAPI proxy (port 8001 → 3000)

## Test Reports
- `/app/test_reports/iteration_12.json` — 100% backend, 100% frontend
