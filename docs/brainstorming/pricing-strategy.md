# GreenLine365 — Pricing Strategy

Brainstorming Document
Status: Draft — Pricing NOT FINAL. Many items TBD.
Created: 2026-02-21
Author: Jared Tucker (Creator, GL365)
File: docs/brainstorming/pricing-strategy.md

## IMPORTANT CONTEXT

GL365 has TWO separate pricing contexts that must NEVER be confused on the website.

| Context | What It Prices | Where It Lives |
|---------|---------------|----------------|
| Directory Listing Tiers | A business's listing on the GL365 public directory | /pricing (public page) |
| Back-End Products | Command Center, Booking System, Home Ledger, etc. | Hidden — sold via email only |

The public pricing page (/pricing) is ONLY for directory listings. All back-end product pricing is delivered personally via email outreach.

---

## TIER 1 — DIRECTORY LISTING PRICING (Public / Confirmed)

These tiers are live at /pricing as of 2026-02-21.

| Tier | Price | Tagline | Key Features |
|------|-------|---------|--------------|
| Free | $0/mo | "Get discovered" | Basic listing, name/address/phone/hours, placeholder image, basic search visibility |
| Pro | $45/mo | "Get chosen" | Everything in Free + 2 custom images, Verified Business badge, Direct CTA button (Book Now/Call Now), business description + service areas |
| Premium | $89/mo | "Get booked" | Everything in Pro + all Google Business photos auto-synced, featured listings on homepage, AI Review Response engine |

### Founding Member — Directory Tier
- First 50 verified businesses get locked-in early pricing
- Their listing rate NEVER increases even when prices go up
- Founding Member badge on their listing card
- Featured placement on homepage and category pages
- Priority support

### Open Questions — Directory Pricing
- What does "locked-in early pricing" mean in dollar terms? (i.e. if Pro goes from $45 to $65 in year 2, founding members stay at $45 forever?)
- Will Pro and Premium prices increase after the first 50 founding members?
- Is there an annual billing discount? (e.g. 2 months free for annual)
- What is the verification process for "Verified Business" badge?
- Does the Free tier have a listing limit? (1 location only?)
- How does the "AI Review Response engine" work on Premium — is it auto-posted or draft-only?

---

## TIER 2 — BACK-END PRODUCT PRICING (Private / TBD)

These are sold through email outreach only. NOT on the public pricing page.

### Booking System
- Base price: TBD
- Founding member price: Base minus $500 setup, Base minus $500/mo forever
- What's included: AI booking assistant, 30-day content calendar, Local Pulse alerts, lead tracking dashboard, Command Center access
- Billing: Monthly subscription (no long-term contract)
- Pricing decision framework (brainstorm):
  - Comparable tools in the market: Podium ($399/mo), Birdeye ($299/mo), GoHighLevel ($297/mo)
  - GL365 is more specific and done-for-you → should price at or above these
  - Suggested range to consider: $297 – $497/mo for the full system
  - Founding member at $500 off = $0 – $497 first month depending on base price
  - This needs to be decided BEFORE Email 3 of the outreach sequence can be finalized
- **DECISION NEEDED: What is the Booking System base price?**

### GL365 Home Ledger — DECISION MADE (2026-02-27)
- **Status: STANDALONE PRODUCT with FREEMIUM model**
- Home Ledger is a standalone product. Homeowners and property managers can buy it without the Command Center.
- This creates a **Dual-Sided Marketplace**: B2B (contractors pay for the Command Center) + B2C (homeowners pay for Home Ledger to protect their asset).

#### Freemium Tiers

| Tier | Price | Access | How It's Activated |
|------|-------|--------|--------------------|
| Free (Read-Only) | $0/mo | Health Scores visible, Certificates of Success visible, locked Filing Cabinet, locked CPA Export, cannot upload DIY repairs | Activated when a **Verified Greenline Pro** scans the homeowner's property QR code. Homeowner gets their Ledger for free. |
| Full Access | $29/mo | Full Filing Cabinet, CPA Export, DIY repair uploads, full document storage, invite any contractor to scan QR and log work | Homeowner upgrades via self-serve checkout |

#### Strategic Rationale
- **"Anti-Hostage" Play:** Homeowners own their data. They can invite ANY contractor to scan their QR code and see the property history. This forces contractors to perform, knowing the homeowner has the data to walk away.
- **"Home Equity Insurance" Psychology:** Homeowners see this as protecting their investment, not buying software. For $29/mo, every dollar spent on repairs is "Verified" and "Stain-Free" — pays for itself at resale.
- **Directory Integration:** When a homeowner's asset health drops (e.g., Water Heater at 40%), the Ledger shows a CTA: "Connect with a Verified Greenline Pro." This feeds leads back into the B2B directory — the "Main Thing."
- **Property Managers:** Per-property pricing. A PM with 50 houses pays $29/mo per property for a portfolio-wide command view.

#### What the Consumer Dashboard Looks Like
- Stripped-down "Obsidian Silk" luxury aesthetic (dark theme, gold accents)
- Health Scores per property
- Certificates of Success (verified repairs)
- Filing Cabinet (locked on Free, full on Paid)
- "Connect with a Verified Greenline Pro" button when scores drop

#### Founding Member Offer — Home Ledger (DECIDED 2026-02-27)
- **First 500 homeowners** get locked-in at **$19/mo for life**
- Same Full Access features — just a permanent price lock
- 500 founding homeowners = viral growth engine: each one pressures their contractors to join GL365, tells their neighbors, and actively shops for Verified Greenline Pros
- This is the cheapest customer acquisition channel GL365 will ever have

#### Property Manager Bulk Pricing (DECIDED 2026-02-27)
| Properties | Per-Property Price |
|---|---|
| 1-19 properties | $29/mo each |
| 20+ properties | **$24/mo each** |

#### Included in Command Center Tiers
- All Command Center tiers (Tier 1/2/3) include full Home Ledger access at no extra cost.
- Standalone pricing is for homeowners/property managers who do NOT need the Command Center.

### Live Local Pulse Add-On
- Status: Feature gated, pricing TBD
- Current behavior: Creator (Jared) has full access. All others see locked preview.
- Suggested approach: Capture interest via waitlist before setting price (see live-local-pulse-spec.md for waitlist CTA details)
- Potential pricing: $29-49/mo as add-on, or included in premium Command Center tier
- **DECISION NEEDED: Pulse standalone add-on or tier-included?**

### Campaigns Module
- Currently accessible inside Command Center (email sequences, outreach, lead tracking)
- Standalone pricing: TBD
- Could be bundled into a "Growth" tier above the base Booking System
- **DECISION NEEDED: Is Campaigns a separate add-on or included?**

### White-Label Products (Agency / Reseller)
- Booking Widget — embeddable widget, white-label for agencies
- AI Chat Widget — embeddable AI chat, white-label for agencies
- Pricing model: TBD (monthly license? per-seat? revenue share?)
- Target buyer: marketing agencies, web developers, consultant resellers
- This is a separate sales motion from the local business outreach
- **DECISION NEEDED: Is white-label a priority before or after first 30 founding members?**

---

## FOUNDING MEMBER PRICING SUMMARY

| Program | Cap | Offer | Ongoing |
|---------|-----|-------|---------|
| Booking System Founding Members | 30 businesses | $500 off setup | $500/mo off for life + beta + 25% new features |
| Directory Founding Members | 50 businesses | Featured placement + priority support | Locked-in listing rate forever |
| **Home Ledger Founding Members** | **500 homeowners** | **$19/mo (vs $29 standard)** | **Price locked for life — never increases** |

---

## PRICING PAGE ARCHITECTURE (Recommended)

Problem: The current /pricing page only shows directory listing tiers. A visitor who wants the Command Center / Booking System has no path forward from this page.

Recommended fix: Add a toggle or a callout at the top of the pricing page:

```
[ Directory Listing ]  [ AI Command Center ]
       ↑ active              ↑ toggle
```

Clicking "AI Command Center" should show:
"The Command Center is sold through personalized onboarding. We build it specifically for your business. [Book a 15-min call to learn more →]"

This routes Command Center interest to a booking call without creating confusion about which pricing tier includes what.

---

## RELATED DOCUMENTS
- docs/brainstorming/founding-members-SOT.md — full offer details for both programs
- docs/brainstorming/email-outreach-sequence.md — Email 3 needs base price to be complete
- docs/brainstorming/live-local-pulse-spec.md — Pulse waitlist / unlock behavior
- docs/brainstorming/home-ledger-launch.md — Home Ledger standalone pricing question

---

Last updated: 2026-02-27
Status: Directory pricing live. Home Ledger standalone freemium confirmed ($0 free / $29 full / $19 founding). PM bulk pricing confirmed ($24/mo at 20+ units). Booking System base price still TBD. Move confirmed decisions to docs/specs/pricing.md when finalized.
