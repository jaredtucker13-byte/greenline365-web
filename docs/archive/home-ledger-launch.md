> **STRATEGIC PIVOT — MUST READ FIRST**
> GL365 was originally built service-first (booking system, AI receptionist, etc.).
> The strategy has pivoted to **directory-first** — using the directory listing as the
> value bomb: low friction, obvious value, instant relationship. All premium products
> (Command Center, Brain, Home Ledger, Booking System) are sold on the back-end
> through email outreach, NOT through public service pages. The directory listing IS
> the front door. Everything below must be understood through this lens.
>
> — Jared Tucker, 2026-02-22

---

# GL365 Home Ledger — Launch Spec
## Brainstorming Document

**Status:** Draft — Internal Only
**Created:** 2026-02-21
**Author:** Jared Tucker (Creator, GL365)
**File:** `docs/brainstorming/home-ledger-launch.md`

---

## NAME CHANGE — OFFICIAL

The module formerly called **"Property Passports"** is now officially called:

> **GL365 Home Ledger**

This rename must be applied everywhere it currently appears:

| Location | Old Text | New Text |
|---|---|---|
| Sidebar nav item | "Passports" | "Home Ledger" |
| Sidebar subtitle | "Every address tells a story" | "GL365 Home Ledger" |
| Commander quick actions panel | "Property Passports" | "Home Ledger" |
| Module page title | "Property Passports" | "GL365 Home Ledger" |
| Module page subtitle | "Every address tells a story" | "Your property's complete intelligence file" |
| Empty state message | "Properties are created when calls come in..." | "Your GL365 Home Ledger is ready. Add your first property." |
| URL (`/admin-v2/property-passport`) | Keep URL as-is for now (routing), update display text only |
| `/home-ledger` page | Currently 404 — NEEDS TO BE BUILT (see below) |
| Any email copy | "Property Passports" | "GL365 Home Ledger" |
| Any onboarding text | "Property Passports" | "GL365 Home Ledger" |

---

## THE /home-ledger PAGE (Currently 404 — Must Be Built)

This is a hidden landing page — NOT in the public nav. Accessed via:
- Direct link shared in email outreach
- Footer link ("For Property Owners" or similar)
- Internal link from the Command Center when users encounter the module

### Page Goal

Convert a warm lead (business owner, property manager, or homeowner)
who received a link from Jared's outreach into a waitlist signup or booking.

### Page Structure

**Section 1 — Hero**
- Headline: "Meet the GL365 Home Ledger — The Only Property File Your Business Will Ever Need"
- Subheadline: "Every property you manage or own, organized in one intelligent file.
  Documents, contacts, incidents, warranties, contractors — all connected."
- CTA: "Join the Waitlist — Get Early Access" → email capture form
- Visual: Screenshot of the Home Ledger module (Property Passports grid view)

**Section 2 — Who It's For**
Three-column panel:
- 🏠 **Homeowners** — "Track every repair, warranty, and contractor in one place.
  Never lose a receipt again."
- 🏢 **Property Managers** — "Manage multiple properties without the spreadsheet chaos.
  Every address has its own file."
- 🏡 **Real Estate Investors** — "Know the exact status, health score, and history
  of every property in your portfolio."

**Section 3 — What's Inside (Feature Walkthrough)**
Show the actual modules with context:
- **Property Passport** — the master file for each address (contacts, notes, status)
- **Filing Cabinet** — AES-256 encrypted doc storage (receipts, warranties, contracts, tax docs)
- **Incidents** — damage documentation with photo capture and signature collection
- **Referral Network** — your trusted contractor directory (plumbers, electricians, HVAC, etc.)

**Section 4 — Trust Bar**
- 🔐 AES-256 Military-Grade Encryption
- 📁 Your files are private — GL365 cannot access them
- 🚫 No long-term contracts
- ✅ Cancel anytime

**Section 5 — Single CTA**
- "Create Your First Property — Free"
- Sub-line: "No credit card required. Takes 2 minutes."
- Links to onboarding wizard or waitlist form

### Page URL

`/home-ledger` — currently returns 404, must be built

### Page Visibility

- NOT in main nav
- Accessible via: direct link in emails, footer ("For Property Owners"), or internal CTA
- This is the back-end product page for the Home Ledger pitch in outreach sequences

---

## MODULE FEATURES (Current State)

Based on audit of `/admin-v2/property-passport`:

| Feature | Current State | Notes |
|---|---|---|
| Property grid | Shows empty state ("No properties yet") | Empty state message needs update |
| Search bar | "Search by address or contact name..." | Good |
| Empty state copy | "Properties are created when calls come in through the AI agent" | Confusing — update to actionable CTA |
| Add property flow | Not tested | Need to test and document |

### Empty State Fix

Current: "Properties are created when calls come in through the AI agent"
Problem: This is confusing for a new user — sounds passive, like they can't do anything.

**Recommended:**
> "Your GL365 Home Ledger is empty — but your first property is one click away."
> [+ Add Your First Property] button

---

## RELATED PRODUCTS THAT FEED INTO HOME LEDGER

The Home Ledger is the hub. These modules connect to it:

- **Filing Cabinet** (`/admin-v2/filing-cabinet`) — documents tagged to properties
- **Incidents** (`/admin-v2/incidents`) — damage reports linked to properties
- **Referral Network** (`/admin-v2/referral-network`) — contractors linked to properties
- **Commander** (`/admin-v2/commander`) — property intelligence overview dashboard

Each of these should cross-link back to the relevant Home Ledger entry.

---

## TARGET NICHES FOR HOME LEDGER OUTREACH

These are the industries most likely to pay for the Home Ledger:

1. **Property managers** (managing 2-20 residential or commercial units)
2. **Real estate investors** (fix-and-flip or rental portfolios)
3. **HVAC / plumbing / electrical contractors** (who manage customer property records)
4. **Insurance agents** (who help clients document property for claims)
5. **Homeowners** with recent renovations or older homes (high repair activity)

---

## OPEN QUESTIONS

- [ ] Is the Home Ledger sold separately or only as part of the Command Center bundle?
- [ ] Is there a standalone pricing tier for Home Ledger only? (e.g., a homeowner who doesn't
      need the booking system or content calendar)
- [ ] What is the founding member offer for Home Ledger specifically?
      (Currently only Booking System has a defined founding member offer)
- [ ] Should `/home-ledger` be built before the first property manager outreach begins?
- [ ] The Filing Cabinet "CPA Export" feature — is this a premium feature or included?
- [ ] Incidents module — is digital signature collection already functional?

---

## RELATED DOCUMENTS

- `docs/brainstorming/founding-members-SOT.md` — founding member tiers
- `docs/brainstorming/pricing-strategy.md` — Home Ledger pricing tier TBD
- `docs/brainstorming/email-outreach-sequence.md` — outreach sequence template

---

*Last updated: 2026-02-21*
*Status: Name change is CONFIRMED. Page build and outreach are pending pricing decisions.*


---

# BRAIN ECOSYSTEM — SECOND BRAIN PRD & BRAINSTORMING

> Added: 2026-02-22
> Context: Full brainstorming session covering the GL365 "Second Brain" architecture,
> Slack integration, smart routing, GAS automations, Restaurant Brain vertical,
> pricing reconciliation, and engineering sequencing. This section consolidates
> insights from GitHub audit, Gemini PRD specs, and Claude analysis.

---

## THE SECOND BRAIN — WHAT IT IS

The GL365 Brain is the intelligent capture-and-action layer of the Command Center. It lives as the "Your Brain" widget on the dashboard and serves as the central nervous system for every business on the platform.

Three surfaces for interaction:
1. **Phone (via Slack)** — #second-brain channel captures ideas, notes, reminders from anywhere
2. **Desktop (via Command Center)** — BrainWidget.tsx on the dashboard with direct input
3. **Automated (via GAS)** — Google Apps Script handles scheduled reports, calendar sync, form input

The Brain does NOT require hashtags. A **smart router powered by Sonnet 4.6** auto-classifies every input into the correct bin. Sonnet 4.6 is the ideal model for this — fast, accurate for everyday classification tasks, and cost-effective for high-volume routing.

---

## BRAIN ARCHITECTURE — 4-LAYER MEMORY SYSTEM

From `memory/DYNAMIC_MEMORY_BUCKET_SYSTEM.md` (audited 2026-02-22):

**Layer 1 — Buffer (Real-Time)**
Scratch pad for live context. Holds current conversation state, recent inputs, and active session data. Flushed after processing. This is what the smart router reads first.

**Layer 2 — Core (Brand Voice)**
Persistent identity layer. Stores brand tone, writing style, business personality, and voice guidelines. Never overwritten — only refined. This ensures every Brain output sounds like the business.

**Layer 3 — Warehouse (RAG Knowledge)**
Long-term knowledge base. Stores documents, SOPs, product info, FAQs, and reference material. Powers retrieval-augmented generation for accurate, context-aware responses.

**Layer 4 — Journal (Event Timeline)**
Chronological event log. Every interaction, decision, and action is timestamped and stored. Enables weekly reports, audit trails, and "what happened" queries.

**Priority Fetch Workflow:** Buffer → Core → Journal → Warehouse (most recent context first, then identity, then events, then deep knowledge)

---

## BRAIN BINS — CURRENT vs. EVOLVED

### Current State (BrainWidget.tsx)

From audit of `webapp/app/admin-v2/components/BrainWidget.tsx` (374 lines):

| Bin | Color | Icon | Purpose |
|---|---|---|---|
| People | Blue | Users | Contacts, team members, key relationships |
| Projects | Purple | Briefcase | Active work, deliverables, timelines |
| Ideas | Yellow | Lightbulb | Concepts, inspirations, brainstorms |
| Admin | Green | Settings | Operations, scheduling, internal tasks |

API Endpoints:
- `POST /api/brain/capture` — captures new item, smart router classifies it
- `GET /api/brain/{people|projects|ideas|admin}` — retrieves items by bin
- `PATCH /api/brain/{type}` — updates existing items

All scoped by `businessId` via `useBusiness()` hook — already multi-tenant.

### Evolved State (Gemini PRD Spec)

The bins evolve from categories to **action-states**:

| State | Purpose | Flow |
|---|---|---|
| Triage | Unprocessed inputs awaiting classification | Smart router auto-sorts here first |
| Pending Approval | Items requiring human decision | Manager reviews, approves/rejects |
| Active | Work in progress | Assigned, tracked, has deadline |
| Pipeline | Future/queued work | Prioritized backlog |
| Resolved | Completed items | Archived, searchable, feeds reports |

**Status Enum:** `triage`, `pending_approval`, `active`, `pipeline`, `resolved`
**Scope Enum:** `private` (only you), `team` (your team), `org` (whole business)

This evolution means the Brain goes from a note-taking tool to a full **work management system** — every thought captured becomes a trackable action item.

---

## SLACK INTEGRATION — SECOND BRAIN CHANNEL

**Setup completed 2026-02-22:**
- Created `#second-brain` public channel in GL365 Slack workspace
- Topic: "Capture ideas, insights & notes from anywhere — your Second Brain for GreenLine365"
- Added `greenline365` custom bot (App ID: A0A0GUQACFM) to channel
- Created Canvas with Second Brain structure and categories
- Slack workspace is on FREE plan — Workflows require paid plan

**How it works:**
1. User sends message from phone → Slack `#second-brain` channel
2. `greenline365` bot receives the message via Events API
3. Smart router (Sonnet 4.6) classifies the input — no hashtags needed
4. Item is stored in the correct Brain bin via `POST /api/brain/capture`
5. Confirmation posted back to Slack thread

**For B2B (subaccount businesses):**
- Each business gets their own `#second-brain` channel in their workspace
- Or uses the GL365 Slack app connected to their Command Center
- All team members with access can post to the Brain
- Brain items respect the `scope` enum (private/team/org)

---

## GAS (GOOGLE APPS SCRIPT) INTEGRATIONS

GAS extends the Brain's reach into the Google ecosystem. These automations run on schedules or triggers, requiring no user action after setup.

**Calendar Sync (Bidirectional)**
- Brain items with dates auto-create Google Calendar events
- Calendar events can feed back into the Brain as Journal entries
- Time-off approvals (from team Brain submissions) auto-block calendar days
- Gap identified: current BrainWidget.tsx has no calendar integration — this is a build priority

**Weekly Digest / Reports**
- GAS script runs every Monday at 7 AM
- Queries Brain API for all items created/updated in past 7 days
- Generates summary grouped by bin (People, Projects, Ideas, Admin)
- Sends digest email or posts to Slack #second-brain
- Also generates a Google Sheet row for long-term tracking

**Google Forms Input**
- Public-facing Google Form feeds directly into Brain via GAS webhook
- Use case: anonymous employee feedback, customer suggestions, field reports
- Form submission → GAS trigger → POST /api/brain/capture with metadata

**Google Drive Backup**
- Nightly export of all Brain items to a Google Sheet (audit trail)
- Filing Cabinet documents backed up to designated Drive folder
- Ensures data portability and disaster recovery

**Gmail Follow-Up Automation**
- Brain items tagged "follow-up" generate draft Gmail messages
- Smart router detects follow-up intent and sets reminder dates
- GAS checks daily for due follow-ups and nudges via email or Slack

---

## B2B USE CASES — TEAM BRAIN

### Subaccount Model
- Business signs up for GL365 Pro → gets full Command Center with Brain
- Business owner can invite team members (team seats)
- All team members get access to the shared Brain
- Items can be scoped: private (only creator sees), team (department), org (everyone)

### Time-Off Automation
1. Employee sends "I need Nov 24-28 off for Thanksgiving" to #second-brain
2. Smart router classifies as Admin → Pending Approval
3. Manager gets notification in Brain dashboard
4. Manager approves → status moves to Active
5. GAS triggers: blocks Google Calendar, updates team availability sheet
6. Employee gets Slack confirmation: "Your time off Nov 24-28 is approved"

### Anonymous Feedback ("Employee Pulse")
- Hidden feature: employees submit anonymous feedback through a dedicated Google Form
- Form submission → GAS → Brain capture with `scope: org` and `source: anonymous`
- **Critical:** No identifying metadata stored — no IP, no email, no user ID
- Business owner sees aggregated pulse data in Brain dashboard
- Categories: morale, management, workload, culture, suggestions
- This builds trust — employees can be honest without fear of retaliation
- Technical implementation: Google Form strips all identity → GAS webhook → Brain API with anonymous flag

---

## RESTAURANT BRAIN — VERTICAL MODULE

The Restaurant Brain adapts the generic Brain bins to restaurant-specific operations. This is where the Second Brain philosophy moves from maintenance to intelligence.

### Bin Mapping (Generic → Restaurant)

| Generic Bin | Restaurant Equivalent | What It Tracks |
|---|---|---|
| People | Staff & Vendors | Employees, suppliers, delivery contacts, health inspectors |
| Projects | Menu & Events | Menu changes, catering orders, special events, seasonal promos |
| Ideas | Concepts & R&D | New dish ideas, customer feedback themes, expansion plans |
| Admin | Ops & Compliance | Licenses, inspections, POS reconciliation, shift schedules |

### Inventory & Velocity Engine (Replaces Property Assets)

Where the Home Ledger tracks static assets (roof, HVAC, plumbing), the Restaurant Brain tracks **consumable inventory with velocity**:

- Track ingredients by category (proteins, produce, dairy, dry goods)
- Monitor velocity: how fast each item depletes (daily burn rate)
- Auto-generate reorder alerts when stock hits threshold
- Predict spoilage risk based on velocity + expiration dates
- Connect to supplier catalog for one-click reorder

### Smart Router — Restaurant Context

The Sonnet 4.6 router gains restaurant-specific classification:
- "We're low on chicken" → Ops & Compliance (inventory alert)
- "Had a great idea for a summer cocktail menu" → Concepts & R&D
- "John called in sick for Saturday" → Staff & Vendors (scheduling)
- "Health inspector coming Tuesday" → Ops & Compliance (urgent flag)

### Kitchen Display Integration (Future)
- Brain items tagged "kitchen" push to KDS (Kitchen Display System)
- Prep lists auto-generated from Brain items + inventory levels
- 86'd items broadcast to all surfaces (POS, Brain, Slack)

---

## HOME LEDGER AS "CARFAX FOR HOMES"

The Home Ledger is not just a filing cabinet — it is a **verified property history system**.

### Stain/Resolution System
Every property event has two states:
- **Stain** — Something happened (water damage, pest infestation, code violation, insurance claim)
- **Resolution** — How it was fixed (contractor used, cost, date completed, photos of repair)

A property with stains but no resolutions is a red flag. A property with stains AND resolutions shows responsible ownership. This creates a trust score.

### Fraud-Proof Verification
- **EXIF/GPS data** — Photos must have metadata proving location and timestamp
- **Screenshot handshake** — Before/after photos required with GPS match
- **Contractor verification** — Referral Network contractors can digitally confirm work completed
- **Digital signatures** — Incidents module already has signature collection capability

### Gold Lead Dossier Engine
When a business listed in the GL365 directory is also a property owner:
- Their Home Ledger data + directory listing data combine into a **Gold Lead Dossier**
- Property managers see: business type, property condition, maintenance history, contractor relationships
- This is the upsell engine: "You're listed in our directory. Want to also track your property?"

---

## PRICING RECONCILIATION

### Problem
The founding members document (`founding-members-SOT.md`) has pricing that is "clearly wrong" and needs to be reconciled with the evolved product vision.

### Current Founding Member Pricing (from SOT)
- Booking System Founding Members: 30 cap, specific pricing tiers
- Directory Founding Members: 50 cap, separate pricing
- These were set before the directory-first pivot

### Gemini PRD Pricing Tiers (Proposed)
- **Starter:** $299/mo — single location, basic Brain (4 bins), Home Ledger lite
- **Growth:** $499/mo — multi-location, full Brain with action-states, team seats
- **Scale:** $899/mo — enterprise features, API access, custom integrations, compliance
- **Enterprise setup fees:** $2,950-$6,500 one-time for onboarding, migration, custom config

### Reconciliation Notes
- The founding member pricing was set for individual products (Booking, Directory)
- The new pricing bundles everything into the Command Center tiers
- Founding members should get grandfathered at their locked-in rate
- New customers enter through the directory-first funnel → upsell to Command Center tiers
- The $299-899/mo range targets small businesses (1-20 employees)
- The $2,950-6,500 setup targets enterprise/multi-location chains
- **Action needed:** Update `founding-members-SOT.md` to clarify which prices are grandfathered vs. deprecated

---

## B2B SUPPLY-SIDE MARKETPLACE

Once enough businesses are on the platform, GL365 becomes a **B2B marketplace**:

- **Restaurants** need suppliers (food distributors, equipment vendors, linen services)
- **Property managers** need contractors (plumbers, electricians, HVAC, cleaners)
- **Any business** needs service providers (IT, accounting, marketing, insurance)

The Brain + Directory combination creates a unique data advantage:
- The Brain knows what each business needs (from their captured items)
- The Directory knows who provides those services (from listed businesses)
- GL365 can intelligently match supply and demand

### Revenue Model
- Free for buyers (businesses searching for services)
- Listing fee or commission for suppliers appearing in recommendations
- Premium placement in Brain-powered suggestions
- This is the long-term monetization play beyond SaaS subscriptions

---

## TEMPLATE MARKETPLACE

Brain templates allow businesses to start with pre-configured bin structures for their industry:

- **Restaurant Template** — Staff & Vendors, Menu & Events, Concepts & R&D, Ops & Compliance
- **Property Management Template** — Tenants, Properties, Maintenance, Compliance
- **Salon/Spa Template** — Clients, Appointments, Products, Staff
- **Contractor Template** — Clients, Jobs, Estimates, Equipment
- **Real Estate Agent Template** — Leads, Listings, Transactions, Marketing

Templates include pre-configured smart router rules, GAS automations, and Slack channel structures. Revenue opportunity: free basic templates, premium industry-specific templates at $49-99/each or included with higher tiers.

---

## COMPLIANCE BRAIN — REGULATED INDUSTRIES

For businesses in regulated industries (restaurants, healthcare, property management), the Brain adds a compliance layer:

- **License tracking** — expiration dates, renewal reminders, document storage
- **Inspection readiness** — checklists, documentation requirements, audit trails
- **Certification management** — employee certifications, training records, continuing education
- **Regulatory alerts** — GAS monitors for regulation changes and notifies via Brain

This transforms the Brain from a productivity tool into a **risk management system**. Businesses pay premium for compliance peace of mind.

---

## FIELD HUB — TECHNICIAN MOBILE INTERFACE

For businesses with field workers (HVAC techs, plumbers, electricians, property inspectors):

- **Mobile-first Brain access** — technicians capture notes, photos, and updates from job sites
- **Job card integration** — Brain items linked to specific work orders
- **Photo documentation** — EXIF/GPS-verified photos attached to Brain entries
- **Offline mode** — capture items offline, sync when connection returns
- **Voice-to-Brain** — speak notes via Slack voice messages, transcribed and classified

This is the bridge between the office Brain (Command Center) and the field. Every field interaction feeds the property's Home Ledger automatically.

---

## ENGINEERING SEQUENCING — BUILD ORDER

Recommended implementation order based on dependency chain and impact:

### Phase 1 — Foundation (Current Sprint)
1. Smart Router integration (Sonnet 4.6 classification endpoint)
2. Slack bot → Brain API webhook connection
3. Brain capture API accepts Slack messages
4. Basic status enum (triage → active → resolved)

### Phase 2 — Automation Layer
1. GAS Calendar sync (bidirectional)
2. GAS Weekly digest script
3. Google Form → Brain anonymous input pipeline
4. Email follow-up automation

### Phase 3 — Team Features
1. Scope enum (private/team/org) on all Brain items
2. Approval workflow (pending_approval state)
3. Team member invite system (subaccounts)
4. Manager notification dashboard

### Phase 4 — Vertical Modules
1. Restaurant Brain template + bin mapping
2. Property Management Brain template
3. Inventory & Velocity engine (restaurant-specific)
4. Compliance layer (license/inspection tracking)

### Phase 5 — Marketplace
1. B2B supply-side matching engine
2. Template marketplace
3. Premium template creation tools
4. Supplier listing/commission system

---

## TECHNICAL ARCHITECTURE NOTES

### Existing Infrastructure (from GitHub audit)
- **Frontend:** Next.js (App Router) deployed on Vercel
- **Backend API:** `/webapp/app/api/` — brain/, bookings/, businesses/, chat/, crm/, email/, filing-cabinet/, incidents/, knowledge/, stripe/, twilio/, sms/, social/
- **Multi-tenant:** All queries scoped by `businessId` via `useBusiness()` hook
- **Encryption:** AES-256 for Filing Cabinet documents
- **Auth:** Session-based with business context switching (BusinessSwitcher.tsx)
- **Components:** BrainWidget.tsx, HybridCalendar.tsx, LiveLocalPulse.tsx, WeeklyTrendBatch.tsx, CollapsibleSidebar.tsx

### Key Gaps Identified
1. **No Calendar-Brain sync** — BrainWidget.tsx and HybridCalendar.tsx don't talk to each other
2. **No GAS files in repo** — Google Apps Script likely set up separately; should be version-controlled
3. **Brain bins are category-only** — need status/scope enums added to the data model
4. **Slack bot has no route handler** — needs `/api/slack/events` endpoint for message processing
5. **No weekly report generator** — needs GAS or cron job for digest emails

### Database Schema Extensions Needed
- Add `status` column to brain items table: enum(triage, pending_approval, active, pipeline, resolved)
- Add `scope` column: enum(private, team, org)
- Add `source` column: enum(command_center, slack, gas, form, api)
- Add `assigned_to` column: nullable user ID for team assignments
- Add `due_date` column: nullable timestamp for deadline tracking
- Add `anonymous` boolean flag for Employee Pulse items

---

## RELATED DOCUMENTS (UPDATED)

- `docs/brainstorming/founding-members-SOT.md` — founding member tiers (NEEDS PRICING FIX)
- `docs/brainstorming/pricing-strategy.md` — Home Ledger pricing tier TBD
- `docs/brainstorming/email-outreach-sequence.md` — outreach sequence template
- `memory/DYNAMIC_MEMORY_BUCKET_SYSTEM.md` — 4-layer memory architecture (Buffer, Core, Warehouse, Journal)
- `memory/PRD.md` — GreenLine365 Business Operating System PRD
- `webapp/app/admin-v2/components/BrainWidget.tsx` — Brain UI component (374 lines, 4 bins)
- `webapp/app/api/brain/` — Brain API endpoints (capture, retrieve, update)

---

*Last updated: 2026-02-22*
*Status: Strategic pivot documented. Brain ecosystem PRD appended. Pricing reconciliation flagged. Engineering sequence proposed.*
