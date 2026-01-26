# 🎯 Real-World Testing Guide: Voice AI + SMS System

## Overview
This guide walks you through testing your GreenLine365 Real-Feel AI system like a real customer would experience it.

---

## 🔐 PRE-FLIGHT CHECK

### ✅ Step 1: Verify All Environment Variables Added
Before testing, confirm you've added ALL 16 environment variables to Vercel:

- [ ] RETELL_API_KEY
- [ ] TWILIO_ACCOUNT_SID
- [ ] TWILIO_AUTH_TOKEN
- [ ] TWILIO_PHONE_NUMBER
- [ ] TWILIO_SMS_NUMBER
- [ ] CALCOM_API_KEY
- [ ] CALCOM_API_URL
- [ ] CALCOM_EVENT_TYPE_ID
- [ ] CALCOM_USERNAME
- [ ] OPENWEATHER_API_KEY
- [ ] KIE_API_KEY
- [ ] NEXT_PUBLIC_SITE_URL
- [ ] EMERGENT_LLM_KEY
- [ ] Plus existing: Supabase, SendGrid, OpenRouter

### ✅ Step 2: Redeploy Application
After adding variables, you MUST redeploy:
1. Go to Vercel Dashboard → Deployments
2. Click "Redeploy" on latest deployment
3. Wait for "Ready" status (~2-3 mins)

---

## 📱 TEST #1: SMS SYSTEM (Easiest to Test First)

### Scenario: Send Booking Confirmation
**Goal:** Test that your system can send SMS like a real booking confirmation.

#### Method A: API Test (Direct)

1. **Open Terminal/Postman**
2. **Send this request:**

```bash
curl -X POST https://greenline365.com/api/twilio/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+1YOUR_PHONE_NUMBER",
    "message": "Hi Jared! Your GreenLine365 demo is confirmed for tomorrow at 2:00 PM. Reply YES to confirm or call us at (813) 540-9691.",
    "type": "confirmation"
  }'
```

**Replace `+1YOUR_PHONE_NUMBER` with your actual phone number!**

3. **Check your phone** - you should receive the SMS within 10-30 seconds

#### Expected Results:
✅ You receive SMS from: **(813) 540-9691**
✅ API returns: `{ "success": true, "message_sid": "SM..." }`
✅ Database logs: Check `sms_messages` table in Supabase

---

### Method B: Test Receiving SMS

1. **Text your Twilio number:** (813) 540-9691
2. **Send message:** "Hi, I'd like to book an appointment"
3. **Check webhook:** Go to Supabase → `sms_messages` table
4. **Verify:** New row with `direction: 'inbound'` should appear

**Note:** Receiving requires webhook setup in Twilio (covered below)

---

## 🎙️ TEST #2: VOICE AI CALL (Real Customer Experience)

### Prerequisites: Configure Retell Agent

#### Step 1: Set Up Retell Dashboard

1. **Go to:** https://dashboard.retellai.com
2. **Create New Agent:**
   - Click **"Create Agent"**
   - Name: **"GreenLine365 Receptionist"**
   - Voice: Choose a professional voice (e.g., ElevenLabs - Jennifer)
   - Language: English (US)

#### Step 2: Add System Prompt

Copy this prompt into Retell:

```
You are the friendly receptionist for GreenLine365, a professional landscaping and lawn care company in Tampa, Florida.

Your primary role is to help customers:
1. Schedule new appointments
2. Reschedule existing appointments  
3. Answer questions about services
4. Transfer complex sales questions to the sales team

## CRITICAL RULES:
- ALWAYS convert dates like "next Tuesday" to absolute dates (e.g., "Tuesday, January 28, 2025")
- For cancellations, FIRST try to reschedule: "Would you prefer to move this to next week so you don't lose your spot?"
- ONLY cancel if customer insists
- Be warm, professional, and patient

## Services We Offer:
- Lawn maintenance (weekly/bi-weekly)
- Landscaping design
- Irrigation systems
- Tree trimming
- Seasonal cleanup

Your tone: Professional but friendly. Think helpful neighbor, not corporate robot.
```

#### Step 3: Add Function Tools

In Retell Dashboard → Functions tab, add these:

**Function 1: check_availability_cal**
```json
{
  "name": "check_availability_cal",
  "url": "https://greenline365.com/api/mcp",
  "method": "POST",
  "description": "Check calendar for available appointment times"
}
```

**Function 2: book_appointment_cal**
```json
{
  "name": "book_appointment_cal",
  "url": "https://greenline365.com/api/mcp",
  "method": "POST",
  "description": "Book a new appointment. Use greenline365help@gmail.com for email if customer doesn't provide one."
}
```

**Function 3: send_sms**
```json
{
  "name": "send_sms",
  "url": "https://greenline365.com/api/mcp",
  "method": "POST",
  "description": "Send SMS confirmation to customer"
}
```

**Function 4: get_weather_context**
```json
{
  "name": "get_weather_context",
  "url": "https://greenline365.com/api/mcp",
  "method": "POST",
  "description": "Get weather forecast for specific date/location"
}
```

#### Step 4: Configure Webhook

In Retell → Settings → Webhooks:
- **Webhook URL:** `https://greenline365.com/api/retell/webhook`
- **Events:** Select `call_started`, `call_ended`, `call_analyzed`
- Click **Save**

---

### 🎯 Making Your First Test Call

#### Option A: Web Test Call (Easiest)

1. In Retell Dashboard, click your **"GreenLine365 Receptionist"** agent
2. Click **"Test Agent"** button (top right)
3. A browser dialog will appear
4. **Click "Call"** to start

**Test Script:**
```
Agent: "Thank you for calling GreenLine365, how can I help you today?"
You: "Hi! I'd like to schedule a lawn service appointment."
Agent: "I'd be happy to help! What date works best for you?"
You: "How about next Thursday afternoon?"
Agent: [Checks availability via Cal.com]
Agent: "I have 2 PM or 4 PM available on Thursday, January 30th. Which works better?"
You: "2 PM sounds great."
Agent: "Perfect! Can I get your name and phone number?"
You: "Sure, it's Jared, and my number is [YOUR NUMBER]"
Agent: [Books appointment] "Great! You're all set for Thursday, January 30th at 2 PM. I'll send you a confirmation text shortly."
[SMS should arrive on your phone within 30 seconds]
```

#### Option B: Real Phone Call (Most Realistic)

1. **Get a Retell Phone Number:**
   - Retell Dashboard → Phone Numbers → Buy Number
   - Choose your area code (813 for Tampa)
   - Assign to "GreenLine365 Receptionist" agent

2. **Call from your phone** to test

---

## 📊 VERIFYING RESULTS

### After Test Call - Check These:

#### 1. Supabase Database
```sql
-- Check call was logged
SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 5;

-- Check SMS was sent
SELECT * FROM sms_messages ORDER BY created_at DESC LIMIT 5;

-- Check appointment was booked
-- (Check Cal.com dashboard)
```

#### 2. Cal.com Dashboard
- Go to: https://cal.com/bookings
- You should see new booking for the time you selected

#### 3. Your Phone
- Should receive SMS confirmation within 30 seconds of booking

#### 4. Retell Dashboard
- Go to Calls → Recent Calls
- Should see your test call with transcript

---

## 🧪 ADVANCED TEST SCENARIOS

### Test #1: Cancellation Nudge Strategy
**Goal:** Verify agent tries to save the booking

```
You: "I need to cancel my appointment"
Expected: Agent says "Would you prefer to reschedule instead?"
You: "No, I really need to cancel"
Expected: Agent processes cancellation, sends SMS
```

### Test #2: Weather-Aware Booking
**Goal:** Test weather API integration

```
You: "I want to book outdoor landscaping for this Saturday"
Expected: Agent checks weather, mentions if rain is forecast
Agent: "I see we're expecting rain on Saturday. Would Sunday work better?"
```

### Test #3: Warm Transfer to Sales
**Goal:** Test transfer function

```
You: "I'm interested in a full landscape redesign"
Expected: Agent says "Let me connect you with our design specialist"
Expected: Call logs show transfer_requested in database
```

### Test #4: Perfect Data Capture via SMS
**Goal:** Test SMS fallback for accuracy

```
You: "My name is difficult to spell..."
Expected: Agent says "No problem! I'll text you and you can reply with your details so I get them exactly right."
Expected: You receive SMS asking for info
```

---

## 🐛 TROUBLESHOOTING

### SMS Not Sending?
1. Check Vercel env vars are saved
2. Check Twilio account has credits
3. Test with: `curl -X POST https://greenline365.com/api/twilio/send -H "Content-Type: application/json" -d '{"to":"+1YOURPHONE","message":"test"}'`
4. Check response for errors

### Voice Agent Not Working?
1. Verify webhook URL is correct: `https://greenline365.com/api/mcp`
2. Check Retell logs for function call errors
3. Test MCP endpoint: `curl -X POST https://greenline365.com/api/mcp -H "Content-Type: application/json" -d '{"tool":"get_business_info","parameters":{}}'`

### Booking Not Creating in Cal.com?
1. Check CALCOM_API_KEY is valid
2. Check CALCOM_EVENT_TYPE_ID matches your event type
3. Test availability: View logs in Vercel

---

## ✅ SUCCESS CRITERIA

Your system is working when:
- [x] SMS arrives on your phone from (813) 540-9691
- [x] Voice agent answers when called
- [x] Agent can check availability and book appointments
- [x] Appointments appear in Cal.com
- [x] Call logs appear in Supabase `call_logs` table
- [x] SMS confirmations send automatically after booking

---

## 📞 QUICK TEST CHECKLIST

```
□ Added all 16 environment variables to Vercel
□ Redeployed application
□ Sent test SMS → received on phone
□ Created Retell agent with prompts
□ Added function tools to Retell
□ Configured webhook in Retell
□ Made test call (web or phone)
□ Received booking confirmation SMS
□ Verified booking in Cal.com
□ Checked call_logs in Supabase
```

---

## 🎉 NEXT STEPS AFTER SUCCESSFUL TEST

1. **Customize Agent Prompt** for your specific business
2. **Add More Agents** (Sales, Customer Service)
3. **Set Up Weather Cron Job** for proactive alerts
4. **Build Calendar CRUD UI** in admin dashboard
5. **Deploy to production** with monitoring

---

## Need Help?

If any test fails, check:
1. Vercel deployment logs
2. Retell function call logs
3. Supabase database for errors
4. Twilio logs for SMS delivery status
