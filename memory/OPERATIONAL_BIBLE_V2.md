# Greenline365 Operational Bible — Volume 2
## Advanced Reputation Architecture, Sales Workflows & Financial Infrastructure

This volume details the high-level marketing, reputation, and financial systems that power the Greenline365 ecosystem. Structured for the development team with exact logic for building a self-sustaining, multi-tenant B2B platform.

---

## I. THE AI INFRASTRUCTURE AUDIT (THE "TRIPWIRE")

$400 one-time audit — primary entry point converting cold prospects to high-ticket monthly subscribers.

### Dual-Search Verification Engine
- **Primary Search (Google Places API):** Pulls "Public Perception" — real-time reviews, hours, Maps reputation
- **Default Search (Greenline365 Index):** Searches internal database for homes in business's service area with active Property Passports

### The "Revenue Leak" Logic
- AI calculates missed revenue by comparing Google's "Closed" status against area's incident frequency
- Formula: `Missed Revenue = (Avg Service Calls/Month × Avg Ticket) × 12 - Current Revenue`

### Automated PDF Deliverable
- Supabase Edge Function generates HD report showing:
  - **Reputation Void** (locked badges)
  - **Intelligence Gap** (lack of connection to local properties)

---

## II. THE GAMIFIED REPUTATION & BADGE SYSTEM

Uses psychological pressure ("Negative Light") and time-weighted decay to ensure only elite businesses maintain status.

### 1. The "Negative Light" Strategy (Free Tier)
- **Locked State:** Full set of 7 badges displayed in Grayscale with padlock icon
- **Paywall Trigger:** Click → "This business is not yet Intelligence Verified" → upgrade prompt

### 2. Earned Badge Mechanics
- **Poll Template Engine (Tier 2/3):** Specialized QR-code templates
  - "Mirror" QR → Cleanliness
  - "Front Door" QR → Vibe
  - "Invoice" QR → Expertise
- **Resolution Loop:** Reviews below 3-star → auto Reputation Incident
  - Manager must respond via AI Review Responder + mark "Resolved" to prevent badge penalty
- **Badge Decay (90-day rolling window):**
  - Recent reviews weighted more heavily
  - No fresh positive feedback → badge fades to grayscale
  - 30-day warning SMS before badge expires

---

## III. THE GREENLINE 365 SEAL OF APPROVAL

Ultimate authority marker — pinned Super Featured List placement.

- **Industry Completion Matrix:** Dynamic per industry
  - HVAC: Master Tech + Safety (no Cleanliness)
  - Nightclubs: Vibe + Cleanliness (no Master Tech)
- **Elite Carousel:** Seal-holders bypass standard search, pinned at absolute top
- **Zero-Tolerance:** One decayed badge or uncleared incident → instant Seal revocation

---

## IV. MONTHLY BUNDLE & PRICING STRUCTURE

| Tier | Monthly Price | Savings | Key Features |
|---|---|---|---|
| Tier 0: Reputation Hook | FREE | — | Grayed-out badges, Basic directory listing |
| Tier 1: Booking Foundation | $1,500/mo | $150 (9%) | AI Booking Agent, Phone Line, Knowledge Base |
| Tier 2: Marketing Engine | $2,000/mo | $725 (27%) | Poll Templates, Email/SMS Campaigns, AI Review Responder |
| Tier 3: Intelligence Command | $2,500/mo | $1,375 (35%) | Property Passport, Incident Resolution, Seal Eligibility, White-Label |

---

## V. ADD-ON MARKETPLACE (SCALING)

### Managed AI Agents (48-hr Programming + 1-week A2P)
- AI Agent (Receptionist/Sales/Support): $350/mo each
- A2P 10DLC Registration: $150 setup per line

### Operational & Data Add-Ons
- Extra Phone Number: $20/mo
- ServiceTitan/Jobber Integration: $150/mo
- Property "Deep-Seed" Data Entry: $250/property
- Physical QR Asset Pack: $199 one-time

---

## VI. MILESTONE SETUP FEE SYSTEM

### 50/50 Payment Structure

| Tier | Total Setup | Day 1 (50%) | Technical Completion (50%) |
|---|---|---|---|
| Tier 1 | $2,500 | $1,250 | $1,250 |
| Tier 2 | $3,500 | $1,750 | $1,750 |
| Tier 3 | $5,500 | $2,750 | $2,750 |

### Key Protections
- Final payment tied to **Technical Completion** (system live, AI programmed, dashboard handed over)
- **NOT tied to A2P carrier approval** — carrier delays don't pause payment
- **50% discount** on add-on setup fees if purchased during initial onboarding
- Post-launch add-ons billed at full a-la-carte setup rate

### HITL Pricing Logic
- **$0 setup (instant toggle):** Team Seats, Media Storage, White-Label
- **Fee required (human labor):** AI Persona Training, API Mapping, Federal Compliance

---

## VII. THE SALES LOOP (COMPLETE)

```
FREE listing (Ghost Badges) 
  → $400 Audit (shows Revenue Leak)
    → Tier 1 ($1,500/mo — AI Booking)
      → Tier 2 ($2,000/mo — Badge Hunting + Marketing)
        → Tier 3 ($2,500/mo — Full Intelligence + Seal Eligibility)
          → Elite 365 Seal (Super Featured — must maintain to keep)
```

| Stage | What They See | What They Feel | What They Do |
|---|---|---|---|
| Free | 7 grayed-out badges | "I look incomplete" | Get the $400 Audit |
| Audit | Revenue leak + Reputation Void | "I'm losing money" | Sign Tier 1 |
| Tier 1 | Booking works, badges still gray | "I need more" | Upgrade to Tier 2 |
| Tier 2 | Badges lighting up, content flowing | "I'm building authority" | Upgrade to Tier 3 |
| Tier 3 | Full Intelligence, Seal eligible | "I'm elite" | Maintain subscription |
| Elite 365 | Gold Seal, Super Featured | "I can't lose this" | Never churn |
