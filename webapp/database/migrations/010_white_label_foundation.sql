-- ============================================
-- WHITE-LABEL FOUNDATION MIGRATION
-- Phase 1: Theme Engine + Custom Domains + Pricing
-- ============================================
-- This creates the infrastructure for:
-- 1. White-label tenants with custom branding
-- 2. Custom domain support (CNAME ready)
-- 3. Database-driven pricing tiers
-- 4. Editable site content regions
-- ============================================

-- ============================================
-- PART 1: Extend businesses table
-- ============================================

-- Add white-label flag and enhanced settings
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_white_label BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS can_edit_site BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS monthly_price INTEGER DEFAULT 299;

-- ============================================
-- PART 2: Business Themes Table
-- ============================================
-- Stores custom branding for each tenant

CREATE TABLE IF NOT EXISTS business_themes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Branding
  logo_url TEXT,
  logo_dark_url TEXT,  -- Alternative logo for dark backgrounds
  favicon_url TEXT,
  
  -- Company Info (for white-label)
  company_name TEXT,  -- Overrides "GreenLine365"
  tagline TEXT,
  support_email TEXT,
  
  -- Color Palette (CSS Variables)
  primary_color TEXT DEFAULT '#39FF14',      -- Main accent color
  secondary_color TEXT DEFAULT '#0CE293',    -- Secondary accent
  background_color TEXT DEFAULT '#121212',   -- Main background
  surface_color TEXT DEFAULT '#1A1A1A',      -- Card/panel backgrounds
  text_primary TEXT DEFAULT '#FFFFFF',       -- Primary text
  text_secondary TEXT DEFAULT '#A0AEC0',     -- Secondary text
  text_muted TEXT DEFAULT '#718096',         -- Muted text
  border_color TEXT DEFAULT '#2D3748',       -- Borders
  success_color TEXT DEFAULT '#10B981',
  warning_color TEXT DEFAULT '#FFC800',
  error_color TEXT DEFAULT '#FF3B3B',
  
  -- Typography
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  
  -- Footer Customization
  footer_text TEXT,
  hide_powered_by BOOLEAN DEFAULT false,     -- Hide "Powered by GreenLine365"
  
  -- Custom CSS (advanced)
  custom_css TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(business_id)
);

CREATE INDEX idx_business_themes_business ON business_themes(business_id);

-- ============================================
-- PART 3: Custom Domains Table
-- ============================================
-- Stores custom domain configurations for white-label tenants

CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Domain Configuration
  domain TEXT NOT NULL,                      -- e.g., "studio.artfulphusion.com"
  subdomain TEXT,                            -- e.g., "studio" (if applicable)
  
  -- Verification
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  verification_token TEXT,                   -- For DNS TXT record verification
  cname_target TEXT,                         -- Our CNAME target for DNS setup
  
  -- SSL
  ssl_status TEXT DEFAULT 'pending' CHECK (ssl_status IN ('pending', 'active', 'expired', 'failed')),
  ssl_expires_at TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,          -- Primary domain for this tenant
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  UNIQUE(domain)
);

CREATE INDEX idx_custom_domains_business ON custom_domains(business_id);
CREATE INDEX idx_custom_domains_domain ON custom_domains(domain);

-- ============================================
-- PART 4: Pricing Tiers Table
-- ============================================
-- Database-driven pricing (not hard-coded)

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tier Identity
  tier_key TEXT NOT NULL UNIQUE,             -- 'tier1', 'tier2', 'tier3', 'white_label'
  name TEXT NOT NULL,                        -- 'Starter', 'Professional', etc.
  
  -- Pricing
  price_monthly INTEGER NOT NULL,            -- Price in dollars
  price_yearly INTEGER,                      -- Annual price (optional discount)
  
  -- Display
  description TEXT,
  tagline TEXT,                              -- e.g., "Most Popular"
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  
  -- Feature Flags
  features JSONB DEFAULT '[]'::jsonb,        -- Array of feature strings
  feature_limits JSONB DEFAULT '{}'::jsonb,  -- Limits like { "ai_generations": 100 }
  
  -- Access Control
  is_white_label BOOLEAN DEFAULT false,
  can_edit_site BOOLEAN DEFAULT false,
  can_custom_domain BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default pricing tiers
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

-- ============================================
-- PART 5: Site Content Table (Editable Regions)
-- ============================================
-- Stores editable content for specific page regions

CREATE TABLE IF NOT EXISTS site_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,  -- NULL = global default
  
  -- Content Identification
  page_slug TEXT NOT NULL,                   -- 'home', 'pricing', 'about', 'tos', 'privacy'
  region_key TEXT NOT NULL,                  -- 'hero_title', 'hero_subtitle', 'pricing_table', etc.
  
  -- Content
  content_type TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'rich_text', 'image', 'json')),
  content TEXT,                              -- The actual content (text, HTML, or JSON string)
  
  -- Image-specific fields
  image_url TEXT,
  image_alt TEXT,
  image_overlay TEXT,                        -- CSS overlay settings
  
  -- Metadata
  last_edited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique per business+page+region
  UNIQUE(business_id, page_slug, region_key)
);

CREATE INDEX idx_site_content_business ON site_content(business_id);
CREATE INDEX idx_site_content_page ON site_content(page_slug);
CREATE INDEX idx_site_content_lookup ON site_content(business_id, page_slug);

-- Insert default site content (global, business_id = NULL)
INSERT INTO site_content (business_id, page_slug, region_key, content_type, content)
VALUES 
  -- Home Page
  (NULL, 'home', 'hero_title', 'text', 'The Operating System for the Local Economy'),
  (NULL, 'home', 'hero_subtitle', 'text', 'Stop competing with algorithms. Start winning. Start running infrastructure that connects local life with local commerce.'),
  (NULL, 'home', 'hero_cta_primary', 'text', 'Join the Waitlist'),
  (NULL, 'home', 'hero_cta_secondary', 'text', 'Book a Demo'),
  
  -- Pricing Page
  (NULL, 'pricing', 'page_title', 'text', 'Simple, Transparent Pricing'),
  (NULL, 'pricing', 'page_subtitle', 'text', 'Choose the plan that fits your business'),
  
  -- About Page
  (NULL, 'about', 'page_title', 'text', 'About GreenLine365'),
  (NULL, 'about', 'mission_statement', 'rich_text', '<p>We believe every local business deserves enterprise-grade tools.</p>')
ON CONFLICT (business_id, page_slug, region_key) DO NOTHING;

-- ============================================
-- PART 6: Enable RLS
-- ============================================

ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Themes: Users can view/edit their own business themes
CREATE POLICY "Users can manage own business themes" ON business_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = business_themes.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Custom Domains: Users can manage their own domains
CREATE POLICY "Users can manage own custom domains" ON custom_domains
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = custom_domains.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Pricing Tiers: Public read, admin write
CREATE POLICY "Anyone can view pricing tiers" ON pricing_tiers
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage pricing tiers" ON pricing_tiers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Site Content: Business owners can edit their content, admins can edit all
CREATE POLICY "Users can view site content" ON site_content
  FOR SELECT USING (true);

CREATE POLICY "Users can edit own business content" ON site_content
  FOR ALL USING (
    business_id IS NULL AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
    OR
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = site_content.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- ============================================
-- PART 7: Grant Permissions
-- ============================================

GRANT ALL ON business_themes TO authenticated, service_role;
GRANT ALL ON custom_domains TO authenticated, service_role;
GRANT SELECT ON pricing_tiers TO anon, authenticated;
GRANT ALL ON pricing_tiers TO service_role;
GRANT SELECT ON site_content TO anon, authenticated;
GRANT ALL ON site_content TO authenticated, service_role;

-- ============================================
-- PART 8: Create ArtfulPhusion Test Tenant
-- ============================================

-- First, ensure we have a default business for the admin user if needed
-- Then create ArtfulPhusion as a white-label tenant

-- Create ArtfulPhusion business
INSERT INTO businesses (
  id,
  name,
  slug,
  tier,
  is_white_label,
  can_edit_site,
  monthly_price,
  industry,
  settings
)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
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
)
ON CONFLICT (slug) DO UPDATE SET
  is_white_label = true,
  can_edit_site = true,
  monthly_price = 1200;

-- Create ArtfulPhusion theme
INSERT INTO business_themes (
  business_id,
  company_name,
  tagline,
  primary_color,
  secondary_color,
  background_color,
  surface_color,
  hide_powered_by
)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'ArtfulPhusion',
  'Creative Sanctuary',
  '#8B5CF6',           -- Purple primary
  '#EC4899',           -- Pink secondary
  '#0F0F0F',           -- Dark background
  '#1A1A2E',           -- Dark purple surface
  true                 -- Hide GreenLine365 branding
)
ON CONFLICT (business_id) DO UPDATE SET
  company_name = 'ArtfulPhusion',
  tagline = 'Creative Sanctuary',
  primary_color = '#8B5CF6',
  secondary_color = '#EC4899',
  hide_powered_by = true,
  updated_at = NOW();

-- Link admin user to ArtfulPhusion (if not already linked)
INSERT INTO user_businesses (user_id, business_id, role, is_primary)
VALUES ('677b536d-6521-4ac8-a0a5-98278b35f4cc', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'owner', false)
ON CONFLICT (user_id, business_id) DO NOTHING;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

SELECT '✅ White-Label Foundation Migration Complete!' as status;

SELECT 
  b.name,
  b.slug,
  b.is_white_label,
  b.can_edit_site,
  bt.company_name,
  bt.primary_color
FROM businesses b
LEFT JOIN business_themes bt ON bt.business_id = b.id
WHERE b.is_white_label = true;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
