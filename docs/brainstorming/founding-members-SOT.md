# GreenLine365 — Founding Members Program
## Source of Truth (SOT) | Brainstorming Document

**Status:** Draft — Internal Only
**Created:** 2026-02-21
**Author:** Jared Tucker (Creator, GL365)
**File:** `docs/brainstorming/founding-members-SOT.md`

---

## OVERVIEW

GL365 runs TWO separate Founding Member programs targeting different products and audiences.
These are NOT the same offer.

| Program | Product | Audience | Cap |
|---|---|---|---|
| Founding Member — Booking System | AI Booking/Scheduling System | Service businesses via email outreach | First 30 |
| Founding Member — Directory | GL365 Business Directory Listing | Local Tampa Bay businesses | First 50 |

---

## PROGRAM 1: FOUNDING MEMBERS — BOOKING SYSTEM

> Back-end offer. Sold through personalized email outreach only. NOT publicly listed.

### Offer Details

- **$500 off** the initial setup/onboarding fee
- **$500 off per month — for life** (locked-in, never increases)
- **Beta Access** — first to test new features before public release
- **25% off all new features** — permanent discount on add-ons and feature upgrades
- **Cap:** First **30 members only** — hard stop, no exceptions

### Perceived Value Calculation (Brainstorm)

- $500/mo savings x 12 months = **$6,000/year in recurring savings**
- $500 setup savings = immediate win on day one
- Beta access = influence over product roadmap
- 25% off features = compounding savings as platform grows
- Total Year 1 perceived value: **$6,500+ before feature discounts**

### Funnel Position

- Entry point: Business claims free GL365 Directory listing
- Email 1: Value bomb — Local Pulse snapshot for their ZIP/industry (zero ask)
- Email 2: Soft reveal of the Command Center — screenshot/GIF walkthrough (no price)
- Email 3: Personalized founding member offer — direct, specific, time-limited

### Email 3 Draft Hook

> *"Hey [Name] — I'm only bringing 30 businesses onto the founding member plan*
> *before this goes public. You're one of the first I'm reaching out to.*
>
> *For [their business type] in [their city], I'd set up the AI booking assistant,*
> *a 30-day content calendar, and Local Pulse alerts for your ZIP.*
>
> *Founding members get $500 off setup, $500 off every month for life,*
> *beta access, and 25% off every new feature we ship.*
>
> *Want to jump on a 15-minute call this week?"*

### Open Questions / To Decide

- [ ] What is the full base price before discount? (set base pricing first)
- [ ] Is the $500/mo off a flat amount or percentage-based?
- [ ] What qualifies as a "new feature" for the 25% discount? (needs feature roadmap)
- [ ] Will founding members get a visible badge inside the Command Center dashboard?
- [ ] Define "for life" — does it apply as long as they remain subscribed?
- [ ] Should there be a simple terms document before first outreach?
- [ ] Consider: private Slack/Discord channel for founding members (community layer)
- [ ] Consider: monthly 30-min founder strategy call for first 6 months

---

## PROGRAM 2: FOUNDING MEMBERS — DIRECTORY LISTING

> Public-facing offer. Displayed on the homepage replacing the empty testimonials section.
> This is the FUNNEL ENTRY POINT — the value bomb that starts the relationship.

### Offer Details

- **Featured placement** on GL365 homepage and category pages
- **Priority support** — direct team access, faster response times
- **Locked-in early pricing** — listing rate frozen before future price increases
- **Founding Member badge** on their directory listing card
- **Cap:** First **50 verified businesses** in Tampa Bay — hard stop

### Why This Works Without Testimonials

GL365 currently has no customer testimonials. Rather than show an empty carousel
(which signals unproven platform), this offer flips the script:

- Absence of testimonials becomes **scarcity opportunity** ("be the first")
- No social proof becomes **founding identity** ("be the one others reference")
- Early adopter risk is rewarded with **lifetime price lock**

### Homepage Section — Draft Copy (Replaces Empty Testimonials)

**Headline:** "Be the Business Everyone Else References"

**Subheadline:**
"GreenLine365 is accepting Founding Member listings in the Tampa Bay area.
The first 50 verified businesses get featured placement, priority support,
and locked-in early pricing — before the platform scales."

**Benefit bullets:**
- Featured placement on homepage and category pages
- Priority support — direct access to the GL365 team
- Your listing rate locked in for life, even as prices increase
- Founding Member badge displayed on your listing card

**CTA:** "Claim Your Spot — Free Listing" → links to directory signup form

**Urgency line:** "[X] of 50 spots remaining" (manual counter until automated)

### Open Questions / To Decide

- [ ] What is "locked-in early pricing" in dollar terms? (need base pricing defined first)
- [ ] Is the 50-spot cap per category or total across the whole directory?
- [ ] How do we verify "verified business" status for founding member designation?
- [ ] Does the Founding Member badge display permanently or expire after a period?
- [ ] Should founding members have a dedicated page at /founding-members?
- [ ] Live counter: manual update vs. auto-pull from database count
- [ ] Special URL slug? e.g. /business/founding/[name]

---

## FUNNEL ARCHITECTURE — HOW THE TWO PROGRAMS CONNECT

```
STEP 1: DIRECTORY FOUNDING MEMBER (50 spots — public offer on homepage)
  Business claims free listing + founding member status
            |
            v
STEP 2: EMAIL SEQUENCE BEGINS (automated after signup)
  Email 1 — Value bomb: Local Pulse snapshot for their ZIP/industry (no ask)
  Email 2 — Soft reveal: Command Center walkthrough (no price mentioned)
  Email 3 — The offer: Booking System Founding Member (personalized pitch)
            |
            v
STEP 3: BOOKING SYSTEM FOUNDING MEMBER (30 spots — back-end only)
  $500 off setup
  + $500 off per month for life
  + Beta access to all new features
  + 25% off every new feature permanently
```

**Key Strategic Insight:**
The Directory Founding Member program costs GL365 almost nothing
(featured placement is a UI decision) but produces a warm, pre-sold
audience who feel a sense of partnership before the premium offer
ever arrives in their inbox.

The directory is the front door. The Booking System is the back room.

---

## NAMING & BRANDING NOTES (Brainstorm)

- "Founding Member" should feel like a founding partner, not a discount code recipient
- Consider a digital certificate (styled PDF) sent on onboarding confirmation
- The numbers matter: 30 and 50 are small enough to feel exclusive, large enough for momentum
- Internal CRM/database tags: `founding_member_booking` and `founding_member_directory`
- Future play: founding members become the first case studies and testimonials
- Consider a "Founding Class of 2026" framing for cohort identity and community
- A founding member badge in the Command Center sidebar would reinforce status

---

## PLATFORM CONTEXT (as of 2026-02-21)

### Website Strategy Pivot

GL365 was originally built service-first. The strategy pivoted to directory-first
to use the directory listing as the value bomb — low friction, obvious value,
instant relationship. All premium products are sold on the back-end through
email outreach, not through public service pages.

Service pages exist but are hidden from the main nav. Accessible via:
- Direct link dropped in outreach emails
- Footer link labeled "Platform" or "For Businesses"
- "Learn More" link inside the Command Center onboarding banner

### Product Stack

- **Directory** = public funnel entry (Free / Pro $45/mo / Premium $89/mo listing tiers)
- **Command Center** (/admin-v2) = back-end AI operations hub, sold via email
- **GL365 Home Ledger** (formerly "Property Passports") = property intelligence module
- **Live Local Pulse** = real-time ZIP-based market signal widget
  - Creator (Jared): fully live, defaulted to ZIP 33619 (East Tampa)
  - Smart fallback: AI-generated opportunity card when no live signal available
  - Free users: blur + lock overlay with Unlock/waitlist CTA
  - Paid tier: full access (pricing TBD)
- **Campaigns Module** = email sequences, outreach pipelines, lead tracking
- **Booking Widget** = embeddable, white-label ready
- **AI Chat Widget** = embeddable, white-label ready

---

## RELATED DOCUMENTS (Create These Next)

- `docs/brainstorming/product-architecture.md`
- `docs/brainstorming/email-outreach-sequence.md`
- `docs/brainstorming/live-local-pulse-spec.md`
- `docs/brainstorming/home-ledger-launch.md`
- `docs/brainstorming/pricing-strategy.md`
- `docs/brainstorming/command-center-feature-roadmap.md`

---

*Last updated: 2026-02-21*
*Status: Living brainstorming document — not a final spec.*
*Move to `docs/specs/` and update Status field when decisions are finalized.*
