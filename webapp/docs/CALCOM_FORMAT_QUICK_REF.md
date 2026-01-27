# QUICK REFERENCE: CAL.COM BOOKING FORMAT

## ⚡ THE FORMAT (Memorize This)

```
"Day of week, YYYY Month M/DD/YYYY HH:MM AM/PM"
```

**Example:** `"Thursday, 2026 May 5/17/2026 10:00 AM"`

---

## 🎯 REAL EXAMPLES FOR YOUR DEMO

### After-Hours Emergency Queue (7 AM Next Day)

**If today is Monday, January 27, 2026 at 11 PM:**
```
"Tuesday, 2026 January 1/28/2026 7:00 AM"
```

**If today is Friday, January 31, 2026 at 8 PM:**
```
"Monday, 2026 February 2/03/2026 7:00 AM"
```
(Skips weekend, goes to Monday)

---

### Business Hours Booking

**User says: "Tomorrow at 2 PM"**
**Today is Tuesday, January 28:**
```
"Wednesday, 2026 January 1/29/2026 2:00 PM"
```

**User says: "Next Thursday morning at 10"**
**Today is Monday, January 27:**
```
"Thursday, 2026 January 1/30/2026 10:00 AM"
```

---

## 📋 PARAMETER CHECKLIST

Every book_appointment_cal call needs:

```json
{
  "time": "Thursday, 2026 May 5/17/2026 10:00 AM",
  "timezone": "America/New_York",
  "guest_email": "greenline365help@gmail.com",
  "guest_name": "John Smith",
  "email": "john@email.com",
  "guest_phone": "+15551234567",
  "rescheduleReason": "first time booking",
  "notes": "High priority emergency: sparking outlets"
}
```

---

## ⚠️ COMMON MISTAKES TO AVOID

❌ **Missing the M/DD/YYYY part**
- Wrong: "Thursday, 2026 May 10:00 AM"
- Right: "Thursday, 2026 May 5/17/2026 10:00 AM"

❌ **Using 24-hour time**
- Wrong: "Thursday, 2026 May 5/17/2026 14:00"
- Right: "Thursday, 2026 May 5/17/2026 2:00 PM"

❌ **Leading zeros on hours**
- Wrong: "Thursday, 2026 May 5/17/2026 07:00 AM"
- Right: "Thursday, 2026 May 5/17/2026 7:00 AM"

❌ **Abbreviated month names**
- Wrong: "Thursday, 2026 Jan 1/28/2026 7:00 AM"
- Right: "Thursday, 2026 January 1/28/2026 7:00 AM"

---

## 🎤 TELL YOUR AI IN THE PROMPT

```
When booking appointments, always format time as:
"Day of week, YYYY Month M/DD/YYYY HH:MM AM/PM"

For after-hours STANDARD priority calls:
- Always book for 7:00 AM next business day
- Skip weekends (Friday night → Monday 7 AM)
- Format example: "Monday, 2026 February 2/03/2026 7:00 AM"

Always include:
- timezone: "America/New_York"
- guest_email: "greenline365help@gmail.com"
- rescheduleReason: "first time booking"
```

---

Print this out and keep it next to you while configuring Retell! 📌
