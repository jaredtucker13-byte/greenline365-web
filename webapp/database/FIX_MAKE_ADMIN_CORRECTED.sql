-- Correct Fix: Make your account an admin
-- The email is in auth.users, not profiles

-- Step 1: Make your account an admin
UPDATE profiles 
SET is_admin = true 
WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

-- Step 2: Verify (this will work now)
SELECT id, full_name, is_admin FROM profiles WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

-- You should see is_admin = true
