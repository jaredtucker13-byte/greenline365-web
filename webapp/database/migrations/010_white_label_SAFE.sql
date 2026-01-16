-- ============================================
-- WHITE-LABEL FOUNDATION - SAFE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: Check if businesses table exists and add columns
-- ============================================
DO $$
BEGIN
  -- Check if businesses table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') THEN
    -- Add new columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'is_white_label') THEN
      ALTER TABLE businesses ADD COLUMN is_white_label BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'can_edit_site') THEN
      ALTER TABLE businesses ADD COLUMN can_edit_site BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'monthly_price') THEN
      ALTER TABLE businesses ADD COLUMN monthly_price INTEGER DEFAULT 299;
    END IF;
    
    RAISE NOTICE '✅ Businesses table updated';
  ELSE
    RAISE NOTICE '❌ Businesses table does not exist - run CLEAN_MIGRATION_ALL_IN_ONE.sql first';
  END IF;
END $$;

-- STEP 2: Create business_themes table
-- ============================================
CREATE TABLE IF NOT EXISTS business_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Branding
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  
  -- Company Info
  company_name TEXT,
  tagline TEXT,
  support_email TEXT,
  
  -- Colors
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
  
  -- Typography
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  
  -- Footer
  footer_text TEXT,
  hide_powered_by BOOLEAN DEFAULT false,
  
  -- Custom CSS
  custom_css TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id)
);

-- STEP 3: Create custom_domains table
-- ============================================
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  domain TEXT NOT NULL,
  subdomain TEXT,
  
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token TEXT,
  cname_target TEXT DEFAULT 'app.greenline365.com',
  
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'expired', 'failed')),
  ssl_expires_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  UNIQUE(domain)
);

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
  feature_limits JSONB DEFAULT '{}'::jsonb,
  
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
  ('tier1', 'Starter', 299, 2990, 'Perfect for getting started', NULL, false, 1,
   '["Content Forge", "Mockup Generator", "Social Media Posting", "Basic Analytics", "Email Support"]'::jsonb,
   false, false, false),
  
  ('tier2', 'Professional', 599, 5990, 'For growing businesses', 'Most Popular', true, 2,
   '["Everything in Starter", "Full Creative Studio", "6-Pack Mockup Generator", "CRM Integration", "Advanced Analytics", "Knowledge Base", "Blog Tools", "Priority Support"]'::jsonb,
   false, false, false),
  
  ('tier3', 'Enterprise', 999, 9990, 'Full platform access', NULL, false, 3,
   '["Everything in Professional", "Product Library", "Email Campaigns", "SMS Marketing", "AI Receptionist", "Calendar Integration", "Dedicated Support", "Custom Integrations"]'::jsonb,
   false, false, false),
  
  ('white_label', 'Elite White-Label', 1200, 12000, 'Your brand, our platform', 'Premium', false, 4,
   '["Everything in Enterprise", "Remove All GreenLine365 Branding", "Custom Domain Support", "Visual Site Editor", "White-Label Dashboard", "Custom Logo & Colors", "Dedicated Account Manager"]'::jsonb,
   true, true, true)
ON CONFLICT (tier_key) DO UPDATE SET
  name = EXCLUDED.name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  description = EXCLUDED.description,
  tagline = EXCLUDED.tagline,
  is_featured = EXCLUDED.is_featured,
  features = EXCLUDED.features,
  is_white_label = EXCLUDED.is_white_label,
  can_edit_site = EXCLUDED.can_edit_site,
  can_custom_domain = EXCLUDED.can_custom_domain,
  updated_at = NOW();

-- STEP 5: Create site_content table
-- ============================================
CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  page_slug TEXT NOT NULL,
  region_key TEXT NOT NULL,
  
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'rich_text', 'image', 'json')),
  content TEXT,
  
  image_url TEXT,
  image_alt TEXT,
  image_overlay TEXT,
  
  last_edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint (handle if already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_content_business_id_page_slug_region_key_key'
  ) THEN
    ALTER TABLE site_content ADD CONSTRAINT site_content_business_id_page_slug_region_key_key 
      UNIQUE (business_id, page_slug, region_key);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Constraint may already exist';
END $$;

-- STEP 6: Enable RLS
-- ============================================
ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- STEP 7: Create RLS Policies (drop first to avoid conflicts)
-- ============================================

-- Business Themes
DROP POLICY IF EXISTS "Users can manage own business themes" ON business_themes;
CREATE POLICY "Users can manage own business themes" ON business_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = business_themes.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Custom Domains
DROP POLICY IF EXISTS "Users can manage own custom domains" ON custom_domains;
CREATE POLICY "Users can manage own custom domains" ON custom_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = custom_domains.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Pricing Tiers
DROP POLICY IF EXISTS "Anyone can view pricing tiers" ON pricing_tiers;
CREATE POLICY "Anyone can view pricing tiers" ON pricing_tiers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage pricing tiers" ON pricing_tiers;
CREATE POLICY "Admins can manage pricing tiers" ON pricing_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Site Content
DROP POLICY IF EXISTS "Anyone can view site content" ON site_content;
CREATE POLICY "Anyone can view site content" ON site_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can edit own business content" ON site_content;
CREATE POLICY "Users can edit site content" ON site_content
  FOR ALL USING (
    (business_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
    OR
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = site_content.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- STEP 8: Grant Permissions
-- ============================================
GRANT ALL ON business_themes TO authenticated, service_role;
GRANT ALL ON custom_domains TO authenticated, service_role;
GRANT SELECT ON pricing_tiers TO anon, authenticated;
GRANT ALL ON pricing_tiers TO service_role;
GRANT SELECT ON site_content TO anon, authenticated;
GRANT ALL ON site_content TO authenticated, service_role;

-- STEP 9: Create ArtfulPhusion tenant
-- ============================================
DO $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Check if ArtfulPhusion already exists
  SELECT id INTO v_business_id FROM businesses WHERE slug = 'artfulphusion';
  
  IF v_business_id IS NULL THEN
    -- Create new business
    INSERT INTO businesses (
      name, slug, tier, is_white_label, can_edit_site, monthly_price, industry, settings
    ) VALUES (
      'ArtfulPhusion',
      'artfulphusion',
      'tier3',
      true,
      true,
      1200,
      'Creative Services',
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
    ) RETURNING id INTO v_business_id;
    
    RAISE NOTICE '✅ Created ArtfulPhusion business with ID: %', v_business_id;
  ELSE
    -- Update existing
    UPDATE businesses SET
      is_white_label = true,
      can_edit_site = true,
      monthly_price = 1200
    WHERE id = v_business_id;
    
    RAISE NOTICE '✅ Updated existing ArtfulPhusion business: %', v_business_id;
  END IF;
  
  -- Create theme for ArtfulPhusion
  INSERT INTO business_themes (
    business_id, company_name, tagline, primary_color, secondary_color, 
    background_color, surface_color, hide_powered_by
  ) VALUES (
    v_business_id,
    'ArtfulPhusion',
    'Creative Sanctuary',
    '#8B5CF6',
    '#EC4899',
    '#0F0F0F',
    '#1A1A2E',
    true
  ) ON CONFLICT (business_id) DO UPDATE SET
    company_name = 'ArtfulPhusion',
    tagline = 'Creative Sanctuary',
    primary_color = '#8B5CF6',
    secondary_color = '#EC4899',
    hide_powered_by = true,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Created/updated ArtfulPhusion theme';
  
  -- Link admin user to ArtfulPhusion
  INSERT INTO user_businesses (user_id, business_id, role, is_primary)
  VALUES ('677b536d-6521-4ac8-a0a5-98278b35f4cc', v_business_id, 'owner', false)
  ON CONFLICT (user_id, business_id) DO NOTHING;
  
  RAISE NOTICE '✅ Linked admin user to ArtfulPhusion';
  
END $$;

-- STEP 10: Insert default site content
-- ============================================
INSERT INTO site_content (business_id, page_slug, region_key, content_type, content)
VALUES 
  (NULL, 'home', 'hero_title', 'text', 'The Operating System for the Local Economy'),
  (NULL, 'home', 'hero_subtitle', 'text', 'Stop competing with algorithms. Start winning.'),
  (NULL, 'pricing', 'page_title', 'text', 'Simple, Transparent Pricing'),
  (NULL, 'about', 'page_title', 'text', 'About GreenLine365')
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ Migration Complete!' as status;

SELECT 
  'ArtfulPhusion Status' as check_type,
  b.name,
  b.is_white_label,
  bt.company_name,
  bt.primary_color
FROM businesses b
LEFT JOIN business_themes bt ON bt.business_id = b.id
WHERE b.slug = 'artfulphusion';

SELECT 'Pricing Tiers' as check_type, tier_key, name, price_monthly FROM pricing_tiers ORDER BY display_order;
