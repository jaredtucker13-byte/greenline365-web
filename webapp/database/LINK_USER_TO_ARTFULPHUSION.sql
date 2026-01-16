-- Link your admin account to ArtfulPhusion
-- Run this in Supabase SQL Editor

-- First, check if user_businesses table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_businesses') THEN
    -- Link admin to ArtfulPhusion
    INSERT INTO user_businesses (user_id, business_id, role, is_primary)
    SELECT 
      '677b536d-6521-4ac8-a0a5-98278b35f4cc',
      id,
      'owner',
      false
    FROM businesses WHERE slug = 'artfulphusion'
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Linked admin to ArtfulPhusion';
  ELSE
    -- Create user_businesses table if it doesn't exist
    CREATE TABLE user_businesses (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      is_primary BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, business_id)
    );
    
    -- Link admin to ArtfulPhusion
    INSERT INTO user_businesses (user_id, business_id, role, is_primary)
    SELECT 
      '677b536d-6521-4ac8-a0a5-98278b35f4cc',
      id,
      'owner',
      false
    FROM businesses WHERE slug = 'artfulphusion';
    
    RAISE NOTICE '✅ Created user_businesses table and linked admin';
  END IF;
END $$;

-- Verify
SELECT 
  b.name as business,
  b.is_white_label,
  ub.role
FROM user_businesses ub
JOIN businesses b ON b.id = ub.business_id
WHERE ub.user_id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';
