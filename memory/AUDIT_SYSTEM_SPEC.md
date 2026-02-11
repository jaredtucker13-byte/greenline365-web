# Digital Infrastructure Audit - Complete Feature Specification
## The $400 Automated Audit System

### Overview
A fully automated Digital Infrastructure Audit that goes beyond standard SEO/marketing audits by leveraging Greenline365's proprietary Property Intelligence Database. This creates an "unfair advantage" — we're not just auditing their site, we're auditing their entire Operational Infrastructure.

---

## Core Architecture: Dual-Search System

### Primary Search: Google Places API (The Public Face)
The "External Truth" — verifies the business's public reputation.

**Data Points Pulled:**
- Official business hours
- Review count & sentiment
- Service categories
- Google Maps "Open/Closed" status
- Street View & plot data
- Service area coverage

**Audit Purpose:** Identifies "Marketing Gaps"
- Example: Google says "Closed at 6 PM" but website says "24/7 Service" → flagged as **Conversion Failure**

### Default Search: Greenline365 Database (The Property Truth)
The "Internal Intelligence" — cross-references our Address-Centric Index.

**Data Points Pulled:**
- Property Passport history
- Clean Bill of Health status
- Asset Inventory (HVAC units, electrical panels, etc.)
- Incident Reports in area
- Intelligence-Verified businesses in area

**Audit Purpose:** Identifies "Operational Gaps"
- Example: "4,000 residents in your service area with Square D panels, but your website has no automated protocol for these assets"

---

## Three Strategic Reasons to Search Internal DB

### 1. The "Neighbor Effect" (Competitive Data)
Even if the prospect ISN'T in our system, properties in their service area likely ARE.

- **Logic:** Auditing an HVAC company in Tampa → DB shows "450 homes with Property Passports that have 10+ year-old AC units in your zip code"
- **Sales Pitch:** "We found 450 high-probability service targets right in your backyard. Your website can't handshake with these digital passports. Our Intelligence Layer fixes that."

### 2. Database Seeding & Conflict Checks
Safety filter to prevent selling a "New Build" audit to an existing partner.

- **Logic:** If business already in DB → audit shifts from "Sales Pitch" to "Health Check"
- **Strategic Value:** Maintains professional "Command-Level" image

### 3. Proving the "Closed-Loop" Value (Compatibility Score)
AI generates a score based on open incidents in their category + geography.

- **Logic:** Count open Incident Reports in the business's category and geographic area
- **Sales Pitch:** "82 uncleared electrical incidents within 5 miles of your office. You're invisible to these homeowners looking for certified clearance."

**Summary:** Google-only = Marketing Auditor. Google + Property DB = Infrastructure Architect.

---

## Automated Workflow Architecture

### Data Flow (100% Automated via Supabase)

| Step | Component | Action |
|---|---|---|
| 1. Input | Supabase Table | New URL inserted into `audit_requests` table |
| 2. Research | Edge Function | Triggers dual-search (Google Places API + Greenline DB) |
| 3. Storage | Postgres | Stores raw AI analysis (JSON) in `audit_results` table |
| 4. Generate | Database Webhook | Detects save, triggers PDF Edge Function |
| 5. Output | Supabase Storage | PDF generated as `[BusinessName]_Audit.pdf` |
| 6. Finish | Edge Function | Sends email with download link, updates CRM status |

### Search Coordinator Edge Function
- **Input:** Business Name / URL / Address
- **Concurrent Fetch:** Pings Google Places API AND Supabase Property Table simultaneously
- **Data Synthesis:** AI merges both datasets into single "Intelligence Profile"
- **Output:** Enriched audit data ready for PDF generation

---

## PDF Generation Strategies

### Strategy 1: "Pure" Edge Function (Low Cost)
- **Tools:** `pdf-lib` or `jspdf` in Supabase Edge Function
- **Best For:** Text-heavy reports with basic branding
- **Workflow:** Pull AI analysis → Draw text/tables/logo → Save to Storage → Send via SendGrid/Twilio

### Strategy 2: "Design-First" HTML-to-PDF (Recommended for $400 report)
- **Tools:** Supabase Edge Functions + Browserless.io or Puppeteer
- **Best For:** Visual "wow factor" reports
- **Workflow:** Create HTML/Tailwind page with AI data → Send to Browserless API → Returns PDF
- **Cost:** ~$0.10 per audit (margins intact)

### Key PDF Section: "Gap Analysis" Chart
Calculate **Missed Revenue Potential:**
```
Missed Revenue = (Avg Service Calls/Month × Avg Ticket) × 12 - Current Revenue
```
When a business owner sees "$115,200/year lost because their website is closed" → the $400 audit pays for itself → $1,500/mo Command Tier becomes easy sell.

---

## Audit Report Template Structure

### Recommended Sections:
1. **Executive Summary** — Overall Intelligence Score
2. **Public Reputation Analysis** (Google Data)
   - Hours accuracy, review sentiment, category optimization
3. **Website Conversion Audit**
   - Mobile responsiveness, load time, CTA analysis
4. **Intelligence Gap Analysis** (The Differentiator)
   - What they're missing by not being on the Intelligence Layer
5. **Market Opportunity** (Internal DB Data)
   - Property Passports in area, open incidents, competitor activity
6. **Missed Revenue Calculator**
   - Dollar amount visualization
7. **Compatibility Score**
   - How ready their business is for the Intelligence Layer
8. **Recommended Tier & Next Steps**
   - Which GL365 tier solves their specific gaps

---

## CRM Lead Enrichment Integration

### Flow: Scraping → Audit → CRM + Directory
When scraping a business for lead generation:
1. **Scrape website** — Extract business info, services, contact details
2. **Google Places lookup** — Pull public reputation data
3. **Greenline DB cross-reference** — Check for existing presence + area intelligence
4. **Generate Intelligence Profile** — Scored summary of gaps/opportunities
5. **Store enrichment data** — Attached to CRM lead record AND directory listing
6. **Auto-tag lead** — Based on audit findings (e.g., "no-after-hours", "low-google-reviews", "high-market-opportunity")

### CRM Tags Generated from Audit:
- `no-after-hours-support` — Website shows limited hours
- `low-google-reviews` — Below area average
- `high-market-opportunity` — Many Intelligence-Ready properties in area
- `conversion-failure` — Hours mismatch or broken CTAs
- `existing-partner` — Already in Greenline ecosystem
- `intelligence-gap` — No property passport integration

---

## Implementation Dependencies
- Google Places API (Google Cloud project required)
- Supabase Edge Functions
- Supabase Storage (for PDF files)
- SendGrid (email delivery)
- Twilio (SMS delivery)
- Browserless.io (for HTML-to-PDF, Strategy 2)
- Existing scraping infrastructure (`/api/directory/scrape/`)
- CRM leads table (needs `business_id` fix first)

## Revenue Model
- **$400/audit** one-time fee
- **99% profit margin** with serverless architecture
- **Upsell path:** Audit → $1,500/mo Command Tier subscription
