-- ============================================
-- FINAL ONE-TIME FIX SCRIPT
-- ============================================
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- It's safe to run multiple times (idempotent)
-- ============================================

-- PART 1: Ensure is_admin column exists on profiles
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- PART 2: Make your account an admin
-- ============================================
-- This will create or update your profile
INSERT INTO profiles (id, full_name, is_admin)
VALUES ('677b536d-6521-4ac8-a0a5-98278b35f4cc', 'Jared Tucker', true)
ON CONFLICT (id) DO UPDATE SET 
  is_admin = true,
  full_name = COALESCE(profiles.full_name, 'Jared Tucker');

-- PART 3: Ensure access_codes table has created_by column
-- ============================================
ALTER TABLE access_codes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- PART 4: Fix RLS policies for access_codes (admin-only access)
-- ============================================
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage codes" ON access_codes;
DROP POLICY IF EXISTS "Service role can manage codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can view codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can insert codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can update codes" ON access_codes;
DROP POLICY IF EXISTS "Admins can delete codes" ON access_codes;

-- Create comprehensive admin policy for all operations
CREATE POLICY "Admins can manage codes" ON access_codes
  FOR ALL
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

-- PART 5: Grant necessary permissions
-- ============================================
GRANT ALL ON access_codes TO authenticated;
GRANT ALL ON access_codes TO service_role;
GRANT ALL ON code_redemptions TO authenticated;
GRANT ALL ON code_redemptions TO service_role;

-- ============================================
-- VERIFICATION QUERIES (Run these after to confirm)
-- ============================================

-- Check 1: Confirm you're an admin
SELECT 
  '✅ SUCCESS: You are an admin!' as status,
  id, 
  full_name, 
  is_admin 
FROM profiles 
WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

-- Check 2: Confirm access_codes has created_by column
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'access_codes' 
    AND column_name = 'created_by'
  ) 
    THEN '✅ SUCCESS: created_by column exists' 
    ELSE '❌ ERROR: created_by column missing' 
  END as column_status;

-- Check 3: Confirm RLS policy exists
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_codes' 
    AND policyname = 'Admins can manage codes'
  ) 
    THEN '✅ SUCCESS: RLS policy created' 
    ELSE '❌ ERROR: RLS policy missing' 
  END as policy_status;

-- ============================================
-- DONE! All fixes applied.
-- ============================================
