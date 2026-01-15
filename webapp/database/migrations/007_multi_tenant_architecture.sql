-- ============================================
-- MULTI-TENANT ARCHITECTURE MIGRATION
-- ============================================
-- This migration creates the foundation for multi-tenant support:
-- - businesses table (tenants)
-- - user_businesses junction table (many-to-many)
-- - RLS policies for data isolation
-- - business_id columns on existing tables
-- - Seed data for GreenLine365 and ArtfulPhusion

-- ============================================
-- BUSINESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  tier TEXT NOT NULL DEFAULT 'tier1' CHECK (tier IN ('tier1', 'tier2', 'tier3')),
  industry TEXT,
  
  -- Tier Definitions:
  -- tier1 ($299/mo): Content Forge, Mockup Generators, Social posting
  -- tier2 ($599/mo): tier1 + CRM, Analytics, Knowledge Base, Blog
  -- tier3 ($999/mo): tier2 + Email, SMS, Bookings, AI Receptionist, Calendar
  
  -- Business settings
  settings JSONB DEFAULT '{
    "features": {
      "content_forge": true,
      "mockup_generator": true,
      "social_posting": true,
      "crm": false,
      "analytics": false,
      "knowledge_base": false,
      "blog": false,
      "email": false,
      "sms": false,
      "bookings": false,
      "ai_receptionist": false,
      "calendar": false
    },
    "limits": {
      "social_posts_per_month": 100,
      "ai_generations_per_month": 50
    },
    "branding": {
      "primary_color": "#39FF14",
      "logo_url": null
    }
  }'::jsonb,
  
  -- Brand Voice & Identity (Layer 1 - Dynamic Memory Bucket)
  brand_voice JSONB DEFAULT '{
    "tone": [],
    "values": [],
    "mission": "",
    "target_audience": "",
    "unique_selling_points": []
  }'::jsonb,
  
  -- Contact info
  email TEXT,
  phone TEXT,
  website TEXT,
  
  -- Retell AI config (for tier3)
  retell_agent_id TEXT,
  twilio_phone_number TEXT,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_tier ON businesses(tier);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);

-- RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Users can view businesses they're members of
CREATE POLICY "Users can view their businesses" ON businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = businesses.id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Admins can view all businesses
CREATE POLICY "Admins can view all businesses" ON businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Business owners can update their business
CREATE POLICY "Owners can update business" ON businesses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = businesses.id 
      AND user_businesses.user_id = auth.uid()
      AND user_businesses.role = 'owner'
    )
  );

GRANT SELECT ON businesses TO authenticated;
GRANT ALL ON businesses TO service_role;

-- ============================================
-- USER_BUSINESSES JUNCTION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_primary BOOLEAN DEFAULT false, -- User's default business on login
  
  -- Permissions (can be overridden at user level)
  permissions JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, business_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_businesses_user ON user_businesses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_business ON user_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_primary ON user_businesses(user_id, is_primary);

-- RLS
ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;

-- Users can view their own business memberships
CREATE POLICY "Users can view own memberships" ON user_businesses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Business owners can view all members
CREATE POLICY "Owners can view members" ON user_businesses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses ub 
      WHERE ub.business_id = user_businesses.business_id 
      AND ub.user_id = auth.uid()
      AND ub.role IN ('owner', 'admin')
    )
  );

-- Owners can manage members
CREATE POLICY "Owners can manage members" ON user_businesses
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses ub 
      WHERE ub.business_id = user_businesses.business_id 
      AND ub.user_id = auth.uid()
      AND ub.role = 'owner'
    )
  );

GRANT SELECT, INSERT ON user_businesses TO authenticated;
GRANT ALL ON user_businesses TO service_role;

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADD business_id TO EXISTING TABLES
-- ============================================

-- Add business_id to leads (CRM)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_leads_business ON leads(business_id);

-- Add business_id to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings(business_id);

-- Add business_id to content_schedule
ALTER TABLE content_schedule ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_content_schedule_business ON content_schedule(business_id);

-- Add business_id to local_trends
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_local_trends_business ON local_trends(business_id);

-- ============================================
-- CREATE NEW MULTI-TENANT TABLES
-- ============================================

-- Memory Identity Chunks (Layer 1 - Brand Voice)
CREATE TABLE IF NOT EXISTS memory_identity_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL CHECK (category IN (
    'tone', 'values', 'mission', 'voice_examples', 
    'brand_story', 'target_audience', 'positioning'
  )),
  
  key TEXT NOT NULL, -- e.g., "tone", "mission_statement"
  value TEXT NOT NULL, -- The actual content
  
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5, -- Higher = more important
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_memory_identity_business ON memory_identity_chunks(business_id);
CREATE INDEX IF NOT EXISTS idx_memory_identity_category ON memory_identity_chunks(business_id, category);

ALTER TABLE memory_identity_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business identity" ON memory_identity_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = memory_identity_chunks.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage business identity" ON memory_identity_chunks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = memory_identity_chunks.business_id 
      AND user_businesses.user_id = auth.uid()
      AND user_businesses.role IN ('owner', 'admin')
    )
  );

GRANT ALL ON memory_identity_chunks TO authenticated;
GRANT ALL ON memory_identity_chunks TO service_role;

-- Memory Knowledge Chunks (Layer 2)
CREATE TABLE IF NOT EXISTS memory_knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL CHECK (category IN (
    'services', 'pricing', 'faq', 'products', 
    'processes', 'policies', 'anti-knowledge'
  )),
  
  subcategory TEXT,
  title TEXT,
  content TEXT NOT NULL,
  
  source TEXT DEFAULT 'manual', -- 'manual', 'import', 'api', 'onboarding'
  confidence FLOAT DEFAULT 1.0, -- 0.0 to 1.0
  priority INTEGER DEFAULT 5,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_memory_knowledge_business ON memory_knowledge_chunks(business_id);
CREATE INDEX IF NOT EXISTS idx_memory_knowledge_category ON memory_knowledge_chunks(business_id, category);
CREATE INDEX IF NOT EXISTS idx_memory_knowledge_active ON memory_knowledge_chunks(business_id, is_active);

ALTER TABLE memory_knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business knowledge" ON memory_knowledge_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = memory_knowledge_chunks.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage business knowledge" ON memory_knowledge_chunks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = memory_knowledge_chunks.business_id 
      AND user_businesses.user_id = auth.uid()
      AND user_businesses.role IN ('owner', 'admin', 'member')
    )
  );

GRANT ALL ON memory_knowledge_chunks TO authenticated;
GRANT ALL ON memory_knowledge_chunks TO service_role;

-- ============================================
-- UPDATE RLS POLICIES FOR EXISTING TABLES
-- ============================================

-- Drop existing RLS policies on leads (we'll recreate with business isolation)
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads" ON leads;
DROP POLICY IF EXISTS "Users can update own leads" ON leads;

-- New RLS for leads with business isolation
CREATE POLICY "Users can view business leads" ON leads
  FOR SELECT
  USING (
    business_id IS NULL OR -- Legacy data (before multi-tenant)
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = leads.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert business leads" ON leads
  FOR INSERT
  WITH CHECK (
    business_id IS NULL OR -- Allow anonymous leads
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = leads.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update business leads" ON leads
  FOR UPDATE
  USING (
    business_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = leads.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Similar RLS for bookings
DROP POLICY IF EXISTS "Allow inserts for everyone" ON bookings;
DROP POLICY IF EXISTS "Allow select for service role" ON bookings;
DROP POLICY IF EXISTS "Allow updates for service role" ON bookings;

CREATE POLICY "Anyone can create bookings" ON bookings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view business bookings" ON bookings
  FOR SELECT
  USING (
    business_id IS NULL OR -- Legacy data
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = bookings.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update business bookings" ON bookings
  FOR UPDATE
  USING (
    business_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = bookings.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's active business
CREATE OR REPLACE FUNCTION get_user_active_business(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_business_id UUID;
BEGIN
  -- Try to get primary business
  SELECT business_id INTO v_business_id
  FROM user_businesses
  WHERE user_id = p_user_id AND is_primary = true
  LIMIT 1;
  
  -- If no primary, get first business
  IF v_business_id IS NULL THEN
    SELECT business_id INTO v_business_id
    FROM user_businesses
    WHERE user_id = p_user_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;
  
  RETURN v_business_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to a business
CREATE OR REPLACE FUNCTION user_has_business_access(p_user_id UUID, p_business_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_id = p_user_id AND business_id = p_business_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get business tier features
CREATE OR REPLACE FUNCTION get_business_features(p_business_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tier TEXT;
  v_features JSONB;
BEGIN
  SELECT tier INTO v_tier FROM businesses WHERE id = p_business_id;
  
  -- Default tier1 features
  v_features := '{
    "content_forge": true,
    "mockup_generator": true,
    "social_posting": true,
    "crm": false,
    "analytics": false,
    "knowledge_base": false,
    "blog": false,
    "email": false,
    "sms": false,
    "bookings": false,
    "ai_receptionist": false,
    "calendar": false
  }'::jsonb;
  
  -- Add tier2 features
  IF v_tier IN ('tier2', 'tier3') THEN
    v_features := v_features || '{
      "crm": true,
      "analytics": true,
      "knowledge_base": true,
      "blog": true
    }'::jsonb;
  END IF;
  
  -- Add tier3 features
  IF v_tier = 'tier3' THEN
    v_features := v_features || '{
      "email": true,
      "sms": true,
      "bookings": true,
      "ai_receptionist": true,
      "calendar": true
    }'::jsonb;
  END IF;
  
  RETURN v_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA
-- ============================================

-- NOTE: You'll need to replace 'YOUR_USER_ID' with your actual Supabase auth user ID
-- You can find it by running: SELECT id, email FROM auth.users WHERE email = 'your@email.com';

-- Create GreenLine365 business (platform/default tenant)
INSERT INTO businesses (
  id,
  name,
  slug,
  tier,
  industry,
  email,
  website,
  settings
) VALUES (
  'a0000000-0000-0000-0000-000000000001', -- Fixed UUID for platform
  'GreenLine365',
  'greenline365',
  'tier3', -- Platform gets all features
  'SaaS',
  'support@greenline365.com',
  'https://greenline365.com',
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
) ON CONFLICT (id) DO NOTHING;

-- Create ArtfulPhusion business (tier2 test tenant)
INSERT INTO businesses (
  id,
  name,
  slug,
  tier,
  industry,
  settings
) VALUES (
  'a0000000-0000-0000-0000-000000000002', -- Fixed UUID for testing
  'ArtfulPhusion',
  'artfulphusion',
  'tier2', -- You specified tier2 for testing
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
      "email": false,
      "sms": false,
      "bookings": false,
      "ai_receptionist": false,
      "calendar": false
    },
    "limits": {
      "social_posts_per_month": 100,
      "ai_generations_per_month": 50
    }
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- LINK YOUR USER TO BOTH BUSINESSES
-- ============================================
-- IMPORTANT: Replace 'YOUR_USER_ID' below with your actual auth.users.id
-- Run this query first to get your ID:
--   SELECT id, email FROM auth.users WHERE email = 'your@email.com';

/*
-- Uncomment and run after replacing YOUR_USER_ID:

INSERT INTO user_businesses (user_id, business_id, role, is_primary) VALUES
  ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000001', 'owner', true),  -- GreenLine365 (primary)
  ('YOUR_USER_ID', 'a0000000-0000-0000-0000-000000000002', 'owner', false); -- ArtfulPhusion

-- Update existing data to belong to GreenLine365
UPDATE leads SET business_id = 'a0000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE bookings SET business_id = 'a0000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
UPDATE content_schedule SET business_id = 'a0000000-0000-0000-0000-000000000001' WHERE business_id IS NULL;
*/

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT ALL ON memory_identity_chunks TO authenticated;
GRANT ALL ON memory_identity_chunks TO service_role;
GRANT ALL ON memory_knowledge_chunks TO authenticated;
GRANT ALL ON memory_knowledge_chunks TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Find your user ID and uncomment the INSERT INTO user_businesses section above
-- 2. Run the UPDATE queries to assign existing data to GreenLine365
-- 3. Proceed to Phase 2: Backend Infrastructure
