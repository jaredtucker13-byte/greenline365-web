-- ============================================
-- WHITE-LABEL FOUNDATION - MINIMAL VERSION
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Add columns to businesses table
-- ============================================
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_white_label BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS can_edit_site BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_price INTEGER DEFAULT 299;

SELECT '✅ Step 1: Added columns to businesses' as status;

-- STEP 2: Create business_themes table
-- ============================================
CREATE TABLE IF NOT EXISTS business_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  company_name TEXT,
  tagline TEXT,
  support_email TEXT,
  primary_color TEXT DEFAULT '#39FF14',
  secondary_color TEXT DEFAULT '#0CE293',
  background_color TEXT DEFAULT '#121212',
  surface_color TEXT DEFAULT '#1A1A1A',
  text_primary TEXT DEFAULT '#FFFFFF',
  text_secondary TEXT DEFAULT '#A0AEC0',
  text_muted TEXT DEFAULT '#718096',
  border_color TEXT DEFAULT '#2D3748',
  success_color TEXT DEFAULT '#10B981',
  warning_color TEXT DEFAULT '#FFC800',
  error_color TEXT DEFAULT '#FF3B3B',
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  footer_text TEXT,
  hide_powered_by BOOLEAN DEFAULT false,
  custom_css TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id)
);

SELECT '✅ Step 2: Created business_themes table' as status;

-- STEP 3: Create custom_domains table
-- ============================================
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  subdomain TEXT,
  verification_status TEXT DEFAULT 'pending',
  verification_token TEXT,
  cname_target TEXT DEFAULT 'app.greenline365.com',
  ssl_status TEXT DEFAULT 'pending',
  ssl_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

SELECT '✅ Step 3: Created custom_domains table' as status;

-- STEP 4: Create pricing_tiers table
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER,
  description TEXT,
  tagline TEXT,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  is_white_label BOOLEAN DEFAULT false,
  can_edit_site BOOLEAN DEFAULT false,
  can_custom_domain BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert pricing tiers
INSERT INTO pricing_tiers (tier_key, name, price_monthly, price_yearly, description, tagline, is_featured, display_order, features, is_white_label, can_edit_site, can_custom_domain)
VALUES 
  ('tier1', 'Starter', 299, 2990, 'Perfect for getting started', NULL, false, 1, '["Content Forge", "Mockup Generator", "Social Media Posting"]'::jsonb, false, false, false),
  ('tier2', 'Professional', 599, 5990, 'For growing businesses', 'Most Popular', true, 2, '["Full Creative Studio", "6-Pack Mockup Generator", "CRM Integration"]'::jsonb, false, false, false),
  ('tier3', 'Enterprise', 999, 9990, 'Full platform access', NULL, false, 3, '["Product Library", "Email Campaigns", "SMS Marketing"]'::jsonb, false, false, false),
  ('white_label', 'Elite White-Label', 1200, 12000, 'Your brand, our platform', 'Premium', false, 4, '["Remove All Branding", "Custom Domains", "Visual Editor"]'::jsonb, true, true, true)
ON CONFLICT (tier_key) DO UPDATE SET
  price_monthly = EXCLUDED.price_monthly,
  features = EXCLUDED.features,
  updated_at = NOW();

SELECT '✅ Step 4: Created pricing_tiers table' as status;

-- STEP 5: Create site_content table
-- ============================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  page_slug TEXT NOT NULL,
  region_key TEXT NOT NULL,
  content_type TEXT DEFAULT 'text',
  content TEXT,
  image_url TEXT,
  image_alt TEXT,
  last_edited_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT '✅ Step 5: Created site_content table' as status;

-- STEP 6: Enable RLS (without complex policies for now)
-- ============================================
ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Simple policies - authenticated users can do everything for now
DROP POLICY IF EXISTS "authenticated_access_themes" ON business_themes;
CREATE POLICY "authenticated_access_themes" ON business_themes FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_access_domains" ON custom_domains;
CREATE POLICY "authenticated_access_domains" ON custom_domains FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_pricing" ON pricing_tiers;
CREATE POLICY "public_read_pricing" ON pricing_tiers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "authenticated_access_content" ON site_content;
CREATE POLICY "authenticated_access_content" ON site_content FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_content" ON site_content;
CREATE POLICY "public_read_content" ON site_content FOR SELECT TO anon USING (true);

SELECT '✅ Step 6: Enabled RLS with basic policies' as status;

-- STEP 7: Grant permissions
-- ============================================
GRANT ALL ON business_themes TO authenticated, service_role;
GRANT ALL ON custom_domains TO authenticated, service_role;
GRANT SELECT ON pricing_tiers TO anon, authenticated;
GRANT ALL ON pricing_tiers TO service_role;
GRANT ALL ON site_content TO authenticated, service_role;
GRANT SELECT ON site_content TO anon;

SELECT '✅ Step 7: Granted permissions' as status;

-- STEP 8: Create ArtfulPhusion
-- ============================================
INSERT INTO businesses (name, slug, tier, is_white_label, can_edit_site, monthly_price, industry, settings)
VALUES (
  'ArtfulPhusion',
  'artfulphusion', 
  'tier3',
  true,
  true,
  1200,
  'Creative Services',
  '{"features": {"content_forge": true, "mockup_generator": true, "social_posting": true, "crm": true, "analytics": true, "knowledge_base": true, "blog": true, "email": true, "sms": true, "bookings": true, "ai_receptionist": true, "calendar": true}}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  is_white_label = true,
  can_edit_site = true,
  monthly_price = 1200;

-- Get ArtfulPhusion ID and create theme
DO $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM businesses WHERE slug = 'artfulphusion';
  
  INSERT INTO business_themes (business_id, company_name, tagline, primary_color, secondary_color, background_color, surface_color, hide_powered_by)
  VALUES (v_id, 'ArtfulPhusion', 'Creative Sanctuary', '#8B5CF6', '#EC4899', '#0F0F0F', '#1A1A2E', true)
  ON CONFLICT (business_id) DO UPDATE SET
    company_name = 'ArtfulPhusion',
    tagline = 'Creative Sanctuary',
    hide_powered_by = true;
END $$;

SELECT '✅ Step 8: Created ArtfulPhusion tenant' as status;

-- VERIFICATION
-- ============================================
SELECT '🎉 MIGRATION COMPLETE!' as final_status;

SELECT name, slug, is_white_label, can_edit_site, monthly_price 
FROM businesses 
WHERE slug = 'artfulphusion';

SELECT company_name, tagline, primary_color, hide_powered_by 
FROM business_themes bt
JOIN businesses b ON b.id = bt.business_id
WHERE b.slug = 'artfulphusion';
