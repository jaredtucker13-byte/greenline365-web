-- ============================================
-- MULTI-TENANT FOUNDATION (CLEAN VERSION)
-- Just copy and paste this entire file - NO EDITING NEEDED
-- ============================================

-- Drop existing tables if you need to start fresh
DROP TABLE IF EXISTS code_redemptions CASCADE;
DROP TABLE IF EXISTS entitlement_overrides CASCADE;
DROP TABLE IF EXISTS access_codes CASCADE;
DROP TABLE IF EXISTS memory_knowledge_chunks CASCADE;
DROP TABLE IF EXISTS memory_identity_chunks CASCADE;
DROP TABLE IF EXISTS user_businesses CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- Create businesses table
CREATE TABLE businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL DEFAULT 'tier1' CHECK (tier IN ('tier1', 'tier2', 'tier3')),
  industry TEXT,
  
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
    }
  }'::jsonb,
  
  brand_voice JSONB DEFAULT '{}'::jsonb,
  
  email TEXT,
  phone TEXT,
  website TEXT,
  
  access_source TEXT DEFAULT 'direct',
  access_code_used TEXT,
  billing_status TEXT DEFAULT 'trial',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_tier ON businesses(tier);

-- Create user_businesses junction table
CREATE TABLE user_businesses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'owner',
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX idx_user_businesses_user ON user_businesses(user_id);
CREATE INDEX idx_user_businesses_business ON user_businesses(business_id);

-- Create memory tables
CREATE TABLE memory_identity_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memory_knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create access codes table
CREATE TABLE access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  current_uses INTEGER NOT NULL DEFAULT 0,
  linked_tier TEXT NOT NULL,
  code_type TEXT DEFAULT 'promo',
  description TEXT,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_access_codes_code ON access_codes(code);

-- Create code redemptions table
CREATE TABLE code_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  granted_tier TEXT NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create entitlement overrides table
CREATE TABLE entitlement_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  override_type TEXT NOT NULL,
  override_tier TEXT,
  reason TEXT,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Add business_id to existing tables
ALTER TABLE leads ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id);

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_identity_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their businesses" ON businesses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = businesses.id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own memberships" ON user_businesses
  FOR SELECT USING (auth.uid() = user_id);

-- Code redemption function
CREATE OR REPLACE FUNCTION redeem_access_code(
  p_code TEXT,
  p_business_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_code_record RECORD;
BEGIN
  SELECT * INTO v_code_record
  FROM access_codes
  WHERE code = p_code
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND current_uses < max_uses
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  END IF;
  
  UPDATE access_codes SET current_uses = current_uses + 1 WHERE id = v_code_record.id;
  
  INSERT INTO code_redemptions (code_id, code, redeemed_by, business_id, granted_tier)
  VALUES (v_code_record.id, v_code_record.code, p_user_id, p_business_id, v_code_record.linked_tier);
  
  UPDATE businesses
  SET tier = v_code_record.linked_tier,
      access_source = 'promo_code',
      access_code_used = v_code_record.code,
      billing_status = 'active'
  WHERE id = p_business_id;
  
  RETURN jsonb_build_object('success', true, 'tier', v_code_record.linked_tier);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON businesses TO authenticated, anon, service_role;
GRANT ALL ON user_businesses TO authenticated, anon, service_role;
GRANT ALL ON memory_identity_chunks TO authenticated, service_role;
GRANT ALL ON memory_knowledge_chunks TO authenticated, service_role;
GRANT ALL ON access_codes TO authenticated, service_role;
GRANT ALL ON code_redemptions TO authenticated, service_role;
GRANT ALL ON entitlement_overrides TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION redeem_access_code TO authenticated, anon;

-- ============================================
-- MIGRATION COMPLETE - NO EDITING REQUIRED
-- ============================================
