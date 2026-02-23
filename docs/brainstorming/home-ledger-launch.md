> STRATEGIC PIVOT — MUST READ FIRST
> GL365 was originally built service-first (booking system, AI receptionist, etc.). The strategy has pivoted to directory-first — using the directory listing as the value bomb: low friction, obvious value, instant relationship. All premium products (Command Center, Brain, Home Ledger, Booking System) are sold on the back-end through email outreach, NOT through public service pages. The directory listing IS the front door. Everything below must be understood through this lens.
> — Jared Tucker, 2026-02-22

# GL365 Home Ledger — Launch Spec

Brainstorming Document
Status: Draft — Internal Only
Created: 2026-02-21
Author: Jared Tucker (Creator, GL365)
File: docs/brainstorming/home-ledger-launch.md

---

## NAME CHANGE — OFFICIAL

The module formerly called "Property Passports" is now officially called: **GL365 Home Ledger**

This rename must be applied everywhere it currently appears:

| Location | Old Text | New Text |
|----------|----------|----------|
| Sidebar nav item | "Passports" | "Home Ledger" |
| Sidebar subtitle | "Every address tells a story" | "GL365 Home Ledger" |
| Commander quick actions panel | "Property Passports" | "Home Ledger" |
| Module page title | "Property Passports" | "GL365 Home Ledger" |
| Module page subtitle | "Every address tells a story" | "Your property's complete intelligence file" |
| URL (/admin-v2/property-passport) | Keep URL as-is for now (routing), update display text only | — |
| /home-ledger page | Currently 404 — NEEDS TO BE BUILT (see below) | — |
| Any email copy | "Property Passports" | "GL365 Home Ledger" |
| Any onboarding text | "Property Passports" | "GL365 Home Ledger" |

---

## THE /home-ledger PAGE (Currently 404 — Must Be Built)

This is a hidden landing page — NOT in the public nav. Accessed via:
- Direct link shared in email outreach
- Footer link ("For Property Owners" or similar)
- Internal link from the Command Center when users encounter the module

**Page Goal:** Convert a warm lead (business owner, property manager, or homeowner) who received a link from Jared's outreach into a waitlist signup or booking.

### Page Structure

**Section 1 — Hero**
- Headline: "Meet the GL365 Home Ledger — The Only Property File Your Business Will Ever Need"
- Subheadline: "Every property you manage or own, organized in one intelligent file. Documents, contacts, incidents, warranties, contractors — all connected."
- CTA: "Join the Waitlist — Get Early Access" → email capture form
- Visual: Screenshot of the Home Ledger module (Property Passports grid view)

**Section 2 — Who It's For**
Three-column panel:
- 🏠 Homeowners — "Track every repair, warranty, and contractor in one place. Never lose a receipt again."
- 🏢 Property Managers — "Manage multiple properties without the spreadsheet chaos. Every address has its own file."
- 🏡 Real Estate Investors — "Know the exact status, health score, and history of every property in your portfolio."

**Section 3 — What's Inside (Feature Walkthrough)**
Show the actual modules with context:
- Property Passport — the master file for each address (contacts, notes, status)
- Filing Cabinet — AES-256 encrypted doc storage (receipts, warranties, contracts, tax docs)
- Incidents — damage documentation with photo capture and signature collection
- Referral Network — your trusted contractor directory (plumbers, electricians, HVAC, etc.)

**Section 4 — Trust Bar**
- 🔐 AES-256 Military-Grade Encryption
- 📁 Your files are private — GL365 cannot access them
- 🚫 No long-term contracts
- ✅ Cancel anytime

**Section 5 — Single CTA**
"Create Your First Property — Free"
Sub-line: "No credit card required. Takes 2 minutes."
Links to onboarding wizard or waitlist form

**Page URL:** /home-ledger — currently returns 404, must be built
**Page Visibility:** NOT in main nav. Accessible via: direct link in emails, footer ("For Property Owners"), or internal CTA.

---

## MODULE FEATURES (Current State)

Based on audit of /admin-v2/property-passport:

| Feature | Current State | Notes |
|---------|--------------|-------|
| Property grid | Shows empty state ("No properties yet") | Empty state message needs update |
| Search bar | "Search by address or contact name..." | Good |
| Empty state copy | "Properties are created when calls come in through the AI agent" | Confusing — update to actionable CTA |
| Add property flow | Not tested | Need to test and document |

### Empty State Fix
- **Current:** "Properties are created when calls come in through the AI agent"
- **Problem:** This is confusing for a new user — sounds passive, like they can't do anything.
- **Recommended:** "Your GL365 Home Ledger is empty — but your first property is one click away." [+ Add Your First Property] button

---

## RELATED PRODUCTS THAT FEED INTO HOME LEDGER

The Home Ledger is the hub. These modules connect to it:
- Filing Cabinet (/admin-v2/filing-cabinet) — documents tagged to properties
- Incidents (/admin-v2/incidents) — damage reports linked to properties
- Referral Network (/admin-v2/referral-network) — contractors linked to properties
- Commander (/admin-v2/commander) — property intelligence overview dashboard

Each of these should cross-link back to the relevant Home Ledger entry.

---

## TARGET NICHES FOR HOME LEDGER OUTREACH

These are the industries most likely to pay for the Home Ledger:
- Property managers (managing 2-20 residential or commercial units)
- Real estate investors (fix-and-flip or rental portfolios)
- HVAC / plumbing / electrical contractors (who manage customer property records)
- Insurance agents (who help clients document property for claims)
- Homeowners with recent renovations or older homes (high repair activity)

---

## OPEN QUESTIONS
- Is the Home Ledger sold separately or only as part of the Command Center bundle?
- Is there a standalone pricing tier for Home Ledger only? (e.g., a homeowner who doesn't need the booking system or content calendar)
- What is the founding member offer for Home Ledger specifically? (Currently only Booking System has a defined founding member offer)
- Should /home-ledger be built before the first property manager outreach begins?
- The Filing Cabinet "CPA Export" feature — is this a premium feature or included?
- Incidents module — is digital signature collection already functional?

---

## BRAIN ECOSYSTEM — SECOND BRAIN PRD & BRAINSTORMING

Added: 2026-02-22

Context: Full brainstorming session covering the GL365 "Second Brain" architecture, Slack integration, smart routing, GAS automations, Restaurant Brain vertical, pricing reconciliation, and engineering sequencing.

### THE SECOND BRAIN — WHAT IT IS

The GL365 Brain is the intelligent capture-and-action layer of the Command Center. Three surfaces for interaction:
- **Phone (via Slack)** — #second-brain channel captures ideas, notes, reminders from anywhere
- **Desktop (via Command Center)** — BrainWidget.tsx on the dashboard with direct input
- **Automated (via GAS)** — Google Apps Script handles scheduled reports, calendar sync, form input

The Brain does NOT require hashtags. A smart router powered by Sonnet 4.6 auto-classifies every input into the correct bin.

### BRAIN ARCHITECTURE — 4-LAYER MEMORY SYSTEM

From memory/DYNAMIC_MEMORY_BUCKET_SYSTEM.md (audited 2026-02-22):

- **Layer 1 — Buffer (Real-Time):** Scratch pad for live context. Flushed after processing.
- **Layer 2 — Core (Brand Voice):** Persistent identity layer. Stores brand tone, writing style, business personality. Never overwritten — only refined.
- **Layer 3 — Warehouse (RAG Knowledge):** Long-term knowledge base. Powers retrieval-augmented generation.
- **Layer 4 — Journal (Event Timeline):** Chronological event log. Every interaction, decision, and action is timestamped.

Priority Fetch Workflow: Buffer → Core → Journal → Warehouse

### BRAIN BINS — CURRENT vs. EVOLVED

**Current State (BrainWidget.tsx)**

| Bin | Color | Icon | Purpose |
|-----|-------|------|---------|
| People | Blue | Users | Contacts, team members, key relationships |
| Projects | Purple | Briefcase | Active work, deliverables, timelines |
| Ideas | Yellow | Lightbulb | Concepts, inspirations, brainstorms |
| Admin | Green | Settings | Operations, scheduling, internal tasks |

**Evolved State (Gemini PRD Spec)**

| State | Purpose | Flow |
|-------|---------|------|
| Triage | Unprocessed inputs awaiting classification | Smart router auto-sorts here first |
| Pending Approval | Items requiring human decision | Manager reviews, approves/rejects |
| Active | Work in progress | Assigned, tracked, has deadline |
| Pipeline | Future/queued work | Prioritized backlog |
| Resolved | Completed items | Archived, searchable, feeds reports |

### SLACK INTEGRATION — SECOND BRAIN CHANNEL

Setup completed 2026-02-22:
- Created #second-brain public channel in GL365 Slack workspace
- Topic: "Capture ideas, insights & notes from anywhere — your Second Brain for GreenLine365"
- Added greenline365 custom bot (App ID: A0A0GUQACFM) to channel
- Slack workspace is on FREE plan — Workflows require paid plan

### HOME LEDGER AS "CARFAX FOR HOMES"

The Home Ledger is not just a filing cabinet — it is a verified property history system.

**Stain/Resolution System:**
Every property event has two states:
- **Stain** — Something happened (water damage, pest infestation, code violation, insurance claim)
- **Resolution** — How it was fixed (contractor used, cost, date completed, photos of repair)

A property with stains but no resolutions is a red flag. A property with stains AND resolutions shows responsible ownership. This creates a trust score.

**Fraud-Proof Verification:**
- EXIF/GPS data — Photos must have metadata proving location and timestamp
- Screenshot handshake — Before/after photos required with GPS match
- Contractor verification — Referral Network contractors can digitally confirm work completed
- Digital signatures — Incidents module already has signature collection capability

### PRICING RECONCILIATION

**Problem:** The founding members document has pricing that is "clearly wrong" and needs to be reconciled with the evolved product vision.

**Gemini PRD Pricing Tiers (Proposed):**
- Starter: $299/mo — single location, basic Brain (4 bins), Home Ledger lite
- Growth: $499/mo — multi-location, full Brain with action-states, team seats
- Scale: $899/mo — enterprise features, API access, custom integrations, compliance
- Enterprise setup fees: $2,950-$6,500 one-time for onboarding, migration, custom config

**Reconciliation Notes:**
- The founding member pricing was set for individual products (Booking, Directory)
- The new pricing bundles everything into the Command Center tiers
- Founding members should get grandfathered at their locked-in rate
- New customers enter through the directory-first funnel → upsell to Command Center tiers
- **Action needed:** Update founding-members-SOT.md to clarify which prices are grandfathered vs. deprecated

### ENGINEERING SEQUENCING — BUILD ORDER

**Phase 1 — Foundation (Current Sprint)**
- Smart Router integration (Sonnet 4.6 classification endpoint)
- Slack bot → Brain API webhook connection
- Basic status enum (triage → active → resolved)

**Phase 2 — Automation Layer**
- GAS Calendar sync (bidirectional)
- GAS Weekly digest script
- Google Form → Brain anonymous input pipeline

**Phase 3 — Team Features**
- Scope enum (private/team/org) on all Brain items
- Approval workflow (pending_approval state)
- Team member invite system (subaccounts)

**Phase 4 — Vertical Modules**
- Restaurant Brain template + bin mapping
- Property Management Brain template
- Inventory & Velocity engine (restaurant-specific)

**Phase 5 — Marketplace**
- B2B supply-side matching engine
- Template marketplace

---

## RELATED DOCUMENTS
- docs/brainstorming/founding-members-SOT.md — founding member tiers (NEEDS PRICING FIX)
- docs/brainstorming/pricing-strategy.md — Home Ledger pricing tier TBD
- docs/brainstorming/email-outreach-sequence.md — outreach sequence template
- memory/DYNAMIC_MEMORY_BUCKET_SYSTEM.md — 4-layer memory architecture
- webapp/app/admin-v2/components/BrainWidget.tsx — Brain UI component

---

Last updated: 2026-02-22
Status: Strategic pivot documented. Brain ecosystem PRD appended. Pricing reconciliation flagged. Engineering sequence proposed.
