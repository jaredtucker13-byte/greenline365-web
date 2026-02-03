# GREENLINE365: THE PROJECT BIBLE (V1.0)
## The Property Intelligence Engine for Home Services

**Document Status:** Master Specification  
**Last Updated:** February 2026  
**Purpose:** Single Source of Truth for Platform Development

---

# I. THE ARCHITECTURAL CORE: "PROPERTY-FIRST"

Unlike standard CRMs, Greenline365 anchors all data to the **Physical Address**.

## The Moat
We track equipment age, service history, and "Relationship Scores" (CRS) for the **property**, regardless of whether the tenant or owner changes.

## The Goal
Superhuman memory that makes the contractor look like they personally remember every house they've ever visited.

## Database Foundation
```
properties (anchor)
    ├── contacts (people linked to property)
    ├── assets (equipment with JSONB metadata)
    ├── interactions (call history, service records)
    └── industry_configs (decay rules, verification prompts)
```

---

# II. THE WEBHOOK NERVOUS SYSTEM

The system relies on **five critical webhooks** operating in parallel.

## Webhook 1: Inbound Call (Pre-Greeting)

| Attribute | Value |
|-----------|-------|
| **Trigger** | BEFORE the agent speaks |
| **Latency Target** | < 500ms |
| **Endpoint** | `/functions/v1/pre-greeting` (Edge Function) |

### Fetches:
- Property history (address → property → assets)
- Asset age (HVAC/Plumbing/Roof/Electrical)
- Weather data (OpenWeather API with 5-min cache)
- CRS (Customer Relationship Score: 0-100)
- Voice Toggle (Professional vs. Witty)
- First 3 Absolute Date slots from Cal.com

### Returns to Retell:
```json
{
  "is_new_caller": boolean,
  "has_property_history": boolean,
  "contact_name": string,
  "property_address": string,
  "primary_asset": { type, brand, install_year, confidence_score },
  "relationship_score": number,
  "vibe_category": "stranger" | "regular" | "vip",
  "weather": { temp, alerts, recommendation },
  "available_slots": ["2026-02-04T10:00:00", ...],
  "voice_mode": "professional" | "witty"
}
```

---

## Webhook 2: Emergency Alert (Real-Time - Parallel)

| Attribute | Value |
|-----------|-------|
| **Trigger** | 30 seconds into call with "Emergency" intent detected |
| **Mission** | Ping owner's Commander Dashboard while AI continues talking |
| **Endpoint** | `/api/emergency-alert` |

### Emergency Keywords (by industry):
- **Electrical:** sparks, burning smell, no power, shock, electrical fire
- **Plumbing:** flooding, burst pipe, sewage, no water, gas smell
- **HVAC:** no air, no heat, smoke, gas leak, carbon monoxide
- **Roofing:** leak, storm damage, tree fell, hole in roof

### Actions:
1. Send push notification to Commander Dashboard
2. Send SMS to owner's mobile
3. Display "Emergency in Progress" banner with caller details
4. Enable "One-Tap Swap" button for schedule rearrangement

---

## Webhook 3: Function Call (DURING Call)

| Attribute | Value |
|-----------|-------|
| **Trigger** | AI requests tool execution mid-conversation |
| **Endpoint** | `/api/mcp` |
| **Latency Target** | < 2 seconds per tool |

### Available Tools:
| Tool | Purpose |
|------|---------|
| `lookup_property_by_address` | Fuzzy search for property history |
| `get_property_assets` | Retrieve equipment for property |
| `verify_asset` | Update asset after customer confirmation |
| `create_property` | Register new property |
| `create_contact` | Add new contact linked to property |
| `check_availability` | Get Cal.com slots |
| `create_booking` | Book appointment |
| `reschedule_booking` | Move appointment |
| `cancel_booking` | Cancel appointment |
| `send_sms` | Send generic SMS |
| `send_meeting_confirmation` | Send booking confirmation |
| `send_value_bomb` | Send helpful resource link |
| `request_contact_info` | Request details via SMS |
| `transfer_to_human` | Connect to human specialist |
| `log_interaction` | Record call details |

---

## Webhook 4: Call Analyzed (AFTER Call)

| Attribute | Value |
|-----------|-------|
| **Trigger** | Call ends, Retell sends `call_analyzed` event |
| **Status** | **MANDATORY** |
| **Endpoint** | `/api/retell/webhook` |

### Extracts:
- **Sentiment:** Happy / Neutral / Frustrated
- **Call Summary:** AI-generated synopsis
- **Transcript:** Full conversation
- **Intent:** What the customer wanted

### Actions:
1. Update CRS score based on sentiment
2. Log interaction to property history
3. **Retention Trigger:** If Sentiment = Negative → "Relationship Save" alert to owner
4. Update `last_contact_date` on contact record
5. Increment `total_interactions` counter

### CRS Update Logic:
```
sentiment = "positive" → CRS += 5 (max 100)
sentiment = "neutral"  → CRS unchanged
sentiment = "negative" → CRS -= 3 (min 0) + Alert triggered
```

---

## Webhook 5: External Sync (Cal.com/Stripe)

| Attribute | Value |
|-----------|-------|
| **Trigger** | Customer reschedules via email OR pays invoice externally |
| **Endpoint** | `/api/webhooks/calcom` and `/api/webhooks/stripe` |

### Cal.com Events:
- `BOOKING_CREATED` → Update property `last_service_date`
- `BOOKING_RESCHEDULED` → Update booking record
- `BOOKING_CANCELLED` → Mark booking cancelled, trigger follow-up

### Stripe Events:
- `invoice.paid` → Update property `lifetime_value`
- `invoice.payment_failed` → Alert owner

---

# III. THE "CONCIERGE CALLBACK" & SCHEDULING ENGINE

The system handles scheduling with **"Contractor Logic"** (Managing expectations).

## The Guided Choice
AI offers **3 slots**, then asks:
> "What generally works best for you?"

This gives customer agency while keeping options manageable.

## The Absolute Date Rule
**All communication with Cal.com must use Absolute ISO-8601 dates.**

AI must clarify ambiguous references:
- "Today" → "Tuesday, February 4th"
- "Next Thursday" → "Thursday, February 13th"
- "Morning" → "Between 8 AM and 12 PM"

### Slot Presentation Format:
```
"I have availability:
 - Tomorrow, Wednesday the 5th at 9:00 AM
 - Thursday the 6th at 2:00 PM  
 - Friday the 7th at 10:30 AM

Which works best for your schedule?"
```

## The 15-Minute Promise (Emergency Protocol)

In an emergency, the AI:
1. **Gathers intelligence** (site symptoms, safety issues)
2. **Promises update callback** within 15-minute window
3. **Triggers Emergency Alert webhook** to ping owner

Script:
> "I completely understand this is urgent. Let me get this information to our dispatch team right now. Someone will call you back within 15 minutes with a concrete plan. In the meantime, [safety instruction based on emergency type]."

## The Dispatch Companion (The Swap)

### System Logic:
1. Emergency detected → Scan calendar for **Low-Priority jobs** (maintenance, inspections)
2. Identify swap candidates
3. Present owner with **"One-Tap Swap"** option in Commander Dashboard
4. If approved:
   - Move maintenance customer to later slot
   - Send **"Flex-Credit" SMS** to maintenance customer
   - Slot emergency into freed time

### Flex-Credit SMS Template:
```
Hi [Name]! Due to an emergency, we need to reschedule 
your maintenance appointment from [original time] to [new time].

As a thank-you for your flexibility, we're adding a 
$25 Flex Credit to your account for future service.

Reply YES to confirm or call us for alternatives.
- [Company Name]
```

---

# IV. INTELLIGENCE GATHERING (The "Transition" Questions)

While the owner is being alerted (parallel), the AI asks these **high-value questions** to prepare the tech:

## Question 1: Access
> "Will there be someone over the age of 18 there to let the tech in, or do we have a gate code or lockbox?"

**Why:** Prevents wasted trips if no one's home.

## Question 2: Safety
> "Is there any active leaking, standing water, or smell of smoke we should be aware of for the tech's safety?"

**Why:** Tech comes prepared with right equipment; liability protection.

## Question 3: Location
> "Where is the [unit/pipe/panel/access point] located? Attic, crawlspace, garage, backyard?"

**Why:** Tech knows what ladders/tools to bring.

## Question 4: History (If New Caller)
> "Have you had any previous work done on this system that we should know about?"

**Why:** Identifies potential code violations or DIY work.

---

# V. THE PRICING & MODULE ARCHITECTURE

To build a system that scales, we use a **Base + Module** model.

## 1. The Core Engine (The "Founding 30" Package)

| Component | Price |
|-----------|-------|
| **Setup Fee** | $2,500 ($1,250 Upfront / $1,250 on Activation) |
| **Monthly Subscription** | $1,000/month |

### Includes:
- Primary AI Agent (Receptionist persona)
- Property Intelligence Fetch (Pre-Greeting)
- A2P Compliance Setup
- Basic Scheduling (Cal.com integration)
- SMS Confirmations
- CRS Tracking
- Weather Integration
- Commander Dashboard (Basic)

---

## 2. Add-On Modules (The Upsell)

| Module | Feature | Price |
|--------|---------|-------|
| **The Dispatch Companion** | Dynamic "Swap" Logic & Emergency Rescheduling | +$250/mo |
| **Proactive Weather Engine** | AI triggers SMS alerts/outbound based on storms/freezes | +$150/mo |
| **Multi-Agent Expansion** | Extra agents for different departments (Sales vs. Service) | +$200/mo per agent |
| **Advanced CRM Sync** | Full bi-directional sync with ServiceTitan/Housecall Pro | +$300/mo |
| **Sentiment Analytics** | Detailed sentiment reports + Relationship Save alerts | +$100/mo |
| **Custom Persona Training** | Unique voice/personality for brand | +$500 one-time |

---

## 3. The "Everything" System (The Elite Partner)

For the client who wants the **full operational brain**:

| Component | Price |
|-----------|-------|
| **Setup** | $5,000 (White-glove data migration + Custom Persona training) |
| **Monthly** | $1,850 - $2,250/mo (Based on fleet size: 1-3 trucks vs. 4+ trucks) |

### Includes Everything Plus:
- Unlimited AI agents
- Full CRM bi-directional sync
- Dispatch Companion
- Weather Engine
- Custom persona
- Priority support
- Quarterly strategy calls

### Value Proposition:
> "This replaces a full-time office manager, saving the owner $4,000-$5,000/month while providing 24/7 coverage."

---

# VI. DEVELOPER GUARDRAILS

## The Wit Toggle

Dashboard switch to move between:
- **"Strictly Professional"** - No jokes, formal language, "Sir/Ma'am"
- **"Witty Concierge"** - Self-aware humor, local flavor, casual warmth

### Implementation:
```json
// In business settings
{
  "voice_mode": "professional" | "witty",
  "humor_enabled": boolean,
  "local_flavor_enabled": boolean
}
```

### Pre-Greeting includes `voice_mode` in response, agent adjusts accordingly.

---

## Sentiment Empathy Override

**If sentiment is detected as "Panic" or "Distress":**
- AI **automatically drops Wit mode**
- Switches to **"High Reassurance"** mode
- Uses calming language, clear instructions
- Does NOT attempt humor

### Detection Keywords:
- "scared", "terrified", "dangerous", "kids", "baby", "fire", "flooding"
- Raised voice / rapid speech (if audio analysis available)

### Override Script:
> "I hear you, and I want you to know we're taking this seriously. Let's make sure everyone is safe first. [Safety instruction]. Now, I'm getting help dispatched to you right now."

---

## A2P Compliance Wizard

**Mandatory UI** for clients to submit Brand/EIN data before system goes live.

### Required Fields:
- Legal Business Name
- DBA (if applicable)
- EIN (Employer Identification Number)
- Business Address
- Business Phone
- Website URL
- Use Case Description
- Sample Messages

### Workflow:
1. Client completes wizard
2. System validates EIN format
3. Submission sent to Twilio/carrier
4. Status tracked: `pending` → `submitted` → `approved` / `rejected`
5. **Voice services can go live BEFORE A2P approval**
6. **SMS services require A2P approval**

### Status Display:
```
┌─────────────────────────────────────┐
│ A2P Registration Status             │
│                                     │
│ Brand: Tampa Electric LLC     ✅    │
│ EIN: **-***1234              ✅    │
│ Campaign: Service Notifications     │
│ Status: PENDING APPROVAL            │
│ Submitted: Feb 3, 2026              │
│ Est. Approval: Feb 13, 2026         │
└─────────────────────────────────────┘
```

---

# VII. THE COMMANDER DASHBOARD

## Core Features:

### 1. Live Call Monitor
- Real-time transcript streaming
- Sentiment indicator (green/yellow/red)
- "Listen In" button (silent monitoring)
- "Whisper" button (speak to AI only)
- "Barge In" button (take over call)

### 2. Emergency Alert Panel
- Flashing banner when emergency detected
- Caller details + property history
- "One-Tap Swap" button
- Direct callback button

### 3. Daily Schedule View
- Cal.com integration
- Color-coded by priority (Emergency/Standard/Maintenance)
- Drag-and-drop rescheduling
- Tech assignment

### 4. Property Intelligence Feed
- Recent calls by property
- CRS trends
- Equipment alerts (aging assets)
- Weather-triggered proactive list

### 5. Performance Metrics
- Calls handled today
- Booking conversion rate
- Average call duration
- Sentiment distribution
- Missed call rate

---

# VIII. THE "FOUNDING 30" MISSION

## Philosophy
We are looking for **partners, not just customers.**

We provide:
- The "Commander Dashboard"
- The "Concierge Callback"
- The "Property Memory"

In exchange, they give us:
- Real-world usage data
- Feedback for improvement
- Testimonials and case studies
- The data to perfect the **Home Service Intelligence Category**

## Founding 30 Benefits:
- **Locked Rate:** $1,000/mo forever (vs. future $1,500/mo)
- **Priority Support:** Direct access to development team
- **Feature Input:** Vote on roadmap priorities
- **Early Access:** Beta features before general release
- **Founder Badge:** Recognition on website and marketing

---

# IX. IMPLEMENTATION STATUS

## ✅ COMPLETED

| Component | Status | Location |
|-----------|--------|----------|
| Property-First Schema | ✅ Done | `015*.sql` migrations |
| Properties Table | ✅ Done | Supabase |
| Contacts Table | ✅ Done | Supabase |
| Assets Table | ✅ Done | Supabase |
| Interactions Table | ✅ Done | Supabase |
| Industry Configs | ✅ Done | Supabase (seeded) |
| Location Flavors | ✅ Done | Supabase (seeded) |
| Helper Functions | ✅ Done | Supabase |
| Pre-Greeting Edge Function | ✅ Done | `/supabase/functions/pre-greeting/` |
| MCP Function Tools | ✅ Done | `/api/mcp/route.ts` |
| SMS Tools | ✅ Done | `/api/twilio/send/` |
| Cal.com Integration | ✅ Done | In MCP |
| Weather Integration | ✅ Done | In Pre-Greeting |
| System Prompt V2 | ✅ Done | `/docs/RETELL_SYSTEM_PROMPT_V2.md` |
| Tampa Electric Demo | ✅ Done | `/docs/TAMPA_ELECTRIC_DEMO.md` |
| ToS Addendum | ✅ Done | `/docs/TERMS_OF_SERVICE_ADDENDUM.md` |
| Pre-Launch Checklist | ✅ Done | `/docs/PRE_LAUNCH_TESTING_CHECKLIST.md` |

## 🔄 IN PROGRESS

| Component | Status | Notes |
|-----------|--------|-------|
| Pre-Greeting Deployment | 🔄 | Needs deployment to Supabase |
| Retell Webhook Config | 🔄 | Point inbound webhook to pre-greeting |

## ⏳ TODO

| Component | Priority | Notes |
|-----------|----------|-------|
| Emergency Alert Webhook | P0 | `/api/emergency-alert` |
| Call Analyzed Webhook | P0 | Sentiment extraction + CRS update |
| Commander Dashboard UI | P1 | React components |
| Dispatch Companion Logic | P1 | Swap algorithm |
| Wit Toggle in Dashboard | P2 | Business settings |
| A2P Compliance Wizard | P2 | Onboarding flow |
| Stripe Webhook | P2 | Invoice tracking |
| CRM Sync (ServiceTitan) | P3 | Bi-directional |
| Proactive Weather Engine | P3 | Outbound triggers |

---

# X. FILE REFERENCE

| File | Purpose |
|------|---------|
| `/database/migrations/015*.sql` | Property-First schema |
| `/supabase/functions/pre-greeting/index.ts` | Pre-Greeting Edge Function |
| `/app/api/mcp/route.ts` | Function Call handler |
| `/app/api/twilio/send/route.ts` | SMS sending |
| `/app/api/twilio/sms/route.ts` | SMS receiving |
| `/docs/RETELL_SYSTEM_PROMPT_V2.md` | Agent prompt template |
| `/docs/TAMPA_ELECTRIC_DEMO.md` | Full demo scenarios |
| `/docs/TERMS_OF_SERVICE_ADDENDUM.md` | Legal clauses |
| `/docs/PRE_LAUNCH_TESTING_CHECKLIST.md` | QA checklist |
| `/docs/WEBSITE_CONTENT_GUIDE.md` | Branding & copy |
| `/docs/PROJECT_BIBLE.md` | This document |

---

*This is the Master Project Bible. All development decisions should reference this document.*

*Version 1.0 - February 2026*
