# GL365 Verified Supplier Network — Complete Specification

**File:** `docs/brainstorming/verified-supplier-network.md`
**Status:** DRAFT — Internal Only
**Created:** 2026-02-24
**Author:** Jared Tucker (Creator, GL365)

> This document defines the GL365 Verified Supplier Network — a closed marketplace
> for premium, pre-qualified home service leads. Both sides are vetted: homeowners
> are pre-qualified through a GL365 voice AI agent, and contractors must earn their
> way onto the Verified Supplier List through a multi-factor scoring system.

---

## I. THE CONCEPT IN ONE SENTENCE

GL365 becomes the trusted middleman: homeowners trust GL365 to send only the best contractors, and contractors pay a premium because the lead is practically pre-closed by the time they arrive.

---

## II. WHY THIS EXISTS

This is the **high-ticket lead product**. Not for every contractor — only for the elite ones who've earned their place.

- Standard lead gen companies sell names and phone numbers. Close rate: 5-15%.
- GL365 sells **pre-qualified, voice-verified, report-armed leads** to **verified suppliers only**. Close rate: 60-80%+.
- The homeowner already trusts GL365. They talked to our voice agent. They got their ROI report showing how much money they're wasting. By the time the contractor knocks on the door, the homeowner is ready to buy — they just need a face to shake hands with.

**Revenue streams:**
1. Per-lead fee to the contractor ($250-$350 per verified lead + closing report)
2. Monthly Verified Supplier subscription (access to the lead pool)
3. The $400 Digital Infrastructure Audit still serves as the contractor's entry tripwire
4. Home Ledger stamp fees when the job is completed ($9.99/stamp)

---

## III. THE TWO-SIDED QUALIFICATION

### Side A: The Homeowner (Qualified by GL365 — Voice OR Form)

GL365 qualifies homeowners through **two paths** — their choice:

**Path 1: Voice Qualification (Scout Agent)**
A voice AI agent — **"Scout"** — handles inbound and outbound homeowner calls. Scout is NOT a sales agent. Scout is a trusted home advisor who helps homeowners understand what they're wasting and what their options are.

**Path 2: Self-Service Form (The Home Savings Calculator)**
For homeowners who don't want to talk to anyone — they fill out a smart form that collects the same data Scout would ask for. The form runs the same ROI calculations in real-time and delivers the Value Bomb as an instant on-screen result + emailed PDF. The form also offers an **optional callback scheduling** field so the homeowner can request a follow-up call on their terms.

**Why two paths matter:** Some homeowners are ready to talk — those are your hottest leads (voice path). Others just want the numbers first — those are your warm leads who convert after seeing the report (form path). Both feed into the same lead pool. Both generate the same Premium Lead Report. The only difference is the qualification score weights shift slightly (voice-qualified leads score higher on "intent" because they actively engaged in conversation).

### Side B: The Contractor (Verified Supplier Badge)

Contractors must earn the **Verified Supplier Badge** — the hardest badge in the GL365 ecosystem — to receive these leads. Multiple paths to qualification, but all require meeting a minimum composite score.

---

## IV. SCOUT — THE HOMEOWNER QUALIFICATION VOICE AGENT

### Identity
- **Name:** Scout
- **Role:** Homeowner Advisor / Lead Qualification Specialist
- **Tone:** Warm, knowledgeable, zero-pressure. Like a trusted neighbor who happens to know everything about home systems. Think "the friend who used to work at the utility company."
- **NOT a salesperson.** Scout never sells a contractor. Scout helps the homeowner understand their situation and asks if they'd like GL365 to connect them with a verified professional.

### What Scout Does

1. **Inbound calls:** Homeowner sees a GL365 ad, gets a mailer, scans a QR code, or gets referred → calls the GL365 homeowner line → Scout answers
2. **Outbound calls:** GL365 identifies high-probability homes (via Local Pulse data, property age, ZIP-based energy stats) → Scout calls proactively with a value-first approach

### Scout's Conversation Flow

```
Phase 1: WARM INTRO (30 seconds)
─────────────────────────────────
"Hey [Name], this is Scout from GreenLine365. We're a home
services accountability network — basically we help homeowners
make sure they're not overpaying on things like energy, HVAC,
roofing, and plumbing. How are you doing today?"

Phase 2: PROPERTY DISCOVERY (2-3 minutes)
─────────────────────────────────────────
Scout asks about the home:
- "How long have you been in your home?"
- "Do you know roughly how old your AC / roof / water heater is?"
- "Have you noticed your electric bill going up over the past year?"
- "When's the last time you had your [system] inspected?"

Scout uses web_search + utility_lookup tools to pull:
- Local electric company rates for their ZIP
- Average utility costs for homes their size in their area
- Equipment age decay curves (industry standard lifespans)

Phase 3: THE VALUE BOMB (2-3 minutes)
─────────────────────────────────────
Scout delivers the ROI breakdown — this is the moment:

"So based on what you're telling me — your AC is about 12 years
old, you're paying around $280/month in electric... here's the thing.
The average home your size in [ZIP] with a modern high-efficiency
unit is paying closer to $160/month. That's $1,440 a year you're
leaving on the table. Over the next 3 years before that unit
probably dies on you? That's over $4,300 in wasted energy costs —
not counting the emergency replacement bill when it goes out on
the hottest day of the year."

"And here's the other piece — a new system actually adds about
$8,000-$12,000 to your home's resale value. So you're not just
saving money, you're building equity."

Phase 4: THE SOFT ASK (30 seconds)
──────────────────────────────────
"Would you be against me connecting you with one of our verified
contractors? These are companies we've personally vetted — they've
been in business for decades, they're accountability-verified on
our platform, and they'll come out, do a full assessment, and give
you an honest recommendation. No pressure, no obligation."

Phase 5: QUALIFICATION & HANDOFF
────────────────────────────────
If YES:
- Collect/confirm: name, address, phone, email, best time for visit
- Confirm equipment details discussed
- Generate the Premium Lead Report (PDF) automatically
- Route to matched Verified Supplier(s) in their ZIP + trade
- SMS the homeowner: confirmation + contractor info + GL365 trust badge

If NOT NOW:
- "Totally understand. I'm going to send you that energy breakdown
  I just mentioned so you have the numbers in front of you. If anything
  changes, you've got my number."
- Drip into nurture sequence (email Value Bomb with the personalized
  numbers Scout quoted)

If NO:
- "No worries at all. The numbers are still the numbers though —
  keep an eye on that electric bill and call us anytime."
- Tag in CRM: "declined_initial" — 90-day re-engagement trigger
```

### Scout's Tools

| Tool | Description |
|------|-------------|
| `utility_lookup` | Pulls average utility rates by ZIP code, electric company, home size. Sources: EIA data, utility company published rates, Perplexity real-time search |
| `web_search` | Search for real-time energy costs, equipment pricing, local market data for the homeowner's area |
| `property_intel` | Queries GL365 Property Database for the address — existing Home Ledger data, past incidents, asset inventory |
| `generate_lead_report` | Triggers the Premium Lead Report PDF generation with all data collected during the call |
| `create_qualified_lead` | Creates a VERIFIED lead in the CRM with full qualification data, intent score, and conversation transcript |
| `match_supplier` | Finds the best matched Verified Supplier(s) for this lead based on trade, ZIP, availability, and Supplier Score |
| `transfer_department` | Routes to booking (Susan), sales (Aiden/Ada), or human if needed |
| `send_sms` | Sends confirmation and value bomb SMS to the homeowner |

### Scout's Data Sources for the Value Bomb

| Data Point | Source | Method |
|-----------|--------|--------|
| Electric rates by ZIP | U.S. Energy Information Administration (EIA) | API / web_search |
| Average monthly bill by home size | Local utility company rate schedules | web_search + Perplexity |
| Equipment lifespan curves | Industry standards (ASHRAE, ACCA, NRCA) | Pre-loaded reference data |
| Replacement cost ranges | HomeAdvisor / Angi / local market averages | web_search |
| Home value impact | NAR (National Association of Realtors) data, Zillow | web_search |
| Local weather patterns | OpenWeather API (already integrated per Tampa Electric demo) | API call |
| Property history | GL365 Home Ledger database | property_intel tool |

### Lead Qualification Scoring (Scout assigns this)

| Factor | Weight | Scoring |
|--------|--------|---------|
| Equipment Age | 25% | 15+ years = 100, 10-14 = 75, 5-9 = 40, <5 = 10 |
| Monthly Waste Amount | 25% | $150+/mo waste = 100, $100-149 = 75, $50-99 = 50, <$50 = 25 |
| Homeowner Intent | 20% | "Yes, send someone" = 100, "Maybe later" = 50, "Just looking" = 25 |
| Home Ownership Confirmed | 10% | Owner = 100, Renter = 0 (disqualify) |
| Timeline Urgency | 10% | "ASAP / this month" = 100, "This quarter" = 70, "Someday" = 30 |
| Budget Awareness | 10% | Discussed financing/budget = 100, Avoided topic = 40 |

**Minimum score to become a Verified Lead: 65/100**

Below 65 → goes into nurture sequence, NOT sent to a supplier.

---

## IV-B. THE HOME SAVINGS CALCULATOR (FORM-BASED QUALIFICATION)

For homeowners who prefer NOT to talk to an AI or anyone — this is a smart, multi-step form that delivers the same Value Bomb as Scout, but self-service.

### Where It Lives
- Standalone page: `/home-savings-calculator`
- Embedded widget on partner sites, mailers (QR code), social ads
- Also accessible from the GL365 homepage as a prominent CTA

### Form Flow (Multi-Step, Conversational Design)

```
STEP 1: YOUR HOME
──────────────────
- ZIP code [required]
- Home address [optional — more accurate results if provided]
- Approximate square footage [dropdown: <1000, 1000-1500, 1500-2000, 2000-2500, 2500-3000, 3000+]
- Year built [dropdown by decade]
- Do you own this home? [Yes / No — No = "This tool is for homeowners. Check out our directory for local service providers." → redirect]

STEP 2: YOUR EQUIPMENT
───────────────────────
- What system are you most concerned about? [HVAC / Roof / Water Heater / Electrical / Plumbing / Not Sure]
- How old is your [selected system]? [dropdown: <5 years, 5-9, 10-14, 15-19, 20+, Not sure]
- When was it last inspected or serviced? [dropdown: Within 6 months, 6-12 months, 1-2 years, 2+ years, Never / Don't remember]
- Have you noticed any issues? [checklist: Higher bills, Strange noises, Uneven performance, Visible damage, Frequent repairs, None]

STEP 3: YOUR UTILITY BILL
──────────────────────────
- What's your approximate monthly electric bill? [slider: $50 - $500+]
- Electric company [auto-detected from ZIP, with manual override dropdown]

STEP 4: YOUR RESULTS (Instant — no submit-and-wait)
────────────────────────────────────────────────────
The page instantly calculates and displays:

┌─────────────────────────────────────────────────┐
│  YOUR HOME SAVINGS REPORT                        │
│                                                  │
│  Based on your ZIP ([ZIP]) and a [X]-year-old    │
│  [system type] in a [sq ft] sq ft home:          │
│                                                  │
│  🔴 You're estimated to waste $[X]/month         │
│     compared to homes with modern equipment      │
│                                                  │
│  📊 That's $[X × 12]/year — or $[X × 60] over   │
│     the next 5 years                             │
│                                                  │
│  🏠 A new [system] could add $[X] to your        │
│     home's resale value                          │
│                                                  │
│  ⏱️ Your [system] is [X]% through its expected   │
│     lifespan                                     │
│                                                  │
│  ─────────────────────────────────────────────── │
│                                                  │
│  WANT THE FULL REPORT + A FREE ASSESSMENT?       │
│                                                  │
│  We'll connect you with a GL365 Verified         │
│  Contractor — vetted, insured, and               │
│  accountability-verified.                        │
│                                                  │
│  Name: [________]                                │
│  Email: [________]                               │
│  Phone: [________]                               │
│                                                  │
│  ☐ I'd like to schedule a callback               │
│    Preferred day: [dropdown]                     │
│    Preferred time: [Morning / Afternoon / Evening]│
│                                                  │
│  [GET MY FREE REPORT + ASSESSMENT →]             │
│                                                  │
│  — or —                                          │
│                                                  │
│  [JUST EMAIL ME THE REPORT]                      │
│  (No contractor visit, just the numbers)         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Two CTA Paths on the Results Page

**Path A: "Get My Free Report + Assessment"** (HOT LEAD)
- Collects name, email, phone
- Optional callback scheduling
- Creates a Verified Lead (score boosted by providing contact willingly)
- Generates full Premium Lead Report PDF
- Matches to Verified Supplier
- Emails report to homeowner + sends to supplier

**Path B: "Just Email Me The Report"** (WARM LEAD)
- Collects email only
- Sends a lighter version of the report (no contractor section)
- Enters nurture sequence
- 48 hours later: "Did you get a chance to look at your savings report? If you'd like a professional to take a look, we can connect you with someone."
- 7 days later: seasonal/urgency nudge based on their equipment age

### Form Lead Scoring Adjustments

Form leads score slightly differently than voice leads because we have less intent signal:

| Factor | Weight | Notes |
|--------|--------|-------|
| Equipment Age | 25% | Same as voice |
| Monthly Waste Amount | 25% | Same as voice |
| Homeowner Intent | 20% | Path A ("Get Assessment") = 85, Path B ("Just Email") = 40, Callback requested = 95 |
| Home Ownership Confirmed | 10% | Same — No = disqualify |
| Timeline Urgency | 10% | Callback requested = 80, Path A no callback = 60, Path B = 30 |
| Issues Reported | 10% | 3+ issues checked = 100, 1-2 = 60, "None" = 20 |

### Callback Scheduling

If the homeowner checks "I'd like to schedule a callback":
- Scout calls them at their requested time
- Scout already has ALL their form data pre-loaded
- Opens with: "Hey [Name], this is Scout from GreenLine365. You filled out our Home Savings Calculator earlier — I've got your numbers pulled up. Your [system] situation is pretty interesting, want me to walk you through what I found?"
- This is the HIGHEST converting path — they self-selected for a call AND already saw their waste numbers

---

## V. THE VERIFIED SUPPLIER BADGE — CONTRACTOR QUALIFICATION

### Why It's the Hardest Badge

The Verified Supplier Badge is the ONLY badge that gives a contractor access to the GL365 lead pool. It sits ABOVE the Elite 365 Seal of Approval. You can have every other badge lit up gold and still not qualify for Verified Supplier if you don't meet the scoring threshold.

**This is the badge that prints money.** That's why it has to be nearly impossible to earn and easy to lose.

### The Verified Supplier Composite Score (VSCS)

Multi-factor weighted scoring system. Minimum composite score: **80/100** to qualify.

| Factor | Weight | Scoring Criteria |
|--------|--------|-----------------|
| **Years in Business** | 30% | 50+ years = 100, 30-49 = 85, 20-29 = 70, 10-19 = 50, 5-9 = 30, <5 = 10 |
| **GL365 Reputation Score** | 20% | Based on existing badge status + review sentiment + incident clearance rate. All industry badges active = 100, Missing 1 = 70, Missing 2+ = 40 |
| **Insurance & Licensing** | 15% | Full coverage verified = 100, Partial = 50, Unverified = 0 (disqualify) |
| **Customer Satisfaction (GL365 Data)** | 15% | Private Feedback Score avg 4.5+ = 100, 4.0-4.4 = 75, 3.5-3.9 = 50, <3.5 = 0 (disqualify) |
| **Financial Stability** | 10% | Bonded + insured + no liens = 100, Minor issues = 50, Major red flags = 0 (disqualify) |
| **GL365 Platform Engagement** | 10% | Active Command Center user (weekly logins, content posting, QR activity) = 100, Occasional = 60, Dormant = 20 |

### The "Good Actor" Path (For Newer Companies)

You're right — a company that's been around 3 years but is absolutely crushing it shouldn't be locked out forever. Here's how the scoring compensates:

**If Years in Business < 10 (score 50 or below on that factor):**

The company can offset through **exceptional performance** on other factors:

| Compensating Factor | Bonus Points (added to composite) |
|--------------------|----------------------------------|
| Perfect GL365 reputation (all badges active for 6+ consecutive months) | +8 |
| Zero uncleared stains across all jobs for 12+ months | +5 |
| Customer satisfaction score 4.8+ (top 5% of platform) | +5 |
| Completed 50+ verified jobs through GL365 | +5 |
| Elite 365 Seal holder for 6+ consecutive months | +5 |
| Industry certification (NATE for HVAC, Master Plumber, etc.) | +3 |
| Veteran-owned, minority-owned, or woman-owned (verified) | +2 |

**Maximum bonus: +33 points**

So a 5-year-old company scoring 30/100 on Years in Business could theoretically earn enough bonuses to reach 80/100 composite — but they'd need to be nearly perfect on everything else. That's the point.

### Example Scenarios

**Scenario 1: "Old Guard" — Easy Qualification**
- Tampa Bay Cooling Co., 52 years in business → Years: 100 × 30% = 30
- All GL365 badges active → Reputation: 100 × 20% = 20
- Fully insured & licensed → Insurance: 100 × 15% = 15
- Private feedback avg 4.6 → Satisfaction: 100 × 15% = 15
- Bonded, no liens → Financial: 100 × 10% = 10
- Weekly Command Center user → Engagement: 100 × 10% = 10
- **Composite: 100/100** — Verified Supplier

**Scenario 2: "Rising Star" — Bonus Path**
- Fresh Air HVAC, 7 years in business → Years: 30 × 30% = 9
- All GL365 badges active → Reputation: 100 × 20% = 20
- Fully insured → Insurance: 100 × 15% = 15
- Private feedback avg 4.9 → Satisfaction: 100 × 15% = 15
- Bonded, clean → Financial: 100 × 10% = 10
- Active daily user → Engagement: 100 × 10% = 10
- **Base Composite: 79/100** — Just below threshold
- Bonuses: All badges 6+ months (+8) + Zero stains 12mo (+5) + Top 5% satisfaction (+5) + 60 verified jobs (+5) + Elite Seal 6mo (+5) + NATE certified (+3)
- **Adjusted Composite: 79 + 31 = 110/100 (capped at 100)** — Verified Supplier

**Scenario 3: "Not Ready" — Rejected**
- Quick Fix Plumbing, 2 years in business → Years: 10 × 30% = 3
- 2 badges missing → Reputation: 40 × 20% = 8
- Insured but gaps → Insurance: 50 × 15% = 7.5
- Private feedback avg 4.1 → Satisfaction: 75 × 15% = 11.25
- Not bonded → Financial: 50 × 10% = 5
- Rarely logs in → Engagement: 20 × 10% = 2
- **Composite: 36.75/100** — Not even close. Needs 2-3 more years of platform engagement + badge completion + job volume.

---

## VI. THE VERIFIED SUPPLIER SUBSCRIPTION

### Pricing Structure

| Component | Price | Notes |
|-----------|-------|-------|
| **Verified Supplier Application Fee** | $500 one-time | Covers background check, insurance verification, financial review. Non-refundable. |
| **Verified Supplier Monthly** | $499/mo | Access to the qualified lead pool. Includes up to 5 lead reports/month. |
| **Per-Lead Fee (Standard)** | $0 (included) | First 5 leads/month included in subscription. |
| **Per-Lead Fee (Overage)** | $250/lead | Leads beyond the 5/month included. |
| **Premium Lead + Closing Report** | $350/lead | Lead + full PDF report (ROI calculator, energy waste analysis, home value impact, GL365 Home Ledger preview). Purchased à la carte or as add-on bundle. |
| **Lead Report Bundle (10-pack)** | $2,500 ($250/each) | Discounted bulk purchase. Reports don't expire. |

### What the Supplier Gets Per Lead

1. **Homeowner name, phone, email, address** — verified by Scout
2. **Equipment details** — age, type, condition as reported by homeowner
3. **Waste calculation** — monthly/yearly waste amount, break-even timeline
4. **Intent score** — 0-100, with Scout's qualification notes
5. **Conversation transcript** — full call recording + AI summary
6. **Best time for visit** — homeowner's preferred window
7. **Premium Lead Report PDF** (if purchased) — the closing tool the tech carries to the door

### Lead Matching Logic

When a lead is qualified:
1. Match **trade** (HVAC, plumbing, roofing, electrical)
2. Match **ZIP code** (supplier's service area)
3. Match **availability** (supplier's current job load from Command Center calendar)
4. Rank by **Verified Supplier Composite Score** (higher score = first right of refusal)
5. If top supplier declines within 2 hours → goes to next-ranked supplier
6. Maximum 3 suppliers per lead (exclusive leads cost more — see Tier upgrade)

### Exclusive Lead Upgrade

| Tier | Leads/Month | Exclusivity | Monthly Price |
|------|-------------|-------------|---------------|
| **Standard Supplier** | 5 included | Shared (up to 3 contractors see it) | $499/mo |
| **Priority Supplier** | 10 included | First right of refusal (2-hour window) | $799/mo |
| **Exclusive Supplier** | Unlimited | Exclusive (1 contractor per lead) | $1,499/mo |

---

## VII. THE PREMIUM LEAD REPORT (THE CLOSING TOOL)

This is the PDF the technician carries to the homeowner's door. It's not a sales brochure — it's **third-party verified data** that makes the homeowner say "I already knew I needed this."

### Report Sections

```
┌─────────────────────────────────────────────────┐
│  GL365 HOME ENERGY & ASSET INTELLIGENCE REPORT  │
│  ─────────────────────────────────────────────── │
│  Prepared for: [Homeowner Name]                  │
│  Property: [Address]                             │
│  Date: [Date]                                    │
│  Report ID: GL365-[UUID]                         │
│                                                  │
│  Verified by: GreenLine365 Intelligence Platform │
└─────────────────────────────────────────────────┘

SECTION 1: PROPERTY SNAPSHOT
─────────────────────────────
- Address, square footage, year built
- Current equipment inventory (as reported + GL365 data if available)
- Property Home Ledger status (new record or existing history)

SECTION 2: ENERGY WASTE ANALYSIS
─────────────────────────────────
- Current estimated monthly utility cost: $[X]
- Average for a home this size in [ZIP] with modern equipment: $[Y]
- Monthly waste: $[X - Y]
- Annual waste: $[X - Y] × 12
- 5-year projected waste: $[X - Y] × 60
- Electric company: [Name] (rate: $[rate]/kWh)
- Source: U.S. EIA, [Electric Company] published rates

Visual: Bar chart comparing current vs. optimized vs. neighborhood average

SECTION 3: EQUIPMENT LIFECYCLE ANALYSIS
────────────────────────────────────────
- [Equipment Type]: [Age] years old
- Industry average lifespan: [X] years
- Remaining useful life estimate: [Y] years
- Failure probability in next 12 months: [Z]%
- Emergency replacement cost (no planning): $[amount]
- Planned replacement cost: $[amount] (savings of $[diff])

Visual: Lifecycle gauge showing where equipment sits on the decay curve

SECTION 4: ROI CALCULATOR
──────────────────────────
- Investment: New [equipment] = $[cost]
- Annual energy savings: $[amount]
- Break-even timeline: [X] months
- 10-year net savings: $[amount]
- Home value increase: +$[amount] (source: NAR/Zillow data)
- Net ROI: [percentage]%

Visual: Timeline showing cumulative savings vs. investment cost

SECTION 5: HOME VALUE IMPACT
─────────────────────────────
- Current estimated home value: $[Zillow/Redfin estimate]
- Value increase from [upgrade]: +$[amount]
- "Homes with verified service records sell for [X]% more"
- GL365 Home Ledger benefit: "This upgrade will be permanently
  recorded on your property's GL365 Home Ledger — verified,
  certified, and visible to future buyers."

SECTION 6: YOUR VERIFIED CONTRACTOR
─────────────────────────────────────
- [Company Name]
- Years in business: [X]
- GL365 Verified Supplier Badge: ✓
- GL365 Reputation Score: [X/100]
- Badges: [list of active badges]
- "This contractor has been vetted by GreenLine365 and meets
  our strict qualification standards for experience, licensing,
  insurance, and customer satisfaction."

SECTION 7: NEXT STEPS
──────────────────────
- Your contractor will contact you within [timeframe]
- What to expect during the assessment
- No-obligation — get the assessment, get the numbers, decide on your timeline
- Questions? Call GL365: [number]
- Your GL365 Home Ledger: [QR code linking to their property record]

─────────────────────────────────────────────────
Powered by GreenLine365 Intelligence Platform
Report ID: GL365-[UUID] | Generated: [timestamp]
This report contains third-party verified data.
GreenLine365 is not a contractor or service provider.
─────────────────────────────────────────────────
```

### Report Generation Architecture

| Step | Component | Action |
|------|-----------|--------|
| 1 | Scout call completes | Lead data + qualification stored in `verified_leads` table |
| 2 | Edge Function triggers | Pulls EIA data, utility rates, Zillow estimates, equipment lifecycle data |
| 3 | AI synthesis | Claude generates narrative sections from raw data |
| 4 | PDF generation | Browserless.io renders HTML template → PDF (same architecture as $400 audit) |
| 5 | Storage | PDF stored in Supabase Storage: `reports/[lead_id]/[timestamp].pdf` |
| 6 | Delivery | PDF sent to matched Verified Supplier + copy emailed to homeowner |

---

## VIII. BADGE DECAY & REVOCATION

### Verified Supplier Badge Maintenance

The badge is **re-evaluated monthly**. It's not a lifetime achievement — it's a living score.

| Event | Impact |
|-------|--------|
| Composite score drops below 80 | 30-day warning. Score must recover or badge is suspended. |
| Any "disqualify" factor triggered (insurance lapse, satisfaction below 3.5, financial red flag) | **Immediate suspension.** No warning. Lead pool access revoked same day. |
| Customer complaint escalated to GL365 | Investigation triggered. Badge suspended pending review. |
| 3+ declined leads in a row | Warning + review. Pattern suggests they're cherry-picking. |
| Lead close rate below 20% for 3 consecutive months | Coaching call from GL365. If no improvement → downgrade to Standard Supplier |
| Homeowner reports negative experience with a Verified Supplier | **Immediate investigation.** GL365's reputation is on the line. |

### The "Nuclear Option"

If a Verified Supplier is found to have:
- Misrepresented qualifications
- Pressured or deceived a homeowner
- Performed substandard work on a GL365-referred job
- Failed to honor a quote given during the lead visit

**Result:** Permanent ban from the Verified Supplier Network. Badge revoked. Home Ledger stain written against the contractor. Public directory listing flagged.

GL365 sends the homeowner to a different Verified Supplier at no cost and eats the lead fee. This is the cost of maintaining trust.

---

## IX. THE COMPLETE FLOW

```
HOMEOWNER SIDE                          CONTRACTOR SIDE
─────────────                           ────────────────

[Homeowner sees GL365 ad / mailer /     [Contractor signs up for GL365]
 QR code / referral]                           │
        │                                      ▼
        ▼                               [Earns badges over time]
[Calls GL365 homeowner line]                   │
        │                                      ▼
        ▼                               [Reaches 80+ Verified
[Scout answers — warm intro]             Supplier Composite Score]
        │                                      │
        ▼                                      ▼
[Property discovery questions]          [Applies for Verified Supplier]
        │                                      │
        ▼                                      ▼
[Scout pulls ZIP energy data,           [$500 application fee →
 utility rates, equipment age            background check, insurance
 decay curves]                           verification, financial review]
        │                                      │
        ▼                                      ▼
[THE VALUE BOMB — Scout tells them      [Approved → Verified Supplier
 exactly how much money they're          Badge activated. Chooses
 wasting, shows ROI numbers]             subscription tier.]
        │                                      │
        ▼                                      ▼
[Soft ask: "Would you be against       [Enters the lead pool for
 us connecting you with a verified       their trade + service area]
 contractor?"]                                 │
        │                                      │
        ▼                                      │
[YES → Lead qualified, report           ◄──────┘
 generated, matched to supplier]               │
        │                                      ▼
        ▼                               [Receives lead notification:
[Homeowner gets SMS confirmation:        homeowner details, equipment
 "Your GL365 Verified Contractor         info, intent score, conversation
 [Company Name] will contact you         summary, Premium Lead Report PDF]
 within [timeframe]"]                          │
        │                                      ▼
        ▼                               [Contractor calls/visits
[Contractor arrives with the             homeowner with the report.
 Premium Lead Report — homeowner         Third-party data does the
 already trusts GL365, already           selling. Contractor just
 knows their numbers]                    needs to be competent and
        │                                honest.]
        ▼                                      │
[JOB COMPLETED]                                │
        │                                      │
        ▼                                      ▼
[GL365 Home Ledger updated with         [Contractor pays lead fee.
 verified job record + Pro               Home Ledger stamp fee.
 Certification Stamp]                    Close rate tracked.]
```

---

## X. INTEGRATION WITH EXISTING SYSTEMS

| Existing System | How It Connects |
|----------------|----------------|
| **Badge System** (Operational Bible) | Verified Supplier is a new badge layer ABOVE the Elite 365 Seal. Requires all industry badges as a prerequisite. |
| **Digital Infrastructure Audit** | The $400 audit remains the contractor's first touchpoint. Audit → Tier subscription → Badge earning → Verified Supplier application. |
| **Home Ledger** | Every job from a Verified Supplier lead gets a Pro Certification Stamp. Homeowner's property record grows with verified data. |
| **The Brain (Skill #7)** | Lead Capture Qualifier skill feeds into Scout's qualification. Brain assists with scoring and routing. |
| **Local Pulse** | Drives Scout's outbound targeting. High-demand ZIPs get priority outbound calling. |
| **Agent Personalities** | Scout is a NEW agent in `agent-personalities.ts`. New agent type: `'scout'`. New mode: `'qualification'`. |
| **Email Outreach Sequence** | Homeowners who say "not now" enter a modified nurture sequence — the Value Bomb email contains their personalized numbers from the Scout call. |
| **Command Center** | Verified Suppliers see a "Verified Leads" spoke in their sidebar. Shows incoming leads, lead status, close tracking. |
| **Private Feedback Loop** | Homeowner feedback after a Verified Supplier visit feeds DIRECTLY into the supplier's satisfaction score. Bad visit = score drops = badge at risk. |

---

## XI. SCOUT AGENT SPECIFICATION (for `agent-personalities.ts`)

### Agent Definition

```typescript
// New AgentId addition
export type AgentId = 'aiden' | 'ada' | 'susan' | 'concierge' | 'scout';

// New AgentMode addition
export type AgentMode = 'sales' | 'concierge' | 'qualification';

// New Department addition
export type Department = 'sales' | 'booking' | 'support' | 'human' | 'supplier_matching';
```

### Scout's Personality Core

- **Voice:** Warm, knowledgeable, like a trusted neighbor
- **Energy:** Calm confidence. Not selling — educating.
- **Signature move:** The Value Bomb delivery. Specific numbers, specific to THEIR home, from real data sources.
- **Key phrase:** "The numbers are the numbers."
- **Never says:** "Buy," "deal," "limited time," "discount," or any traditional sales language
- **Always says:** "Here's what the data shows for your home specifically..."

### Scout's Strict Rules

```
NEVER:
- Recommend a specific contractor by name during the call (GL365 matches after)
- Guarantee savings amounts (always "estimated based on...")
- Pressure the homeowner — one soft ask, that's it
- Discuss contractor pricing — that's between the homeowner and contractor
- Create a lead with a score below 65 as a Verified Lead

ALWAYS:
- Cite data sources ("According to EIA data for your ZIP...")
- Use the homeowner's specific numbers, not generic stats
- Offer to send the Value Bomb data via email regardless of outcome
- Disclose: "I'm an AI advisor working with the GreenLine365 team"
- Log the full call for quality assurance and supplier matching
```

---

## XII. DATABASE SCHEMA (NEW TABLES)

### `verified_suppliers`
```sql
id                    UUID PRIMARY KEY
business_id           UUID REFERENCES businesses(id)
tenant_id             UUID REFERENCES tenants(id)
composite_score       DECIMAL(5,2)
years_in_business     INTEGER
reputation_score      DECIMAL(5,2)
insurance_verified    BOOLEAN
insurance_expiry      DATE
satisfaction_score     DECIMAL(3,2)
financial_score       DECIMAL(5,2)
engagement_score      DECIMAL(5,2)
bonus_points          DECIMAL(5,2)
badge_status          TEXT CHECK (status IN ('pending', 'active', 'suspended', 'revoked'))
subscription_tier     TEXT CHECK (tier IN ('standard', 'priority', 'exclusive'))
activated_at          TIMESTAMPTZ
last_evaluated_at     TIMESTAMPTZ
suspended_reason      TEXT
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```

### `verified_leads`
```sql
id                    UUID PRIMARY KEY
tenant_id             UUID REFERENCES tenants(id)
homeowner_name        TEXT NOT NULL
homeowner_email       TEXT
homeowner_phone       TEXT NOT NULL
property_address      TEXT NOT NULL
property_zip          TEXT NOT NULL
equipment_type        TEXT
equipment_age         INTEGER
estimated_monthly_waste DECIMAL(10,2)
estimated_annual_waste  DECIMAL(10,2)
intent_score          INTEGER CHECK (score >= 0 AND score <= 100)
qualification_notes   TEXT
call_transcript_url   TEXT
call_recording_url    TEXT
report_pdf_url        TEXT
lead_status           TEXT CHECK (status IN ('qualified', 'matched', 'accepted', 'declined', 'closed_won', 'closed_lost', 'nurture'))
matched_supplier_id   UUID REFERENCES verified_suppliers(id)
matched_at            TIMESTAMPTZ
accepted_at           TIMESTAMPTZ
closed_at             TIMESTAMPTZ
close_amount          DECIMAL(10,2)
homeowner_feedback    TEXT
feedback_score        DECIMAL(3,2)
scout_agent_id        TEXT
created_at            TIMESTAMPTZ DEFAULT now()
updated_at            TIMESTAMPTZ DEFAULT now()
```

### `supplier_lead_history`
```sql
id                    UUID PRIMARY KEY
supplier_id           UUID REFERENCES verified_suppliers(id)
lead_id               UUID REFERENCES verified_leads(id)
action                TEXT CHECK (action IN ('offered', 'accepted', 'declined', 'expired'))
response_time_seconds INTEGER
close_result          TEXT CHECK (result IN ('won', 'lost', 'pending'))
close_amount          DECIMAL(10,2)
lead_fee_charged      DECIMAL(10,2)
report_fee_charged    DECIMAL(10,2)
created_at            TIMESTAMPTZ DEFAULT now()
```

### `supplier_score_history`
```sql
id                    UUID PRIMARY KEY
supplier_id           UUID REFERENCES verified_suppliers(id)
evaluation_date       DATE
composite_score       DECIMAL(5,2)
years_score           DECIMAL(5,2)
reputation_score      DECIMAL(5,2)
insurance_score       DECIMAL(5,2)
satisfaction_score    DECIMAL(5,2)
financial_score       DECIMAL(5,2)
engagement_score      DECIMAL(5,2)
bonus_points          DECIMAL(5,2)
badge_status_result   TEXT
notes                 TEXT
created_at            TIMESTAMPTZ DEFAULT now()
```

---

## XIII. REVENUE PROJECTIONS

### Per Verified Supplier (Monthly)

| Revenue Source | Low Estimate | High Estimate |
|---------------|-------------|---------------|
| Subscription (Standard $499) | $499 | $1,499 (Exclusive) |
| Per-lead overage fees ($250/lead) | $0 (uses 5 included) | $2,500 (10 extra leads) |
| Premium Lead Reports ($350 each or $250 bundled) | $1,250 (5 reports) | $5,000 (20 reports) |
| Home Ledger stamps ($9.99/stamp) | $50 (5 jobs) | $200 (20 jobs) |
| **Total per supplier/month** | **$1,799** | **$9,199** |

### At Scale

| Metric | 10 Suppliers | 50 Suppliers | 200 Suppliers |
|--------|-------------|-------------|---------------|
| Subscription revenue | $4,990-$14,990/mo | $24,950-$74,950/mo | $99,800-$299,800/mo |
| Lead report revenue | $12,500-$50,000/mo | $62,500-$250,000/mo | $250,000-$1,000,000/mo |
| **Total monthly** | **$17,490-$64,990** | **$87,450-$324,950** | **$349,800-$1,299,800** |

### Margin Analysis

| Cost | Per Lead |
|------|----------|
| Scout voice agent (Retell/Vapi minutes) | ~$0.50-1.00 |
| Perplexity/web search API calls | ~$0.10 |
| PDF generation (Browserless) | ~$0.10 |
| EIA/utility data lookup | ~$0.05 |
| SMS confirmation | ~$0.02 |
| Claude AI processing | ~$0.50 |
| **Total cost per lead** | **~$1.27-1.77** |
| **Revenue per lead** | **$250-350** |
| **Margin** | **99%+** |

---

## XIV. IMPLEMENTATION PRIORITY

### Phase 1: Foundation (Weeks 1-3)
1. Create `verified_suppliers` and `verified_leads` database tables
2. Build Verified Supplier Composite Score calculation engine
3. Build Scout agent personality in `agent-personalities.ts`
4. Integrate EIA / utility rate data sources

### Phase 2: Home Savings Calculator Form (Weeks 2-4) ← START HERE — fastest to market
5. Build `/home-savings-calculator` multi-step form page
6. Integrate ZIP → utility rate → waste calculation engine
7. Build instant results display with Value Bomb data
8. Build "Get Assessment" vs "Just Email Report" dual CTA flow
9. Build optional callback scheduling with Scout agent pre-load
10. Connect form submissions to `verified_leads` table

### Phase 3: Voice System (Weeks 4-6)
11. Deploy Scout as a Retell/Vapi voice agent
12. Build the conversation flow with real-time data lookups
13. Connect Scout to the lead qualification scoring system
14. Build lead matching algorithm (trade + ZIP + score ranking)
15. Build callback queue (form → scheduled Scout call)

### Phase 4: Reports (Weeks 6-8)
16. Build Premium Lead Report HTML template
17. Integrate PDF generation via Browserless (same pattern as $400 audit)
18. Build report delivery pipeline (email + SMS + supplier dashboard)

### Phase 5: Supplier Dashboard (Weeks 8-10)
19. Add "Verified Leads" spoke to Command Center sidebar
20. Build lead notification + accept/decline flow
21. Build close tracking ("Mark as Closed" button + amount)
22. Build supplier analytics (close rate, average deal size, ROI)

### Phase 6: Billing (Weeks 10-11)
23. Stripe subscription products (Standard/Priority/Exclusive)
24. Per-lead billing integration
25. Report bundle purchasing
26. Supplier application fee processing

---

## XV. OPEN QUESTIONS

1. **Scout's voice provider:** Retell or Vapi? Need to evaluate based on real-time tool calling capability (Scout needs to call APIs mid-conversation).
2. **Lead exclusivity windows:** 2-hour first right of refusal — is that too long? Too short? A/B test.
3. **Homeowner opt-in language:** What exactly does the homeowner consent to? Need legal review on data sharing with contractors.
4. **Geographic rollout:** Start Tampa Bay only? Or launch nationally from day one?
5. **Outbound calling compliance:** TCPA requirements for Scout's proactive calling. Need registered A2P, DNC list checking, time-of-day restrictions.
6. **Verified Supplier cap per ZIP/trade:** Should we limit the number of suppliers per area to maintain exclusivity value? (e.g., max 5 HVAC suppliers per ZIP)
7. **Form vs. Voice conversion rates:** Track which path produces higher close rates. Hypothesis: Voice > Form for close rate, but Form > Voice for volume.

---

## XVI. HOW THIS CHANGES EVERYTHING — MARKETING, POSITIONING, SEO, PITCH

### The Identity Shift

**BEFORE the Verified Supplier Network:**
GL365 = "A verified business directory with an AI operations platform"
Positioning: B2B tool for contractors. Homeowners are passive users of the directory.

**AFTER the Verified Supplier Network:**
GL365 = "The trusted bridge between homeowners and elite contractors — powered by data, verified by accountability"
Positioning: **TWO-SIDED MARKETPLACE**. Homeowners are now ACTIVE customers. GL365 serves BOTH sides.

This is the difference between Yelp (one-sided directory) and Angi/HomeAdvisor (two-sided marketplace). But GL365 is better than both because:
- Yelp doesn't qualify homeowners or verify contractors beyond reviews
- Angi/HomeAdvisor sells leads to anyone who pays — no quality gate
- GL365 qualifies BOTH sides. Only verified suppliers get leads. Only qualified homeowners become leads.

### What Changes on the Homepage

**Current hero:**
"THE UNRIVALED STANDARD IN HOME SERVICES. Curated. Verified. Your Home's Legacy."

**New hero (two audiences on one page):**

```
FOR HOMEOWNERS:
───────────────
"Find Out What Your Home Is Really Costing You"
[Home Savings Calculator CTA button]

Subheadline: "Enter your ZIP code and get a free energy & equipment
analysis — powered by real utility data, not guesswork."


FOR CONTRACTORS:
────────────────
"Stop Chasing Leads. Start Receiving Them."
[Learn About Verified Supplier Network CTA]

Subheadline: "GL365 Verified Suppliers receive pre-qualified homeowners
who already know their numbers and are ready to act."
```

The homepage now has TWO clear paths. The directory listing is still the free front door for contractors. But the homeowner now has their own front door — the Home Savings Calculator.

### What Changes in SEO Content

**New keyword targets (homeowner-facing):**

| Keyword Cluster | Search Intent | GL365 Page |
|----------------|---------------|------------|
| "how much does a new AC cost [city]" | Commercial research | /home-savings-calculator |
| "is my AC too old" | Informational | Blog + Calculator |
| "average electric bill [ZIP]" | Informational | Calculator results page (indexed) |
| "how to lower electric bill [city]" | Informational | Blog + Calculator |
| "best HVAC company near me" + "verified" | Local commercial | Directory + Verified Supplier listings |
| "home energy audit free" | Transactional | /home-savings-calculator |
| "roof replacement ROI" | Commercial research | Blog + Calculator |
| "water heater lifespan" | Informational | Blog + Calculator |
| "home value improvement [city]" | Commercial research | Home Ledger landing page |

**New keyword targets (contractor-facing):**

| Keyword Cluster | Search Intent | GL365 Page |
|----------------|---------------|------------|
| "HVAC leads [city]" | Transactional | /verified-supplier-network |
| "qualified home service leads" | Commercial research | /verified-supplier-network |
| "pre-qualified roofing leads" | Transactional | /verified-supplier-network |
| "best lead generation for contractors" | Commercial research | Blog + VSN landing page |
| "HomeAdvisor alternative" | Comparison | Blog + VSN landing page |
| "Angi leads alternative" | Comparison | Blog + VSN landing page |

**SEO content strategy shift:**
- Previously: All content targets contractors (B2B only)
- Now: 50% homeowner content (B2C) + 50% contractor content (B2B)
- The homeowner content drives calculator traffic → leads → revenue
- The contractor content drives directory signups → badge earning → Verified Supplier applications → subscription revenue

### What Changes in the Pitch Deck / Sales Materials

**For Contractor Sales (Aiden/Ada + Email Sequence):**

The pitch now has a MASSIVE new proof point. Instead of just selling "AI booking + badges + content automation," you're selling **access to the lead pool**:

```
OLD PITCH:
"GL365 helps you automate your operations, build your reputation,
and get found in our directory."

NEW PITCH:
"GL365 has homeowners in your ZIP code who already know their
AC is costing them $1,400/year in wasted energy. They've seen
the numbers. They want a professional assessment. The only
contractors who get access to these homeowners are the ones
who've earned our Verified Supplier Badge. Here's how you
qualify."
```

The $400 Digital Infrastructure Audit now has an even sharper hook:
- Before: "We'll show you what you're missing in your digital presence"
- Now: "We'll show you what you're missing — AND we'll show you the homeowners in your area who are actively looking for help. You just can't reach them yet."

**For Homeowner Marketing (NEW — didn't exist before):**

| Channel | Message | CTA |
|---------|---------|-----|
| **Facebook/Instagram Ads** | "Your [ZIP] electric bill is [X]% higher than it should be. Find out why — free." | → Home Savings Calculator |
| **Google Ads** | "Free Home Energy Analysis for [City] Homeowners — See Your Savings in 60 Seconds" | → Home Savings Calculator |
| **Direct Mail / QR** | "Scan to see how much your home is really costing you" | → Home Savings Calculator |
| **Nextdoor / Community** | "I just found out my AC was costing me $140/month more than it should. Free tool: [link]" (organic post style) | → Home Savings Calculator |
| **Referral** | Verified Suppliers give homeowners a card: "Want to check your other systems? Scan here." | → Home Savings Calculator |

### What Changes in the Email Outreach Sequence

**Email 1 — The Value Bomb gets upgraded:**

Before: "HVAC service searches in 33619 are up 31% this week"
Now: "We ran your ZIP through our Home Savings Calculator this week. There are approximately [X] homes in your service area with equipment over 12 years old — and [Y] of them have already used our calculator to see their waste numbers. You're not on the list of contractors they can reach."

**Email 3 — The Personalized Offer now includes Verified Supplier path:**

"There are two ways to grow with GL365. The first is our Command Center — the operational platform. The second is our Verified Supplier Network — where we send you pre-qualified homeowners who've already seen their numbers and want a professional assessment. Most of our founding members start with the Command Center and earn their way into the Supplier Network within 6-12 months."

### What Changes in the Directory Listing Display

**For Verified Suppliers — their directory listing gets upgraded:**

```
┌──────────────────────────────────────────────┐
│ ★ VERIFIED SUPPLIER ★                         │
│                                               │
│ [Company Name]                                │
│ ⭐ 4.8 (127 reviews) | 52 years in business  │
│                                               │
│ 🛡️ GL365 Verified Supplier                    │
│ 🏆 Elite 365 Seal                             │
│ ✅ Insurance Verified                          │
│ ✅ Background Checked                          │
│ ✅ Accountability Score: 94/100                │
│                                               │
│ "This contractor receives pre-qualified leads │
│ through the GL365 Verified Supplier Network.  │
│ They have earned our highest level of trust." │
│                                               │
│ [REQUEST ASSESSMENT] [CALL NOW] [VIEW PROFILE]│
└──────────────────────────────────────────────┘
```

Non-verified contractors see:
```
┌──────────────────────────────────────────────┐
│ [Company Name]                                │
│ ⭐ 4.2 (23 reviews) | 8 years in business    │
│                                               │
│ 🔒 Not Yet Verified Supplier                  │
│    "This business has not yet qualified for   │
│    the GL365 Verified Supplier Network."      │
│    [LEARN HOW TO QUALIFY →]                   │
│                                               │
│ [CALL NOW] [VIEW PROFILE]                     │
└──────────────────────────────────────────────┘
```

This is the **Negative Light strategy** applied to the Verified Supplier Badge — same psychology as the grayscale badges but at a much higher level. Contractors see their competitors lit up gold with "VERIFIED SUPPLIER" and they want in.

### Brand Voice Evolution

| Aspect | Before | After |
|--------|--------|-------|
| **Tagline** | "The Unrivaled Standard in Home Services" | "The Unrivaled Standard in Home Services" (keep — it works for both sides) |
| **Homeowner-facing voice** | Didn't exist | "Your home advisor. Data-driven. Zero pressure." |
| **Contractor-facing voice** | "We help you automate and get found" | "We send you homeowners who already know they need you" |
| **Trust signal** | "Verified business directory" | "Both sides verified. Homeowner qualified. Contractor vetted." |
| **Competitive positioning** | "Better than Yelp" | "Better than Angi + HomeAdvisor + Yelp combined — because we qualify both sides" |
| **Founder story addition** | Jared's HVAC + kitchen experience | Add: "I've been on both sides of the door. I know what homeowners need to hear, and I know what contractors need to close." |

### What This Does to the Sales Loop

The existing sales loop was:

```
FREE listing → $400 Audit → Tier 1 ($1,500/mo) → Tier 2 → Tier 3 → Elite Seal
```

The NEW sales loop becomes:

```
FREE listing → $400 Audit → Tier 1 ($1,500/mo) → Tier 2 → Tier 3 → Elite Seal
                                                                         │
                                                                         ▼
                                                              Verified Supplier Badge
                                                              ($499-$1,499/mo ADDITIONAL)
                                                                         │
                                                                         ▼
                                                              Pre-Qualified Leads
                                                              ($250-$350 per lead)
                                                                         │
                                                                         ▼
                                                              $$$ Close Deals $$$
                                                              (60-80% close rate)
                                                                         │
                                                                         ▼
                                                              Home Ledger Stamps
                                                              ($9.99/stamp)
                                                                         │
                                                                         ▼
                                                              Homeowner becomes
                                                              GL365 property record
                                                              owner → future leads
                                                              for other trades
```

**The flywheel:**
1. Homeowner uses Calculator → gets qualified → becomes a lead
2. Verified Supplier receives lead → closes deal → stamps Home Ledger
3. Home Ledger now has a verified record → homeowner trusts GL365 more
4. Homeowner uses Calculator again for another system (roof after HVAC)
5. Another Verified Supplier gets that lead
6. The property record grows → home value documented → word of mouth
7. Neighbors hear about it → they use the Calculator
8. More leads → more supplier demand → more applications → more subscription revenue

**This is a self-reinforcing loop. The more homeowners use it, the more valuable the supplier badge becomes. The more suppliers compete for it, the higher the quality bar goes. The higher the quality, the more homeowners trust it.**
