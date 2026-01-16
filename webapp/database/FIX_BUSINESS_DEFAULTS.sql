-- ============================================
-- FIX: Business Defaults & Admin Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Create GreenLine365 as the primary business (if not exists)
INSERT INTO businesses (
  name, slug, tier, is_white_label, can_edit_site, monthly_price, industry, settings
) VALUES (
  'GreenLine365',
  'greenline365',
  'tier3',
  false,  -- NOT white-label (this is the main brand)
  true,   -- Admin CAN edit site
  0,      -- Owner account, no charge
  'Technology',
  '{
    "features": {
      "content_forge": true,
      "mockup_generator": true,
      "social_posting": true,
      "crm": true,
      "analytics": true,
      "knowledge_base": true,
      "blog": true,
      "email": true,
      "sms": true,
      "bookings": true,
      "ai_receptionist": true,
      "calendar": true
    }
  }'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  is_white_label = false,
  can_edit_site = true;

SELECT '✅ Step 1: GreenLine365 business created/updated' as status;

-- STEP 2: Link admin to GreenLine365 as PRIMARY
-- First, set all existing links to non-primary
UPDATE user_businesses 
SET is_primary = false 
WHERE user_id = '677b536d-6521-4ac8-a0a5-98278b35f4cc';

-- Then link to GreenLine365 as primary
INSERT INTO user_businesses (user_id, business_id, role, is_primary)
SELECT 
  '677b536d-6521-4ac8-a0a5-98278b35f4cc',
  id,
  'owner',
  true  -- This is the PRIMARY business
FROM businesses WHERE slug = 'greenline365'
ON CONFLICT (user_id, business_id) DO UPDATE SET
  is_primary = true,
  role = 'owner';

SELECT '✅ Step 2: Admin linked to GreenLine365 as PRIMARY' as status;

-- STEP 3: Keep ArtfulPhusion link but as non-primary
INSERT INTO user_businesses (user_id, business_id, role, is_primary)
SELECT 
  '677b536d-6521-4ac8-a0a5-98278b35f4cc',
  id,
  'owner',
  false  -- NOT primary
FROM businesses WHERE slug = 'artfulphusion'
ON CONFLICT (user_id, business_id) DO UPDATE SET
  is_primary = false;

SELECT '✅ Step 3: ArtfulPhusion set as secondary' as status;

-- VERIFICATION
SELECT 
  b.name,
  b.slug,
  b.is_white_label,
  ub.role,
  ub.is_primary
FROM user_businesses ub
JOIN businesses b ON b.id = ub.business_id
WHERE ub.user_id = '677b536d-6521-4ac8-a0a5-98278b35f4cc'
ORDER BY ub.is_primary DESC;
