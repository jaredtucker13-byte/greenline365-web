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
- **Framework:** Next.js 14 (App Router) on port 3000
- **Backend Proxy:** FastAPI on port 8001 → forwards /api/* to Next.js
- **Database:** PostgreSQL via Supabase
- **Payments:** Stripe (live keys)
- **AI Discovery:** OpenRouter (Perplexity sonar-pro) + Google Places API
- **Styling:** Tailwind CSS with Bentley Standard theme
- **Image Generation:** Gemini (Nano Banana) for destination photos

## Completed Features

### Phase 1 — Directory & UI Overhaul (Complete)
- "Bentley Standard" dark theme with gold accents
- Simplified Navbar (Directory | Our Services | Add Your Business)
- 9-category homepage grid with sub-category pill tabs
- Weighted ranking for paid tier businesses
- Stripe live integration with webhook verification

### Phase 2A — Discovery Pipeline (Complete — Feb 12, 2026)
- 3-stage pipeline: Perplexity discovery → Google Places enrichment → Directory + CRM population
- "Closed After Hours" CRM tagging for AI agent upsell targeting
- 8 destinations populated: ~203 total listings, ~195 CRM leads, ~99 after-hours targets

### Phase 2B — Destination Guide UI (Complete — Feb 12, 2026)
- Dedicated guide pages at `/destination/[slug]` for all 8 destinations
- 10 tourism section tabs per destination
- Cross-destination navigation

### Phase 2C — Bentley Standard Visual Overhaul (Complete — Feb 12, 2026)
**Global Background System:**
- Deep midnight blue gradient base (#050B18 → #0B132B) with gold accent radials
- Micro film grain texture overlay (CSS SVG noise)
- Abstract compass rose watermark (fixed, 1.8% opacity)
- Gold filigree corner accents framing content sections
- Gold section divider lines with diamond accent

**8-Card Destination Grid:**
- 4x2 balanced grid layout (Row 1: St. Pete Beach, Key West, Sarasota, Daytona / Row 2: Ybor City, Orlando, Miami, Jacksonville)
- Metallic gold 3px border frames with gradient shimmer effect
- AI-generated hyper-realistic golden hour photography for all 8 destinations
- Glassmorphism text labels with destination name + tagline
- Hover: scale(1.02) + gold border glow intensification

**8 Destinations:**
| Destination | Tagline | Listings |
|---|---|---|
| St. Pete Beach | Florida's Sunshine City | 32 |
| Key West | Close to Perfect, Far from Normal | 26 |
| Sarasota | Where Arts Meet the Gulf | 26 |
| Daytona Beach | World's Most Famous Beach | 25 |
| Ybor City | Tampa's Historic Latin Quarter | 19 |
| Orlando | The City Beautiful | 24 |
| Miami | Neon Nights & Coastal Luxury | 24 |
| Jacksonville | Gridiron Grit & Riverfront Views | 27 |

### Build Fix (Feb 12, 2026)
- Fixed TypeScript error in `Navbar.tsx` — added proper type annotation for `navLinks` array to include optional `dropdown` property
- Build was failing on Vercel with: `Property 'dropdown' does not exist on type '{ href: string; label: string; }'`
- `tsc --noEmit` now passes cleanly

### Website Audit Implementation (Feb 12, 2026)
Ran GreenLine365's own `/api/crawl-website` and `/api/analyze-website` tools against greenline365.com. Implemented all audit findings:

**Hero Section Overhaul:**
- New headline: "The Gold Standard for Local Discovery" (replacing generic "Your City's Best, Verified")
- New subheadline: "Verified businesses across dining, services, nightlife & more — every listing earned its place."
- High-contrast "Search Directory" CTA button with bold gold gradient and box shadow (was nearly invisible before)

**Live Trust Counter Bar:**
- New `/api/directory/stats` endpoint queries Supabase for real-time counts
- Displays: 450+ Verified Businesses | 8+ Destinations | 13+ Categories
- Numbers grow automatically as data is added — no manual updates needed

**SEO & Accessibility Fixes:**
- Fixed all 19 images with descriptive alt text (was: empty alt="" on every image)
- Hero, category, destination, and value prop images all have keyword-rich alt tags

**Contrast & Readability Improvements:**
- Hero background overlay increased from 80%/50% to 90%/70% for better text legibility
- Subheadline text bumped from white/60 to white/70
- Category description text bumped from text-silver to text-white/50
- Category chips borders increased from white/10 to white/15 with gold hover state

**Dark Theme Depth:**
- Charcoal sections now have subtle gold border inset shadows for visual separation
- Search bar background opacity increased from 0.05 to 0.07

### Business Owner Dashboard — Phase 1 (Feb 12, 2026)
Built the core directory listing management experience for business owners:

**New APIs:**
- `GET /api/directory/my-listing` — returns authenticated user's claimed listing(s)
- `PATCH /api/directory/my-listing` — update listing details (name, description, phone, website, email, location) with field whitelisting
- `POST /api/directory/claim` — claim an auto-discovered listing (sets is_claimed=true, claimed_by=user.id)

**Business Dashboard Page (`/business-dashboard`):**
- Auth-gated: redirects to `/login?redirect=/business-dashboard` when unauthenticated
- Shows listing preview with cover image, business details, rating, Google reviews
- Inline edit form for all basic fields
- Photo gallery with tier-based gating (Free: 1 visible, Pro: 2, Premium: unlimited) with lock overlays
- Tier status panel showing current features (green checks) and locked features (lock icons)
- Upgrade buttons wired to existing Stripe checkout (Pro $39/mo, Premium $59/mo)
- Quick stats panel (Google reviews, rating, photos, trust score)
- Property Intelligence CTA linking to /services for backend CRM upsell
- "No listing found" state with links to directory search and registration

### Individual Listing Detail Pages (Feb 12, 2026)
Built `/listing/[slug]` pages for all 450+ businesses — each is now SEO-indexable:

**New API:** `GET /api/directory/[slug]` — returns full listing with photo gating + 4 related businesses (same city & industry)

**Detail Page Features:**
- Hero cover image with back-to-directory navigation
- Business header: name, category badge, location, subcategory tags
- Google rating + review count from Places data
- Photo gallery with tier-based gating
- Contact sidebar: Phone (clickable tel:), Website (external link), Google Maps directions
- "Is this your business?" claim section → reveals greenline365help@gmail.com mailto with pre-filled subject
- "More [category] in [city]" related businesses grid with clickable cards
- Claimed/Unclaimed status indicator

**Also updated:**
- Listing cards in directory now wrapped in `<Link>` to `/listing/[slug]`
- Updated all @greenline365.com email references to greenline365help@gmail.com (privacy, trust, terms, footer, email sender, admin lists, incident reports)

## Backlog

### P0 — Immediate
- Expand discovery limits (currently 3/category → target 25/category per destination)
- Add more Florida destinations (Tampa, Naples, Clearwater, Fort Lauderdale)

### P1 — Data & Content
- Classify pre-discovery listings with destination_zone tags
- Run Supabase SQL migration for dedicated `destination_zone` column

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
- `GET /api/directory/discover` — List 8 destinations & 10 categories
- `POST /api/directory/discover` — Run discovery pipeline
- `GET /api/directory/guide?destination={slug}` — All guide data for a destination

## Key Files
- `/app/webapp/app/globals.css` — Global background system, metallic frames, glassmorphism
- `/app/webapp/app/directory/DirectoryClient.tsx` — Homepage with 8-card destination grid
- `/app/webapp/app/destination/[slug]/DestinationGuideClient.tsx` — Guide page UI
- `/app/webapp/app/api/directory/discover/route.ts` — Discovery pipeline
- `/app/webapp/app/api/directory/guide/route.ts` — Guide data endpoint
- `/app/backend/server.py` — FastAPI proxy (8001 → 3000)

## Test Reports
- `/app/test_reports/iteration_12.json` — Phase 2A/B: 100% pass
- `/app/test_reports/iteration_13.json` — Phase 2C: 100% pass (21/21 backend, 100% frontend)
