# GreenLine365 — Email Outreach Sequence
## Source of Truth (SOT) | Brainstorming Document

**Status:** Draft — Internal Only
**Created:** 2026-02-21
**Author:** Jared Tucker (Creator, GL365)
**File:** `docs/brainstorming/email-outreach-sequence.md`

---

## PURPOSE

This is the back-end sales engine for GreenLine365.

The directory listing is the front door — low friction, obvious value, zero ask.
Once a business owner joins the directory, this 3-email sequence begins automatically.
The goal: build trust, demonstrate value, then deliver a personalized offer.

**No cold pitching. No features list. No pricing page links.**
Every email earns the next one.

---

## SEQUENCE OVERVIEW

```
Day 0  — Business claims directory listing (trigger)
Day 1  — EMAIL 1: The Value Bomb (no ask)
Day 4  — EMAIL 2: The Soft Reveal (no price)
Day 8  — EMAIL 3: The Personalized Offer (founding member pitch)
Day 14 — EMAIL 4: The Follow-Up (if no reply to Email 3)
Day 21 — EMAIL 5: The Graceful Exit (if still no reply)
```

---

## EMAIL 1 — THE VALUE BOMB
**Send:** Day 1 after directory listing goes live
**Goal:** Deliver something genuinely useful. Zero ask. Build trust immediately.
**Tone:** Personal, specific, helpful — feels handwritten, not automated

### Subject Line Options (A/B Test These)

- A: "Something I noticed about [Business Name]"
- B: "Quick win for [Business Name] this week"
- C: "Your area is trending — thought you should know"

### Body Copy (Template)

---

Hey [First Name],

Your listing just went live on GreenLine365 — welcome to the directory.

I pulled a quick Local Pulse snapshot for [their ZIP code / neighborhood] and thought
you'd want to see what's trending for [their industry] this week:

> 📍 **[Their Area] — [Current Month] Opportunity**
> [AI-generated insight, e.g.: "HVAC service searches in the 33619 area are up 31%
> this week as temperatures drop. Homeowners are looking for pre-season tune-ups
> before the heat hits. Businesses that post this week are capturing that demand."]

No ask here — just thought it was worth sharing since it's directly relevant to
what you do.

I'll check back in a few days.

— Jared
GreenLine365

---

**P.S.** If you want to see the full Local Pulse dashboard for your ZIP, I can pull
a more detailed breakdown. Just reply and I'll send it over.

---

### Personalization Variables

- `[First Name]` — pull from directory signup
- `[Business Name]` — pull from directory listing
- `[Their ZIP code / neighborhood]` — pull from listing address
- `[Their industry]` — pull from listing category
- `[AI-generated insight]` — generated from Local Pulse data for their ZIP + category

### Notes / Open Questions

- [ ] Who sends this? Should it come from jared@greenline365.com (personal) or hello@greenline365.com (brand)?
- [ ] Recommended: personal email address for Email 1 — feels more genuine
- [ ] The P.S. is a soft reply-bait — important for deliverability and engagement signal
- [ ] If no Local Pulse data available: use seasonal fallback (see live-local-pulse-spec.md)
- [ ] Consider plain-text format for Email 1 — higher open rates, more personal feel

---

## EMAIL 2 — THE SOFT REVEAL
**Send:** Day 4 (or 2 days after Email 1 if they replied)
**Goal:** Show them what the Command Center looks like for a business like theirs.
         Plant the seed. Still no price.
**Tone:** Curious, collaborative — "I built something, want to see it?"

### Subject Line Options

- A: "What I'd set up for [Business Name]"
- B: "Quick question about [Business Name]"
- C: "This is what 24/7 bookings looks like for [their industry]"

### Body Copy (Template)

---

Hey [First Name],

Quick follow-up.

I've been building a system specifically for [their industry] businesses in the
Tampa Bay area — and I wanted to show you what it looks like when it's set up
for a business like yours.

Here's what the Command Center dashboard shows when it's running:

[SCREENSHOT or GIF: Command Center dashboard showing Leads Today, Content Queued,
Booking Confirmed, Live Activity feed — ideally tailored to their industry]

A few things it handles automatically:

- Captures leads 24/7 — even when you're on a job or asleep
- Schedules content to Facebook/Instagram without you having to think about it
- Alerts you when there's high buying intent in your area (that Local Pulse data
  I sent you comes from this)
- Confirms bookings and sends reminders so you stop chasing no-shows

This isn't a software demo. It's closer to having an extra team member who never
takes a day off.

I'm not pitching you anything today — just wanted you to see what it looks like
in action before I tell you more about it.

Worth a conversation?

— Jared

---

### Personalization Variables

- `[First Name]` — pull from directory signup
- `[Business Name]` — pull from directory listing
- `[Their industry]` — pull from listing category (HVAC, restaurant, med spa, etc.)
- `[SCREENSHOT or GIF]` — ideally industry-specific mockup of the Command Center

### Notes / Open Questions

- [ ] Need 6 industry-specific Command Center screenshots (HVAC, restaurant, med spa,
      fitness, real estate, professional services)
- [ ] GIF is higher impact than static image — consider short Loom or screen record
- [ ] "Worth a conversation?" is a low-friction CTA — easier to say yes to than
      "Book a call" or "Sign up now"
- [ ] If they replied to Email 1: acknowledge the reply, make this feel like a continuation
      of that conversation — not a new email sequence
- [ ] Consider: if they clicked the P.S. in Email 1 and asked for the full Pulse report,
      send the full report FIRST, then follow with Email 2 content

---

## EMAIL 3 — THE PERSONALIZED OFFER
**Send:** Day 8 (or 3 days after Email 2 if they engaged)
**Goal:** Make the founding member offer. Specific, personal, time-limited.
**Tone:** Direct, confident, collaborative — founder-to-founder

### Subject Line Options

- A: "The founding member offer — [Business Name]"
- B: "30 spots. You're one of the first I'm reaching out to."
- C: "Here's exactly what I'd build for [Business Name]"

### Body Copy (Template)

---

Hey [First Name],

I'm building out the founding member tier for the GL365 Booking System — and I'm
only bringing 30 businesses in at this rate before it goes public.

You're one of the first people I'm reaching out to.

Here's what I'd set up specifically for [Business Name]:

- **AI booking assistant** — captures and confirms appointments 24/7,
  integrates with your calendar, handles reminders automatically
- **30-day content calendar** — pre-loaded with [industry]-specific posts,
  scheduled and ready to publish across your platforms
- **Local Pulse alerts** — real-time notifications when buying intent spikes
  in [their ZIP code] so you can act before competitors do
- **Lead tracking dashboard** — see every inquiry, where it came from, and
  what happened to it

**Founding Member Terms:**

- $500 off the setup fee (Day 1 savings)
- $500 off every month — for life (locked in, never increases)
- Beta access — you test everything before it goes public
- 25% off every new feature we ship, permanently

This isn't a trial. It's a founding partnership.

I'm only doing this for 30 businesses total. After that, it goes to standard pricing.

Want to jump on a 15-minute call this week to see if it's a fit?

[BOOKING LINK]

— Jared
Founder, GreenLine365

---

P.S. Even if the timing isn't right, I'd genuinely appreciate your feedback on
what would make this more useful for a [their industry] business like yours.
Reply anytime.

---

### Personalization Variables

- `[First Name]` — directory signup
- `[Business Name]` — directory listing
- `[industry]` — listing category
- `[their ZIP code]` — listing address ZIP
- `[BOOKING LINK]` — Jared's calendar link (GL365 booking widget)

### Notes / Open Questions

- [ ] The bullet build-out ("Here's what I'd set up for [Business Name]") should be
      genuinely customized per industry — not generic
- [ ] The P.S. is a safety net: even a "not right now" reply keeps the conversation open
      and signals to email providers this is a real exchange
- [ ] Should we include a one-liner on price anchor?
      e.g. "Standard pricing will be $[X]/mo. Founding members pay $[X-500]/mo forever."
      Can't do this until base pricing is set — leave blank for now
- [ ] The booking link should go directly to Jared's calendar, not a form
- [ ] Consider: include a 60-second Loom video here — Jared walking through the setup
      for their specific business type. Highest-converting email format for B2B

---

## EMAIL 4 — THE FOLLOW-UP
**Send:** Day 14 (only if no reply to Email 3)
**Goal:** One gentle bump. Keep it short.
**Tone:** Light, no pressure, still human

### Subject Line

- "Still thinking it over?"

### Body Copy

---

Hey [First Name],

Just bumping this up in case it got buried.

No pressure at all — if the timing isn't right or it's not a fit, totally understood.

If you're curious about any part of it, I'm happy to answer questions here or
hop on a quick call.

Either way — hope the listing has been useful.

— Jared

---

### Notes

- Keep this extremely short — one paragraph max
- No re-pitching the offer in full
- The goal is a reply, not a conversion — even "not interested" is a useful signal
- [ ] Should we add a soft pivot here? e.g. "If the booking system isn't the right fit,
      are there other parts of the platform that would be useful?" — opens door to
      selling a different module

---

## EMAIL 5 — THE GRACEFUL EXIT
**Send:** Day 21 (only if still no reply after Email 4)
**Goal:** Close the loop gracefully. Leave the door open. No hard feelings.
**Tone:** Warm, final, genuine

### Subject Line

- "Closing the loop — [Business Name]"

### Body Copy

---

Hey [First Name],

I've reached out a few times and haven't heard back, so I'll leave you alone
after this one.

If now isn't the right time, no worries at all. The founding member offer stays
open until we hit 30 businesses — after that it closes permanently.

Your directory listing stays live regardless. Happy to keep it updated whenever
you want to make changes.

And if things change down the road, I'm always reachable at jared@greenline365.com.

Thanks for being part of the early community.

— Jared

---

### Notes

- [ ] "After that it closes permanently" is only true if we're enforcing the 30 cap strictly
- The directory listing staying live is a goodwill anchor — they got value, no hard feelings
- This email's real job: make them feel good so they tell others about GL365
- [ ] Consider: add a simple "Is there anything about the platform that wasn't useful
      or clear?" — exit survey mindset, turns last email into product research

---

## AUTOMATION TRIGGERS & TAGGING (For When Sequence Is Built)

| Event | Action |
|---|---|
| Directory signup complete | Start sequence, tag: `email_seq_active` |
| Email 1 opened | Log open, no action change |
| Email 1 replied | Pause sequence, tag: `replied_email1`, notify Jared |
| Email 2 link clicked | Tag: `engaged_email2`, move to Email 3 after 2 days (not 4) |
| Email 3 booking link clicked | Tag: `clicked_booking`, notify Jared immediately |
| Email 3 replied | Pause sequence, tag: `replied_email3`, notify Jared |
| Booking confirmed | Tag: `founding_member_booked`, end sequence |
| Email 5 sent with no reply | Tag: `sequence_complete_no_response`, archive |

---

## PLATFORM / TOOL NOTES (TBD)

- [ ] What email platform sends this? (ConvertKit / Mailchimp / custom / other?)
- [ ] How does directory signup trigger the sequence? (webhook? Zapier? native?)
- [ ] Is personalization (ZIP, industry, business name) pulled automatically or manually?
- [ ] For Phase 1 (first 30 outreaches): consider doing this MANUALLY — more personal,
      better response rates, and Jared learns what resonates before automating

---

## SUCCESS METRICS

| Metric | Target | Notes |
|---|---|---|
| Email 1 open rate | > 55% | Personal send + strong subject |
| Email 1 reply rate | > 15% | P.S. reply-bait drives this |
| Email 2 → Email 3 progression | > 60% | If they read E1 they usually read E2 |
| Email 3 booking link click | > 20% | |
| Email 3 → Booked call | > 30% of clicks | |
| Booked call → Founding member | > 40% | |
| Full sequence (signup → founding member) | > 5% | Industry benchmark for cold: 1-2% |

---

## RELATED DOCUMENTS

- `docs/brainstorming/founding-members-SOT.md` — offer details, both programs
- `docs/brainstorming/live-local-pulse-spec.md` — how the value bomb data is generated
- `docs/brainstorming/pricing-strategy.md` — base pricing (needed before Email 3 final)
- `docs/brainstorming/command-center-feature-roadmap.md` — for 25% new feature discount tracking

---

*Last updated: 2026-02-21*
*Status: Draft — Email 1 and Email 3 are closest to final. Emails 4-5 are placeholders.*
*Move to `docs/specs/` when sequence is locked and automation is being built.*
