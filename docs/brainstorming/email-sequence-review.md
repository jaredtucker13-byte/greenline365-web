# GreenLine365 — Email Sequence Master Map

Status: Brainstorming | Internal Only
Created: 2026-02-27
Author: Jared Tucker + Claude review
Context: Pre-launch. Zero customers. Zero social proof. Two senders (SendGrid + Gmail SMTP).

---

## THE PROBLEM THIS DOC SOLVES

GL365 doesn't have one email sequence — it has many. They serve different audiences, fire from different triggers, and have completely different goals. This doc maps ALL of them so nothing gets confused, duplicated, or forgotten.

---

## SEQUENCE MAP — EVERY EMAIL FLOW GL365 NEEDS

```
┌─────────────────────────────────────────────────────────┐
│                    COLD (YOU → THEM)                     │
│                                                         │
│  SEQ A: Claim Your Listing Outreach                     │
│  Trigger: You find a business to add to directory       │
│  Goal: Get them to claim their listing                  │
│  Status: BUILT (campaigns/send route + templates)       │
│                                                         │
│  SEQ B: Cold Outreach to Booking System                 │
│  Trigger: You manually identify a prospect              │
│  Goal: Book a 15-min founding member call               │
│  Status: DRAFTED (email-outreach-sequence.md)           │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  WARM (THEY ACTED → AUTO)                │
│                                                         │
│  SEQ C: Post-Claim Welcome Sequence ← NEEDS WORK       │
│  Trigger: Business claims their listing                 │
│  Goal: Activate them, get them using the listing        │
│  Status: NOT STARTED                                    │
│                                                         │
│  SEQ D: Post-Claim → Founding Member Nurture            │
│  Trigger: Follows Seq C after activation                │
│  Goal: Warm them toward booking system offer            │
│  Status: DRAFTED (email-outreach-sequence.md emails 1-5)│
│                                                         │
│  SEQ E: Waitlist / Newsletter Verification              │
│  Trigger: Someone joins waitlist or newsletter          │
│  Goal: Verify email, confirm subscription               │
│  Status: BUILT (verify-email + sendgrid-sender)         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                 TRANSACTIONAL (SYSTEM → THEM)            │
│                                                         │
│  SEQ F: Email Verification (code-based)                 │
│  Trigger: Signup / form submission                      │
│  Goal: Verify the email is real                         │
│  Status: BUILT (gmail-sender + sendgrid-sender)         │
│                                                         │
│  SEQ G: Access Code Invite                              │
│  Trigger: Admin sends invite from dashboard             │
│  Goal: Get them to create account with code             │
│  Status: BUILT (admin/send-invite route)                │
│                                                         │
│  SEQ H: Booking Confirmations & Reminders               │
│  Trigger: Appointment booked through widget             │
│  Goal: Confirm booking, reduce no-shows                 │
│  Status: NOT STARTED                                    │
│                                                         │
│  SEQ I: Blast Deal Notifications                        │
│  Trigger: Business publishes a deal                     │
│  Goal: Notify subscribed consumers                      │
│  Status: BUILT (blast-deals/outblast route)             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│               FUTURE (NOT BUILT, NOT URGENT)            │
│                                                         │
│  SEQ J: Review Request Sequence                         │
│  Trigger: Consumer visits a listing / completes booking │
│  Goal: Get them to leave a review                       │
│                                                         │
│  SEQ K: Subscription Lifecycle (Upgrade/Downgrade)      │
│  Trigger: Stripe events (trial ending, payment failed)  │
│  Goal: Retain paid subscribers, recover failed payments  │
│                                                         │
│  SEQ L: Re-engagement (Dormant Listings)                │
│  Trigger: Business hasn't logged in for 30+ days        │
│  Goal: Bring them back, show what they're missing       │
│                                                         │
│  SEQ M: Referral / Ambassador Program                   │
│  Trigger: Business hits milestone (first review, etc.)  │
│  Goal: Get them to refer other businesses               │
│                                                         │
│  SEQ N: Consumer Welcome Sequence                       │
│  Trigger: Consumer creates account                      │
│  Goal: Get them using directory, leaving reviews        │
│                                                         │
│  SEQ O: Weekly/Monthly Digest                           │
│  Trigger: Cron (weekly)                                 │
│  Goal: Keep businesses engaged with platform stats      │
│  Status: PARTIALLY BUILT (brain/weekly-recap route)     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## WHAT'S ALREADY BUILT (CODE EXISTS)

### SEQ A: Claim Your Listing Outreach
**File:** `webapp/app/api/campaigns/[id]/send/route.ts`
**Sender:** Gmail SMTP (`lib/email/gmail-sender.ts`)
**Templates built:**
1. `initial_outreach` — "Your business is live on GreenLine365. Claim it to update your information."
2. `value_bomb` — "We ran a free audit for [Business Name]" + after-hours Google Maps screenshot
3. `demo_invite` — "Try our AI receptionist — live right now" + phone number
4. Generic follow-up — "Just checking in about [Business Name]'s listing"

**What this sequence IS:** You (Jared) reach out to businesses that are already in the directory (pre-populated) but haven't claimed their listing. The framing is: "We built this community resource. Your business is already listed. Come confirm your info is correct."

**What this sequence is NOT:** It's NOT the post-claim nurture. It's NOT the founding member pitch. It ends when they claim.

### SEQ E: Waitlist / Newsletter Verification
**File:** `webapp/app/api/waitlist/route.ts` + `webapp/app/api/verify-email/route.ts`
**Sender:** SendGrid (waitlist) / Gmail (verify-email)
**Status:** Functional. Sends 6-digit code or magic link.

### SEQ F: Email Verification
**File:** `webapp/lib/email/sendgrid-sender.ts` + `webapp/lib/email/gmail-sender.ts`
**Status:** Both work. Two parallel systems (see SendGrid audit section below).

### SEQ G: Access Code Invite
**File:** `webapp/app/api/admin/send-invite/route.ts`
**Sender:** SendGrid (direct fetch)
**Status:** Functional. Generates code + sends branded invite email.

### SEQ I: Blast Deal Notifications
**File:** `webapp/app/api/blast-deals/outblast/route.ts`
**Sender:** SendGrid (direct fetch)
**Status:** Functional.

---

## WHAT NEEDS BRAINSTORMING NOW

### SEQ C: Post-Claim Welcome Sequence (PRIORITY)

This is the gap the user identified. When a business CLAIMS their listing, what happens next?

**Trigger:** Business completes the claim flow (verified ownership)
**Audience:** Engaged business owner who just took action — warmest lead you'll get
**Goal:** Get them to ACTIVATE — complete their profile, add photos, see value immediately

**Why this matters:** The claim is the most important conversion event in the entire funnel. If you don't capitalize on it within 48 hours, the business owner moves on and forgets about you. This sequence is about activation, not selling.

**Recommended sequence (no social proof needed):**

#### Email C1: Instant Confirmation (Day 0, within 60 seconds)
```
Subject: You're in — [Business Name] is claimed

Hey [First Name],

Done. [Business Name] is officially yours on GreenLine365.

Here's your listing: [DIRECT LINK]

Three quick things you can do right now:
1. Add your best photo (listings with photos get 3x more views)
2. Update your hours (we pulled what we could, but you know best)
3. Add a description in your own words

If anything looks off, just reply to this email. I'll fix it personally.

— Jared
```

**Why it works pre-launch:**
- Delivers immediate value (their listing, their link)
- Specific CTAs that are easy to do right now
- "3x more views" is a general directory stat, not a GL365 claim — honest
- Reply-to opens conversation
- No upsell, no pitch, no "join 10,000 businesses"

#### Email C2: Profile Completion Nudge (Day 2)

Only send if they HAVEN'T completed their profile (photos, hours, description).

```
Subject: Quick tip for [Business Name]

Hey [First Name],

Just a heads up — your listing is live but it's missing [photos / hours / a description].

Listings with complete profiles show up higher in search results and
get significantly more clicks. Takes about 5 minutes.

→ Update your listing: [LINK TO THEIR PORTAL/EDIT PAGE]

If you want, send me a few photos by replying to this email and I'll
upload them for you. Happy to do it.

— Jared
```

**Skip this email if:** They already uploaded photos + set hours + wrote a description. Don't nag people who already did the thing.

#### Email C3: First Value Delivery (Day 5)

```
Subject: Something useful for [Business Name]

Hey [First Name],

I pulled together a quick snapshot of what's happening in [their
industry] around [their ZIP / area] this week.

[ONE SPECIFIC, USEFUL INSIGHT — same tiered approach:]
- Tier 1: Real Local Pulse data if available
- Tier 2: Seasonal industry trend (researched, true)
- Tier 3: One specific observation about their online presence

No ask here. Just thought it might be useful.

— Jared
```

**This is the bridge email.** After this, the business owner has:
1. A live listing (C1)
2. A complete profile (C2)
3. Received genuine value with zero ask (C3)

They're now warm enough for Sequence D (the founding member nurture) to begin.

#### Email C4: Founding Member Tease (Day 8)

This is where Seq C hands off to Seq D. See `email-outreach-sequence.md` for the full nurture flow.

```
Subject: I'm building something for businesses like [Business Name]

Hey [First Name],

Since you claimed your listing, I wanted to give you a heads-up on
something I'm putting together for a small group of businesses in
the Tampa Bay area.

Not ready to share the details yet — still finalizing it. But you're
on my short list of people I want to tell first.

I'll follow up in a few days with more.

— Jared
```

**Why tease instead of pitch:** They just claimed a free listing. Going from "free directory listing" to "buy my booking system" in 8 days is too fast. The tease creates anticipation without asking for anything.

---

### SEQ A REVIEW: Claim Your Listing (Cold Outreach)

This is the "come claim your free listing" email. It's already built in the campaigns route. Here's what's good and what needs work:

**What's good:**
- The `initial_outreach` template frames it as a community resource, not a sales email
- "Claim it to update your information" is the right CTA — it's about accuracy, not buying
- Unsubscribe link included
- Plain, professional design

**What needs work:**

1. **The subject line is missing personality.** Currently implied as just "GreenLine365" or similar. Better options:
   - "Is this info correct for [Business Name]?"
   - "[Business Name] is on the map — just need you to confirm"
   - "Quick question about [Business Name]"

2. **The body should feel like a request for help, not a notification.** The current template says "has been added to GreenLine365 — Florida's premium verified business directory." That sounds like marketing. Better:
   - "We're building a community business directory for the Tampa Bay area, and [Business Name] is one of the businesses we've included."
   - "We want to make sure we got your information right. Can you take a quick look?"

3. **The CTA "View Your Listing" is good.** Keep it. When they click, they see their own business — that's compelling.

4. **No follow-up sequence in the campaigns route.** The `value_bomb` and `demo_invite` templates exist but they're part of a DIFFERENT pitch (the booking system audit angle). For Seq A, the follow-up should stay focused on claiming:
   - Follow-up 1 (Day 5): "Just checking — did you get a chance to look at your listing?"
   - Follow-up 2 (Day 12): "Last note about [Business Name] on GreenLine365" (graceful exit)

---

### SEQ B vs SEQ D: CLARIFYING THE CONFUSION

The `email-outreach-sequence.md` doc currently mixes two things:
- **Seq B (Cold booking system outreach):** You manually reach out to a prospect you've identified, pitching the booking system directly. No prior relationship.
- **Seq D (Post-claim nurture to founding member):** A business already claimed their listing. You've built trust through Seq C. Now you warm them toward the booking system.

**These should be separate sequences because:**
- Seq B is cold. Seq D is warm.
- Seq B needs to establish credibility from scratch. Seq D can reference their existing listing.
- Seq B has lower conversion rates (1-3%). Seq D should convert higher (5-10%+) because trust is already built.
- Seq B might come from a different sender identity or tone than Seq D.

**The current email-outreach-sequence.md is really Seq D** (it assumes they've already claimed a listing). That's fine — just label it correctly and don't try to use the same emails for cold outreach to strangers.

---

## THE NO SOCIAL PROOF PLAYBOOK

Applies to ALL sequences. Pre-launch rules:

### What you CAN say (honest):
- "We're building a community business directory for Tampa Bay"
- "Your business is one of [X] listed in the [category] section"
- "The directory covers [X] ZIP codes across [region]"
- "I'm building this because [genuine reason]"
- "Listings with complete profiles perform better in local search" (generally true across all directories)

### What you CANNOT say (no proof yet):
- Any specific conversion or performance numbers about GL365
- "Businesses trust us" / "Join hundreds of businesses"
- Testimonials or case studies (you have none)
- ROI claims specific to your platform
- "Our AI has helped businesses increase..."

### What REPLACES social proof:
1. **Specificity** — The more specific your emails are to THEIR business, the more credible you seem
2. **Founder transparency** — "I'm Jared, I'm building this in Tampa" > "Our team of experts"
3. **The directory itself IS the proof** — When they click "View Your Listing" and see their business on a real, professional-looking platform, that's worth more than any testimonial
4. **Helping without asking** — Every email that delivers value with zero ask builds credibility
5. **Founding class scarcity** — "Be the first" is honest and compelling when you actually ARE early

---

## SENDGRID SETUP STATUS

From the codebase audit:

| What | Where | Status |
|------|-------|--------|
| `@sendgrid/mail` package | package.json | Installed (v8.1.6) |
| SendGrid sender module | `lib/email/sendgrid-sender.ts` | Built, needs `SENDGRID_API_KEY` |
| Gmail sender module | `lib/email/gmail-sender.ts` | Built, needs `GMAIL_APP_PASSWORD` |
| Waitlist emails | `/api/waitlist` | Uses SendGrid sender |
| CRM verification resend | `/api/crm/resend-verification` | Uses SendGrid sender |
| Verification emails | `/api/verify-email` | Uses Gmail sender |
| Campaign sends (Seq A) | `/api/campaigns/[id]/send` | Uses Gmail sender |
| Admin invites (Seq G) | `/api/admin/send-invite` | Uses SendGrid (direct fetch) |
| Blast deals (Seq I) | `/api/blast-deals/outblast` | Uses SendGrid (direct fetch) |
| Health check | `/api/health` | Checks for `SENDGRID_API_KEY` |

**Inconsistency note:** Some routes use the `sendgrid-sender.ts` module (uses `@sendgrid/mail` npm package), others call the SendGrid API directly via `fetch`. Both work, but it's two patterns for the same thing. Not broken, but worth unifying eventually.

**To make everything work, set in Vercel env vars:**
- `SENDGRID_API_KEY` — from SendGrid dashboard
- `SENDGRID_FROM_EMAIL` — the verified sender address
- `GMAIL_USER` — greenline365help@gmail.com
- `GMAIL_APP_PASSWORD` — 16-char app password from Google

**Before sending outreach emails, also need:**
- [ ] SPF record on greenline365.com (authorizes SendGrid)
- [ ] DKIM record (from SendGrid domain authentication)
- [ ] DMARC record (`v=DMARC1; p=none; rua=mailto:...`)
- [ ] Domain authenticated in SendGrid dashboard
- [ ] Domain warmup plan (5-10 emails/day week 1, ramp up)
- [ ] Physical mailing address in email footers (CAN-SPAM)
- [ ] Suppression groups configured (separate outreach from transactional)

---

## WHAT TO BUILD NEXT (PRIORITY ORDER)

1. **Seq C: Post-Claim Welcome** — This is the missing piece. When a business claims their listing, they need an immediate confirmation + activation nudge + value delivery before any pitch starts.

2. **Seq A: Improve the claim outreach subject/body** — The templates are built but the copy needs the tweaks described above. Small changes, big impact on open rates.

3. **SendGrid domain authentication** — Nothing else matters if emails land in spam.

4. **Seq D: Finalize the founding member nurture** — Once Seq C is working and you have businesses claiming listings, this sequence picks up where C leaves off.

5. **Everything else** — Seqs H through O are future. Don't build them until you have businesses flowing through A → C → D.

---

Last updated: 2026-02-27
Related: email-outreach-sequence.md, founding-members-SOT.md, pricing-strategy.md
