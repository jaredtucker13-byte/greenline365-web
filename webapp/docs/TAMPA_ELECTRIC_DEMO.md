# Tampa Electric - Property Intelligence Engine Demo
## Complete Call Flow Demonstration

**Company:** Tampa Electric  
**Industry:** Electrical Services  
**Location:** Tampa, FL  
**Demo Property:** 722 South 57th Street, Tampa, FL 33619

---

## THE PROPERTY INTELLIGENCE DIFFERENCE

Traditional AI bots know **who** is calling.  
Tampa Electric's AI knows **the house** that's calling.

This means:
- New owners inherit 7 years of service history
- The AI knows the exact panel, wiring age, and past issues
- Weather-aware scheduling protects techs and customers
- Every interaction builds the "Property Memory"

---

# SCENARIO 1: EXISTING CUSTOMER (7+ Year Relationship)

## The Setup
- **Caller:** John Doe (original homeowner)
- **Phone:** (813) 555-1234 (on file)
- **Property:** 722 S 57th St, Tampa, FL 33619
- **Relationship Score:** 87 (VIP Status)
- **Years as Customer:** 7.4 years
- **Last Service:** Panel inspection, 8 months ago

## Pre-Greeting Edge Function Output
```json
{
  "is_new_caller": false,
  "has_property_history": true,
  "contact_name": "John Doe",
  "customer_name": "John",
  "property_address": "722 S 57th St, Tampa, FL 33619",
  "relationship_score": 87,
  "vibe_category": "vip",
  "confidence_score": 92,
  "needs_verification": false,
  "primary_asset": {
    "type": "Electrical Panel",
    "brand": "Square D",
    "model": "QO130L200PG",
    "install_year": 2019,
    "amps": 200
  },
  "weather": {
    "city": "Tampa",
    "temp": 91,
    "humidity": 82,
    "has_severe_alert": true,
    "alerts": [{"event": "Thunderstorm Warning", "severity": "severe"}],
    "recommendation": "Storms expected around 3 PM. Consider morning slots."
  },
  "witty_hook": "I know that humidity feels like wearing a warm, wet blanket!",
  "available_slots_today": ["9:00 AM", "10:30 AM", "2:00 PM"],
  "emergency_keywords": ["sparks", "burning smell", "no power", "shock"]
}
```

---

## THE CALL TRANSCRIPT

### Opening (0:00)

**[PHONE RINGS - Pre-Greeting loads in 200ms]**

**AI:** "John! Great to hear from you—you're practically family at this point after seven years. I hope you're staying cool in this Tampa heat. What can I help you with today?"

> **BEHIND THE SCENES:**
> - Phone number matched → Contact found → Property linked
> - CRS = 87 → VIP greeting triggered
> - Location flavor: Tampa humidity joke loaded
> - No verification needed (confidence 92%)

---

### Problem Description (0:15)

**John:** "Hey! Yeah, it's brutal out there. Listen, I've got a weird buzzing sound coming from my electrical panel. Started this morning."

**AI:** "A buzzing panel—that's definitely something we want to look at. Since we upgraded you to that 200-amp Square D panel back in 2019, it's been rock solid. A new buzz could be a loose breaker or a connection that needs tightening. Nothing to panic about, but let's not ignore it either."

> **BEHIND THE SCENES:**
> - "Buzzing" detected → Not an emergency keyword, but flagged as priority
> - Asset history pulled: Square D QO130L200PG, installed 2019
> - Confidence score 92% → No need to verify equipment details
> - AI demonstrates "Property Memory" by referencing the 2019 upgrade

---

### Weather Intelligence Pivot (0:45)

**John:** "Can you get someone out today? I'm a little worried about it."

**AI:** "Absolutely, I want to get this handled for you. Looking at the schedule... I have slots at 9:00 AM, 10:30 AM, and 2:00 PM today. 

But here's the thing, John—my weather sensors are showing a thunderstorm warning for Tampa starting around 3 PM. Since we're dealing with electrical work, I'd hate for a power surge to complicate things while our tech is elbow-deep in your panel. 

Would you prefer the 9:00 AM or 10:30 AM slot so we can wrap up before the storms roll in?"

> **BEHIND THE SCENES:**
> - Weather API returned: Thunderstorm Warning, 3 PM
> - AI proactively suggests earlier slots
> - Risk mitigation: Electrical + storms = safety concern
> - Customer feels AI is "watching out for them"

---

### Booking Confirmation (1:15)

**John:** "Good thinking. Let's do 10:30."

**AI:** "Perfect. I've got you locked in for 10:30 AM today. I'm sending a text to your phone right now with the confirmation details. 

Since it's a buzzing panel, I've flagged this as a priority diagnostic, and I'm making sure our tech sees the notes from your 2019 upgrade so they come prepared with the right tools for your Square D system.

Is there anything else I can help you with, John?"

> **BEHIND THE SCENES:**
> - `create_booking` tool called → Cal.com slot reserved
> - `send_meeting_confirmation` SMS triggered
> - Interaction logged with `joke_id` to prevent repetition next call
> - Tech notes include: "200A Square D panel, installed 2019, buzzing reported"

---

### The Self-Aware Wit Close (1:45)

**John:** "No, that's everything. You know, you're way better than the last receptionist I dealt with at another company."

**AI:** "I appreciate that, John! Though to be fair, I don't need coffee breaks or sleep, so I've got an unfair advantage. It's truly my pleasure to help. Stay cool out there, and we'll see you at 10:30!"

**John:** "Ha! Thanks."

**[CALL ENDS]**

> **BEHIND THE SCENES:**
> - Witty compliance hook delivered
> - Self-aware AI humor builds rapport
> - Florida Two-Party Consent: Recording disclosure was in the opening (integrated naturally)
> - Call logged, CRS potentially increases due to positive sentiment

---

### Post-Call SMS (Within 60 seconds)

```
Hi John! Your appointment is confirmed:

📅 Today at 10:30 AM
📍 722 S 57th St, Tampa
🔧 Priority Diagnostic: Panel Buzzing

Your Square D panel has been reliable since 2019—we'll get this sorted quickly!

⚡ Tip: If you notice any burning smell before we arrive, flip the main breaker and call us immediately.

Reply YES to confirm. - Tampa Electric
```

> **BEHIND THE SCENES:**
> - SMS includes property-specific equipment reference
> - "Value Bomb" content: Safety tip about burning smell
> - Personalization builds trust and perceived expertise

---

## SCENARIO 1 FEATURE SHOWCASE

| Feature | How It Was Used |
|---------|-----------------|
| **Caller ID → Property Lookup** | Instant recognition by phone number |
| **VIP Greeting (CRS 87)** | "You're practically family" - casual, warm tone |
| **Property Memory** | Referenced 2019 panel upgrade without being asked |
| **Asset Intelligence** | Knew exact panel model (Square D QO130L200PG, 200A) |
| **Confidence Scoring** | 92% confidence → No verification questions needed |
| **Weather Integration** | Proactively warned about 3 PM thunderstorms |
| **Safety-First Scheduling** | Suggested morning slot to avoid electrical + storm risk |
| **Cal.com Integration** | Real-time availability, instant booking |
| **SMS Value Bomb** | Confirmation + equipment reference + safety tip |
| **Self-Aware Wit** | "I don't need coffee breaks" - charming, not creepy |
| **Location Flavor** | Tampa humidity reference ready (not used, but loaded) |

---

# SCENARIO 2: NEW OWNER AT SAME PROPERTY

## The Setup
- **Caller:** Sarah Chen (just bought the house 2 weeks ago)
- **Phone:** (813) 555-9876 (NOT on file)
- **Property:** 722 S 57th St, Tampa, FL 33619 (SAME property as John Doe)
- **Relationship Score:** N/A (new contact)
- **Property History:** 7.4 years of service records exist

## Pre-Greeting Edge Function Output (Initial)
```json
{
  "is_new_caller": true,
  "has_property_history": false,
  "contact_name": null,
  "customer_name": null,
  "relationship_score": 50,
  "vibe_category": "stranger",
  "confidence_score": 100,
  "weather": {
    "city": "Tampa",
    "temp": 91,
    "has_severe_alert": true
  },
  "witty_hook": "That Florida humidity is no joke!"
}
```

---

## THE CALL TRANSCRIPT

### Opening - The Soft Pivot (0:00)

**[PHONE RINGS - Pre-Greeting finds no phone match]**

**AI:** "Thank you for calling Tampa Electric! Just so you know, we record calls to make sure I don't miss a single detail. 

I noticed I couldn't pull up a file for the number you're calling from—either my system is being shy, or maybe you've got a new number. To make sure I'm looking at the right service history, what's the address of the property you're calling about?"

> **BEHIND THE SCENES:**
> - Phone lookup: NO MATCH
> - AI triggers "Soft Pivot Dialogue"
> - Florida Two-Party Consent disclosure delivered naturally
> - Tone is professional but warm (stranger vibe)
> - Asks for address as secondary lookup key

---

### Address Discovery (0:20)

**Sarah:** "Oh, hi! It's 722 South 57th Street in Tampa."

**AI:** "Let me pull that up..."

**[2-second pause - `lookup_property_by_address` tool executing]**

**AI:** "Oh, I found it! We've actually been the electrical specialists for this home for over seven years. I can see the full history here—including a nice 200-amp panel upgrade from 2019. 

Just so I can update our records correctly—are you part of the Doe family and using a new number, or are you the new owner of the property?"

> **BEHIND THE SCENES:**
> - `lookup_property_by_address` called with "722 South 57th Street"
> - Fuzzy match via pg_trgm: "722 South 57th Street" → "722 S 57th St"
> - Property FOUND → Assets loaded → 7.4 years of history retrieved
> - AI now knows the house, but not the person
> - Ownership Verification Branch triggered

---

### New Owner Registration (0:45)

**Sarah:** "I'm the new owner! We just closed on the house two weeks ago."

**AI:** "Welcome to the neighborhood, Sarah! And congratulations on the new home. 

Here's the great news: since we've maintained the electrical at this house since 2017, we have the complete history of your system on file. I can see the 200-amp Square D panel, when it was installed, every inspection we've done—all of it. 

I'll get you set up with a fresh profile but keep all those valuable technical notes attached to the property. That way, you inherit seven years of expertise on day one.

Now, what can I help you with today?"

> **BEHIND THE SCENES:**
> - "New owner" detected → New contact creation triggered
> - `create_contact` tool called:
>   - first_name: "Sarah"
>   - property_id: [existing property UUID]
>   - role: "owner"
>   - relationship_score: 50 (starting fresh)
> - Property history PRESERVED and linked to new contact
> - Old contact (John Doe) remains in system but marked as previous owner

---

### Problem Description (1:15)

**Sarah:** "That's amazing that you have all that history! So, I've noticed a couple of outlets in the master bedroom aren't working. Not sure if it's a tripped breaker or something else."

**AI:** "Dead outlets in the master bedroom—let me check the notes... 

Interesting. I don't see any previous issues with that circuit in our records, which is actually good news. It could be as simple as a tripped GFCI somewhere in the chain, or it might be a loose connection that happened during the move. 

Either way, it's a quick diagnostic. Would you like me to get a tech out there to take a look?"

> **BEHIND THE SCENES:**
> - AI references property history ("I don't see previous issues")
> - Demonstrates institutional knowledge even to new owner
> - Builds confidence: "We know this house"
> - No emergency keywords detected → Standard scheduling

---

### Weather-Smart Scheduling (1:45)

**Sarah:** "Yes, please. When can you come out?"

**AI:** "I have availability today at 9:00 AM, 10:30 AM, and 2:00 PM. 

Fair warning though—my weather radar is showing thunderstorms hitting Tampa around 3 PM this afternoon. The 2:00 slot should be fine, but if the storms come early, our tech might need to pause any panel work for safety. 

Would you prefer one of the morning slots to be safe, or is 2:00 PM better for your schedule?"

> **BEHIND THE SCENES:**
> - Same weather intelligence as Scenario 1
> - AI explains reasoning (transparency builds trust)
> - Gives customer the choice rather than dictating
> - New customer education: "This is how we operate"

---

### Booking & Data Capture (2:15)

**Sarah:** "Let's do 10:30 AM. That works better anyway."

**AI:** "Perfect! I've got you down for 10:30 AM. 

One quick thing—I want to make sure I capture your information exactly right for our records. I just sent you a text. If you could reply with your full name and email, I'll have everything perfect in our system. 

Is there anything else you need help with today, Sarah?"

> **BEHIND THE SCENES:**
> - `create_booking` tool called
> - `request_contact_info` SMS tool triggered
> - "Perfect Data Capture" via text prevents transcription errors
> - Professional close

---

### The Welcome Close (2:45)

**Sarah:** "No, that's everything. I have to say, I'm impressed you knew so much about the house already."

**AI:** "That's the Tampa Electric difference! We don't just know our customers—we know the properties we service. Your house has been in good hands for seven years, and we're excited to continue that relationship with you.

Oh, and one more thing—since you're new to the home, after we fix those outlets, you might want to ask our tech about a quick 'New Homeowner Walkthrough.' It's a 15-minute overview of your electrical system, where your main shutoffs are, that sort of thing. No charge, just part of the welcome package.

We'll see you at 10:30!"

**Sarah:** "That's wonderful, thank you!"

**[CALL ENDS]**

> **BEHIND THE SCENES:**
> - Upsell opportunity: "New Homeowner Walkthrough" (revenue + value)
> - Reinforces "Property Intelligence" differentiator
> - Sarah now feels she inherited a trusted relationship
> - Positive sentiment → CRS will increase after completed service

---

### Post-Call SMS (Within 60 seconds)

```
Hi Sarah! Welcome to the Tampa Electric family! 🏠

Your appointment is confirmed:
📅 Today at 10:30 AM  
📍 722 S 57th St, Tampa
🔧 Diagnostic: Master Bedroom Outlets

Fun fact: Your home has been with us since 2017. 
Your 200-amp Square D panel was upgraded in 2019 
and has been rock solid ever since!

Ask your tech about our FREE "New Homeowner Walkthrough" 
to learn your electrical system.

Reply YES to confirm. - Tampa Electric
```

---

## SCENARIO 2 FEATURE SHOWCASE

| Feature | How It Was Used |
|---------|-----------------|
| **Smart Pivot Logic** | Phone not found → Asked for address → Found property |
| **Fuzzy Address Matching** | "722 South 57th Street" matched "722 S 57th St" |
| **Property Continuity** | New owner inherited 7+ years of service history |
| **Ownership Verification** | AI asked "Doe family or new owner?" |
| **New Contact Creation** | Sarah added, linked to existing property |
| **Asset Memory Transfer** | Panel details available without re-inspection |
| **Weather Integration** | Same storm warning, same proactive scheduling |
| **Perfect Data Capture** | SMS request for name/email (reduces errors) |
| **Upsell Opportunity** | "New Homeowner Walkthrough" offered naturally |
| **Trust Building** | "Your house has been in good hands for 7 years" |

---

# COMPLETE FEATURE REFERENCE

## 🧠 PROPERTY INTELLIGENCE CORE

### 1. Property-First Data Model
- **What it is:** The physical address is the anchor, not the customer
- **Why it matters:** New owners inherit history; data never gets "orphaned"
- **In action:** Sarah got John's 7 years of electrical records instantly

### 2. Fuzzy Address Matching (pg_trgm)
- **What it is:** Smart search that matches "Street" to "St", "South" to "S"
- **Why it matters:** Customers don't speak in database format
- **In action:** "722 South 57th Street" found "722 S 57th St"

### 3. Confidence Scoring
- **What it is:** 0-100 score based on data freshness
- **Formula:** Age of equipment + time since last verification
- **Triggers:** Score < 70% → AI asks verification questions
- **In action:** John's panel at 92% confidence → No verification needed

### 4. Customer Relationship Score (CRS)
- **What it is:** 0-100 score determining greeting style
- **Factors:** Frequency, longevity, sentiment, booking reliability
- **Tiers:**
  - 0-30: Stranger (formal)
  - 31-70: Regular (friendly)
  - 71-100: VIP (casual, priority treatment)
- **In action:** John at 87 → "You're practically family"

---

## 🌦️ WEATHER INTELLIGENCE

### 5. Real-Time Weather Integration
- **What it is:** OpenWeather API data injected into every call
- **Data points:** Temperature, humidity, severe alerts, forecast
- **In action:** "Thunderstorm warning at 3 PM" → Morning slots recommended

### 6. Weather-Smart Scheduling
- **What it is:** AI proactively adjusts recommendations based on conditions
- **Logic:** Electrical + storms = safety risk → Suggest earlier slots
- **In action:** Both John and Sarah steered toward morning appointments

### 7. Location Flavor / Climate Quirks
- **What it is:** Region-specific humor and references
- **Examples:** Tampa = "humidity like a wet blanket", Phoenix = "dry heat oven"
- **In action:** Loaded but not used (John was VIP, Sarah was new)

---

## 💬 CONVERSATION INTELLIGENCE

### 8. Smart Pivot Logic
- **What it is:** Recursive lookup when phone doesn't match
- **Flow:** Phone → Address → Property Found → Ownership Verification
- **In action:** Sarah's phone not found → Asked for address → Found property

### 9. Ownership Verification Branch
- **What it is:** Determines if caller is old customer with new number OR new owner
- **Question:** "Are you part of the [family] or the new owner?"
- **In action:** Sarah identified as new owner → New contact created

### 10. Emergency Detection
- **What it is:** Keywords that trigger immediate human transfer
- **Electrical keywords:** "sparks", "burning smell", "no power", "shock"
- **In action:** "Buzzing" flagged as priority but not emergency

### 11. Witty Hooks Rotation
- **What it is:** AI humor that doesn't repeat to the same caller
- **Tracking:** `joke_id` stored per interaction
- **In action:** John got "coffee breaks" joke; next call will be different

### 12. Self-Aware AI Compliance
- **What it is:** AI acknowledges being AI in charming way
- **Why it matters:** Florida law + trust building + not creepy
- **In action:** "I don't need coffee breaks" + recording disclosure

---

## 📅 BOOKING & SCHEDULING

### 13. Cal.com Integration
- **What it is:** Real-time availability + instant booking
- **Features:** Slot checking, booking creation, cancellation
- **In action:** Both calls showed live availability, booked instantly

### 14. Availability Caching
- **What it is:** 60-second cache to avoid API rate limits
- **Why it matters:** Multiple rapid calls don't hammer Cal.com
- **In action:** Slots loaded in 200ms from cache

---

## 📱 SMS INTEGRATION

### 15. Meeting Confirmation SMS
- **What it is:** Instant text with booking details
- **Trigger:** Immediately after `create_booking`
- **In action:** Both John and Sarah received confirmation texts

### 16. Value Bomb SMS
- **What it is:** Extra content that adds value beyond confirmation
- **Examples:** Safety tips, equipment facts, upsell nudges
- **In action:** John got "burning smell" safety tip; Sarah got walkthrough offer

### 17. Perfect Data Capture
- **What it is:** Request customer info via text to avoid transcription errors
- **Trigger:** When name/email needed for new contact
- **In action:** Sarah asked to reply with full name and email

---

## 📊 DATA DECAY & ASSET TRACKING

### 18. Asset Lifecycle Tracking
- **What it is:** Install date + industry decay rules = confidence score
- **Electrical rules:** Stale at 10 years, unreliable at 25 years
- **In action:** 2019 panel = 7 years old = high confidence

### 19. Verification Prompts
- **What it is:** AI asks customer to confirm data when confidence is low
- **Trigger:** Confidence < 70%
- **Example:** "Our records show a 200-amp panel. Is that still current?"

### 20. Last Verified Tracking
- **What it is:** Timestamp when customer confirmed asset details
- **Effect:** Recent verification = confidence boost
- **In action:** John's confidence at 92% partly from 8-month-old inspection

---

## 🔐 MULTI-TENANT & COMPLIANCE

### 21. Row-Level Security (RLS)
- **What it is:** Database-level isolation between businesses
- **How it works:** Every query filtered by `tenant_id`
- **Why it matters:** Plumber can't see electrician's customers

### 22. Florida Two-Party Consent
- **What it is:** Mandatory recording disclosure
- **Hardcoded:** Cannot be disabled or modified
- **In action:** "We record calls to make sure I don't miss a single detail"

### 23. AI Liability Shield
- **What it is:** Disclaimer that AI requires human verification
- **Legal protection:** Specs must be confirmed by technician
- **In action:** AI says "quick diagnostic" not "I'll fix it for $50"

---

## 🚀 BUSINESS INTELLIGENCE

### 24. Property Lifetime Value
- **What it is:** Total revenue from a property over time
- **Calculation:** Sum of all completed bookings
- **Use case:** Identify high-value properties for priority treatment

### 25. Interaction History
- **What it is:** Every call, SMS, repair logged to property
- **Tracked:** Sentiment, outcome, joke used, agent type
- **Use case:** Never repeat same joke; track customer satisfaction

### 26. CRM Sync Logs
- **What it is:** Async updates to external CRMs (HighLevel, HubSpot)
- **Why async:** Keeps call latency low; CRM updated after call ends
- **Tracked:** Success/failure, retry count, last attempt

---

# THE "NO DEAD ENDS" PHILOSOPHY

Traditional AI bots have ONE path:
```
Phone Match? 
  → Yes: Proceed
  → No: "I don't have your information. Can you spell your name?"
```

Tampa Electric's Property Intelligence Engine has MULTIPLE paths:
```
Phone Match?
  → Yes: VIP/Regular/Stranger greeting based on CRS
  → No: Ask for address
    → Address Found?
      → Yes: Ownership verification
        → Old customer, new number: Update contact
        → New owner: Create contact, preserve property history
      → No: New customer + new property onboarding
```

**Result:** The AI almost ALWAYS finds relevant context, maintaining that "superhuman memory" impression even when the initial lookup fails.

---

# SUMMARY: WHY THIS MATTERS

| Traditional Booking Bot | Tampa Electric Property Intelligence |
|------------------------|--------------------------------------|
| Knows the caller | Knows the HOUSE |
| Asks for info every time | Remembers everything |
| Generic greeting | CRS-based personality |
| Ignores weather | Proactive storm warnings |
| Dead end if no match | Smart Pivot finds property anyway |
| Forgets when owner changes | New owner inherits history |
| One-size-fits-all | Industry-specific decay logic |
| Robotic and repetitive | Witty, self-aware, never repeats jokes |

**The Bottom Line:**  
When Sarah called about her new house, she didn't feel like a stranger. She felt like she inherited a trusted relationship. That's the difference between a booking bot and a Property Intelligence Engine.

---

*This demo document is for Tampa Electric training and sales purposes.*
*Property Intelligence Engine powered by Greenline365.*
