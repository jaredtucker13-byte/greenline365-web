-- ============================================
-- MIGRATION 017: Referral Network & Ratings
-- Run this in Supabase SQL Editor AFTER 016
-- ============================================

-- 1. Contractor Directory (Network Members)
-- ============================================
CREATE TABLE IF NOT EXISTS contractor_directory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Business info
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL, -- 'plumbing', 'roofing', 'hvac', 'electrical', 'lawn_care', 'security', 'painting', 'general'
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  service_area TEXT[], -- ZIP codes or city names
  
  -- Greenline network status
  is_greenline_member BOOLEAN DEFAULT false, -- Are they a Founding 30 member?
  greenline_tenant_id UUID REFERENCES businesses(id), -- Link to their Greenline tenant if member
  
  -- Ratings
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_referrals_received INTEGER DEFAULT 0,
  total_referrals_completed INTEGER DEFAULT 0,
  
  -- Preferences
  is_preferred BOOLEAN DEFAULT false, -- Contractor marked as "my guy" by this tenant
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contractor_directory_tenant ON contractor_directory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contractor_directory_industry ON contractor_directory(industry);
CREATE INDEX IF NOT EXISTS idx_contractor_directory_rating ON contractor_directory(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_directory_greenline ON contractor_directory(is_greenline_member) WHERE is_greenline_member = true;

-- 2. Referrals Table
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Who referred
  referring_tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  referring_user_id UUID REFERENCES auth.users(id),
  
  -- Who was referred
  referred_contractor_id UUID NOT NULL REFERENCES contractor_directory(id),
  
  -- The property and context
  property_id UUID REFERENCES properties(id),
  
  -- What triggered the referral
  trigger_type TEXT NOT NULL DEFAULT 'manual' 
    CHECK (trigger_type IN ('manual', 'ai_suggested', 'asset_age', 'property_passport', 'network_match')),
  trigger_context JSONB DEFAULT '{}'::jsonb, -- e.g., {"asset_type": "roofing", "asset_age_years": 15, "reason": "Roof is aging"}
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'suggested' 
    CHECK (status IN ('suggested', 'sent', 'viewed', 'accepted', 'completed', 'declined', 'expired')),
  
  -- Contact info for the referral
  homeowner_name TEXT,
  homeowner_phone TEXT,
  homeowner_email TEXT,
  
  -- Outcome
  job_value DECIMAL(10,2), -- Value of the job if completed
  referral_fee DECIMAL(10,2), -- Fee earned for the referral
  completed_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referring ON referrals(referring_tenant_id);
CREATE INDEX IF NOT EXISTS idx_referrals_contractor ON referrals(referred_contractor_id);
CREATE INDEX IF NOT EXISTS idx_referrals_property ON referrals(property_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- 3. Contractor Reviews / Ratings
-- ============================================
CREATE TABLE IF NOT EXISTS contractor_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES contractor_directory(id) ON DELETE CASCADE,
  
  -- Who reviewed
  reviewer_tenant_id UUID NOT NULL REFERENCES businesses(id),
  reviewer_user_id UUID REFERENCES auth.users(id),
  
  -- The review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  
  -- Context
  referral_id UUID REFERENCES referrals(id), -- Was this review from a referral?
  property_id UUID REFERENCES properties(id),
  job_type TEXT, -- What work was done
  
  is_verified BOOLEAN DEFAULT false, -- Verified via completed referral
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_contractor ON contractor_reviews(contractor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer ON contractor_reviews(reviewer_tenant_id);

-- 4. Auto-update avg_rating on contractor_directory
-- ============================================
CREATE OR REPLACE FUNCTION update_contractor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE contractor_directory SET
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM contractor_reviews WHERE contractor_id = NEW.contractor_id),
    total_reviews = (SELECT COUNT(*) FROM contractor_reviews WHERE contractor_id = NEW.contractor_id),
    updated_at = NOW()
  WHERE id = NEW.contractor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_contractor_rating ON contractor_reviews;
CREATE TRIGGER trg_update_contractor_rating
  AFTER INSERT OR UPDATE OR DELETE ON contractor_reviews
  FOR EACH ROW EXECUTE FUNCTION update_contractor_rating();

-- 5. Referral suggestion function
-- ============================================
CREATE OR REPLACE FUNCTION suggest_referral_contractors(
  p_tenant_id UUID,
  p_industry TEXT,
  p_property_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  contractor_id UUID,
  business_name TEXT,
  industry TEXT,
  avg_rating DECIMAL,
  total_reviews INTEGER,
  is_preferred BOOLEAN,
  is_greenline_member BOOLEAN,
  priority_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cd.id AS contractor_id,
    cd.business_name,
    cd.industry,
    cd.avg_rating,
    cd.total_reviews,
    cd.is_preferred,
    cd.is_greenline_member,
    CASE
      WHEN cd.is_preferred THEN 'Your preferred contractor'
      WHEN cd.is_greenline_member AND cd.avg_rating >= 4.0 THEN 'Top-rated Greenline member'
      WHEN cd.is_greenline_member THEN 'Greenline network member'
      WHEN cd.avg_rating >= 4.0 THEN 'Highly rated'
      ELSE 'Available contractor'
    END AS priority_reason
  FROM contractor_directory cd
  WHERE cd.tenant_id = p_tenant_id
    AND cd.industry = p_industry
    AND cd.is_active = true
  ORDER BY
    cd.is_preferred DESC,          -- Preferred contractors first
    cd.is_greenline_member DESC,   -- Greenline members next
    cd.avg_rating DESC,            -- Then by rating
    cd.total_referrals_completed DESC  -- Then by track record
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policies
-- ============================================
ALTER TABLE contractor_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;

-- Contractor directory: tenant can see their own + all greenline members
CREATE POLICY "contractor_directory_read" ON contractor_directory
  FOR SELECT USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
    OR is_greenline_member = true
  );

CREATE POLICY "contractor_directory_write" ON contractor_directory
  FOR ALL USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

-- Referrals: tenant can see referrals they created
CREATE POLICY "referrals_read" ON referrals
  FOR SELECT USING (
    referring_tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "referrals_write" ON referrals
  FOR ALL USING (
    referring_tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

-- Reviews: anyone in the network can read, own tenant can write
CREATE POLICY "reviews_read" ON contractor_reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_write" ON contractor_reviews
  FOR INSERT WITH CHECK (
    reviewer_tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

-- Done!
