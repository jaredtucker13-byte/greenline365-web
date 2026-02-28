# GL365 Progress Report — Brainstorming vs. Reality
**Date:** February 25, 2026
**Author:** Automated Audit (Claude)
**Scope:** Cross-reference all 6 brainstorming documents against the live codebase
**Branch:** `claude/review-brainstorming-notes-Y5Xhc`

---

## EXECUTIVE SUMMARY

GreenLine365 is approximately **65-70% complete for MVP launch**. The directory-first strategy is live and functional. The Command Center (admin-v2) has 28 working modules. The major gaps are in **automation layers** (email drip triggers, sequence scheduling), the **Founding Member program** (zero database support), and the **/home-ledger landing page** (currently 404).

| System | Completion | Verdict |
|--------|-----------|---------|
| Directory Listing (Public) | 90% | Live and functional |
| Pricing & Stripe | 95% | Working — $0/$45/$89 tiers |
| Command Center (Admin-v2) | 85% | 28 modules, founder-ready |
| Email Infrastructure | 75% | SendGrid + Gmail working |
| Email Drip Automation | 25% | Templates exist, no automation |
| Home Ledger / Property Passport | 60% | Core system built, landing page missing |
| Live Local Pulse | 55% | Widget works, tier gating missing |
| Brain / Second Brain | 40% | 4-bin capture works, advanced layers missing |
| Founding Member Program | 0% | Zero database or UI support |
| Booking System | 65% | Retell + Cal.com wired, no public flow |
| White-Label | 50% | DB migrations done, no UI |
| Growth Vault / Feedback Loop | 0% | Brainstorming only |

---

## SYSTEM-BY-SYSTEM BREAKDOWN

---

### 1. DIRECTORY LISTING SYSTEM

**Brainstorming Docs:** `pricing-strategy.md`, `founding-members-SOT.md`
**Status: 90% COMPLETE**

#### What's Built and Working

| Feature | Status | Key Files |
|---------|--------|-----------|
| Public directory browse/search | DONE | `webapp/app/directory/DirectoryClient.tsx` |
| Individual listing pages | DONE | `webapp/app/directory/[slug]/` |
| 3-tier pricing (Free/$45/$89) | DONE | `webapp/app/pricing/page.tsx` |
| Feature gates by tier | DONE | `webapp/lib/feature-gates.ts` |
| Photo gating per tier | DONE | `webapp/app/api/directory/route.ts` (`applyPhotoGating()`) |
| Stripe checkout integration | DONE | `webapp/app/api/stripe/checkout/route.ts` |
| Stripe webhook handling | DONE | `webapp/app/api/stripe/webhook/route.ts` |
| Business registration flow | DONE | `webapp/app/register-business/page.tsx` |
| Business portal (listing mgmt) | DONE | `webapp/app/portal/listing/` |
| Portal upgrade flow | DONE | `webapp/app/portal/upgrade/` |
| Listing claim system | DONE | `webapp/app/api/directory/claim/route.ts` |
| Badge earning system | DONE | `directory_badges` table, earned via feedback |
| Marketplace add-ons | DONE | `webapp/app/api/directory/addons/route.ts` |
| Reviews & feedback | DONE | `directory_feedback` table, sentiment analysis |
| Listing stats/analytics | DONE | `webapp/app/api/directory/stats/` |
| Geocoding | DONE | `webapp/app/api/directory/geocode/` |
| Directory scraping (admin) | DONE | `webapp/app/api/directory/scrape/` |
| Entitlements API | DONE | `webapp/app/api/directory/entitlements/` |

#### What's Missing from Brainstorming Docs

| Feature | Gap | Priority |
|---------|-----|----------|
| Founding Member badge on listings | No `is_founding_member` column or badge type | HIGH |
| "X of 50 remaining" counter on homepage | Not implemented anywhere | HIGH |
| Founding member locked-in pricing | No price-freeze mechanism in DB | HIGH |
| Homepage founding member section | DirectoryClient.tsx has no special banner | MEDIUM |
| System B pricing toggle on `/pricing` page | Only directory tiers shown | LOW (sell via email) |
| Tier name mismatch in DB schema comment | Schema says "growth/authority/dominator", code uses "free/pro/premium" | LOW (cosmetic) |

#### Actionable Steps — Directory
1. **Add founding member schema** — Create migration adding `is_founding_member BOOLEAN DEFAULT false`, `founding_member_at TIMESTAMPTZ`, `founding_member_price_locked NUMERIC` to `directory_listings`
2. **Add founding member badge type** — Insert `founding_member` into `directory_badges` badge_type options
3. **Add 50-spot counter** — Create a DB function that counts `is_founding_member = true` and caps at 50
4. **Homepage banner** — Add "Founding Member" section to `DirectoryClient.tsx` showing remaining spots
5. **Clean up schema comments** — Update tier names in migration 019 comment to match actual code values

---

### 2. EMAIL OUTREACH & DRIP SEQUENCE

**Brainstorming Doc:** `email-outreach-sequence.md`
**Status: 25% AUTOMATED (infrastructure exists, no automation)**

#### What's Built and Working

| Feature | Status | Key Files |
|---------|--------|-----------|
| SendGrid email sending | DONE | `webapp/lib/email/sendgrid-sender.ts` |
| Gmail SMTP fallback | DONE | `webapp/lib/email/gmail-sender.ts` |
| Email templates DB table | DONE | Migration `009_email_system.sql` |
| Template management API | DONE | `/api/email/templates/` |
| Campaign CRUD | DONE | `/api/campaigns/` + `/api/campaigns/[id]/` |
| Campaign send endpoint | DONE | `/api/campaigns/[id]/send/route.ts` |
| Sequence schema support | DONE | `custom_recipients.sequence` in `email_campaigns` JSONB |
| Campaign contacts management | DONE | `/api/campaigns/[id]/contacts/` |
| Contact import from directory | DONE | `action: import_from_directory` |
| Kanban pipeline UI | DONE | `webapp/app/admin-v2/campaigns/page.tsx` |
| Email Command Center UI | DONE | `webapp/app/admin-v2/email/page.tsx` |
| Pre-built outreach templates | DONE | Hardcoded: initial_outreach, value_bomb, demo_invite, follow_up |

#### What's Missing (The Automation Layer)

| Feature | Gap | Priority |
|---------|-----|----------|
| Auto-trigger on listing claim | No webhook fires when `is_claimed = true` | CRITICAL |
| Timed sequence sends | `delay_days` field exists but no cron/scheduler honors it | CRITICAL |
| Reply detection & skip logic | Inbound email endpoint exists but doesn't parse replies | HIGH |
| SendGrid event webhooks | `email_sends` has `opened_at/clicked_at/bounced_at` but never populated | HIGH |
| Local Pulse data in emails | No dynamic market data injected into templates | MEDIUM |
| A/B testing infrastructure | No split logic or variant tracking | MEDIUM |
| Founding member offer in Email 3 | No eligibility check or scarcity counter | MEDIUM |
| Personalized industry content | Templates are generic, not tailored per industry/location | LOW |

#### Actionable Steps — Email Outreach
1. **Build claim trigger** — Add Supabase database trigger or webhook on `directory_listings` when `is_claimed` changes to `true`. Enqueue Email 1 for +24 hours
2. **Build sequence scheduler** — Create a cron job (n8n workflow or Vercel cron) that:
   - Checks `email_campaigns` for sequences with pending steps
   - Respects `delay_days` between steps
   - Skips contacts in `replied` or `claimed` pipeline stages
3. **Wire SendGrid webhooks** — Register webhook URL at SendGrid dashboard pointing to a new `/api/email/webhook` endpoint. Parse event types (open, click, bounce, spam) and update `email_sends` table
4. **Build reply detection** — In the existing `/api/email/inbound` endpoint, parse `In-Reply-To` headers to match replies back to original sends. Auto-move contact to `replied` pipeline stage and pause their sequence
5. **Integrate Local Pulse into Email 1** — At send time, query `local_trends` table for the business's ZIP code and inject a "snapshot" into the email body
6. **Add founding member eligibility check** — Before sending Email 3 ("The Personalized Offer"), query founding member count. If < 50, include the offer; otherwise, use alternate CTA

---

### 3. GL365 HOME LEDGER (Property Passport)

**Brainstorming Doc:** `home-ledger-launch.md`
**Status: 60% COMPLETE (core engine built, landing page + naming + advanced features missing)**

#### What's Built and Working

| Feature | Status | Key Files |
|---------|--------|-----------|
| Property Passport module UI | DONE | `webapp/app/admin-v2/property-passport/page.tsx` |
| Properties DB table | DONE | Migration `015b_properties_table.sql` |
| Contacts DB with CRS scoring | DONE | Migration `015c_contacts_table.sql` |
| Assets DB (polymorphic JSONB) | DONE | Migration `015d_assets_table.sql` |
| Property interactions tracking | DONE | Migration `018_performance_optimizations.sql` |
| Health score calculation | DONE | Dynamic score based on asset age/confidence |
| Properties API (CRUD) | DONE | `webapp/app/api/properties/route.ts` |
| Filing Cabinet module | DONE | `webapp/app/admin-v2/filing-cabinet/page.tsx` |
| Filing Cabinet DB (AES-256) | DONE | Migration `016_rbac_filing_cabinet_audit.sql` |
| Incidents module | DONE | `webapp/app/admin-v2/incidents/page.tsx` (37KB) |
| Incident image AI analysis | DONE | `/api/incidents/analyze/` |
| Digital signature collection | DONE | `/api/incidents/sign/[token]/` |
| PDF report generation | DONE | `/api/incidents/generate-pdf/` |
| Referral Network module | DONE | `webapp/app/admin-v2/referral-network/page.tsx` |
| Contractor directory + ratings | DONE | Migration `017_referral_network_ratings.sql` |
| Commander dashboard | DONE | `webapp/app/admin-v2/commander/page.tsx` |

#### What's Missing

| Feature | Gap | Priority |
|---------|-----|----------|
| `/home-ledger` landing page | Currently 404 — completely unbuilt | CRITICAL |
| UI rename: "Property Passport" → "Home Ledger" | Sidebar + page titles still say old name | HIGH |
| Stain/Resolution system ("Carfax for Homes") | No schema or code at all | HIGH |
| Incidents not linked to properties | Missing `property_id` foreign key on incidents | HIGH |
| Fraud-proof verification (EXIF/GPS) | Not implemented | MEDIUM |
| Before/after screenshot handshake | Not implemented | MEDIUM |
| Empty state improvements (per spec) | Current empty states are generic | LOW |
| Target niche landing variants | No property manager / investor / contractor specific pages | LOW |

#### Actionable Steps — Home Ledger
1. **Build `/home-ledger` landing page** — Create `webapp/app/home-ledger/page.tsx` with:
   - Hero: "Meet the GL365 Home Ledger"
   - 3-column "Who It's For" (Homeowners, Property Managers, Investors)
   - Feature walkthrough (Property Passport, Filing Cabinet, Incidents, Referral Network)
   - Trust bar (AES-256, no contracts, cancel anytime)
   - CTA: "Create Your First Property — Free"
   - Email capture for waitlist
2. **Rename Property Passport throughout UI** — Update sidebar nav label, page title, subtitle, and empty states from "Property Passports" to "GL365 Home Ledger"
3. **Link incidents to properties** — Add `property_id UUID REFERENCES properties(id)` to incidents table via new migration
4. **Design stain/resolution schema** — Create migration with:
   - `property_stains` table: property_id, stain_type (water_damage, pest, code_violation, insurance_claim, etc.), detected_at, severity, description, photos
   - `stain_resolutions` table: stain_id, contractor_id (from referral_network), cost, completed_at, resolution_notes, before_photos, after_photos, verified
5. **Implement EXIF extraction** — Use `sharp` (already installed) to extract EXIF/GPS metadata from uploaded incident photos for fraud verification

---

### 4. SECOND BRAIN ECOSYSTEM

**Brainstorming Doc:** Appended to `home-ledger-launch.md`
**Status: 40% COMPLETE (Layer 1-2 built, Layers 3-4 and automation missing)**

#### What's Built

| Feature | Status | Key Files |
|---------|--------|-----------|
| BrainWidget (4-bin UI) | DONE | `webapp/app/admin-v2/components/BrainWidget.tsx` |
| Brain capture API (AI router) | DONE | `webapp/app/api/brain/capture/route.ts` |
| People bucket API | DONE | `/api/brain/people/` |
| Projects bucket API | DONE | `/api/brain/projects/` |
| Ideas bucket API | DONE | `/api/brain/ideas/` |
| Admin bucket API | DONE | `/api/brain/admin/` |
| Weekly recap API | DONE | `/api/brain/weekly-recap/` |
| Brain DB schema (4 tables) | DONE | Migration `009_brain_system.sql` |
| Claude Opus 4.6 classification | DONE | Smart router in capture endpoint |
| Slack channel created | DONE | `#second-brain` channel exists |

#### What's Missing

| Feature | Gap | Priority |
|---------|-----|----------|
| Slack → Brain webhook pipeline | Bot exists but no event routing | HIGH |
| Memory Layers 3-4 (RAG, Journal) | Only buffer + core implemented | MEDIUM |
| Evolved status states (triage → resolved) | Currently simple boolean completed | MEDIUM |
| Google Apps Script integrations | Calendar sync, weekly digest, Forms pipeline | LOW |
| Team features (scope: private/team/org) | Single-user only | LOW |

#### Actionable Steps — Second Brain
1. **Upgrade to Slack paid plan** — Required for webhook automations and workflows
2. **Wire Slack events** — Create `/api/brain/slack-webhook` endpoint that receives Slack messages from `#second-brain` and forwards to the capture API
3. **Add status enum** — Migrate `brain_*` tables to use `status TEXT DEFAULT 'active'` with values: `triage`, `pending_approval`, `active`, `pipeline`, `resolved` instead of simple boolean
4. **Implement weekly recap cron** — Schedule the existing `/api/brain/weekly-recap` endpoint to run every Sunday via n8n or Vercel cron

---

### 5. LIVE LOCAL PULSE

**Brainstorming Doc:** `live-local-pulse-spec.md`
**Status: 55% COMPLETE (widget works for admin, missing tier gating + AI fallbacks)**

#### What's Built

| Feature | Status | Key Files |
|---------|--------|-----------|
| LiveLocalPulse widget | DONE | `webapp/app/admin-v2/components/LiveLocalPulse.tsx` |
| LocalPulse trend display | DONE | `webapp/app/admin-v2/components/LocalPulse.tsx` |
| Trend receive API | DONE | `/api/receive-trends/route.ts` |
| Daily Trend Hunter API | DONE | `/api/daily-trend-hunter/route.ts` |
| N8N trend hunter workflow | DONE (inactive) | `n8n-workflows/GL365_daily_trend_hunter.json` |
| local_trends DB table | DONE | Migration `005_daily_trend_hunter_tables.sql` |
| "Forge It" content bridge | DONE | Trend → Content Forge integration |

#### What's Missing

| Feature | Gap | Priority |
|---------|-----|----------|
| Three-tier behavior gating | Same widget shows to all users | HIGH |
| AI-generated fallback cards | Shows sleeping emoji instead of seasonal cards | HIGH |
| Pre-loaded seasonal library (Tampa Bay) | No fallback content DB | MEDIUM |
| ZIP code personalization | Component doesn't pass user ZIP | MEDIUM |
| 3-hour scan timer | Shows static text, not real countdown | LOW |
| N8N workflow activation | Currently `"active": false` | HIGH |

#### Actionable Steps — Local Pulse
1. **Activate n8n workflow** — Set `"active": true` in GL365_daily_trend_hunter.json and deploy to n8n instance. Verify Perplexity Sonar API key is configured
2. **Add tier gating** — Wrap `LiveLocalPulse` with the existing `FeatureGate` component. Free users see blurred preview + "Upgrade to unlock Local Pulse" CTA. Paid users get full access
3. **Build seasonal fallback engine** — Create `local_pulse_fallbacks` table with columns: `month`, `zip_code`, `industry`, `title`, `description`, `suggested_action`. Seed with Tampa Bay (33619) content for each month
4. **Pass user ZIP** — When fetching trends, pass the authenticated user's business ZIP from their profile. Default to 33619 for creator/admin
5. **Fix countdown timer** — Calculate next scan time (every 3 hours from midnight) and display a real countdown

---

### 6. FOUNDING MEMBERS PROGRAM

**Brainstorming Doc:** `founding-members-SOT.md`
**Status: 0% COMPLETE — Entire program exists only in docs**

#### What's Defined in Docs

Two separate programs:
1. **Booking System Founding Members** (30 spots) — $500 off setup + $500/mo for life + beta access + 25% off future features
2. **Directory Listing Founding Members** (50 spots) — Featured placement + priority support + locked-in early pricing

#### What Exists in Code

**Nothing.** Zero database columns, zero UI, zero API support.

#### Actionable Steps — Founding Members
1. **Create founding member migration** — New migration adding:
   - `directory_listings`: `is_founding_member`, `founding_member_at`, `founding_member_locked_price`
   - New table `founding_members_booking`: `user_id`, `enrolled_at`, `setup_discount`, `monthly_price`, `is_active`
   - Trigger function to enforce 50 directory + 30 booking caps
2. **Build founding member enrollment API** — `/api/founding-members/enroll` with validation for remaining spots
3. **Add homepage counter widget** — "X of 50 spots remaining" in DirectoryClient.tsx
4. **Create founding member badge** — Add `founding_member` badge type, auto-assign on enrollment
5. **Wire into Email 3** — The "Personalized Offer" email template should check founding member availability before including the offer

---

### 7. MASTER ECOSYSTEM — OTHER VERTICALS

**Brainstorming Doc:** `master-spec-2026.md`
**Status: Varies widely by vertical**

#### Booking System (65%)
| Built | Missing |
|-------|---------|
| Retell AI voice integration | No public-facing booking widget |
| Cal.com calendar bridge | No Google/Outlook calendar sync UI |
| call_logs + call_audits DB | No booking management page for businesses |
| Weather-aware context | Smart conflict detection not exposed in UI |
| Flexible booking migrations | No self-serve booking setup flow |

**Actionable:** Build public booking widget component and embed in Premium directory listings. Create `/portal/bookings` for businesses to manage their calendar.

#### Campaigns Module (70%)
| Built | Missing |
|-------|---------|
| Campaign CRUD + UI | Omnichannel (SMS campaigns limited) |
| Kanban pipeline view | Auto-sequence progression |
| 5 sequence types defined | A/B testing |
| Email templates system | Campaign analytics dashboard |
| Contact pipeline tracking | Cross-channel attribution |

**Actionable:** Priority is the sequence scheduler (see Email section). SMS campaign support exists via Twilio but isn't wired into the campaign UI.

#### White-Label System (50%)
| Built | Missing |
|-------|---------|
| Multi-tenant DB architecture | White-label branding customization UI |
| `tenant_id` isolation in queries | Custom domain support |
| BusinessContext/Switcher components | Client-facing white-label portal |
| Access codes system | White-label pricing/billing |

**Actionable:** Low priority per brainstorming docs. Infrastructure is ready when needed.

#### Growth Vault / Private Feedback Loop (0%)
- **Spec says:** Two streams — public review + private coaching feedback, private sentiment analysis
- **Reality:** Directory has review system but no private coaching feedback
- No `growth_vault` table, no private feedback UI, no technician sentiment tracking

**Actionable:** Design schema and UI. Lower priority — focus on founding members and automation first.

#### Technician Performance Radar (0%)
- **Spec says:** 5-axis radar chart (Scan Volume, Private Feedback Score, Stain Count, PTO Reliability, VIP Interaction)
- **Reality:** No radar visualization, no technician-level performance tracking

**Actionable:** Requires Growth Vault and Stain/Resolution system first. Phase 3+ item.

#### Giving Back Bank / Community Vault (0%)
- **Spec says:** Automated vault tracking donations ($3/subscriber + 15% of QR fees)
- **Reality:** Not implemented

**Actionable:** Nice-to-have. Build after core revenue systems are working.

---

## FEATURES MISSING FROM THE LIVE DIRECTORY

Per the user's request, here are all features that need to be added to the live directory:

### Critical (Block Revenue)
1. **Founding Member badge + counter** — No way to enroll founding members or show scarcity
2. **Founding Member locked pricing** — No price-freeze mechanism
3. **Auto-trigger email on listing claim** — When a business claims their listing, nothing happens automatically

### High Priority (Enhance Value)
4. **SendGrid event tracking** — Opens/clicks/bounces not being recorded
5. **Reply detection in drip** — Can't auto-stop sequences when businesses reply
6. **Tier gating on Local Pulse** — Free users see the same widget as paid users
7. **AI fallback opportunity cards** — When no live signal data, show AI-generated seasonal suggestions

### Medium Priority (Polish)
8. **Directory listing photo carousel** — Premium listings should auto-sync Google Business photos
9. **Listing analytics dashboard** — Premium feature showing views/clicks/calls
10. **Marketplace add-on purchase flow** — Add-on endpoints exist but no purchase UI in portal
11. **QR Feedback Kit integration** — Listed as $39/mo add-on but no QR code generation
12. **Badge visibility enhancement** — Badges appear grayed for free tier but could show "unlock by upgrading" tooltips

### Lower Priority (Future)
13. **Industry-specific landing pages** — Routes exist (`/industries/restaurants/`) but need content
14. **Booking widget embed** — Premium listings should show "Book Now" powered by Retell
15. **Review response AI** — Premium feature mentioned in pricing but not wired to listings

---

## PRIORITIZED ACTION PLAN

### Phase 1: Revenue Blockers (This Week)
- [ ] Create founding member DB migration (schema + caps)
- [ ] Build founding member enrollment API
- [ ] Add founding member counter to homepage
- [ ] Build `/home-ledger` landing page
- [ ] Activate n8n Daily Trend Hunter workflow

### Phase 2: Automation Engine (Next Week)
- [ ] Build listing claim → Email 1 trigger
- [ ] Build sequence scheduler (cron for timed sends)
- [ ] Wire SendGrid event webhooks
- [ ] Build reply detection in `/api/email/inbound`

### Phase 3: Polish & Gating (Week 3)
- [ ] Rename "Property Passport" → "GL365 Home Ledger" across UI
- [ ] Add FeatureGate to Live Local Pulse widget
- [ ] Build seasonal fallback card system
- [ ] Link incidents to properties (add `property_id`)
- [ ] Wire Slack → Brain capture webhook

### Phase 4: Advanced Features (Week 4+)
- [ ] Design and implement Stain/Resolution system
- [ ] Build EXIF/GPS fraud verification
- [ ] Add Brain status evolution (triage → resolved)
- [ ] Build public booking widget for Premium listings
- [ ] Create `/portal/bookings` for business calendar management

### Phase 5: Ecosystem (Month 2+)
- [ ] Growth Vault / Private Feedback Loop
- [ ] Technician Performance Radar
- [ ] Google Apps Script integrations
- [ ] White-label branding UI
- [ ] Giving Back Bank / Community Vault

---

## APPENDIX: TECH STACK REFERENCE

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 16.0.10 |
| Runtime | React | 19.2.1 |
| Language | TypeScript | 5 |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | SSR 0.8.0 |
| Payments | Stripe | 20.3.1 |
| Email | SendGrid + Nodemailer | 8.1.6 / 7.0.12 |
| SMS | Twilio | 5.11.2 |
| Voice AI | Retell SDK | 4.66.0 |
| Calendar | Cal.com + FullCalendar | 6.1.20 |
| AI/LLM | OpenRouter (Claude Opus 4.6) | — |
| Animation | GSAP + Framer Motion | 3.14.2 / 12.24.8 |
| Analytics | PostHog | 1.313.0 |
| Testing | Playwright | 1.57.0 |
| Deployment | Vercel | — |
| CDN/Security | Cloudflare | Free tier |
| Design | Glassmorphism + Tailwind | 3.4.19 |

---

*Report generated from automated codebase audit. All file paths verified against live repository.*
