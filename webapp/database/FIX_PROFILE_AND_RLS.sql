-- Step 1: Check if your profile exists
SELECT * FROM profiles WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

-- If no results, your profile doesn't exist yet. Create it:
INSERT INTO profiles (id, full_name, is_admin)
VALUES ('677b536d-6521-4ac8-a0a5-98278b35f4cc', 'Jared Tucker', true)
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- Step 2: Fix the RLS policy to be less strict
DROP POLICY IF EXISTS "Admins can manage codes" ON access_codes;

-- Create a more permissive policy with proper WITH CHECK
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

-- Step 3: Verify you're an admin now
SELECT id, full_name, is_admin FROM profiles WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';
