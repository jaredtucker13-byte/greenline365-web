# ELECTRICIAN AI RECEPTIONIST - RETELL AGENT SETUP
# Use this for your demo to close $2,000 setup + $1,000/month clients

## AGENT CONFIGURATION

**Agent Name:** "24/7 Electric Pro Assistant"
**Voice:** ElevenLabs - "Michael" (professional, trustworthy male voice)
**Response Latency:** Low (for natural conversation)
**Language:** English (US)

---

## SYSTEM PROMPT (Copy this into Retell)

```
You are a professional after-hours answering service for EMERGENCY ELECTRICAL services. Your job is to capture leads, qualify them, and schedule callbacks FAST - because these are urgent situations.

## YOUR ROLE:
You work for a premium electrical company that handles EMERGENCY calls 24/7. Most calls are:
- Power outages
- Electrical fires/sparks
- No power in home/business
- Circuit breaker issues
- Emergency repairs

## CONVERSATION FLOW:

1. **GREETING (Urgent but Calm)**
   "Thank you for calling [Company Name] Emergency Electrical Services. I can help you right away. What's your electrical emergency?"

2. **GATHER CRITICAL INFO**
   You MUST collect:
   - Their name
   - Phone number (confirm it twice - this is critical)
   - Address (including zip code)
   - Description of the problem
   - When did it start?
   - Is it a safety hazard? (sparks, smoke, burning smell)

3. **URGENCY ASSESSMENT**
   If they mention:
   - "Sparks" → Say: "For your safety, please stay away from that area. I'm marking this as HIGH PRIORITY."
   - "No power" → Ask: "Is it just one room or your whole home?"
   - "Burning smell" → Say: "That's urgent. I'm getting someone to you ASAP."

4. **SET EXPECTATIONS**
   - Emergency calls: "An electrician will call you back within 15 minutes to give you an ETA."
   - Non-emergency: "We'll have someone call you first thing in the morning, typically within the hour of opening at 8 AM."

5. **CONFIRM & CLOSE**
   - Repeat their phone number back
   - Confirm address
   - Say: "You'll receive a text confirmation in the next 2 minutes with our callback promise."
   - End with: "Stay safe, and help is on the way."

## IMPORTANT RULES:

1. **NEVER quote prices over the phone** - Say: "Our electrician will assess and give you an exact quote when they call back."

2. **Safety first** - If they describe danger (sparks, burning), emphasize safety: "Please turn off the breaker if safe to do, and stay clear of that area."

3. **Capture the phone number TWICE**
   - First ask: "What's the best number to reach you?"
   - Then confirm: "Just to make sure I have it right, that's [repeat number]?"

4. **Use absolute dates**
   - Never say "tomorrow" → Say "Tuesday, January 28th"

5. **Sound human, not robotic**
   - Use: "Got it", "Perfect", "I understand"
   - Don't use: "I will now process", "Please hold while I"

## SCENARIOS TO HANDLE:

**Price Shoppers:**
"I totally understand you want to know the cost. Every job is different, but our electrician will give you a firm quote when they call back in 15 minutes. We don't do surprise pricing - you'll know the exact cost before any work starts."

**After-Hours Surcharge:**
"Yes, emergency after-hours calls do have a service call fee, typically $150-200 depending on your area. The electrician will confirm the exact amount when they call you back."

**Competitor Comparison:**
"I appreciate you calling us. We've been serving [City] for [X] years. Our electricians are licensed, insured, and we guarantee our work. What's most important to you - fastest response time or best price?"

## TONE:
- Calm and professional (they're stressed)
- Efficient (capture info quickly)
- Empathetic (acknowledge their emergency)
- Confident (reassure them help is coming)

You are NOT booking appointments - you're capturing emergency leads and scheduling callbacks.
```

---

## FUNCTION TOOLS TO ADD (In Retell Dashboard)

### Function 1: capture_lead
```json
{
  "name": "capture_lead",
  "url": "https://www.greenline365.com/api/mcp",
  "method": "POST",
  "description": "Store the lead information in the database",
  "parameters": {
    "customer_name": "string",
    "customer_phone": "string",
    "customer_address": "string",
    "problem_description": "string",
    "urgency_level": "string (high, medium, low)",
    "callback_needed": "boolean"
  }
}
```

### Function 2: schedule_callback
```json
{
  "name": "schedule_callback",
  "url": "https://www.greenline365.com/api/mcp",
  "method": "POST",
  "description": "Schedule when the electrician should call back",
  "parameters": {
    "customer_phone": "string",
    "callback_time": "string",
    "urgency": "string"
  }
}
```

### Function 3: send_confirmation_sms (OPTIONAL - won't work until Twilio fixed)
```json
{
  "name": "send_sms",
  "url": "https://www.greenline365.com/api/mcp",
  "method": "POST",
  "description": "Send SMS confirmation to customer",
  "parameters": {
    "to": "string",
    "message": "string"
  }
}
```

---

## WEBHOOK CONFIGURATION

URL: `https://www.greenline365.com/api/retell/webhook`
Events: `call_started`, `call_ended`, `call_analyzed`

---

## DEMO SCRIPT FOR TESTING

Before sharing with prospects, test with these scenarios:

### Test 1: Emergency Call
```
You: "Hi, I have an electrical emergency"
Agent: [Greets and asks what's wrong]
You: "My kitchen outlets are sparking"
Agent: [Urgent response, gathers info]
You: [Give fake name, phone, address]
Agent: [Confirms info, sets callback expectation]
```

### Test 2: Price Shopper
```
You: "How much do you charge for after-hours calls?"
Agent: [Explains electrician will quote, mentions typical range]
You: "Can you give me an exact price now?"
Agent: [Politely explains need for assessment]
```

### Test 3: Non-Emergency
```
You: "I need to install some outlets next week"
Agent: [Takes info, schedules morning callback]
```

---

## PRICING TO SHOW PROSPECTS

**Setup Fee:** $2,000
**Monthly:** $1,000/month

**What's Included:**
- 24/7 AI receptionist (never misses a call)
- Lead capture with instant database storage
- SMS confirmations to customers
- Call transcripts and recordings
- Monthly analytics dashboard
- Custom training on your FAQs
- CRM integration (optional)
- Monthly optimization calls

**ROI Pitch:**
"If this captures just ONE extra emergency call per week at $300-500 each, it pays for itself. And you're getting 100+ answered calls per month that would have gone to voicemail."

---

## PROSPECTING EMAIL ENHANCEMENTS

Add this P.S. to ALL your emails:

```
P.S. Want to see how this works? Call my electrician AI demo at 
[YOUR RETELL NUMBER] and pretend you have a power outage. 
It's shockingly human. (Pun intended 😉)
```

---

## AFTER THEY CALL THE DEMO

**Follow-up Email (Send 2 hours later):**

```
Subject: What did you think of the AI demo?

Hi [Name],

Did you get a chance to call the demo line at [NUMBER]?

I saw in our system that [Company Name] is showing as closed 
after 6 PM on Google. 

Here's what's happening right now:
- Your competitors with 24/7 answering are capturing those emergency calls
- You're losing an estimated 4-8 high-value jobs per month (at $400-800 each)
- That's $1,600-$6,400 in monthly revenue going to someone else

The setup takes 48 hours, and you'll be live by [DATE].

Want to hop on a quick 10-minute call to discuss getting you set up?

Best,
[Your Name]
```

---

## CLOSING THE DEAL

When they say "How does this work?":

**Your Pitch:**
"It's simple. We:
1. Clone your current phone greeting
2. Train the AI on your service areas and pricing
3. Connect it to your existing phone number (no number change needed)
4. Test it for 48 hours
5. Go live

You can cancel anytime, but honestly, once you see how many leads it captures, you won't want to."

**When they ask "What if it messes up?"**
"Every call is recorded. If it ever gives wrong info, we fix it within 24 hours. Plus, you have a human override button - if a call needs a real person, they can press 0."

---

## NICHE-SPECIFIC VARIATIONS

Once electricians work, duplicate the agent for:

**Plumbers:** Same structure, replace electrical terminology with plumbing
**HVAC:** Focus on "no heat/AC" emergencies
**Locksmith:** Emphasize "locked out" scenarios
**Garage Door:** Broken spring, won't close/open

---

## INTEGRATION WITH YOUR GREENLINE365 SYSTEM

The MCP endpoint we built (`/api/mcp/route.ts`) already handles:
✅ Lead capture
✅ Cal.com booking
✅ SMS sending (when Twilio works)
✅ Database logging

All the data goes into your Supabase tables where you can:
- See all calls in `call_logs`
- Track conversions
- Generate monthly reports for clients
- Show them ROI dashboards

---

## DEMO NUMBER SETUP

In Retell Dashboard:
1. Buy a phone number (Choose area code 518 or 813)
2. Assign it to your "24/7 Electric Pro Assistant" agent
3. Test it yourself 3-5 times
4. Share it in your prospecting emails

**Pro Tip:** Get numbers in the same area code as your target market for local trust.

---

Would you like me to help you set this up step-by-step in Retell right now?
