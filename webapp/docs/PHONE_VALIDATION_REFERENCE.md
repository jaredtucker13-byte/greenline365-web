# US PHONE NUMBER VALIDATION - QUICK REFERENCE

## Format Rules

**What Customer Might Give:**
- "555-123-4567" (10 digits - most common)
- "1-555-123-4567" (11 digits with leading 1)
- "(555) 123-4567" (10 digits with parentheses)
- "5551234567" (10 digits no formatting)

**What AI Should Store:**
- Always: `+15551234567` (11 digits with +1 prefix)

**What AI Should Say Back:**
- Always: "555-123-4567" (natural format, no +1)

---

## Validation Logic

```
Step 1: Strip all non-numeric characters (spaces, dashes, parentheses)
Step 2: Count remaining digits

If 10 digits:
  ✅ VALID
  → Add "+1" prefix
  → Store as: +1XXXXXXXXXX
  → Say back: "XXX-XXX-XXXX"

If 11 digits AND starts with "1":
  ✅ VALID
  → Add "+" prefix
  → Store as: +1XXXXXXXXXX
  → Say back: "XXX-XXX-XXXX" (drop the leading 1 when speaking)

If 11 digits AND does NOT start with "1":
  ❌ ERROR - Too many digits
  → Use: "It sounds like I caught an extra digit..."

If less than 10 digits:
  ❌ ERROR - Too few digits
  → Use: "I think I missed a few digits..."

If more than 11 digits:
  ❌ ERROR - Way too many
  → Use: "Can you give me just your 10-digit number with area code?"
```

---

## Examples

### Example 1: Customer Gives 10 Digits (Most Common)
```
Customer: "My number is 518-879-9207"

AI Internal Process:
- Count digits: 5,1,8,8,7,9,9,2,0,7 = 10 digits ✅
- Store as: +15188799207
- Say back in natural format

AI Says: "Just to make sure I have it right, that's 518-879-9207?"
```

### Example 2: Customer Gives 11 Digits with Leading 1
```
Customer: "1-518-879-9207"

AI Internal Process:
- Count digits: 1,5,1,8,8,7,9,9,2,0,7 = 11 digits
- Starts with 1? YES ✅
- Store as: +15188799207
- Say back in natural format (drop the 1)

AI Says: "Just to make sure, that's 518-879-9207?"
```

### Example 3: Customer Gives Wrong Number (Too Many)
```
Customer: "555-123-4567-8"

AI Internal Process:
- Count digits: 5,5,5,1,2,3,4,5,6,7,8 = 11 digits
- Starts with 1? NO
- This is 11 digits but doesn't start with 1 = ERROR ❌

AI Says: "I'm sorry, it sounds like I might have caught an extra digit. I have 555-123-4567-8, which feels like one too many. What's the correct number with your area code?"
```

### Example 4: Customer Gives Too Few Digits
```
Customer: "879-9207"

AI Internal Process:
- Count digits: 8,7,9,9,2,0,7 = 7 digits
- Less than 10 = ERROR ❌

AI Says: "I'm sorry, I think I missed your area code. I only caught 879-9207. Can you give me the full number with area code?"
```

---

## Backend Function Format

When calling `capture_lead` function:

```json
{
  "customer_phone": "+15188799207"
}
```

**NEVER:**
```json
{
  "customer_phone": "518-879-9207"  ❌
}
```

**NEVER:**
```json
{
  "customer_phone": "5188799207"  ❌
}
```

---

## Common Mistakes to Avoid

❌ **Mistake 1:** Repeating back "+1" to customer
- DON'T SAY: "That's +1-518-879-9207?"
- DO SAY: "That's 518-879-9207?"

❌ **Mistake 2:** Accepting 11 digits that don't start with 1
- Customer: "555-123-4567-8" (11 digits, not starting with 1)
- DON'T: Accept it as valid
- DO: Ask for correction

❌ **Mistake 3:** Asking customer to add the "1"
- DON'T SAY: "Can you add a 1 before the area code?"
- DO: Automatically add it in the background

❌ **Mistake 4:** Storing without +1 prefix
- DON'T STORE: "5188799207"
- DO STORE: "+15188799207"

---

## Testing Checklist

Test these inputs:

- [ ] "555-123-4567" (10 digits) → Should auto-add +1
- [ ] "1-555-123-4567" (11 with 1) → Should accept
- [ ] "(555) 123-4567" (10 with parens) → Should auto-add +1
- [ ] "555-123-4567-8" (11 wrong) → Should reject and ask for correction
- [ ] "555-1234" (7 digits) → Should ask for area code
- [ ] "1-555-123-4567-8" (12 digits) → Should reject

---

## Summary

**ACCEPT:** 10 or 11 digits (11 only if starts with 1)
**AUTO-FIX:** Add +1 to 10-digit numbers
**STORE:** Always as +1XXXXXXXXXX
**SAY:** Always in natural format without +1
**ERROR HANDLING:** Use "save-face" empathy, never blame customer

---

Ready to implement!
