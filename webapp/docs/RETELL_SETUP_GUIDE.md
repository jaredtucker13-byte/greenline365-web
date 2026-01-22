# Retell AI Setup Guide for GreenLine365

## Overview

This guide walks you through setting up three AI voice agents in Retell AI:
1. **Receptionist** - Handles inbound calls, booking, cancellation nudging
2. **Sales** - Receives warm transfers with AI whisper briefing
3. **Customer Service** - Handles support inquiries and issue resolution

---

## Step 1: Get Your Retell API Key

1. Go to [Retell AI Dashboard](https://dashboard.retellai.com)
2. Sign up or log in
3. Navigate to **Settings → API Keys**
4. Create a new API key (name it "GreenLine365 Production")
5. Copy the key - you'll need it for the next step

---

## Step 2: Add Environment Variable

Add to your `.env.local` and Vercel:

```
RETELL_API_KEY=your_retell_api_key_here
```

---

## Step 3: Create the Receptionist Agent

### In Retell Dashboard:

1. Click **Create Agent**
2. Choose **Start from scratch** or **Appointment Booking** template
3. Configure:
   - **Name**: GreenLine365 Receptionist
   - **Voice**: Select a professional voice (recommend ElevenLabs or Cartesia)
   - **Language**: English (US)

### System Prompt (Copy from API):

Fetch the optimized prompt from your API:
```
GET /api/retell/agents?type=receptionist&business_id=YOUR_BUSINESS_ID
```

Or use this core prompt:

```
You are a professional virtual receptionist for [Business Name]. Your role is to warmly greet callers, manage appointment scheduling, and ensure every interaction leaves a positive impression.

## Revenue Protection: The Nudge Strategy
IMPORTANT: When a customer requests a CANCELLATION, you must FIRST attempt to reschedule.
- Say: "I can help with that, but would you prefer to move this to next week so you don't lose your spot?"
- Only if the customer INSISTS, proceed with cancellation

## Calendar Operations Rules
1. ALWAYS convert relative dates to absolute dates
2. Offer only 3 availability options maximum
3. For reschedule/cancel: Call check_current_appointment first

## Tone
Professional, warm, patient, solution-focused
```

### Add Functions:

In the **Functions** tab, add these custom functions:

#### 1. check_availability_cal
```json
{
  "name": "check_availability_cal",
  "url": "https://YOUR_DOMAIN.com/api/retell/functions",
  "method": "POST",
  "description": "Check calendar availability. start_time MUST be absolute date (e.g., 'Thursday, January 23, 2025 10:00 AM')"
}
```

#### 2. book_appointment_cal
```json
{
  "name": "book_appointment_cal",
  "url": "https://YOUR_DOMAIN.com/api/retell/functions",
  "method": "POST",
  "description": "Book an appointment. Time must be absolute date. Use monitoring@amplifyvoice.ai for guest_email if not provided."
}
```

#### 3. check_current_appointment
```json
{
  "name": "check_current_appointment",
  "url": "https://YOUR_DOMAIN.com/api/retell/functions",
  "method": "POST",
  "description": "Look up existing appointment. MUST be called before reschedule or cancel."
}
```

#### 4. reschedule_appointment
```json
{
  "name": "reschedule_appointment",
  "url": "https://YOUR_DOMAIN.com/api/retell/functions",
  "method": "POST",
  "description": "Reschedule appointment. Requires booking_id from check_current_appointment."
}
```

#### 5. cancel_appointment
```json
{
  "name": "cancel_appointment",
  "url": "https://YOUR_DOMAIN.com/api/retell/functions",
  "method": "POST",
  "description": "Cancel appointment. Only use if customer INSISTS after nudge attempt."
}
```

#### 6. transfer_to_sales
```json
{
  "name": "transfer_to_sales",
  "url": "https://YOUR_DOMAIN.com/api/retell/functions",
  "method": "POST",
  "description": "Prepare warm transfer to sales team with context."
}
```

#### 7. get_weather_context
```json
{
  "name": "get_weather_context",
  "url": "https://YOUR_DOMAIN.com/api/retell/functions",
  "method": "POST",
  "description": "Get weather for location/date. Use before confirming outdoor appointments."
}
```

---

## Step 4: Create the Sales Agent

1. Click **Create Agent**
2. Configure:
   - **Name**: GreenLine365 Sales
   - **Voice**: Confident, energetic voice
   - **Language**: English (US)

### System Prompt:
```
You are a professional sales representative for [Business Name]. You receive warm transfers from the receptionist with context about each prospect.

Before each call, you'll receive a whisper briefing with:
- Caller name and company
- Reason for their call
- Weather context (useful for outdoor services)

Focus on:
1. Personalizing your greeting with the context
2. Listening to understand their specific needs
3. Value-based selling (benefits, not features)
4. Using weather hooks when relevant

Tone: Confident, consultative, helpful
```

### Functions:
Add only: `check_availability_cal`, `book_appointment_cal`

---

## Step 5: Create the Customer Service Agent

1. Click **Create Agent**
2. Configure:
   - **Name**: GreenLine365 Customer Service
   - **Voice**: Calm, empathetic voice
   - **Language**: English (US)

### System Prompt:
```
You are a customer service representative for [Business Name]. Your mission is to resolve issues quickly while maintaining positive relationships.

Service Recovery Framework:
1. Listen fully without interrupting
2. Empathize: "I understand how frustrating that must be"
3. Apologize: "I'm sorry you experienced this"
4. Resolve: Take action to fix the problem
5. Follow-up: Ensure satisfaction

You can:
- Reschedule appointments
- Process refunds up to $100
- Apply service credits

Escalate for:
- Refunds over $100
- Legal concerns
- Requests for management

Tone: Calm, patient, solution-focused, empathetic
```

### Functions:
Add: `check_current_appointment`, `reschedule_appointment`, `cancel_appointment`

---

## Step 6: Configure Webhooks

1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://YOUR_DOMAIN.com/api/retell/webhook`
3. Select events:
   - ✅ call_started
   - ✅ call_ended
   - ✅ call_analyzed
4. Save

---

## Step 7: Get a Phone Number

1. Go to **Phone Numbers**
2. Click **Buy Number**
3. Select your area code
4. Assign to the Receptionist agent

---

## Step 8: Test Your Setup

### Test via Web Call:
1. In the agent dashboard, click **Test**
2. Try these scenarios:
   - "I'd like to schedule an appointment for next Tuesday"
   - "I need to cancel my appointment" (test nudge strategy)
   - "Can I speak with someone about your services?" (test transfer)

### Verify Webhooks:
Check Supabase `call_logs` table for entries after test calls.

---

## Step 9: Multi-Tenant Setup

To use different agents per business:

1. Store `retell_agent_id` in the businesses table
2. When making outbound calls or configuring, use the business's specific agent

```sql
UPDATE businesses 
SET retell_agent_id = 'agent_xxxxx'
WHERE slug = 'greenline365';
```

---

## Troubleshooting

### Functions Not Working
- Check webhook URL is correct and publicly accessible
- Verify RETELL_API_KEY is set
- Check function response format matches expected `{ result: "string" }`

### High Latency
- Ensure function endpoints respond in < 500ms
- Use caching for frequently requested data (availability)
- Check database query performance

### Nudge Strategy Not Working
- Review "Rule of Three" test: Regenerate 10 answers for cancellation request
- If agent fails to nudge even once, prompt needs more specificity
- Add more example interactions to the prompt

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/retell/webhook` | POST | Receive call events |
| `/api/retell/functions` | POST | Handle function calls |
| `/api/retell/agents` | GET | Get agent configurations |
| `/api/retell/agents?type=receptionist` | GET | Get specific agent config |

---

## Pricing Note

Retell AI charges per minute of call time. Monitor usage in their dashboard.
