# Migration Troubleshooting Guide

## Step 1: Check What Tables Exist

Run this in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('businesses', 'user_businesses', 'access_codes', 'entitlement_overrides');
```

**Expected Result:** Should return empty (none of these tables exist yet)

---

## Step 2: Get Your User ID

```sql
SELECT id, email FROM auth.users;
```

**Copy your `id`** - it looks like: `12345678-abcd-1234-abcd-123456789abc`

---

## Step 3: Run Migration 007 (COMPLETE VERSION)

**IMPORTANT:** Before running, you MUST:

1. Open `/database/migrations/007_multi_tenant_architecture.sql`
2. Scroll to line ~500 (near the end)
3. Find this section:

```sql
/*
-- Uncomment and run after replacing YOUR_USER_ID:

INSERT INTO user_businesses (user_id, business_id, role, is_primary) VALUES
  ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000001', 'owner', true),
  ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000002', 'owner', false);

-- Update existing data to belong to GreenLine365
UPDATE leads SET business_id = 'a0000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE bookings SET business_id = 'a0000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE content_schedule SET business_id = 'a0000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
*/
```

4. **Replace BOTH instances** of `YOUR_USER_ID` with your actual ID from Step 2
5. **Remove the comment markers** - Delete `/*` at the start and `*/` at the end
6. **Copy the ENTIRE file** and paste into Supabase SQL Editor
7. Click **RUN**

---

## Step 4: Verify Migration 007 Worked

```sql
-- Should return 2 rows
SELECT id, name, slug, tier FROM businesses;

-- Should return 2 rows (your user linked to both businesses)
SELECT 
  ub.role,
  ub.is_primary,
  b.name as business_name,
  b.tier
FROM user_businesses ub
JOIN businesses b ON b.id = ub.business_id;
```

**Expected Result:**
- 2 businesses: GreenLine365 (tier3), ArtfulPhusion (tier2)
- 2 user_business links showing you as owner of both

---

## Step 5: ONLY After 007 Works, Run Migration 008

Open `/database/migrations/008_entitlement_access_system.sql`

**This migration does NOT need any editing** - just copy the entire file and run it.

---

## Common Errors & Fixes

### Error: "relation 'user_businesses' does not exist"
**Fix:** Migration 007 didn't run. Go back to Step 3.

### Error: "column 'slug' does not exist"
**Fix:** You're trying to run 008 before 007. Run 007 first.

### Error: "duplicate key value violates unique constraint"
**Fix:** Migration already partially ran. Either:
- Option A: Drop the tables and start fresh:
  ```sql
  DROP TABLE IF EXISTS user_businesses CASCADE;
  DROP TABLE IF EXISTS businesses CASCADE;
  DROP TABLE IF EXISTS memory_identity_chunks CASCADE;
  DROP TABLE IF EXISTS memory_knowledge_chunks CASCADE;
  ```
  Then run migration 007 again.

- Option B: Skip the duplicate inserts and just link your user:
  ```sql
  -- Replace YOUR_USER_ID with your actual ID
  INSERT INTO user_businesses (user_id, business_id, role, is_primary) VALUES
    ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000001', 'owner', true),
    ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000002', 'owner', false)
  ON CONFLICT DO NOTHING;
  ```

---

## Quick Verification Script

After both migrations, run this to verify everything:

```sql
-- Check all tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') 
    THEN '✅ businesses' 
    ELSE '❌ businesses MISSING' 
  END as table_businesses,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_businesses') 
    THEN '✅ user_businesses' 
    ELSE '❌ user_businesses MISSING' 
  END as table_user_businesses,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_codes') 
    THEN '✅ access_codes' 
    ELSE '❌ access_codes MISSING' 
  END as table_access_codes,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entitlement_overrides') 
    THEN '✅ entitlement_overrides' 
    ELSE '❌ entitlement_overrides MISSING' 
  END as table_entitlement_overrides;

-- Check data
SELECT 'Businesses' as type, count(*)::text as count FROM businesses
UNION ALL
SELECT 'User Links', count(*)::text FROM user_businesses
UNION ALL
SELECT 'Access Codes', count(*)::text FROM access_codes;
```

**Expected Output:**
```
✅ businesses
✅ user_businesses
✅ access_codes
✅ entitlement_overrides

type          | count
------------- | -----
Businesses    | 2
User Links    | 2
Access Codes  | 0
```

---

## Still Having Issues?

If you're still getting errors, please share:
1. The exact error message
2. Which step you're on
3. The output of the verification script above

I'll help you debug it!
