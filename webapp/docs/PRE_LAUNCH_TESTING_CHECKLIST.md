# Greenline365 Pre-Launch Testing Checklist
## 10 "Superhuman" Scenarios to Validate Before Go-Live

---

## Overview
Run these 10 scenarios to ensure the Greenline365 Property Intelligence Engine is bulletproof before sending prospecting emails.

For each test, capture the "Thought Log" from the Edge Function:
- ✅ Identity Match: Did it find the correct `tenant_id`?
- ✅ Weather Fetch: Did it successfully pull local temperature/conditions?
- ✅ CRS Fetch: Did it pull the correct Relationship Score?
- ✅ Prompt Construction: Did it inject the "Location Flavor" correctly?

---

## Test Scenarios

### Test #1: The Stranger (Low CRS)
**Scenario:** Call from a brand new, unrecognized phone number.

**Test Setup:**
- Use a phone number NOT in the contacts table
- Ensure no property match exists

**Expected "Superhuman" Outcome:**
- Formal, professional greeting
- Captures name and address
- Establishes trust with "My Pleasure" tone
- Delivers Florida Two-Party Consent recording disclosure:
  > "Just so you know, my human creators make me record this call for quality and training—and to make sure I don't miss a single detail of your project."
- Relationship Score assigned: 50 (default)
- Vibe Category: "stranger"

**Pass Criteria:**
- [ ] Recording disclosure delivered
- [ ] Name captured
- [ ] Address captured
- [ ] Contact created in database
- [ ] Greeting was formal, not casual

---

### Test #2: The VIP (High CRS)
**Scenario:** Returning customer with high relationship score.

**Test Setup:**
```sql
UPDATE contacts SET relationship_score = 90 WHERE phone_normalized = '5551234567';
```

**Expected "Superhuman" Outcome:**
- Warm, familiar greeting: "Welcome back, [Name]! Great to hear from you."
- Skips basic info capture (already has it)
- Offers priority booking slots
- May use casual humor
- Vibe Category: "vip"

**Pass Criteria:**
- [ ] Recognized caller by name
- [ ] Did NOT ask for address (already known)
- [ ] Offered priority treatment
- [ ] Greeting was warm and casual

---

### Test #3: The Storm Warning
**Scenario:** Call during severe weather conditions.

**Test Setup:**
- Set property ZIP code to an area with active weather alerts
- Or manually inject weather data showing "Thunderstorm Warning"

**Expected "Superhuman" Outcome:**
- AI leads with weather-aware comment:
  > "I see there's a severe thunderstorm warning for your area. Our techs are brave, but they aren't lightning-proof!"
- Proactively suggests rescheduling to safer time
- Weather recommendation delivered

**Pass Criteria:**
- [ ] Weather data fetched successfully
- [ ] Storm warning acknowledged in conversation
- [ ] Alternative time slots offered
- [ ] Safety mentioned as priority

---

### Test #4: The "Data Decay" Flag
**Scenario:** Property has old equipment that needs verification.

**Test Setup:**
```sql
UPDATE assets 
SET install_date = '2012-01-01', 
    confidence_score = 45,
    asset_type = 'HVAC',
    brand = 'Carrier'
WHERE property_id = 'YOUR_PROPERTY_UUID';
```

**Expected "Superhuman" Outcome:**
- AI acknowledges the aging equipment:
  > "I see your system is a bit of a classic—14 years old! Should we have our tech do a 'Health Check' while they're there?"
- Verification prompt triggered due to low confidence score
- Upsell opportunity presented naturally

**Pass Criteria:**
- [ ] Confidence score below 70 detected
- [ ] Verification question asked
- [ ] Equipment age referenced naturally
- [ ] Maintenance upsell suggested

---

### Test #5: New Owner / Old House
**Scenario:** New caller at an address we've serviced before.

**Test Setup:**
- Use a NEW phone number (not in contacts)
- When asked for address, give an EXISTING property address

**Expected "Superhuman" Outcome:**
- AI recognizes the property but not the person:
  > "Ah, I know that house! We've serviced the equipment there for years. Welcome to the neighborhood!"
- Offers to register them as the new owner
- References existing property/asset history
- Property continuity demonstrated

**Pass Criteria:**
- [ ] Property found via fuzzy address search
- [ ] Equipment history mentioned
- [ ] New owner registration offered
- [ ] Contact created and linked to existing property

---

### Test #6: The "Inches" Test
**Scenario:** Customer mentions a measurement in inches.

**Test Setup:**
- During the call, say: "I need a 10-inch pipe replaced"

**Expected "Superhuman" Outcome:**
- AI correctly processes the measurement
- Summary/transcript shows: `10-inch` or `10"`
- Greeting quotes remain standard (e.g., "It's my pleasure")
- No confusion between inches and quotation marks

**Pass Criteria:**
- [ ] Measurement recorded correctly as 10-inch or 10"
- [ ] Quotation marks in speech not converted to inches
- [ ] Transcript is readable and accurate

---

### Test #7: The Objection Trap
**Scenario:** Customer challenges pricing or value.

**Test Input:**
> "Why is your diagnostic fee so high?"

**Expected "Superhuman" Outcome:**
- AI delivers confident, witty rebuttal:
  > "Great question! Our master techs don't just show up—they show up prepared. Unlike 'a guy with a truck,' our team knows your exact equipment before they ring the doorbell. That expertise is what keeps a $150 diagnostic from turning into a $3,000 surprise."
- Maintains "My Pleasure" hospitality tone
- Does NOT get defensive or apologetic

**Pass Criteria:**
- [ ] Confident response delivered
- [ ] Value proposition explained
- [ ] Tone remained positive and professional
- [ ] Did not offer discounts or apologize

---

### Test #8: The Cal.com Loop
**Scenario:** Book an appointment through the voice interface.

**Test Setup:**
- Ensure Cal.com integration is active
- Request a specific day/time

**Expected "Superhuman" Outcome:**
1. AI checks availability via `check_availability` tool
2. Offers available slots
3. Customer selects a time
4. AI confirms booking via `create_booking` tool
5. Slot removed from Cal.com availability
6. Database updated with appointment status

**Pass Criteria:**
- [ ] Availability checked successfully
- [ ] Booking created in Cal.com
- [ ] Confirmation number provided
- [ ] Slot no longer available for others
- [ ] Interaction logged in database

---

### Test #9: The SMS "Value Bomb"
**Scenario:** SMS follow-up after successful booking.

**Test Setup:**
- Complete a booking (Test #8)
- Wait for post-call SMS trigger

**Expected "Superhuman" Outcome:**
Within 60 seconds of call ending:
1. SMS confirmation sent with booking details
2. "Value Bomb" content included (maintenance tip, property history link, etc.)
3. Message logged in `sms_messages` table

**Sample SMS:**
```
Hi John! Your appointment is confirmed:
📅 Tuesday, Feb 4th at 10:00 AM
📍 123 Main St, Tampa

Fun fact: Your Carrier unit is 6 years into its expected 15-year lifespan. 
Ask your tech about our Comfort Club for priority scheduling!

Reply YES to confirm. - The Greenline365 Team
```

**Pass Criteria:**
- [ ] SMS sent within 60 seconds
- [ ] Booking details accurate
- [ ] Value-add content included
- [ ] SMS logged in database

---

### Test #10: The Emergency Swap
**Scenario:** Urgent call requiring immediate human intervention.

**Test Setup:**
- Call at unusual hour (e.g., 2 AM)
- Say: "My house is flooding!" or "I smell gas!"

**Expected "Superhuman" Outcome:**
- AI immediately drops casual/witty persona
- Switches to high-urgency mode:
  > "I hear you—that's an emergency situation. I'm connecting you with our emergency team right now. Stay safe."
- Triggers `transfer_to_human` tool
- Sends emergency SMS alert to business owner
- Emergency keyword detected from `industry_configs`

**Pass Criteria:**
- [ ] Emergency keyword detected ("flooding", "gas")
- [ ] Tone shifted to urgent/serious
- [ ] Transfer initiated immediately
- [ ] Owner notification sent
- [ ] No jokes or casual humor used

---

## Debug Checklist for Each Test

For every test call, verify in the logs:

```
[Pre-Greeting] Incoming call from +1555XXXXXXX
[Pre-Greeting] Tenant identified: {tenant_id}
[Pre-Greeting] Contact lookup: {found/not_found}
[Pre-Greeting] Property lookup: {found/not_found}
[Pre-Greeting] Weather fetch: {temp}°F, alerts: {count}
[Pre-Greeting] CRS: {score}, Vibe: {category}
[Pre-Greeting] Confidence: {score}
[Pre-Greeting] Joke ID selected: {id}
[Pre-Greeting] Response built successfully
```

---

## Critical Compliance Check

**Florida Two-Party Consent (MANDATORY):**
Verify that EVERY test call includes the recording disclosure. This is non-negotiable and must be hardcoded:

> "Just so you know, my human creators make me record this call for quality and training—and to make sure I don't miss a single detail of your project. Now, how can I help you today?"

---

## Sign-Off

| Test # | Scenario | Pass/Fail | Tester | Date |
|--------|----------|-----------|--------|------|
| 1 | The Stranger | | | |
| 2 | The VIP | | | |
| 3 | The Storm Warning | | | |
| 4 | The Data Decay Flag | | | |
| 5 | New Owner / Old House | | | |
| 6 | The "Inches" Test | | | |
| 7 | The Objection Trap | | | |
| 8 | The Cal.com Loop | | | |
| 9 | The SMS Value Bomb | | | |
| 10 | The Emergency Swap | | | |

**All 10 tests passed:** ☐ Yes ☐ No

**Ready for Founding 30 Outreach:** ☐ Yes ☐ No

---

*Complete this checklist before sending the first "Are You Open?" prospecting email.*
