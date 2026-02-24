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
1. Per-lead fee to the contractor ($600 per verified lead — includes Premium Lead Report)
2. Monthly Verified Supplier subscription (access to the lead pool)
3. The $400 Digital Infrastructure Audit still serves as the contractor's entry tripwire
4. Home Ledger stamp fees when the job is completed ($9.99/stamp)

### Why $600/Lead Is Justified (and Conservative)

The industry charges $15-$80 for a raw, unqualified lead that gets sold to 5+ contractors simultaneously. Close rates: 5-15%. That means each closed deal costs $200-$1,600 in lead spend alone.

GL365 leads are different in every measurable way:

| Dimension | Industry Standard (Angi/HomeAdvisor) | GL365 Verified Lead |
|-----------|--------------------------------------|---------------------|
| **Qualification** | Name + phone number. Maybe they're interested. Maybe they were just browsing. | Voice-verified OR form-qualified. Intent score 65+. Equipment age, waste amount, and timeline confirmed. |
| **Data provided** | Name, phone, maybe address | Full Premium Lead Report: name, phone, email, address, equipment details, energy waste analysis, ROI calculator, home value impact, EIA-sourced data, neighborhood comparison |
| **Exclusivity** | Sold to 3-5+ contractors simultaneously. Race to the bottom. | Sold to a maximum of 3 Verified Suppliers in the homeowner's area. Homeowner CHOOSES — not a bidding war. |
| **Homeowner trust** | None — cold lead, knows nothing about the contractor | High — GL365 verified the contractor, homeowner trusts the GL365 recommendation |
| **Close rate** | 5-15% | 60-80% projected (homeowner already knows their numbers, already agreed to assessment, already trusts GL365) |
| **Contractor quality** | Anyone who pays. No vetting. | Must earn Verified Supplier Badge (80/100 composite score). Decades in business. Fully insured. Accountability-verified. |
| **Cost per closed deal** | $200-$1,600+ (many leads needed to close one) | $600-$1,800 (1-3 leads to close one at 60-80% close rate) |

**The math for the contractor:**

Average HVAC replacement job: $8,000-$15,000
Average roofing job: $10,000-$25,000
Average water heater replacement: $2,000-$5,000

At $600/lead with a 70% close rate:
- Cost per closed deal: $857
- Revenue per closed deal: $8,000-$25,000
- **ROI: 833%-2,817%**

At Angi at $30/lead with a 10% close rate:
- Cost per closed deal: $300 (in lead fees alone, not counting wasted time on 9 dead leads)
- But the contractor also wasted 9 sales visits, 9 phone calls, 9 quote sheets on leads that went nowhere
- Real cost per closed deal (including labor): $600-$1,200+

**GL365 at $600/lead with a 70% close rate is actually CHEAPER per closed deal** than Angi at $30/lead with a 10% close rate — when you factor in the contractor's time.

The contractor isn't paying $600 for a name and phone number. They're paying $600 for:
1. A pre-qualified homeowner who ASKED for the assessment
2. A Premium Lead Report that does 80% of the selling
3. A GL365 trust endorsement backing their visit
4. Data that makes the homeowner say "I already knew I needed this"
5. A homeowner who has been shown the EXACT dollar amount they're wasting

**This is a closing tool, not a cold lead. $600 is the deal of a lifetime for a contractor closing $8K-$25K jobs.**

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

## IV-C. LEAD SOURCE #3 — HOME LEDGER ASSET DECAY TRIGGERS (AUTOMATED)

This is the third — and most powerful — lead source. It requires ZERO ad spend, ZERO outbound effort, and produces the warmest leads in the system.

### Why This Is Different

| Lead Source | How It Works | Acquisition Cost | Lead Temperature | Trust Level |
|------------|-------------|-----------------|-----------------|-------------|
| **Home Savings Calculator** (form) | Homeowner finds GL365, fills out form, sees waste numbers, requests assessment | Ad spend + SEO investment | Warm-Hot | Medium — first interaction with GL365 |
| **Scout voice calls** (inbound/outbound) | Homeowner talks to Scout, gets personalized Value Bomb, agrees to visit | Voice minutes + ad spend | Hot | Medium-High — had a conversation |
| **Home Ledger decay triggers** (AUTOMATED) | GL365 already knows their equipment is dying because they're an existing GL365 homeowner. System detects end-of-life approach and reaches out proactively. | **$0** — they're already in the system | **Warmest possible** | **Maximum** — they already trust GL365, they already have a property record, they've already used the platform |

Lead Source #3 is the **zero-cost acquisition flywheel**. This is what makes GL365 impossible to replicate.

### How Home Ledger Asset Data Gets Created

Equipment age and condition data enters the Home Ledger from multiple sources:

| Data Source | How It Gets In | Accuracy |
|------------|---------------|----------|
| **Contractor stamp data** | Verified Supplier completes a GL365-referred job → stamps the Home Ledger with equipment installed, model, warranty date, expected lifespan | High — verified by the contractor who did the work |
| **Homeowner self-report** | Homeowner fills out the Home Savings Calculator → equipment age entered | Medium — homeowner's best estimate |
| **Scout conversation** | Scout asks "How old is your AC?" during qualification → data logged | Medium — conversational estimate |
| **Filing Cabinet voice notes** | Homeowner or contractor voice-logs equipment details through GL365 Brain | Medium — natural language parsed |
| **Public property records** | Permit data (new roof permits, HVAC permits) → estimated install date | High — government records |
| **Previous incident reports** | "Water heater leak" logged 3 years ago → water heater age estimated | Low-Medium — inference |

### The Automated Decay Detection Engine

Runs as a monthly cron job that scans ALL Home Ledger records:

```
MONTHLY SCAN: equipment_lifecycle_check

FOR EACH property IN home_ledger WHERE has_equipment_data = true:

  FOR EACH asset IN property.asset_inventory:

    age = NOW() - asset.install_date
    lifespan = INDUSTRY_STANDARD_LIFESPAN[asset.type]
    life_percentage = age / lifespan

    IF life_percentage >= 0.85:
      ── APPROACHING END OF LIFE ──
      → Trigger: "Awareness" email
      → Subject: "Your [asset.type] at [address] is [age] years old"
      → Contains: Personalized Value Bomb with THEIR numbers
      → CTA: "See what homes like yours are saving with modern equipment"
      → Links to pre-filled Home Savings Calculator
      → Tag: decay_awareness_sent

    IF life_percentage >= 0.95:
      ── ENTERING FAILURE ZONE ──
      → Trigger: "Urgency" email
      → Subject: "Your [asset.type] is [X]% past its expected lifespan"
      → Contains: Emergency replacement cost comparison
      → Key line: "Emergency replacement costs 30-50% more than planned"
      → CTA: "Get a free assessment before it's an emergency"
      → Tag: decay_urgency_sent

    IF life_percentage >= 1.10:
      ── OVERDUE — HIGH FAILURE RISK ──
      → Trigger: "Final notice" email + optional Scout outbound call
      → Subject: "Most [asset.type] units your age have already been replaced"
      → Contains: Full Value Bomb + neighborhood comparison
      → CTA: "Connect with a GL365 Verified Contractor — free assessment"
      → Tag: decay_critical_sent
      → Queue for Scout outbound if phone number on file

  END FOR

END FOR
```

### The Decay Email Sequence

**Email 1: Awareness (85% of lifespan)**

```
Subject: Your AC at [123 Main St] is entering its final years

Hey [Name],

Just a heads-up from your GreenLine365 Home Ledger. Your [AC/HVAC
system] was installed approximately [X] years ago. The industry-
standard lifespan for that type of unit is [Y] years — which means
yours is about [Z]% through its expected life.

Here's what that means for your wallet right now:

  Monthly energy waste (vs. modern unit): ~$[amount]/mo
  Annual waste: ~$[amount × 12]/yr
  Projected waste over next 2 years: ~$[amount × 24]

These numbers are based on EIA utility data for your ZIP code
([ZIP]) and equipment lifecycle standards from [ASHRAE/ACCA/NRCA].

No action needed right now — just wanted you to have the data.
The numbers are the numbers.

[SEE YOUR FULL HOME SAVINGS REPORT →]

— Scout, GreenLine365 Home Advisor
```

**Email 2: Urgency (95% of lifespan)**

```
Subject: Your [system] is now [X]% past its expected lifespan

Hey [Name],

Quick update on your [system] at [address]. It's now [age] years
old — [X]% through its expected [lifespan]-year lifespan.

Here's the part most homeowners don't know: when these units fail
unexpectedly, the emergency replacement typically costs 30-50%
more than a planned replacement. That's the difference between
a $[planned] planned upgrade and a $[emergency] emergency call
on the hottest/coldest day of the year.

Your current monthly waste estimate has gone up to ~$[amount]/mo
compared to homes your size with modern equipment.

If you want a professional to take a look — no pressure, no
obligation — we can connect you with a GL365 Verified Contractor
who will give you an honest assessment.

[GET A FREE ASSESSMENT →]   [JUST SEND ME THE UPDATED NUMBERS →]

— Scout, GreenLine365 Home Advisor
```

**Email 3: Critical (110%+ of lifespan)**

```
Subject: [Name], your [system] has outlived its expected lifespan

Hey [Name],

Your [system] at [address] is now [age] years old. The expected
lifespan was [lifespan] years. Most units this age have already
been replaced.

I'm not saying this to scare you — the numbers are the numbers.
Here's where you stand:

  Monthly waste: ~$[amount]/mo
  Annual waste: ~$[amount × 12]/yr
  Emergency replacement premium: +$[diff] vs. planned
  Home value impact of upgrading: +$[value_increase]

Over the past [months since first email] months since we first
flagged this, you've spent approximately $[cumulative_waste] more
than you needed to on energy alone.

If you'd like a Verified Contractor to take a look, the
assessment is free and there's zero obligation. These are
contractors we've personally vetted — decades in business,
insured, and accountability-verified on our platform.

[CONNECT ME WITH A VERIFIED CONTRACTOR →]

[I'M NOT READY — JUST KEEP ME UPDATED →]

— Scout, GreenLine365 Home Advisor
```

### Why This Is the Highest-Converting Lead Source

1. **Pre-existing trust.** The homeowner already has a GL365 account. They've already interacted with the platform. They didn't arrive from a cold ad — they're an existing relationship.

2. **Personalized data over time.** GL365 has been tracking their equipment for months or years. The emails contain THEIR specific address, THEIR specific equipment age, THEIR specific ZIP code energy data. This isn't generic marketing — it's a personalized home intelligence report delivered exactly when it's relevant.

3. **Escalating urgency with real math.** Each email shows the cumulative waste since the last email. "Since we first flagged this 6 months ago, you've spent approximately $840 more than you needed to." That number only goes up. The math does the selling.

4. **Zero acquisition cost.** The homeowner is already in the system. The email costs $0.001 to send. The data lookup is automated. No ad spend. No voice minutes. No outbound calling cost. Pure margin.

5. **Cross-sell engine.** When a homeowner gets their HVAC replaced through GL365, the system immediately starts monitoring their next-oldest asset. "Your roof is 18 years old..." The property record creates a perpetual lead machine across all trade categories.

### The Cross-Sell Flywheel

```
Homeowner creates GL365 profile (even just as a directory visitor)
        │
        ▼
Links their address → Home Ledger activated
        │
        ▼
Home Ledger captures equipment data from:
  - Contractor stamp data (previous verified jobs)
  - Home Savings Calculator submissions
  - Scout conversations
  - Filing Cabinet voice notes
  - Public property records (permit data)
        │
        ▼
Equipment lifecycle engine runs monthly:
  "HVAC: 14 years old (93% of expected life)"
  "Roof: 18 years old (72% of expected life)"
  "Water heater: 11 years old (110% — OVERDUE)"
        │
        ▼
Decay trigger fires for water heater (overdue)
        │
        ▼
Personalized Value Bomb email sent with their numbers
        │
        ▼
Homeowner clicks "Get Assessment" → Verified Lead created
        │
        ▼
Verified Supplier replaces water heater → stamps Home Ledger
        │
        ▼
6 months later: HVAC hits 85% threshold → awareness email
        │
        ▼
12 months later: HVAC hits 95% threshold → urgency email
        │
        ▼
Homeowner converts again → another lead, another trade
        │
        ▼
3 years later: Roof hits 85% threshold → awareness email
        │
        ▼
Same homeowner, THIRD lead, THIRD trade category
```

**One homeowner. Three leads. Three different Verified Suppliers. Three lead fees. Three Home Ledger stamps. Zero acquisition cost on leads #2 and #3.**

This is the flywheel Angi and HomeAdvisor can't build. They don't own the property record. They don't track equipment age. They don't know when it's about to die. They sell the same homeowner to 5 contractors every time they search "HVAC repair near me." GL365 reaches the homeowner BEFORE the emergency — when they still have time to plan, compare, and choose the Verified Supplier who shows up with data instead of a pitch.

### Database Requirements for Decay Engine

```sql
-- New fields on the properties / home_ledger table
asset_inventory JSONB    -- Array of { type, install_date, estimated_age, brand, model, last_inspected, data_source, confidence }

-- New table: decay_trigger_log
CREATE TABLE decay_trigger_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     UUID REFERENCES properties(id),
  asset_type      TEXT NOT NULL,
  asset_age_years DECIMAL(4,1),
  lifespan_years  INTEGER,
  life_percentage DECIMAL(5,2),
  trigger_level   TEXT CHECK (trigger_level IN ('awareness', 'urgency', 'critical')),
  email_sent_at   TIMESTAMPTZ,
  email_opened    BOOLEAN DEFAULT false,
  cta_clicked     BOOLEAN DEFAULT false,
  lead_created    BOOLEAN DEFAULT false,
  lead_id         UUID REFERENCES verified_leads(id),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Index for monthly scan performance
CREATE INDEX idx_decay_trigger_property ON decay_trigger_log(property_id, asset_type, trigger_level);
```

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
| **Verified Supplier Monthly** | $499/mo | Access to the qualified lead pool. Includes up to 3 lead reports/month. |
| **Per-Lead Fee** | $600/lead | Every lead includes the full Premium Lead Report. No stripped-down version. |
| **Lead Bundle (5-pack)** | $2,500 ($500/each) | Discounted bulk purchase. Leads don't expire. |
| **Lead Bundle (10-pack)** | $4,500 ($450/each) | Higher volume discount. For suppliers doing real volume. |

### The 3-Contractor Competitive Model — Homeowner Chooses

**Every qualified lead goes to the TOP 3 Verified Suppliers** in the homeowner's area for that trade. All 3 contractors pay the $600 lead fee. The homeowner receives information on all 3 and CHOOSES who they want to come out.

This model is better for everyone:

**For the homeowner:**
- Gets 3 options, not 1 — feels empowered, not locked in
- All 3 are GL365 Verified — no bad options, just different strengths
- Can compare years in business, reputation scores, specialties
- "We're sending you our top 3 Verified Contractors. Look them over and pick the one that feels right." ← zero pressure

**For the contractor:**
- Yes, they're competing — but only against 2 other verified companies, not 5+ random guys from Angi
- The competition is QUALITY-based (reputation score, years in business, badges) not PRICE-based
- Even if the homeowner picks someone else, the contractor's profile was shown — brand awareness
- Close rate per lead drops slightly (estimated 40-50% per contractor), but the math still works at $600

**For GL365:**
- 3 × $600 = **$1,800 per qualified lead** in total revenue
- If the lead came from a decay trigger (Source #3): $1,800 revenue at $0 acquisition cost
- The competitive model makes contractors WANT to improve their scores to rank higher
- Higher scores = better service = happier homeowners = more referrals = more leads

**The math for the contractor with the 3-contractor model:**

At $600/lead with a 45% close rate (lower because 3 competing):
- Average leads to close one deal: 2.2 leads
- Cost per closed deal: $1,333
- Revenue per closed deal: $8,000-$25,000
- **ROI: 500%-1,775%**

Still better than Angi's real cost-per-close. And the contractor only spent time on 2.2 leads to get a close — not 10+ dead leads.

### What the Supplier Gets Per Lead

1. **Homeowner name, phone, email, address** — verified by Scout or form
2. **Equipment details** — age, type, condition as reported by homeowner
3. **Waste calculation** — monthly/yearly waste amount, break-even timeline
4. **Intent score** — 0-100, with qualification notes
5. **Premium Lead Report PDF** — the closing tool the tech carries to the door (ALWAYS included at $600)
6. **Conversation transcript** (voice leads) — full call recording + AI summary
7. **Best time for visit** — homeowner's preferred window
8. **Competitive position** — "You are 1 of 3 Verified Suppliers presented to this homeowner. Your ranking is based on your Verified Supplier Composite Score."

### Lead Matching Logic

When a lead is qualified:
1. Match **trade** (HVAC, plumbing, roofing, electrical)
2. Match **ZIP code** (supplier's service area)
3. Match **availability** (supplier's current job load from Command Center calendar)
4. Rank by **Verified Supplier Composite Score** (higher score = ranked #1)
5. Top 3 qualifying suppliers in the area receive the lead simultaneously
6. All 3 are charged the $600 lead fee upon acceptance
7. If fewer than 3 suppliers qualify in the area → lead goes to whoever is available (minimum 1)
8. If a supplier declines within 4 hours → next-ranked supplier gets offered
9. Homeowner receives a comparison card showing all 3 contractors' GL365 profiles

### The Homeowner Comparison Card (sent via email + SMS)

```
YOUR GL365 VERIFIED CONTRACTORS
────────────────────────────────

Based on your [equipment type] assessment at [address],
here are the top-rated GL365 Verified Contractors in your area:

┌─────────────────────────────────────────┐
│ #1  [Company Name]                      │
│     ★★★★★ 4.9 (189 reviews)            │
│     47 years in business                │
│     GL365 Score: 96/100                 │
│     Specialty: [trade]                  │
│     [VIEW PROFILE]  [REQUEST VISIT]     │
├─────────────────────────────────────────┤
│ #2  [Company Name]                      │
│     ★★★★★ 4.7 (94 reviews)             │
│     28 years in business                │
│     GL365 Score: 88/100                 │
│     Specialty: [trade]                  │
│     [VIEW PROFILE]  [REQUEST VISIT]     │
├─────────────────────────────────────────┤
│ #3  [Company Name]                      │
│     ★★★★☆ 4.5 (62 reviews)             │
│     15 years in business                │
│     GL365 Score: 82/100                 │
│     Specialty: [trade]                  │
│     [VIEW PROFILE]  [REQUEST VISIT]     │
└─────────────────────────────────────────┘

All three contractors are GL365 Verified Suppliers —
vetted, insured, and accountability-verified.
Choose the one that feels right for you.

Questions? Reply to this email or call [number].
```

### Subscription Tiers

| Tier | Included Leads/Month | Positioning | Monthly Subscription |
|------|---------------------|-------------|---------------------|
| **Standard Supplier** | 3 included | Competes as 1 of 3 | $499/mo |
| **Priority Supplier** | 8 included | Ranked higher in the top 3 (score boosted +5 in matching algorithm) | $799/mo |
| **Exclusive Supplier** | 15 included | Exclusive leads available (1 contractor, $900/lead for exclusives) | $1,499/mo |

**Exclusive leads:** For high-intent leads (score 90+), Exclusive tier suppliers can claim the lead exclusively — no competition. The homeowner still gets the same quality experience but with 1 contractor. These cost $900/lead because there's no competition. The contractor gets a 100% addressable market on that lead.

### The Losing Contractor Credit — "Good Faith Guarantee"

When 3 contractors compete for a lead and the homeowner chooses 1, the 2 losing contractors receive a **$250 credit** toward their next lead. This is critical for retention and fairness.

**Why this works:**

1. **For the contractor:** Takes the sting out of "losing." They paid $600, didn't get the job, but they get $250 back. Their real cost for that lost lead was $350 — essentially a brand awareness fee for being shown to a qualified homeowner who now knows their name and GL365 score.

2. **For GL365 retention:** Without a credit, contractors who lose 2-3 leads in a row might rage-quit the platform. The credit keeps them in the game and incentivizes them to improve their score (higher score = ranked #1 = more likely to be chosen).

3. **For the math:**
   - GL365 collects: 3 × $600 = $1,800
   - GL365 credits back: 2 × $250 = $500
   - GL365 net per lead: **$1,300** (still 99.9% margin on a ~$1.50 cost basis)
   - Winning contractor paid: $600 net (got the job)
   - Losing contractors paid: $350 net each (got a credit + brand exposure)

4. **Credit rules:**
   - Credit is applied to the NEXT lead accepted (not refunded in cash)
   - Credits expire after 90 days (use it or lose it — keeps them engaged)
   - Credits stack up to $750 max (3 losses in a row = next lead costs $600 - $750 = effectively FREE + $150 toward the one after)
   - If a contractor declines a lead (doesn't accept it), NO credit — only for accepted leads where the homeowner chose someone else
   - Exclusive tier leads: no credit needed (only 1 contractor)

**The psychology:** "You didn't lose $600 — you invested $350 in brand awareness with a qualified homeowner, and you got $250 toward your next win." That framing keeps contractors positive about the platform even when they don't close.

### Anti-Gaming Protections (Preventing Credit Scams)

The 3-contractor model with credits creates a potential attack vector: two friendly contractors coordinate so one always "wins" and the other collects credits. Here's how the system prevents this:

**1. Active Homeowner Selection Required**
Credits only trigger when the homeowner explicitly clicks "Request Visit" on the comparison card for a DIFFERENT contractor. No passive timeouts, no auto-credits. A real human made a real choice.

**2. Close Verification Gate**
The winning contractor must record a close status (`closed_won` or `closed_lost`) within 30 days. If no close status is recorded → NO credits are issued to anyone. This prevents fake "wins" where nobody actually does the work.

**3. Collusion Pattern Detection**
The system tracks which contractors appear together on leads and who wins. If 2 suppliers appear on 5+ leads together AND the same one wins 80%+ of the time → **automatic review**. Both contractors receive a warning. If the pattern continues → credit pairing suspended (they stop being matched on the same leads).

```sql
-- Collusion detection query (runs weekly as part of decay-scanner cron)
SELECT
  a.supplier_id AS always_wins,
  b.supplier_id AS always_loses,
  COUNT(*) AS shared_leads,
  SUM(CASE WHEN a.close_result = 'won' THEN 1 ELSE 0 END) AS a_wins,
  ROUND(SUM(CASE WHEN a.close_result = 'won' THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100) AS win_rate
FROM supplier_lead_history a
JOIN supplier_lead_history b ON a.lead_id = b.lead_id AND a.supplier_id != b.supplier_id
WHERE a.action = 'accepted' AND b.action = 'accepted'
GROUP BY a.supplier_id, b.supplier_id
HAVING COUNT(*) >= 5
  AND ROUND(SUM(CASE WHEN a.close_result = 'won' THEN 1 ELSE 0 END)::decimal / COUNT(*) * 100) >= 80;
```

**4. Per-Pair Credit Cap**
A contractor can receive a maximum of 3 credits from leads where the SAME winning contractor beat them. After 3 → the system stops pairing those two on the same leads. This prevents long-term collusion even if it starts below the detection threshold.

**5. Non-Transferable, Non-Refundable**
Credits can ONLY be applied to the next lead fee. Cannot be cashed out. Cannot be transferred to another contractor. Cannot be applied to subscription fees. This removes the financial incentive for gaming — you can only "win" a cheaper lead, not actual money.

**6. Homeowner Feedback Correlation**
After the assessment visit, the homeowner rates their experience. If "losing" contractors consistently show patterns where the homeowner says "I was already contacted by someone else" or "I never heard from the contractor I chose" — that's a signal the homeowner was pre-steered. Flagged for investigation.

**7. Geographic Separation (Soft Rule)**
If only 3 Verified Suppliers exist in a ZIP code for a given trade, the matching algorithm notes this as a "limited pool" and applies stricter collusion monitoring. In markets with 5+ suppliers, the top 3 rotate more naturally.

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

### Per Qualified Lead (Revenue to GL365)

Remember: every qualified lead goes to 3 contractors. Each pays $600.

| Revenue Source | Per Lead | Notes |
|---------------|----------|-------|
| Lead fee (Contractor #1) | $600 | Ranked #1 by Composite Score |
| Lead fee (Contractor #2) | $600 | Ranked #2 |
| Lead fee (Contractor #3) | $600 | Ranked #3 |
| **Total per qualified lead** | **$1,800** | Before subscription revenue |

For Exclusive tier leads (score 90+, claimed by Exclusive supplier):
| Lead fee (single contractor) | $900 | Exclusive — no competition |

### Per Verified Supplier (Monthly)

| Revenue Source | Low Estimate | High Estimate |
|---------------|-------------|---------------|
| Subscription (Standard $499) | $499 | $1,499 (Exclusive) |
| Per-lead fees ($600/lead) | $1,800 (3 leads) | $9,000 (15 leads) |
| Home Ledger stamps ($9.99/stamp) | $50 (5 jobs) | $200 (20 jobs) |
| **Total per supplier/month** | **$2,349** | **$10,699** |

### Per Qualified Lead (GL365 Total Revenue)

| Lead Source | Acquisition Cost | Revenue (3 × $600) | Margin |
|------------|-----------------|---------------------|--------|
| Home Savings Calculator (ad-driven) | $15-50 per lead (ad spend) | $1,800 | 97-99% |
| Scout voice (inbound from ad/QR) | $20-60 per lead (ad spend + voice minutes) | $1,800 | 96-99% |
| Scout voice (outbound) | $2-5 per lead (voice minutes only) | $1,800 | 99.7% |
| **Home Ledger decay trigger** | **$0.01** (email send cost) | **$1,800** | **99.99%** |

### At Scale

| Metric | 10 Suppliers | 50 Suppliers | 200 Suppliers |
|--------|-------------|-------------|---------------|
| Subscription revenue | $4,990-$14,990/mo | $24,950-$74,950/mo | $99,800-$299,800/mo |
| Lead fee revenue (per supplier avg 5 leads/mo × $600) | $30,000/mo | $150,000/mo | $600,000/mo |
| Home Ledger stamps | $500-$2,000/mo | $2,500-$10,000/mo | $10,000-$40,000/mo |
| **Total monthly** | **$35,490-$46,990** | **$177,450-$234,950** | **$709,800-$939,800** |

**Note:** These numbers are per-supplier. Because each lead is sent to 3 suppliers, the lead fee revenue is 3× per qualified homeowner. At 200 suppliers handling ~330 qualified homeowners/month (each sent to 3 suppliers = ~1,000 lead deliveries), the lead fee pool alone is $600K/mo.

### Margin Analysis

| Cost | Per Lead |
|------|----------|
| Scout voice agent (Retell/Vapi minutes) | ~$0.50-1.00 |
| Perplexity/web search API calls | ~$0.10 |
| PDF generation (Browserless) | ~$0.10 |
| EIA/utility data lookup | ~$0.05 |
| SMS confirmation (homeowner + 3 contractors) | ~$0.08 |
| Claude AI processing | ~$0.50 |
| Email sends (homeowner + 3 contractors) | ~$0.01 |
| **Total cost per qualified lead** | **~$1.34-1.84** |
| **Revenue per qualified lead** | **$1,800** (3 contractors × $600) |
| **Margin** | **99.9%** |

For decay-triggered leads (Source #3), the cost drops to ~$0.52 (no voice minutes, no ad spend).

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
                                                              ($600 per lead)
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
