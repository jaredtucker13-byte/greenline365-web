# RETELL FUNCTION JSON SCHEMAS
# Copy-paste these directly into your Retell dashboard

## FUNCTION 1: capture_lead (Priority-Based Triage)

**Name:** `capture_lead`

**Description:**
```
Capture emergency service lead with priority-based routing. HIGH priority (sparks/smoke/fire) alerts owner immediately. STANDARD priority queues for 7 AM if after-hours. Call immediately after gathering all customer info.
```

**URL:** `https://www.greenline365.com/api/mcp`

**Method:** `POST`

**Parameters:**
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
    "description": "One-sentence summary of the electrical problem",
    "required": true
  },
  "priority_level": {
    "type": "string",
    "description": "Must be 'high' (if sparks/smoke/fire/exposed wires) or 'standard' (everything else)",
    "required": true,
    "enum": ["high", "standard"]
  },
  "is_safety_hazard": {
    "type": "boolean",
    "description": "True if sparks, smoke, fire, burning smell, or exposed wires are present",
    "required": false
  },
  "time_of_call": {
    "type": "string",
    "description": "business_hours (7AM-6PM) or after_hours (6PM-7AM). Used to determine routing.",
    "required": false,
    "enum": ["business_hours", "after_hours"]
  }
}
```

---

## FUNCTION 2: check_availability_cal

**Name:** `check_availability_cal`

**Description:**
```
Check calendar availability for STANDARD priority calls during business hours. Only use for non-emergency appointments. Returns available time slots.
```

**URL:** `https://www.greenline365.com/api/mcp`

**Method:** `POST`

**Parameters:**
```json
{
  "start_time": {
    "type": "string",
    "description": "Absolute start date in format: 'Tuesday, January 28, 2026 9:00 AM'. Never use relative dates.",
    "required": true
  },
  "end_time": {
    "type": "string",
    "description": "Absolute end date in format: 'Tuesday, January 28, 2026 5:00 PM'",
    "required": false
  }
}
```

---

## FUNCTION 3: book_appointment_cal

**Name:** `book_appointment_cal`

**Description:**
```
Book callback appointment. For after-hours STANDARD priority, time should be 7:00 AM next business day. 

CRITICAL: Time format MUST be exactly: "Day of week, YYYY Month M/DD/YYYY HH:MM AM/PM"
Example: "Thursday, 2026 May 5/17/2026 10:00 AM"

Email defaults to greenline365help@gmail.com if customer doesn't provide.
```

**URL:** `https://www.greenline365.com/api/mcp`

**Method:** `POST`

**Parameters:**
```json
{
  "time": {
    "type": "string",
    "description": "EXACT FORMAT REQUIRED: 'Day of week, YYYY Month M/DD/YYYY HH:MM AM/PM'. Example: 'Thursday, 2026 May 5/17/2026 10:00 AM'. MUST be in the future.",
    "required": true
  },
  "guest_name": {
    "type": "string",
    "description": "Customer full name (first and last)",
    "required": true
  },
  "guest_email": {
    "type": "string",
    "description": "Always use greenline365help@gmail.com",
    "required": true
  },
  "email": {
    "type": "string",
    "description": "Customer email if provided, otherwise greenline365help@gmail.com",
    "required": false
  },
  "guest_phone": {
    "type": "string",
    "description": "Customer phone in +1XXXXXXXXXX format",
    "required": false
  },
  "notes": {
    "type": "string",
    "description": "One-sentence summary of conversation/issue",
    "required": false
  },
  "timezone": {
    "type": "string",
    "description": "Always America/New_York",
    "required": false
  },
  "rescheduleReason": {
    "type": "string",
    "description": "Always use 'first time booking'",
    "required": false
  }
}
```

---

## FUNCTION 4: send_sms (Optional - Auto-triggered)

**Name:** `send_sms`

**Description:**
```
Send SMS confirmation to customer. This is automatically triggered by capture_lead. Only call manually if you need to send an additional message.
```

**URL:** `https://www.greenline365.com/api/mcp`

**Method:** `POST`

**Parameters:**
```json
{
  "to": {
    "type": "string",
    "description": "Customer phone number to send SMS",
    "required": true
  },
  "message": {
    "type": "string",
    "description": "Message content to send",
    "required": true
  }
}
```

---

## SYSTEM ARCHITECTURE NOTES

### Priority Routing Logic

**HIGH PRIORITY (Immediate Alert)**
- Keywords: sparks, smoke, fire, exposed wires, electric shock
- Action: Immediate SMS to owner (even 3 AM)
- Promise: "15-minute callback"
- Customer SMS: "Emergency electrician will call within 15 minutes"

**STANDARD PRIORITY + AFTER-HOURS (Queue for Morning)**
- Everything else after 6 PM or before 7 AM
- Action: Log in database, NO immediate alert to owner
- Promise: "First call at 7 AM tomorrow"
- Customer SMS: "You're #1 in Priority Queue for 7:00 AM"

**STANDARD PRIORITY + BUSINESS HOURS (Same-Day Service)**
- Everything else during 7 AM - 6 PM
- Action: SMS to owner for callback within hour
- Promise: "Callback within the hour"
- Customer SMS: "Electrician will call within the hour"

### The Success State

Every call MUST end with:
1. Verbal confirmation of what happens next
2. SMS sent to customer with confirmation
3. Clear expectation set (15 min, 1 hour, or 7 AM next day)

This "receipt" prevents them from calling competitors.

---

## TESTING THE SYSTEM

### Test Scenario 1: HIGH PRIORITY (Emergency)
```
Time: 11 PM (after hours)
Customer: "My outlets are sparking"
Expected: 
- Agent classifies as HIGH PRIORITY
- Promises 15-minute callback
- Owner gets immediate SMS alert
- Customer gets emergency confirmation SMS
```

### Test Scenario 2: STANDARD PRIORITY After-Hours
```
Time: 9 PM (after hours)
Customer: "My bedroom outlets stopped working"
Expected:
- Agent classifies as STANDARD PRIORITY
- Promises 7 AM first callback
- Owner NOT alerted (queued for morning)
- Customer gets queue confirmation SMS
```

### Test Scenario 3: STANDARD PRIORITY Business Hours
```
Time: 2 PM (business hours)
Customer: "I need to install some outlets"
Expected:
- Agent classifies as STANDARD PRIORITY
- Checks availability
- Books appointment
- Owner gets standard lead notification
```

---

## DEPLOYMENT CHECKLIST

- [ ] Copy updated system prompt to Retell agent
- [ ] Add all 4 functions with correct parameters
- [ ] Set webhook URL: https://www.greenline365.com/api/mcp
- [ ] Test HIGH priority scenario
- [ ] Test STANDARD after-hours scenario
- [ ] Test STANDARD business hours scenario
- [ ] Verify SMS confirmations arrive on customer phone
- [ ] Verify owner only alerted for HIGH priority or business hours calls
- [ ] Deploy to production Retell number
- [ ] Add demo number to prospecting emails

---

## FUTURE ENHANCEMENTS

1. **Morning Queue System:**
   - Cron job at 6:50 AM to send owner list of queued STANDARD calls
   - Single SMS with all overnight leads prioritized by time received

2. **Customer Portal:**
   - SMS includes link to track queue position
   - Customer can see "You're #1, callback at 7:15 AM"

3. **Analytics Dashboard:**
   - Track HIGH vs STANDARD priority split
   - Measure after-hours call volume
   - Calculate revenue from emergency upcharge vs standard service

4. **Multi-Electrician Dispatch:**
   - Route by zip code to nearest available electrician
   - Load balancing for multiple techs
