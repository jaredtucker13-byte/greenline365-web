# GreenLine365 — Brainstorming Notes Review
**Date:** 2026-02-27
**Scope:** All 7 docs in `docs/brainstorming/`
**Purpose:** Map what's planned vs. what's built, surface contradictions, identify next actions

---

## I. DOCUMENT INVENTORY

| # | Document | Created | Status | Summary |
|---|----------|---------|--------|---------|
| 1 | `founding-members-SOT.md` | 2026-02-21 | Draft | Two founding member programs (Directory: 50 cap, Booking: 30 cap) |
| 2 | `email-outreach-sequence.md` | 2026-02-21 | Draft | 5-email drip sequence triggered by directory claim |
| 3 | `live-local-pulse-spec.md` | 2026-02-21 | Draft | Three-tier widget behavior + AI fallback cards |
| 4 | `home-ledger-launch.md` | 2026-02-21 | Draft | Home Ledger landing page + Brain ecosystem + Stain/Resolution system |
| 5 | `pricing-strategy.md` | 2026-02-21 | Draft | Two-tier pricing (public directory + private back-end) |
| 6 | `master-spec-2026.md` | 2026-02-23 | Confirmed | Full 14-section ecosystem narrative (Directory + Command Center + all modules) |
| 7 | `loops-brainstorming.md` | 2026-02-26 | Draft | Engine 2 (Lifestyle) + Engine 3 (Competitive Leagues) |

---

## II. IMPLEMENTATION STATUS BY FEATURE

### 1. Founding Members Program — 0% Built
**Spec:** Two programs. Directory (50 spots, homepage counter, badge). Booking System (30 spots, $500/mo off for life).

| What the spec says | Codebase status |
|-------------------|-----------------|
| `founding_member_booking` / `founding_member_directory` DB tags | No tables, no columns, no migrations |
| Homepage counter "[X] of 50 spots remaining" | Not built |
| Founding Member badge on listing cards | Not built |
| Enrollment API | No `/api/founding-members` route |
| CRM tags (`email_seq_active`, `founding_member_booked`, etc.) | No CRM tag system |

**Verdict:** This is the #1 revenue priority per CLAUDE.md and zero lines of code exist. The entire founding member funnel — from homepage section to database to badge display — needs to be built from scratch.

---

### 2. Email Outreach Sequence — 40% Built
**Spec:** 5-email drip (Day 1/4/8/14/21), auto-triggered on directory claim, with tagging and skip logic.

| What the spec says | Codebase status |
|-------------------|-----------------|
| SendGrid integration | DONE — `sendgrid-sender.ts` configured |
| Email template CRUD | DONE — `/api/email/templates` exists |
| Campaign CRUD | DONE — `/api/email/campaigns` exists |
| Manual send endpoint | DONE — `/api/email/send` (admin-only) |
| Auto-trigger on listing claim | NOT BUILT |
| Timed sequence sends (cron/scheduler) | NOT BUILT |
| Reply detection + skip logic | NOT BUILT |
| SendGrid event webhooks (opens, clicks) | NOT BUILT |
| Pre-built 5-email founding member templates | NOT BUILT |

**Verdict:** The email plumbing exists but it's manual-only. The entire automation layer (trigger → schedule → track → tag) is missing. This blocks the founding member funnel.

**New requirement (2026-02-27):** The $400 Digital Infrastructure Audit pipeline is already built as a manual workflow. The email sequence needs a CTA where businesses can **request** the audit — it's a free value bomb to drive email engagement, not pushed unsolicited. Jared manually runs the audit per company, saves it, and attaches it to the outreach email.

---

### 3. Live Local Pulse — 55% Built
**Spec:** Three tiers (Creator full / Free blurred / Paid full), AI fallback cards, ZIP personalization, 3-hour timer.

| What the spec says | Codebase status |
|-------------------|-----------------|
| LiveLocalPulse widget UI | DONE — `LiveLocalPulse.tsx` (750+ lines) |
| Trend receive/display API | DONE — `/api/daily-trend-hunter` |
| 3-hour scan timer display | DONE — countdown implemented |
| Creator always-on view | DONE |
| Blurred/locked preview for free users | NOT BUILT — all users see full widget |
| AI-generated Opportunity Cards (fallback) | NOT BUILT |
| ZIP code personalization per user | NOT BUILT — hardcoded to 33619 |
| Seasonal fallback library (9 periods) | NOT BUILT |

**Verdict:** Widget works for Jared. Needs tier-gating + blur overlay for free users before launch. The seasonal fallback library is well-specced and ready to be built as a JSON config.

---

### 4. Home Ledger — 65% Built
**Spec:** Renamed from "Property Passports". Landing page, Stain/Resolution system, Carfax-for-homes vision.

| What the spec says | Codebase status |
|-------------------|-----------------|
| `/home-ledger` landing page | DONE — 5-section page built |
| Property Passport module (CRUD, timeline, assets) | DONE |
| Filing Cabinet (AES-256 encrypted docs) | DONE |
| Incidents module (photo capture, AI analysis) | DONE |
| Digital signature collection | DONE |
| UI rename: "Property Passports" → "Home Ledger" | PARTIAL — sidebar still says "Passports" |
| Stain/Resolution tracking system | NOT BUILT — no schema |
| CPA Export | NOT BUILT |
| Incidents → Properties foreign key | MISSING |
| Fraud-proof verification (EXIF/GPS) | NOT BUILT |

**Verdict:** The UI shell is solid. The "Carfax for Homes" vision (Stain system, verification, property history) is entirely unbuilt. The rename is incomplete — sidebar nav, page titles, and several references still say "Property Passports" or "Passports".

---

### 5. Brain / Second Brain — 40% Built
**Spec:** 4-bin capture → evolve to 5-state workflow. Slack integration. GAS automations. Smart router.

| What the spec says | Codebase status |
|-------------------|-----------------|
| 4-bin capture UI (People/Projects/Ideas/Admin) | DONE — BrainWidget.tsx |
| AI classification router | DONE — `/api/brain/capture` uses Claude |
| Bucket APIs | DONE — `/api/brain/[bucket]` routes |
| Weekly recap API | DONE — but not scheduled |
| 5-state workflow (Triage→Pending→Active→Pipeline→Resolved) | NOT BUILT |
| Slack webhook pipeline (#second-brain channel) | NOT BUILT |
| Memory Layers 3-4 (RAG knowledge, Journal timeline) | NOT BUILT |
| GAS Calendar sync (bidirectional) | NOT BUILT |
| GAS Weekly digest script | NOT BUILT |
| Team scope enum (private/team/org) | NOT BUILT |
| Approval workflow | NOT BUILT |

**Verdict:** Basic capture works. The "Second Brain" vision — Slack integration, team features, RAG memory, GAS automations — is all on paper.

---

### 6. Pricing Page — 50% Built
**Spec:** Public directory pricing + toggle to Command Center callout.

| What the spec says | Codebase status |
|-------------------|-----------------|
| Directory listing tiers (Free/$45/$89) | DONE |
| Pricing page UI | DONE — full tier comparison |
| Directory ↔ Command Center toggle | NOT BUILT |
| Command Center pricing callout ("Book a call") | NOT BUILT |

**Verdict:** Small UI addition. Add a toggle at the top that switches between "Directory Listing" and "AI Command Center" views, where the Command Center view says "Sold through personalized onboarding. Book a 15-min call."

---

### 7. Loops (Lifestyle + Leagues) — 0% Built
**Spec:** Two separate engines. Lifestyle = social discovery with Fog of War. Leagues = sports management with Scoreboard OCR.

| What the spec says | Codebase status |
|-------------------|-----------------|
| Any routes, components, or database tables | ZERO |

**Verdict:** Correctly deferred. The doc itself says "This is NOT the current priority." No action needed until Directory Engine is revenue-ready.

---

## III. CONTRADICTIONS & DECISIONS NEEDED

### Pricing Conflicts
The brainstorming docs contain **three different pricing models** that contradict each other:

| Source | Pricing Model |
|--------|--------------|
| `pricing-strategy.md` | Free / Pro $45 / Premium $89 (directory) + TBD back-end |
| `home-ledger-launch.md` (Gemini PRD) | Starter $299 / Growth $499 / Scale $899 (Command Center) |
| `master-spec-2026.md` | Operator / Commander / Sovereign (prices in `docs/specs/pricing.md`) |
| `founding-members-SOT.md` | $500/mo off "base price" — but base price never defined |

**Decision needed:** Which pricing model is canonical? The `master-spec-2026.md` points to `docs/specs/pricing.md` as the source of truth, but the founding members doc references pricing that doesn't align with any of them.

### Home Ledger: Standalone Product or Bundle?
- `pricing-strategy.md` asks: "Is Home Ledger standalone ($29-49/mo) or bundle-only?"
- `master-spec-2026.md` implies it's a Command Center module
- No decision recorded

### Email 3 is Blocked
The personalized offer email (Email 3) can't be finalized until the Booking System base price is decided. The template includes "$500 off" but $500 off of what?

### "Property Passports" Name Still in Codebase
The rename to "Home Ledger" was decided in `home-ledger-launch.md` but only partially applied. At minimum these need updating:
- Sidebar nav label: "Passports" → "Home Ledger"
- Module page title
- Commander quick actions panel reference

---

## IV. RECOMMENDED BUILD ORDER

Based on CLAUDE.md priorities, revenue impact, and dependency chains:

### Phase 1 — Revenue Foundation (Unblocks everything)
1. **Founding Members DB schema** — `founding_members` table with `program_type`, `status`, `enrolled_at`, counter query
2. **Homepage founding member section** — Replace empty testimonials with "[X] of 50 spots remaining" CTA
3. **Founding member badge** — Visual badge on directory listing cards for enrolled businesses
4. **Email auto-trigger** — When a business claims a listing → start 5-email drip sequence

### Phase 2 — Automation Layer
5. **Email sequence scheduler** — Cron or Supabase pg_cron for Day 1/4/8/14/21 sends
6. **SendGrid webhooks** — Track opens, clicks, replies → update CRM tags
7. **Live Local Pulse tier-gating** — Blur overlay + waitlist CTA for non-paying users
8. **AI fallback cards** — Seasonal opportunity cards when no live signal data

### Phase 3 — Polish & Depth
9. **Home Ledger rename** — Complete the "Property Passports" → "Home Ledger" rename across all UI
10. **Pricing page toggle** — Add Directory ↔ Command Center toggle
11. **Stain/Resolution system** — Database schema + UI for property incident tracking
12. **Brain: Slack webhook** — Connect #second-brain Slack channel to `/api/brain/capture`

### Phase 4 — Future Engines (Deferred)
13. Loops: Lifestyle Engine — After Directory is revenue-ready
14. Loops: Competitive League Engine — After Lifestyle Engine

---

## V. DECISIONS RESOLVED (2026-02-27 — Jared)

| # | Question | Answer |
|---|----------|--------|
| 1 | Booking System base monthly price | **$1,500/mo** (Operator tier in `docs/specs/pricing.md`). Founding members get $500 off = **$1,000/mo for life** |
| 2 | Canonical pricing model | **`docs/specs/pricing.md` is the SOT**. Operator $1,500 / Commander $2,500 / Sovereign $3,500. Jared doesn't love the tier names — open to renaming |
| 3 | Home Ledger standalone or bundle? | **Standalone product** — separate pricing, not bundle-only |
| 4 | 50-spot founding member cap | **Total across all categories** — not per-category |
| 5 | Founding member verification | **First come, first serve** — no verification gate |
| 6 | $400 Digital Infrastructure Audit | **Pipeline is built**. Manual workflow — Jared starts it per company, saves audit, attaches to email. The email sequence should include a way for businesses to **request** the audit (value bomb to drive email engagement, not pushed unsolicited) |

### Still Open
- **Tier name alternatives** — Jared doesn't like Operator/Commander/Sovereign. Needs new names.
- **Home Ledger standalone price** — Confirmed standalone, but what's the monthly rate? (`pricing-strategy.md` suggests $29-49/mo)
- **Live Local Pulse pricing** — Standalone add-on or tier-included?

---

## VI. WHAT'S WORKING WELL

Despite the gaps, significant infrastructure exists:

- **Directory Engine** is live and functional (search, listings, categories, business detail pages)
- **Command Center UI** is fully built with 10+ spoke modules
- **Email plumbing** (SendGrid, templates, campaigns) just needs automation wired up
- **Live Local Pulse** widget is impressive and functional for the creator tier
- **QR code system** is self-hosted and working (`/api/qr`, `/scan/[type]/[id]`, `/claim/[code]`)
- **Brain capture** (4-bin AI classification) works end-to-end
- **Home Ledger landing page** is built and well-designed
- **Blast deals** infrastructure is complete (create, claim, QR, outblast)

The brainstorming docs are unusually well-written and specific. Most specs are implementation-ready — they just haven't been built yet.

---

*Generated by Claude Code — 2026-02-27*
*Based on review of all 7 documents in `docs/brainstorming/`*
