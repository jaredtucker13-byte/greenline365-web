# GreenLine365 — Master Ecosystem Spec 2026
**File:** `docs/brainstorming/master-spec-2026.md`
**Status:** CONFIRMED — Living Document
**Last Updated:** 2026-02-24
**Author:** Jared Tucker (Creator, GL365)

> This document defines the complete GL365 ecosystem — every product, every system, every flow.
> It is the narrative companion to `docs/specs/pricing.md`.
> Read this to understand WHAT GL365 is. Read pricing.md to understand WHAT IT COSTS.

---

## I. THE PLATFORM IN ONE SENTENCE

GreenLine365 is a national accountability engine for home services — a verified business directory powered by an AI operations platform that gives every contractor, technician, and service business a Tactical Command Center to run their entire operation.

---

## II. THE TWO SYSTEMS

GL365 operates as two distinct but connected systems:

**System A — The Directory (Public)**
The GL365 verified business directory. Businesses get listed, verified, and found. Consumers discover, review, and hire. Pricing: Free / Pro $45 / Premium $89 per month. This is what the public sees at greenline365.com.

**System B — The Command Center (Private)**
The AI operations platform sold via personalized outreach. Three tiers: Operator / Commander / Sovereign. Every feature is modular. Businesses stack only what they need. This is never shown publicly.

---

## III. THE TACTICAL COMMAND CENTER

The hub-and-spoke dashboard that powers everything in System B.

### What It Is
The Command Center is the entry point for every System B customer. On its own, it is a calendar — a hub-and-spoke booking and content calendar with four color-coded event types: Booking (gold), Content (blue), Review (orange), Launch (purple).

Without modules, the Command Center is nearly useless. Its power comes from the spokes — the individual modules that plug into it.

### The Hub-and-Spoke Map

Every item in the left sidebar of the Command Center is a spoke:

**PROPERTY INTEL section:**
- Commander — The intelligence overview dashboard
- Passports — Home Ledger / Property Passport records
- Filing Cabinet — Technician voice note capture and asset extraction
- Referral Network — Lead sharing and partner connections

**TOOLS section:**
- Incidents — Incident reporting flowing to Home Ledger
- Campaigns — Content Creation Forge and launch pipeline
- Settings — Configuration and preferences

**Quick Actions:**
- + New Booking — Opens AI booking flow
- + New Content — Opens content creation flow
- Preview as Customer — View listing as a consumer would see it

**Dashboard Widgets (always visible):**
- Weekly Trend Hunter — AI content ideas, refreshes every Monday
- Live Local Pulse — Real-time local opportunity scanner, refreshes every 3 hours
- Analytics Dashboard — ROI tracker (currently showing +25% example)
- Make Phone Call — Quick dial contacts
- Review Suggested Posts — Content pipeline review queue
- Recent Activity — Latest system events
- Team Performance — Aggregate score and average metrics
- Content Pipeline — Creation / Review Stage / Launch Pipeline tracker
- Booking Trends — This Week vs Last Week comparison

### System Status Bar
Bottom left of every Command Center view:
- SYSTEM ONLINE indicator
- AES-256 ENCRYPTED badge
- COMMAND CENTER V2.0 version label

---

## IV. THE BRAIN (MAIN BRAIN)

The most premium asset in the entire GL365 ecosystem. The Brain IS the identity of System B.

### What It Is
The Main Brain is a Supabase-powered 16-skill agentic AI workforce. It is the intelligence engine that powers the entire Command Center. It is NOT a chatbot. It is an autonomous workforce that manages operations, surfaces intelligence, and takes action on behalf of the business owner.

### Where It Lives
The Brain is a module available to any tier (Operator, Commander, Sovereign). It is priced at $599/mo individually or included in the Sovereign all-in bundle.

### The 16 Skills
The Brain's agentic workforce covers every operational dimension of a service business:
1. Booking Intelligence — schedules, routes, conflict detection
2. Review Response Engine — Brand Voice AI for Google + Directory reviews
3. Reputation Incident Detection — flags negative sentiment automatically
4. Badge Progress Tracker — monitors poll thresholds, fires badge-earn webhooks
5. Property Asset Extractor — parses voice notes for model/serial numbers
6. Home Ledger Stain Writer — writes incidents to property records automatically
7. Lead Capture Qualifier — scores and routes inbound leads
8. Content Idea Generator — Weekly Trend Hunter logic
9. Local Opportunity Scanner — Live Local Pulse logic
10. Campaign Sequencer — email/SMS outreach automation
11. Team Performance Aggregator — Internal Trust Score calculations
12. PTO Conflict Detector — checks master calendar before surfacing requests
13. VIP Customer Recognizer — identifies high-frequency customers via QR scan history
14. FSM Handshake Verifier — validates geotagged photo proof for Stain clearance
15. Giving Back Vault Trigger — writes to giving_back_vault table on every transaction
16. Notification Orchestrator — routes all system events to dashboard + email simultaneously

---

## V. THE SECOND BRAIN (THE CALL BRAIN / SLACK BRAIN)

A standalone add-on. Separate product. Separate monthly cost on top of any tier.

### What It Is
The Second Brain connects the GL365 ecosystem to the business's Slack workspace. It acts as an AI HR manager, operations coordinator, and communication hub — all inside Slack channels the business owner already uses.

### What It Does

**PTO and Scheduling:**
- Technician sends a voice note or text to a designated Slack channel (e.g., #time-off)
- Example: "Need next Friday off for a graduation"
- Second Brain checks the master calendar and the AI Booking Agent's current load
- Surfaces a clean alert on the Commander Dashboard: "Tech #4: PTO Request (March 6). Capacity: 92% (Approval Recommended)"
- Admin clicks [Approve] — Brain syncs the calendar and sends a Verified confirmation back to the tech via Slack

**Call Transcription:**
- All inbound/outbound calls processed through the GL365 voice system are transcribed
- Transcripts summarized and posted to designated Slack channel
- Key data (model numbers, addresses, complaints) extracted and written to relevant records

**Filing Cabinet Voice Notes:**
- Technicians send voice notes via Slack
- Second Brain (powered by Claude) extracts: model numbers, serial numbers, asset decay indicators, location details
- Extracted data written to Home Ledger / Filing Cabinet automatically

**Slack Badge Rewards:**
- When a tech receives a positive Private Feedback score, Second Brain auto-sends a Slack "Good Job" badge to the tech
- Keeps morale high without manager intervention

### Pricing
Second Brain is an additional monthly cost on top of any tier. Individual price: $499/mo. Included in Sovereign all-in bundle.

---

## VI. THE PRIVATE FEEDBACK LOOP (THE GROWTH VAULT)

### The Core Concept
GL365 replaces public shaming with private accountability. No Yelp-style public humiliation. Feedback goes to the business owner first, always.

### The Two Feedback Streams

**Stream 1 — Consumer Review (Public, Directory-Linked)**
- Job is marked complete by the technician
- Consumer receives a link via SMS
- Link takes them to the business's GL365 directory listing page
- Consumer leaves a native GL365 review there (contributes to badge thresholds)
- This review is public and appears on the directory listing

**Stream 2 — Internal Coaching (Private, Commander Dashboard Only)**
- After the same job completion, consumer is also nudged for private feedback
- Example: "Tech was great but left a smudge on the wall"
- The Feedback Architect (AI) analyzes sentiment
- This feedback NEVER goes public — it goes to the Commander Dashboard only
- Admin sees it color-coded: Green (praise), Amber (coaching needed)
- Admin can click [Coach Tech] — Second Brain drafts a pre-written encouraging Slack message
- Admin sends it with one click
- Tech's Internal Trust Score is updated
- If behavior improves, score rises

### The Reward Mechanic
A portion of GL365 QR transaction fee revenue funds consumer rewards for providing feedback. This creates a feedback loop where consumers are incentivized to engage.

### Developer Mandate
Feedback data lives in a SEPARATE database table from the public directory. It is private by default. It is never exposed via any public API endpoint. Color-coding: Green = praise sentiment, Amber = coaching sentiment.

---

## VII. THE TECHNICIAN PERFORMANCE RADAR

A visual skill for the Commander Dashboard showing the business owner the "pulse" of their entire team in one glance.

### The Five Radar Axes
Each technician gets a pentagon-shaped radar chart scored 0–100 on five dimensions:

1. **Scan Volume** — QR activity per week (how busy/active the tech is)
2. **Private Feedback Score** — Sentiment score from the Growth Vault (private coaching data)
3. **Home Ledger Stain Count** — Outstanding uncleared Stains on their jobs (lower is better)
4. **PTO Reliability** — Ratio of requested vs. approved vs. no-show events
5. **VIP Interaction Rate** — How often they are serving the business's top-tier customers

### Visual Design
- Glassmorphism dark card background
- Liquid Gold accent color for the radar fill
- Each axis labeled with icon + short label
- Overall "Trust Score" percentage displayed center of the radar
- Color logic: 80–100% = Gold glow, 60–79% = Green, 40–59% = Amber, Below 40% = Red pulse
- "Elite Worker" tag auto-appears above radar when Trust Score exceeds 85%

### Developer Implementation Notes
Data sources per axis:
- Scan Volume: `qr_scans` table, filtered by `technician_id`, rolling 7 days
- Private Feedback Score: `private_feedback` table, `sentiment_score` column, rolling 30 days
- Stain Count: `home_ledger_stains` table, `status = uncleared`, filtered by `assigned_tech`
- PTO Reliability: `pto_requests` table, `status` column (requested/approved/no_show), rolling 90 days
- VIP Interaction Rate: JOIN `qr_scans` with `customer_vip_status`, rolling 30 days

---

## VIII. THE HOME LEDGER / PROPERTY PASSPORT

### The Core Concept
A "Carfax for Homes" — every property has a permanent, address-keyed service history that follows the house, not the owner. When a new buyer purchases a home, they can look up the full GL365 record.

### What Goes Into the Ledger
- Every incident report filed via the Incidents module
- Every FSM Handshake (geotagged photo proving a Stain was cleared)
- Every GL365-verified job completed at the address
- Every warranty logged by a contractor
- Every asset (HVAC, Electrical, Plumbing) with model/serial number

### The Stain System
- Incidents create "Stains" on the property record
- Stains can ONLY be cleared by an FSM Handshake: a geotagged photo taken on-site by the technician
- Once cleared, the Stain remains in the record as "Resolved" — it never disappears
- New home buyers see the full history: what broke, who fixed it, when, with photo proof

### Access Model
- Property records are keyed to address, not to the business owner's account
- New home buyers can look up the record during due diligence
- Future: paid property report pull at point of real estate sale ($15–$25/report)

### Rule: ALL Incident Reports Go to Home Ledger
No exceptions. Every incident report filed anywhere in the GL365 system is permanently written to the Home Ledger for that property address.

---

## IX. THE FILING CABINET

### What It Is
A voice-note-to-record extraction system for field technicians.

### The Flow
1. Technician takes a voice note via Slack after a job (using Second Brain channel)
2. Claude (Sonnet) processes the audio transcription
3. AI extracts: model numbers, serial numbers, asset decay indicators ("rust on the flange", "compressor cycling fast"), property address
4. Extracted data is written to the Home Ledger / Property Passport automatically
5. Any decay indicators flagged as potential "Stains" — Admin reviews and confirms

### The "Asset Decay" Intelligence
The Filing Cabinet doesn't just capture data — it detects early warning signs. If a technician mentions anything indicating deterioration, the Brain flags it as a predictive maintenance opportunity and surfaces it to the Admin as a lead for a future service booking.

---

## X. THE GIVING BACK BANK (COMMUNITY VAULT)

### The Model
- Jared Tucker personally donates $3 per subscriber per month from his GL365 revenue
- Formula: $3 x total platform subscribers (directory + System B combined)
- This is NOT charged to businesses — it comes entirely from GL365 operating revenue
- Additionally, 15% of GL365 QR transaction fee revenue is allocated to the Vault

### Scale
- 1,000 subscribers = $3,000/mo donated
- 5,000 subscribers = $15,000/mo donated
- 10,000 subscribers = $30,000/mo donated

### The Automation (Day One Requirement)
The Vault MUST be automated from Day One. No manual transfers. No batch processing.
- Supabase Postgres trigger fires on every qualifying transaction
- Trigger writes to `giving_back_vault` table with: amount, source_type, transaction_id, timestamp
- Full UX/UI built in the GL365 hidden admin dashboard showing: total vault balance, monthly contribution chart, subscriber count feed, transaction log

### The Public Story
"When you get paid through The Shield, GL365 automatically puts 15% of OUR fee into the Community Vault. Every member on this platform funds the community."

### The Homepage Counter
A real-time counter on the GL365 homepage showing total community contributions. This is a major marketing asset — it grows with every subscriber.

---

## XI. THE QR SHIELD

### What It Is
The payment processing infrastructure embedded in every GL365-verified transaction.

### The Fee
QR Shield transaction fees are capped at $0.60 per scan — no percentages, no surprises. Applies to directory-only listings. Backend System B subscribers have transaction fees waived.

### The VIP Nudge
When a high-frequency customer scans a QR code, the system recognizes them as a VIP and surfaces an alert to the business owner: "This is a 50x VIP Customer." Business owner can offer a VIP special in real time.

---

## XII. THE SALES WORKFLOW

### Entry Points
1. Inbound: website chat widget (GL365 Concierge) runs discovery
2. Outbound: cold call or referral → book discovery call → AI or Jared runs 5-category intake
3. $400 Digital Infrastructure Audit as tripwire → $400 credited toward first month on sign-up

### The Intake Blueprint
Every prospect goes through a 5-category discovery before any system is built:
1. Business Basics (name, industry, location, call volume, pain points)
2. Team and Resources (staff count, calendars needed, after-hours coverage)
3. Services and Booking (full service list, durations, pricing model, emergency tiers)
4. Existing Tech Stack (CRM, booking system, phone system, review collection method)
5. Goals and Success Metrics (90-day success definition, primary pain, budget awareness)

Output: Completed Intake Blueprint JSON stored in Supabase prospects table.

### Config Mapping (Operator / Commander / Sovereign)
- **Operator** = Solo or small team, no GL365 CRM, plugs into existing CRM via webhook/API. Includes free 30-day trial. 30-day trial at Day 25: Brain upgrade conversation introduced.
- **Commander** = Multi-staff, wants full GL365 CRM + Property Intelligence system
- **Sovereign** = Enterprise, external CRM integration (bridge builder), custom MCP function mapping

---

## XIII. THE BADGE AND REPUTATION SYSTEM

### Badge Types
- **Integrated (Intelligence Verified):** Unlocked automatically for Command-tier subscribers
- **Earned (Poll-to-Badge Loop):** Earned through QR-triggered consumer polls

### Badge Decay
Badges are time-weighted. Recent reviews carry more weight. Inactivity causes decay. 30 days before badge expires, automated SMS: "Your badge is at risk. Deploy a new Poll Template now."

### The Elite 365 Seal of Approval
Awarded only when 100% of industry-specific badges are active simultaneously. Losing ONE badge = instant Seal revocation. This makes the subscription feel like insurance.

---

## XIV. RELATED DOCUMENTS

- `docs/specs/pricing.md` — Canonical pricing SOT (Operator/Commander/Sovereign)
- `README.md` — Platform overview and Premium Evolution directive
- `design_guidelines.json` — Glassmorphism visual system v2.0
- `memory/OPERATIONAL_BIBLE.md` — Property Intelligence and Badge System deep dive
- `docs/saas-product-architecture.md` — Config A/B/C deployment and voice agent architecture
- `memory/PRICING_STACK.md` — **DEPRECATED** — superseded by docs/specs/pricing.md
- `docs/brainstorming/founding-members-SOT.md` — Founding member offer details
- `docs/brainstorming/home-ledger-launch.md` — Home Ledger launch plan
- `docs/brainstorming/live-local-pulse-spec.md` — Live Local Pulse behavior spec
