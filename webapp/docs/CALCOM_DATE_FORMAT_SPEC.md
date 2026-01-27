# CAL.COM DATE FORMAT SPECIFICATION
# CRITICAL: Use this EXACT format or bookings will fail

## THE EXACT FORMAT

```
Day of week, YYYY Month M/DD/YYYY HH:MM AM/PM
```

**Format Breakdown:**
- `Day of week` = Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- `,` = Comma (required)
- ` ` = Space
- `YYYY` = 4-digit year (e.g., 2026)
- ` ` = Space
- `Month` = Full month name (January, February, March, April, May, June, July, August, September, October, November, December)
- ` ` = Space
- `M/DD/YYYY` = Month/Day/Year with single digit month for Jan-Sep, double digit for Oct-Dec
- ` ` = Space
- `HH:MM` = Hour:Minute in 12-hour format (01-12)
- ` ` = Space
- `AM/PM` = Morning or afternoon

---

## CORRECT EXAMPLES

```
✅ "Thursday, 2026 May 5/17/2026 10:00 AM"
✅ "Monday, 2026 January 1/27/2026 7:00 AM"
✅ "Friday, 2026 December 12/15/2026 2:30 PM"
✅ "Tuesday, 2026 March 3/04/2026 9:15 AM"
✅ "Wednesday, 2026 June 6/21/2026 11:45 AM"
```

---

## INCORRECT EXAMPLES (WILL FAIL)

```
❌ "Jan 28, 2026 7:00 AM" - Wrong format
❌ "Tuesday, January 28, 2026 7:00 AM" - Missing M/DD/YYYY format
❌ "2026-01-28 07:00" - ISO format not accepted
❌ "1/28/2026 7:00 AM" - Missing day of week and month name
❌ "Tuesday, 2026 January 01/28/2026 07:00 AM" - Wrong time format (use 7:00 not 07:00)
```

---

## MONTH NAME REFERENCE

Always use FULL month names:
- January (not Jan)
- February (not Feb)
- March (not Mar)
- April (not Apr)
- May
- June (not Jun)
- July (not Jul)
- August (not Aug)
- September (not Sep or Sept)
- October (not Oct)
- November (not Nov)
- December (not Dec)

---

## TIME FORMAT RULES

**12-Hour Format (Required):**
- Use: 7:00 AM, 2:30 PM, 11:45 AM
- NOT: 07:00, 14:30, 23:45 (24-hour format)

**Single-Digit Hours:**
- Use: 7:00 AM (not 07:00 AM)
- Use: 9:15 PM (not 09:15 PM)

**Minutes:**
- Always two digits: 7:00, 7:05, 7:15
- NOT: 7:0, 7:5

---

## CONVERSION EXAMPLES

### User Says → AI Formats

| User Input | AI Formats To |
|------------|---------------|
| "Tomorrow at 10 AM" | "Tuesday, 2026 January 1/28/2026 10:00 AM" |
| "Next Thursday 2 PM" | "Thursday, 2026 February 2/06/2026 2:00 PM" |
| "7 AM tomorrow" | "Tuesday, 2026 January 1/28/2026 7:00 AM" |
| "This Friday at noon" | "Friday, 2026 January 1/31/2026 12:00 PM" |

### After-Hours STANDARD Priority → Always 7 AM Next Business Day

| Current Day | Current Time | Books For |
|-------------|--------------|-----------|
| Monday | 9:00 PM | "Tuesday, 2026 January 1/28/2026 7:00 AM" |
| Friday | 10:00 PM | "Monday, 2026 February 2/03/2026 7:00 AM" |
| Saturday | Any time | "Monday, 2026 February 2/03/2026 7:00 AM" |
| Sunday | Any time | "Monday, 2026 February 2/03/2026 7:00 AM" |

---

## REQUIRED PARAMETERS FOR book_appointment_cal

```json
{
  "time": "Thursday, 2026 May 5/17/2026 10:00 AM",
  "timezone": "America/New_York",
  "guest_email": "greenline365help@gmail.com",
  "guest_name": "John Smith",
  "email": "john.smith@email.com",
  "guest_phone": "+15551234567",
  "rescheduleReason": "first time booking",
  "notes": "High priority electrical emergency: sparking kitchen outlets"
}
```

---

## VALIDATION CHECKLIST

Before calling book_appointment_cal, verify:

- [ ] Day of week matches the date (use day calculation)
- [ ] Year is 2026 or later (always in future)
- [ ] Month name is spelled out fully
- [ ] Date format is M/DD/YYYY (single digit month for Jan-Sep)
- [ ] Time is 12-hour format with AM/PM
- [ ] Single-digit hours don't have leading zero (7:00 not 07:00)
- [ ] Minutes always have two digits (7:00 not 7:0)
- [ ] Timezone is "America/New_York"
- [ ] guest_email is "greenline365help@gmail.com"
- [ ] rescheduleReason is "first time booking"

---

## AI PROMPT INSTRUCTIONS

Add this to your Retell system prompt in the FUNCTIONS section:

```
CRITICAL: When calling book_appointment_cal, the time parameter MUST follow this EXACT format:

"Day of week, YYYY Month M/DD/YYYY HH:MM AM/PM"

Example: "Thursday, 2026 May 5/17/2026 10:00 AM"

Steps to format correctly:
1. Convert any relative date ("tomorrow", "next Tuesday") to absolute date
2. Determine the day of week for that date
3. Format as: [Day], [YYYY] [Month name] [M/DD/YYYY] [H:MM AM/PM]
4. Always use America/New_York timezone
5. Always use greenline365help@gmail.com for guest_email
6. Always use "first time booking" for rescheduleReason

WRONG: "Tuesday, January 28, 2026 7:00 AM"
RIGHT: "Tuesday, 2026 January 1/28/2026 7:00 AM"
```

---

## TESTING

Test these conversions in your Retell agent:

**Test 1: Tomorrow at 10 AM**
- Input: User agrees to "tomorrow at 10 AM"
- AI should format: "[Correct day], 2026 [Month] [M/DD/2026] 10:00 AM"

**Test 2: After-Hours Queue (7 AM Next Day)**
- Input: After-hours standard call
- AI should format: "[Next business day], 2026 [Month] [M/DD/2026] 7:00 AM"

**Test 3: Specific Date**
- Input: "Thursday the 30th at 2 PM"
- AI should format: "Thursday, 2026 January 1/30/2026 2:00 PM"

---

Ready to update your Retell agent with this exact formatting!
