# Migration Status & Checklist

## 📊 Step 1: Run the Status Check

Copy and paste the entire contents of `/database/CHECK_MIGRATION_STATUS.sql` into your Supabase SQL Editor.

This will show you exactly which migrations you still need to run.

---

## 📋 Migration Files (In Order):

### 1. **CLEAN_MIGRATION_ALL_IN_ONE.sql** (Foundation)
**Run if:** Tables don't exist (businesses, user_businesses, access_codes, etc.)
**What it does:** Creates all core multi-tenant tables
**File:** `/database/migrations/CLEAN_MIGRATION_ALL_IN_ONE.sql`
**Status:** ✅ You already ran this (confirmed - tables exist)

### 2. **FIX_ACCESS_CODES_COLUMN.sql** (Quick Fix)
**Run if:** `created_by` column missing from `access_codes`
**What it does:** Adds the missing column
**File:** `/database/migrations/FIX_ACCESS_CODES_COLUMN.sql`
**Command:**
```sql
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
```
**Status:** ✅ You already ran this (confirmed)

### 3. **FIX_PROFILE_AND_RLS.sql** (Admin Access)
**Run if:** You can't send invites (RLS blocks you)
**What it does:** Makes you admin + creates proper RLS policies
**File:** `/database/migrations/FIX_PROFILE_AND_RLS.sql`
**Command:**
```sql
-- Create/update your profile with admin rights
INSERT INTO profiles (id, full_name, is_admin)
VALUES ('677b536d-6521-4ac8-a0a5-98278b35f4cc', 'Jared Tucker', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Fix the RLS policy
DROP POLICY IF EXISTS "Admins can manage codes" ON access_codes;
DROP POLICY IF EXISTS "Admin full access to access_codes" ON access_codes;

CREATE POLICY "Admin full access to access_codes" ON access_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
```
**Status:** ⚠️ **YOU NEED TO RUN THIS** (based on RLS error)

---

## ✅ Quick Action:

Since you've already run migrations 1 and 2, **just run this:**

```sql
-- Make yourself admin
INSERT INTO profiles (id, full_name, is_admin)
VALUES ('677b536d-6521-4ac8-a0a5-98278b35f4cc', 'Jared Tucker', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Create RLS policy
DROP POLICY IF EXISTS "Admin full access to access_codes" ON access_codes;

CREATE POLICY "Admin full access to access_codes" ON access_codes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );
```

**That's it!** After this, you should be able to send invites. 🎯

---

## 🧪 Verification:

After running the above, verify with:

```sql
-- Should show is_admin = true
SELECT id, full_name, is_admin FROM profiles WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

-- Should show 1 policy
SELECT policyname FROM pg_policies WHERE tablename = 'access_codes';
```

---

**Summary:** You just need ONE more migration - the admin/RLS fix. Everything else is done! 🚀
