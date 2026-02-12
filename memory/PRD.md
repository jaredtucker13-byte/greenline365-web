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
