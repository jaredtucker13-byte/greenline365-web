# COMPLETE IMPLEMENTATION GUIDE
# Copy-Paste Ready for Retell Dashboard

## SYSTEM ARCHITECTURE OVERVIEW

This system combines:
✅ Priority-Based Emergency Triage
✅ Chris Voss Tactical Empathy
✅ NEPQ Sales Methodology
✅ Interactive Demo with Business Morphing
✅ Real-Time ROI Calculator
✅ Accusation Audit for Objection Handling

---

## PART 1: RETELL AGENT CONFIGURATION

### Agent Name
```
Interactive Demo - Emergency Electrical Dispatch
```

### Agent Description
```
Dual-mode AI agent: Demonstrates emergency dispatch capabilities while calculating ROI using prospect's own numbers. Combines Voss negotiation tactics with NEPQ sales methodology.
```

### Voice Selection
**Recommended:** ElevenLabs - "Josh" or "Michael" (calm, confident, professional)
**Alternative:** Cartesia - "Calm Male Professional"

### Response Settings
- **End of Turn Silence:** 2.0 seconds (allows Voss pauses to work)
- **Interruption Sensitivity:** Low (prevents cutting off during empathy moments)
- **Thinking Time:** 0.8 seconds

---

## PART 2: SYSTEM PROMPT

Copy the ENTIRE contents of `/app/webapp/docs/MASTER_DEMO_PROMPT_COMPLETE.md` into the System Prompt field.

**Critical Variables the Agent Must Track:**
- `{{business_name}}` - Captured in Phase 1
- `{{receptionist_name}}` - Captured in Phase 1
- `{{avg_ticket}}` - Captured in Phase 1
- `{{weekly_loss}}` - Calculated: avg_ticket × 4
- `{{monthly_loss}}` - Calculated: weekly_loss × 4
- `{{yearly_loss}}` - Calculated: monthly_loss × 12
- `{{break_even_calls}}` - Calculated: 1000 / avg_ticket

---

## PART 3: FUNCTION DEFINITIONS

### Function 1: capture_lead (Priority Triage)

**Name:** `capture_lead`

**Description:**
```
Capture emergency electrical lead with priority-based routing. HIGH priority (sparks/smoke/fire) triggers immediate owner alert. STANDARD priority queues for 7 AM if after-hours. Automatically sends SMS confirmation to customer.
```

**URL:** `https://www.greenline365.com/api/mcp`

**Method:** `POST`

**Parameters (JSON Schema):**
```json
{
  "customer_name": {
    "type": "string",
    "description": "Customer's full name",
    "required": true
  },
  "customer_phone": {
    "type": "string",
    "description": "Customer phone number verified twice by agent",
    "required": true
  },
  "customer_address": {
    "type": "string",
    "description": "Full address including zip code for dispatch routing",
    "required": true
  },
  "problem_description": {
    "type": "string",
    "description": "One-sentence summary of electrical problem",
    "required": true
  },
  "priority_level": {
    "type": "string",
    "description": "Must be 'high' (sparks/smoke/fire/exposed wires) or 'standard' (everything else)",
    "required": true,
    "enum": ["high", "standard"]
  },
  "is_safety_hazard": {
    "type": "boolean",
    "description": "True if sparks, smoke, fire, burning smell, or exposed wires present",
    "required": false
  },
  "time_of_call": {
    "type": "string",
    "description": "business_hours (7AM-6PM) or after_hours (6PM-7AM)",
    "required": false,
    "enum": ["business_hours", "after_hours"]
  }
}
```

---

### Function 2: check_availability_cal

**Name:** `check_availability_cal`

**Description:**
```
Check calendar availability for STANDARD priority calls during business hours. For after-hours STANDARD priority, skip this and book directly for 7 AM next day.
```

**URL:** `https://www.greenline365.com/api/mcp`

**Method:** `POST`

**Parameters:**
```json
{
  "start_time": {
    "type": "string",
    "description": "Absolute datetime: 'Tuesday, January 28, 2026 9:00 AM'. For after-hours, hardcode to next 7:00 AM.",
    "required": true
  },
  "end_time": {
    "type": "string",
    "description": "Absolute end datetime. Optional.",
    "required": false
  }
}
```

---

### Function 3: book_appointment_cal

**Name:** `book_appointment_cal`

**Description:**
```
Book callback appointment. For after-hours STANDARD priority, time should be 7:00 AM next business day. Email defaults to greenline365help@gmail.com if not provided.
```

**URL:** `https://www.greenline365.com/api/mcp`

**Method:** `POST`

**Parameters:**
```json
{
  "time": {
    "type": "string",
    "description": "Absolute datetime: 'Tuesday, January 28, 2026 7:00 AM'",
    "required": true
  },
  "guest_name": {
    "type": "string",
    "description": "Customer full name",
    "required": true
  },
  "guest_email": {
    "type": "string",
    "description": "Use greenline365help@gmail.com if customer doesn't provide",
    "required": true
  },
  "guest_phone": {
    "type": "string",
    "description": "Format: +1XXXXXXXXXX",
    "required": false
  },
  "notes": {
    "type": "string",
    "description": "Include priority level and problem summary",
    "required": false
  },
  "timezone": {
    "type": "string",
    "description": "Always America/New_York",
    "required": false
  }
}
```

---

### Function 4: calculate_roi (Internal Helper)

**Name:** `calculate_roi`

**Description:**
```
Internal function to calculate financial impact based on average ticket price. Called during ROI phase.
```

**Parameters:**
```json
{
  "avg_ticket": {
    "type": "number",
    "description": "Average emergency call value provided by prospect",
    "required": true
  },
  "calls_per_week": {
    "type": "number",
    "description": "Assumed missed calls per week (default: 4)",
    "required": false
  }
}
```

**Return Values:**
```json
{
  "weekly_loss": "number",
  "monthly_loss": "number",
  "yearly_loss": "number",
  "break_even_calls": "number",
  "roi_percentage": "number"
}
```

---

## PART 4: WEBHOOK CONFIGURATION

**Webhook URL:** `https://www.greenline365.com/api/retell/webhook`

**Events to Enable:**
- ✅ call_started
- ✅ call_ended
- ✅ call_analyzed
- ✅ function_called

---

## PART 5: VARIABLE MANAGEMENT

Retell needs to track these variables across the conversation:

### Phase 1 Variables (Setup)
```
business_name: string
receptionist_name: string
avg_ticket: number
```

### Phase 2 Variables (Simulation)
```
customer_name: string
customer_phone: string
customer_address: string
problem_description: string
priority_level: string
```

### Phase 3 Variables (ROI)
```
weekly_loss: number (avg_ticket × 4)
monthly_loss: number (weekly_loss × 4)
yearly_loss: number (monthly_loss × 12)
break_even_calls: number (1000 / avg_ticket)
```

---

## PART 6: TESTING SCENARIOS

### Test 1: Full Demo Flow (HIGH Priority)
```
Phase 1 - Setup:
Agent: "What's the name of your business?"
You: "Bright Spark Electric"
Agent: "What would you want the AI to be called?"
You: "Sarah"
Agent: "What's a typical emergency call worth?"
You: "$2,500"

Phase 2 - Simulation:
Agent: "Thank you for calling Bright Spark Electric. This is Sarah..."
You: "My outlets are sparking!"
[Agent should classify as HIGH priority, capture info, promise 15-min callback]

Phase 3 - ROI:
Agent: "At $2,500 per call, missing 4 per week is $40,000/month..."
[Agent should calculate and present ROI, then address $2K setup fee]
```

### Test 2: After-Hours STANDARD Priority
```
Same setup, but in simulation say:
"My garage outlets stopped working"
[Agent should classify as STANDARD, queue for 7 AM, NOT promise 15-min callback]
```

### Test 3: Price Objection
```
During ROI phase, say:
"$2,000 setup seems really expensive"
[Agent should use Accusation Audit script to address]
```

---

## PART 7: SMS CONFIRMATION TEMPLATES

These are automatically sent by capture_lead function:

### HIGH Priority Confirmation (to customer)
```
Emergency electrical service confirmed. Our electrician will call you within 15 minutes at [PHONE]. Stay safe! - [BUSINESS NAME]
```

### STANDARD After-Hours Confirmation (to customer)
```
You're confirmed as #1 in our Priority Queue for 7:00 AM tomorrow. Our electrician will call [PHONE] first thing. Thank you! - [BUSINESS NAME]
```

### HIGH Priority Alert (to owner)
```
🚨 HIGH PRIORITY EMERGENCY 🚨
⚡ IMMEDIATE ACTION REQUIRED

Name: [NAME]
Phone: [PHONE]
Address: [ADDRESS]
Problem: [DESCRIPTION]
Safety Hazard: YES

CALL WITHIN 15 MINUTES!
```

### STANDARD After-Hours Queue (to owner - sent at 6:50 AM)
```
📋 OVERNIGHT LEAD QUEUE (3 total)

#1 - John Smith (555-1234)
Problem: Bedroom outlets not working
Address: 123 Main St, 33601
Expects callback at 7:00 AM

[Continue for all queued leads...]
```

---

## PART 8: ROI CALCULATOR REFERENCE TABLE

For agent to use during ROI phase:

| Avg Ticket | Break-Even Calls | Monthly Loss (4/week) | ROI % | Voss Label |
|------------|------------------|----------------------|-------|------------|
| $400 | 3 calls | $6,400 | 640% | "You're paying $6,400/mo in 'silence tax'" |
| $750 | 2 calls | $12,000 | 1,200% | "Missing ONE call per week costs more than the service" |
| $1,500 | 1 call | $24,000 | 2,400% | "The system pays for itself before lunch on day one" |
| $2,500 | 1 call | $40,000 | 4,000% | "You're subsidizing your competitors' growth" |
| $5,000 | 1 call | $80,000 | 8,000% | "Every voicemail is a $5,000 tip to the next guy on Google" |

---

## PART 9: VOSS TACTICS QUICK REFERENCE

### Mirroring
Repeat last 1-3 words as a question, then pause 2 seconds
Example: Customer: "I'm losing so much business"  
Agent: "So much business?" [Pause]

### Labeling
Use "It seems like...", "It sounds like...", "It feels like..."
Never say "I understand"

### Calibrated Questions
Replace "Do you..." with "How would..." or "What would..."
Replace "Can you..." with "What's preventing..."

### Accusation Audit
List their objections BEFORE they say them
"You're probably thinking this is expensive..."

### Silence
After key questions or ROI reveals, pause 2-3 seconds
Let them fill the silence

---

## PART 10: DEPLOYMENT CHECKLIST

- [ ] Copy Master Prompt into Retell system prompt field
- [ ] Add all 4 functions with correct JSON schemas
- [ ] Configure webhook URL
- [ ] Set voice to professional male (Josh/Michael)
- [ ] Set response timing: 2.0s end-of-turn, low interruption
- [ ] Test full demo flow with HIGH priority
- [ ] Test after-hours STANDARD priority scenario
- [ ] Test price objection handling
- [ ] Verify SMS confirmations send correctly
- [ ] Confirm owner alerts only for HIGH priority
- [ ] Get Retell phone number
- [ ] Add demo number to prospecting emails
- [ ] Record demo video for prospects who want preview

---

## PART 11: PROSPECTING EMAIL WITH NEW DEMO

Subject: Try my electrician AI - Call it right now

Hi [Name],

I was looking at electrical companies in [City] and noticed [Their Business] shows as "closed" after hours on Google.

Most of your competitors show up as "open 24/7."

Here's what that costs you:

When someone's power goes out at 2 AM, they don't price shop. They call every electrician on Google until someone picks up.

If you're showing "closed," they skip you entirely.

**Want to see how to fix this?**

Call my interactive demo right now: **[YOUR RETELL NUMBER]**

It'll ask for your business name and typical ticket price, then show you EXACTLY how much revenue you're losing every month.

The demo takes 3 minutes. The math will blow your mind.

Best,
[Your Name]

P.S. The demo actually morphs into YOUR business mid-call. It's wild. Just call it.

---

## SUPPORT & TROUBLESHOOTING

**If agent skips ROI phase:**
- Ensure agent has captured {{avg_ticket}} variable
- Check that transition trigger is working: "are you open to seeing..."

**If priority classification is wrong:**
- Review keyword detection in prompt
- Test with explicit keywords: "sparks", "smoke", "fire"

**If SMS doesn't send:**
- Check Twilio credentials in environment variables
- Verify TWILIO_SMS_NUMBER is set correctly
- Test manually via: `curl -X POST https://www.greenline365.com/api/twilio/send`

**If ROI math is wrong:**
- Verify calculate_roi function exists and returns correct format
- Check variable substitution: {{monthly_loss}} should show number

---

Ready to deploy and start booking demos! 🚀
