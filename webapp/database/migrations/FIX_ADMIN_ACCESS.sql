-- Quick Fix: Make your account an admin and fix RLS for access_codes
-- Run this in Supabase SQL Editor

-- Step 1: Make your account an admin
UPDATE profiles 
SET is_admin = true 
WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

-- Step 2: If the above doesn't work, drop and recreate the RLS policies for access_codes
DROP POLICY IF EXISTS "Admins can manage codes" ON access_codes;

CREATE POLICY "Admins can manage codes" ON access_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Step 3: Verify you're an admin
SELECT id, email, is_admin FROM profiles WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';
