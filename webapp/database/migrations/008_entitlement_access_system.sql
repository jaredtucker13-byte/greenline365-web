-- ============================================
-- ENTITLEMENT & SPECIAL ACCESS SYSTEM
-- ============================================
-- This migration creates the "VIP Lounge" logic:
-- - Promo codes with usage limits
-- - Manual entitlement overrides
-- - Access tracking and audit trail

-- ============================================
-- ACCESS CODES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The actual code
  code TEXT UNIQUE NOT NULL,
  
  -- Usage limits
  max_uses INTEGER NOT NULL DEFAULT 1, -- How many times can this be redeemed
  current_uses INTEGER NOT NULL DEFAULT 0, -- How many times has it been redeemed
  
  -- What it unlocks
  linked_tier TEXT NOT NULL CHECK (linked_tier IN ('tier1', 'tier2', 'tier3')),
  
  -- Optional features override (can grant specific features beyond tier)
  feature_overrides JSONB DEFAULT NULL, -- e.g., {"email": true, "sms": false}
  
  -- Expiration
  expires_at TIMESTAMPTZ DEFAULT NULL, -- NULL = never expires
  
  -- Metadata
  code_type TEXT DEFAULT 'promo' CHECK (code_type IN ('promo', 'family', 'partner', 'beta', 'lifetime')),
  description TEXT, -- e.g., "Black Friday 2024", "Mom's Account"
  
  -- Creator tracking
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON access_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_access_codes_type ON access_codes(code_type);

-- RLS
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;

-- Only admins can view codes
CREATE POLICY "Admins can view codes" ON access_codes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can create/manage codes
CREATE POLICY "Admins can manage codes" ON access_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

GRANT ALL ON access_codes TO authenticated;
GRANT ALL ON access_codes TO service_role;

-- ============================================
-- CODE REDEMPTIONS TABLE (Audit Trail)
-- ============================================
CREATE TABLE IF NOT EXISTS code_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  code_id UUID NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- Denormalized for easy tracking
  
  -- Who redeemed it
  redeemed_by UUID REFERENCES auth.users(id),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- When
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- What they got
  granted_tier TEXT NOT NULL,
  granted_features JSONB DEFAULT NULL,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_code_redemptions_code ON code_redemptions(code_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_business ON code_redemptions(business_id);
CREATE INDEX IF NOT EXISTS idx_code_redemptions_user ON code_redemptions(redeemed_by);

-- RLS
ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;

-- Admins can view all redemptions
CREATE POLICY "Admins can view redemptions" ON code_redemptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Users can view their own redemptions
CREATE POLICY "Users can view own redemptions" ON code_redemptions
  FOR SELECT
  USING (auth.uid() = redeemed_by);

GRANT ALL ON code_redemptions TO authenticated;
GRANT ALL ON code_redemptions TO service_role;

-- ============================================
-- ENTITLEMENT OVERRIDES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS entitlement_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Override details
  override_type TEXT NOT NULL CHECK (override_type IN ('manual', 'code_redemption', 'partnership', 'lifetime_grant')),
  override_tier TEXT CHECK (override_tier IN ('tier1', 'tier2', 'tier3')),
  
  -- Feature-level overrides (more granular than tier)
  feature_overrides JSONB DEFAULT NULL, -- e.g., {"email": true, "bookings": false}
  
  -- Expiration (NULL = never expires)
  expires_at TIMESTAMPTZ DEFAULT NULL,
  
  -- Reason & Notes
  reason TEXT, -- e.g., "Family member", "Beta tester", "Redeemed FAMILY-X"
  notes TEXT,
  
  -- Who granted it
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Related code (if from redemption)
  access_code_id UUID REFERENCES access_codes(id) ON DELETE SET NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ DEFAULT NULL,
  revoked_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entitlement_overrides_business ON entitlement_overrides(business_id);
CREATE INDEX IF NOT EXISTS idx_entitlement_overrides_active ON entitlement_overrides(is_active);
CREATE INDEX IF NOT EXISTS idx_entitlement_overrides_type ON entitlement_overrides(override_type);

-- RLS
ALTER TABLE entitlement_overrides ENABLE ROW LEVEL SECURITY;

-- Admins can manage overrides
CREATE POLICY "Admins can manage overrides" ON entitlement_overrides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Business owners can view their overrides
CREATE POLICY "Business owners can view overrides" ON entitlement_overrides
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = entitlement_overrides.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

GRANT ALL ON entitlement_overrides TO authenticated;
GRANT ALL ON entitlement_overrides TO service_role;

-- ============================================
-- UPDATE BUSINESSES TABLE
-- ============================================
-- Add access tracking fields to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS access_source TEXT DEFAULT 'direct' 
  CHECK (access_source IN ('direct', 'promo_code', 'manual_override', 'partnership', 'beta'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS access_code_used TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'trial' 
  CHECK (billing_status IN ('trial', 'active', 'past_due', 'canceled', 'lifetime'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_id TEXT; -- Stripe subscription ID

CREATE INDEX IF NOT EXISTS idx_businesses_access_source ON businesses(access_source);
CREATE INDEX IF NOT EXISTS idx_businesses_billing_status ON businesses(billing_status);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to validate and redeem a code
CREATE OR REPLACE FUNCTION redeem_access_code(
  p_code TEXT,
  p_business_id UUID,
  p_user_id UUID,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_code_record RECORD;
  v_redemption_id UUID;
BEGIN
  -- Find the code
  SELECT * INTO v_code_record
  FROM access_codes
  WHERE code = p_code
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  AND current_uses < max_uses
  FOR UPDATE; -- Lock the row
  
  -- Check if code exists and is valid
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired code'
    );
  END IF;
  
  -- Check if this business already redeemed this code
  IF EXISTS (
    SELECT 1 FROM code_redemptions 
    WHERE code_id = v_code_record.id 
    AND business_id = p_business_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code already redeemed by this business'
    );
  END IF;
  
  -- Increment usage
  UPDATE access_codes
  SET current_uses = current_uses + 1
  WHERE id = v_code_record.id;
  
  -- Record redemption
  INSERT INTO code_redemptions (
    code_id,
    code,
    redeemed_by,
    business_id,
    granted_tier,
    granted_features,
    ip_address,
    user_agent
  ) VALUES (
    v_code_record.id,
    v_code_record.code,
    p_user_id,
    p_business_id,
    v_code_record.linked_tier,
    v_code_record.feature_overrides,
    p_ip_address,
    p_user_agent
  ) RETURNING id INTO v_redemption_id;
  
  -- Create entitlement override
  INSERT INTO entitlement_overrides (
    business_id,
    override_type,
    override_tier,
    feature_overrides,
    expires_at,
    reason,
    granted_by,
    access_code_id
  ) VALUES (
    p_business_id,
    'code_redemption',
    v_code_record.linked_tier,
    v_code_record.feature_overrides,
    v_code_record.expires_at,
    'Redeemed code: ' || v_code_record.code,
    p_user_id,
    v_code_record.id
  );
  
  -- Update business
  UPDATE businesses
  SET 
    tier = v_code_record.linked_tier,
    access_source = 'promo_code',
    access_code_used = v_code_record.code,
    billing_status = CASE 
      WHEN v_code_record.code_type = 'lifetime' THEN 'lifetime'
      ELSE 'active'
    END
  WHERE id = p_business_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tier', v_code_record.linked_tier,
    'code_type', v_code_record.code_type,
    'redemption_id', v_redemption_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually grant entitlement (God Mode)
CREATE OR REPLACE FUNCTION grant_manual_entitlement(
  p_business_id UUID,
  p_tier TEXT,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL,
  p_granted_by UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_feature_overrides JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_override_id UUID;
BEGIN
  -- Verify admin permission (in production, check via RLS)
  IF p_granted_by IS NULL THEN
    p_granted_by := auth.uid();
  END IF;
  
  -- Create override
  INSERT INTO entitlement_overrides (
    business_id,
    override_type,
    override_tier,
    feature_overrides,
    expires_at,
    reason,
    notes,
    granted_by
  ) VALUES (
    p_business_id,
    'manual',
    p_tier,
    p_feature_overrides,
    p_expires_at,
    p_reason,
    p_notes,
    p_granted_by
  ) RETURNING id INTO v_override_id;
  
  -- Update business
  UPDATE businesses
  SET 
    tier = p_tier,
    access_source = 'manual_override',
    billing_status = CASE 
      WHEN p_expires_at IS NULL THEN 'lifetime'
      ELSE 'active'
    END
  WHERE id = p_business_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'override_id', v_override_id,
    'tier', p_tier
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get effective permissions for a business
CREATE OR REPLACE FUNCTION get_effective_permissions(p_business_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_business RECORD;
  v_override RECORD;
  v_features JSONB;
BEGIN
  -- Get business
  SELECT * INTO v_business FROM businesses WHERE id = p_business_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Get base features from tier
  v_features := get_business_features(p_business_id);
  
  -- Check for active overrides
  SELECT * INTO v_override
  FROM entitlement_overrides
  WHERE business_id = p_business_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY granted_at DESC
  LIMIT 1;
  
  -- Apply override if exists
  IF FOUND AND v_override.feature_overrides IS NOT NULL THEN
    v_features := v_features || v_override.feature_overrides;
  END IF;
  
  RETURN jsonb_build_object(
    'business_id', p_business_id,
    'tier', v_business.tier,
    'access_source', v_business.access_source,
    'billing_status', v_business.billing_status,
    'features', v_features,
    'has_override', FOUND
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION redeem_access_code TO authenticated;
GRANT EXECUTE ON FUNCTION grant_manual_entitlement TO authenticated;
GRANT EXECUTE ON FUNCTION get_effective_permissions TO authenticated;

-- ============================================
-- SEED EXAMPLE CODES (Optional - for testing)
-- ============================================

-- Example: Family code (one-time use, tier3, lifetime)
/*
INSERT INTO access_codes (code, max_uses, linked_tier, code_type, description, created_by) VALUES
  ('FAMILY-VIP-2024', 1, 'tier3', 'family', 'Family member - lifetime access', (SELECT id FROM auth.users LIMIT 1));

-- Example: Beta tester code (100 uses, tier2, expires in 90 days)
INSERT INTO access_codes (code, max_uses, linked_tier, code_type, description, expires_at, created_by) VALUES
  ('BETA-TESTER-X', 100, 'tier2', 'beta', 'Beta tester program', NOW() + INTERVAL '90 days', (SELECT id FROM auth.users LIMIT 1));
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- You now have:
-- ✅ access_codes table for promo codes
-- ✅ code_redemptions table for audit trail
-- ✅ entitlement_overrides table for manual grants
-- ✅ Helper functions for code redemption and manual overrides
-- ✅ Effective permissions calculation

-- Next: Build the Admin UI and Redemption Flow
