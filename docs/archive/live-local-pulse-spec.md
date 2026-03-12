# GreenLine365 — Live Local Pulse
## Behavior Specification | Brainstorming Document

**Status:** Draft — Internal Only
**Created:** 2026-02-21
**Author:** Jared Tucker (Creator, GL365)
**File:** `docs/brainstorming/live-local-pulse-spec.md`

---

## WHAT IT IS

The Live Local Pulse is a real-time market intelligence widget inside the Command Center dashboard.
It shows ZIP-code-specific buying signals, local events, seasonal trends, and foot traffic data
relevant to the business owner's industry.

It is a PREMIUM feature. It is the same data that powers the value bomb in Email 1 of the
outreach sequence — but the full widget experience is gated behind a paid tier.

---

## THREE-TIER BEHAVIOR

### TIER 1 — Creator/Admin View (Jared Tucker)

- Widget is FULLY LIVE at all times
- Default ZIP: **33619** (East Tampa / Brandon, FL)
- Scans every 3 hours for real-time signals
- When live signals are available: display the signal card with source, timestamp, and suggested action
- When NO live signal is available (between scan windows): display an **AI-generated Opportunity Card**
  (see Fallback Behavior section below)
- The sleeping emoji and "No live opportunities at the moment" state should **NEVER appear** for Jared
- "Calculating..." loading state should resolve within 5 seconds max

### TIER 2 — Free-Tier Users (Directory listing holders, not paying for Command Center)

- Widget displays a **locked preview state**
- Show a blurred/frosted pulse animation behind a lock overlay
- Lock overlay text:
  > "⚡ Live Local Pulse"
  > "Real-time market signals for your ZIP code."
  > "[Unlock Access →]" — CTA captures email and adds to Pulse waitlist
- Do NOT show any actual signal data
- The blur effect should show enough of the widget to make it desirable (moving line, card shapes)
- Clicking "Unlock Access" → adds to `pulse_waitlist` tag in CRM, shows confirmation:
  > "You're on the list. We'll reach out when Pulse access opens for your area."
- Pricing is TBD — use waitlist capture, not a pricing page link

### TIER 3 — Paid Subscribers (Pricing TBD)

- Full widget access, same as Tier 1
- ZIP code defaults to the business address ZIP on file from their directory listing
- User can manually override ZIP in settings (for businesses serving multiple areas)
- Scans every 3 hours (same cadence as creator)
- Same fallback behavior as Tier 1 when no live signal available

---

## FALLBACK BEHAVIOR — AI OPPORTUNITY CARDS

When no real-time signal data is available between scan cycles, the widget renders
an AI-generated Opportunity Card. This keeps the widget useful and impressive 24/7.

### Card Structure

```
┌─────────────────────────────────────────────────┐
│ ⚡ LIVE LOCAL PULSE — ZIP 33619 | East Tampa     │
│ ─────────────────────────────────────────────── │
│ 📍 [MONTH] OPPORTUNITY                           │
│                                                   │
│ [2-3 sentence insight specific to current        │
│  month, Tampa Bay area, and the user's industry] │
│                                                   │
│ 💡 SUGGESTED ACTION:                             │
│ [1 specific, actionable recommendation]          │
│ ─────────────────────────────────────────────── │
│ ⏱ Next live scan: Xh Xm  |  📍 33619            │
└─────────────────────────────────────────────────┘
```

### Fallback Priority (In Order)

1. **Current week seasonal trend** (highest priority if applicable)
2. **Upcoming local event within 50-mile radius of 33619** (within next 14 days)
3. **Industry-specific evergreen Tampa Bay insight** (always available as final fallback)

### Pre-Loaded Seasonal Fallback Library (Tampa Bay / 33619)

These should be pre-built and stored — rotate by current date:

| Period | Trigger Dates | Insight Topic |
|---|---|---|
| Tax Season | Feb 1 – Apr 15 | "Tax refund spending surge — service bookings up" |
| Spring Break | Mar 1 – Mar 31 | "Tourism + local foot traffic peak week" |
| Hurricane Prep | May 15 – Jun 15 | "Pre-season home services demand spike" |
| Back to School | Jul 15 – Aug 31 | "Family services, tutoring, uniforms demand" |
| Holiday Shopping | Nov 1 – Dec 24 | "Gifting services, restaurants, beauty bookings peak" |
| New Year / Resolutions | Dec 26 – Jan 31 | "Fitness, wellness, home improvement intent" |
| Valentine's Day | Jan 25 – Feb 14 | "Restaurant, florist, beauty bookings surge" |
| Super Bowl Week | 2 weeks before Super Bowl | "Tampa Bay sports-adjacent event traffic" |
| Summer Slowdown | Jun 15 – Jul 15 | "Lower foot traffic — focus on content/visibility" |

### Example Opportunity Cards by Month

**February:**
> "📍 ZIP 33619 — February Opportunity
> Valentine's Day weekend foot traffic in the Tampa Bay area historically runs 28-34%
> above average for restaurants, beauty services, and gift-adjacent businesses.
> Service businesses can capitalize by promoting "gift-a-service" packages this week.
>
> 💡 Suggested Action: Schedule a Valentine's-themed post for Feb 12-13 offering
> a gift card or couples package. Post by Wednesday for maximum reach."

**May:**
> "📍 ZIP 33619 — May Opportunity
> Pre-hurricane season demand for HVAC, roofing, generator, and home inspection
> services in Hillsborough County peaks in May before the June 1 season start.
> Homeowners searching now are 3x more likely to book within 48 hours.
>
> 💡 Suggested Action: Post a 'Pre-Season Checklist' for your service category
> this week and make sure your booking link is prominently displayed."

---

## WIDGET PLACEMENT IN THE DASHBOARD

- Location: Right-side panel of the Command Center main schedule view (`/admin-v2`)
- Current position: Top-right widget (above Weekly Trend Hunter)
- Size: Approximately 220px wide, 200px tall
- Always visible — not collapsible on desktop
- Mobile: collapses to a banner with pulse indicator and "View Signal" tap target

---

## TECHNICAL NOTES (For Developer)

- [ ] What API or data source powers the live signals? (TBD — Eventbrite, Google Trends,
      local news RSS, custom scraper, or combination)
- [ ] The 3-hour scan timer is currently displayed as static text ("Next scan in 3 hours")
      — this should be a live countdown based on last scan timestamp
- [ ] "Check for Updates" button currently exists — this should force an immediate rescan
      and show a loading state, not just a static button
- [ ] The "Calculating..." state should have a maximum timeout of 10 seconds before
      falling back to the Opportunity Card
- [ ] ZIP code 33619 should be stored in Jared's user profile settings, not hardcoded
- [ ] Fallback card content should be stored in a JSON/database table keyed by date range
      so it can be updated without a code deploy
- [ ] For paid users: ZIP is read from their business address on file in the directory listing

---

## DATA THE WIDGET SHOULD EVENTUALLY SHOW (Vision)

When fully built, a live signal card should contain:

- Signal type (foot traffic spike, social trend, search intent, local event, weather trigger)
- Signal strength (low / medium / high / urgent)
- Geographic specificity (ZIP, neighborhood, city, metro)
- Industry relevance score (how relevant is this to the user's business category)
- Suggested content action ("Post about X today")
- Suggested offer action ("Promote Y this weekend")
- Time sensitivity ("Act before Friday" / "This is an evergreen trend")

---

## RELATED DOCUMENTS

- `docs/brainstorming/founding-members-SOT.md` — Pulse as a paid feature / waitlist
- `docs/brainstorming/email-outreach-sequence.md` — Email 1 uses Pulse data as value bomb
- `docs/brainstorming/pricing-strategy.md` — what tier unlocks full Pulse access

---

*Last updated: 2026-02-21*
*Status: Behavior spec draft. Technical implementation TBD.*
