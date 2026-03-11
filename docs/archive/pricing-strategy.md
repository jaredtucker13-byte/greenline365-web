# GreenLine365 — Pricing Strategy
## Brainstorming Document

**Status:** Draft — Pricing NOT FINAL. Many items TBD.
**Created:** 2026-02-21
**Author:** Jared Tucker (Creator, GL365)
**File:** `docs/brainstorming/pricing-strategy.md`

---

## IMPORTANT CONTEXT

GL365 has TWO separate pricing contexts that must NEVER be confused on the website.

| Context | What It Prices | Where It Lives |
|---|---|---|
| Directory Listing Tiers | A business's listing on the GL365 public directory | `/pricing` (public page) |
| Back-End Products | Command Center, Booking System, Home Ledger, etc. | Hidden — sold via email only |

The public pricing page (`/pricing`) is ONLY for directory listings.
All back-end product pricing is delivered personally via email outreach.

---

## TIER 1 — DIRECTORY LISTING PRICING (Public / Confirmed)

These tiers are live at `/pricing` as of 2026-02-21.

| Tier | Price | Tagline | Key Features |
|---|---|---|---|
| **Free** | $0/mo | "Get discovered" | Basic listing, name/address/phone/hours, placeholder image, basic search visibility |
| **Pro** | $45/mo | "Get chosen" | Everything in Free + 2 custom images, Verified Business badge, Direct CTA button (Book Now/Call Now), business description + service areas |
| **Premium** | $89/mo | "Get booked" | Everything in Pro + all Google Business photos auto-synced, featured listings on homepage, AI Review Response engine |

### Founding Member — Directory Tier

- First **50 verified businesses** get locked-in early pricing
- Their listing rate NEVER increases even when prices go up
- Founding Member badge on their listing card
- Featured placement on homepage and category pages
- Priority support

### Open Questions — Directory Pricing

- [ ] What does "locked-in early pricing" mean in dollar terms?
      (i.e. if Pro goes from $45 to $65 in year 2, founding members stay at $45 forever?)
- [ ] Will Pro and Premium prices increase after the first 50 founding members?
- [ ] Is there an annual billing discount? (e.g. 2 months free for annual)
- [ ] What is the verification process for "Verified Business" badge?
- [ ] Does the Free tier have a listing limit? (1 location only?)
- [ ] How does the "AI Review Response engine" work on Premium — is it auto-posted or draft-only?

---

## TIER 2 — BACK-END PRODUCT PRICING (Private / TBD)

These are sold through email outreach only. NOT on the public pricing page.

### Booking System

- **Base price:** TBD
- **Founding member price:** Base minus $500 setup, Base minus $500/mo forever
- **What's included:** AI booking assistant, 30-day content calendar, Local Pulse alerts,
  lead tracking dashboard, Command Center access
- **Billing:** Monthly subscription (no long-term contract)

Pricing decision framework (brainstorm):
- Comparable tools in the market: Podium ($399/mo), Birdeye ($299/mo), GoHighLevel ($297/mo)
- GL365 is more specific and done-for-you → should price at or above these
- Suggested range to consider: **$297 – $497/mo** for the full system
- Founding member at $500 off = **$0 – $497 first month** depending on base price
- This needs to be decided BEFORE Email 3 of the outreach sequence can be finalized
- [ ] **DECISION NEEDED: What is the Booking System base price?**

### GL365 Home Ledger

- **Status:** Standalone pricing TBD — currently only available as part of Command Center
- **Question:** Is there a standalone Home Ledger tier for homeowners/property managers
  who don't need the full Booking System?
- If yes, suggested positioning: $29-49/mo standalone, included in all Command Center tiers
- [ ] **DECISION NEEDED: Is Home Ledger a standalone product or bundle-only?**

### Live Local Pulse Add-On

- **Status:** Feature gated, pricing TBD
- **Current behavior:** Creator (Jared) has full access. All others see locked preview.
- **Suggested approach:** Capture interest via waitlist before setting price
  (see live-local-pulse-spec.md for waitlist CTA details)
- Potential pricing: $29-49/mo as add-on, or included in premium Command Center tier
- [ ] **DECISION NEEDED: Pulse standalone add-on or tier-included?**

### Campaigns Module

- Currently accessible inside Command Center (email sequences, outreach, lead tracking)
- Standalone pricing: TBD
- Could be bundled into a "Growth" tier above the base Booking System
- [ ] **DECISION NEEDED: Is Campaigns a separate add-on or included?**

### White-Label Products (Agency / Reseller)

- **Booking Widget** — embeddable widget, white-label for agencies
- **AI Chat Widget** — embeddable AI chat, white-label for agencies
- Pricing model: TBD (monthly license? per-seat? revenue share?)
- Target buyer: marketing agencies, web developers, consultant resellers
- This is a separate sales motion from the local business outreach
- [ ] **DECISION NEEDED: Is white-label a priority before or after first 30 founding members?**

---

## FOUNDING MEMBER PRICING SUMMARY

| Program | Cap | Discount | Ongoing |
|---|---|---|---|
| Booking System Founding Members | 30 | $500 off setup | $500/mo off for life + beta + 25% new features |
| Directory Founding Members | 50 | Featured placement + priority support | Locked-in listing rate forever |

---

## PRICING PAGE ARCHITECTURE (Recommended)

**Problem:** The current `/pricing` page only shows directory listing tiers.
A visitor who wants the Command Center / Booking System has no path forward from this page.

**Recommended fix:**

Add a toggle or a callout at the top of the pricing page:

```
[ Directory Listing ]  [ AI Command Center ]
       ↑ active              ↑ toggle

Clicking "AI Command Center" should show:
"The Command Center is sold through personalized onboarding.
 We build it specifically for your business.
 [Book a 15-min call to learn more →]"
```

This routes Command Center interest to a booking call without creating confusion
about which pricing tier includes what.

---

## RELATED DOCUMENTS

- `docs/brainstorming/founding-members-SOT.md` — full offer details for both programs
- `docs/brainstorming/email-outreach-sequence.md` — Email 3 needs base price to be complete
- `docs/brainstorming/live-local-pulse-spec.md` — Pulse waitlist / unlock behavior
- `docs/brainstorming/home-ledger-launch.md` — Home Ledger standalone pricing question

---

*Last updated: 2026-02-21*
*Status: Directory pricing is live and confirmed. Back-end pricing is all TBD.*
*This doc should be updated every time a pricing decision is made.*
*Move confirmed decisions to `docs/specs/pricing.md` when finalized.*
