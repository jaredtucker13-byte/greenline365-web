-- ============================================
-- MIGRATION 021: Badge Engine, Coupons & Trust Index
-- Dynamic badges, goal-based feedback, reward vault
-- ============================================

-- 1. Badge Library (global catalog of available badges)
-- ============================================
CREATE TABLE IF NOT EXISTS badge_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  badge_key TEXT UNIQUE NOT NULL,
  badge_label TEXT NOT NULL,
  badge_description TEXT,
  badge_color TEXT DEFAULT '#39FF14',
  badge_icon TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  
  -- Threshold to earn
  required_positive_scans INTEGER DEFAULT 50,
  required_sentiment_pct DECIMAL(5,2) DEFAULT 90.00,
  
  -- Decay rules
  decay_window_days INTEGER DEFAULT 30,
  decay_start_health_pct INTEGER DEFAULT 100,
  
  -- Who can earn this
  applicable_industries TEXT[] DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Business Goals (owner selects up to 5 from library)
-- ============================================
CREATE TABLE IF NOT EXISTS business_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badge_library(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_positive_scans INTEGER DEFAULT 0,
  current_sentiment_pct DECIMAL(5,2) DEFAULT 0,
  total_scans INTEGER DEFAULT 0,
  
  -- Badge health (100 = full, 0 = revoked)
  health_pct INTEGER DEFAULT 0,
  is_badge_earned BOOLEAN DEFAULT false,
  badge_earned_at TIMESTAMPTZ,
  badge_published BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(listing_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_business_goals_listing ON business_goals(listing_id);
CREATE INDEX IF NOT EXISTS idx_business_goals_badge ON business_goals(badge_id);
CREATE INDEX IF NOT EXISTS idx_business_goals_earned ON business_goals(listing_id) WHERE is_badge_earned = true;

-- 3. Sentiment Logs (raw scan data)
-- ============================================
CREATE TABLE IF NOT EXISTS sentiment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES business_goals(id) ON DELETE SET NULL,
  
  -- Feedback data
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  response_data JSONB DEFAULT '{}'::jsonb,
  
  -- Verification
  gps_latitude DECIMAL(10, 8),
  gps_longitude DECIMAL(11, 8),
  is_verified_location BOOLEAN DEFAULT false,
  device_fingerprint TEXT,
  
  -- AI analysis
  ai_sentiment TEXT,
  ai_sentiment_score DECIMAL(3,2),
  
  -- Submitter
  submitter_name TEXT,
  submitter_email TEXT,
  submitter_phone TEXT,
  
  -- Reward issued
  coupon_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_listing ON sentiment_logs(listing_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_goal ON sentiment_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_recent ON sentiment_logs(listing_id, created_at DESC);

-- 4. Coupon / Rewards Vault
-- ============================================
CREATE TABLE IF NOT EXISTS rewards_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  
  -- Coupon details
  coupon_code TEXT UNIQUE NOT NULL,
  coupon_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL,
  description TEXT,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  
  -- Who gets it
  issued_to_email TEXT,
  issued_to_phone TEXT,
  issued_for TEXT DEFAULT 'feedback',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  redeemed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rewards_listing ON rewards_vault(listing_id);
CREATE INDEX IF NOT EXISTS idx_rewards_code ON rewards_vault(coupon_code);
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards_vault(listing_id, is_active) WHERE is_active = true;

-- 5. Trust Index scores
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'directory_listings' AND column_name = 'trust_index'
  ) THEN
    ALTER TABLE directory_listings ADD COLUMN trust_index INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'directory_listings' AND column_name = 'pro_stamp_score'
  ) THEN
    ALTER TABLE directory_listings ADD COLUMN pro_stamp_score INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'directory_listings' AND column_name = 'sentiment_score'
  ) THEN
    ALTER TABLE directory_listings ADD COLUMN sentiment_score INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'directory_listings' AND column_name = 'scan_volume_score'
  ) THEN
    ALTER TABLE directory_listings ADD COLUMN scan_volume_score INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'directory_listings' AND column_name = 'active_goals_count'
  ) THEN
    ALTER TABLE directory_listings ADD COLUMN active_goals_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 6. Auto-calculate Trust Index
-- ============================================
CREATE OR REPLACE FUNCTION calculate_trust_index(p_listing_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_pro_stamp INTEGER := 0;
  v_sentiment INTEGER := 0;
  v_volume INTEGER := 0;
  v_total_scans INTEGER;
  v_positive_scans INTEGER;
BEGIN
  -- Pro Stamp score (50% weight) — from property interactions
  SELECT LEAST(100, COUNT(*) * 10) INTO v_pro_stamp
  FROM property_interactions pi
  JOIN directory_listings dl ON dl.property_id = pi.property_id
  WHERE dl.id = p_listing_id;

  -- Sentiment score (30% weight) — from feedback
  SELECT COUNT(*), COUNT(*) FILTER (WHERE rating >= 4)
  INTO v_total_scans, v_positive_scans
  FROM sentiment_logs WHERE listing_id = p_listing_id;
  
  IF v_total_scans > 0 THEN
    v_sentiment := (v_positive_scans * 100 / v_total_scans);
  END IF;

  -- Volume score (20% weight) — based on total scans
  v_volume := LEAST(100, v_total_scans * 2);

  -- Weighted Trust Index: Pro(50%) + Sentiment(30%) + Volume(20%)
  RETURN LEAST(100, (v_pro_stamp * 50 + v_sentiment * 30 + v_volume * 20) / 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Auto-update goal progress on new sentiment log
-- ============================================
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal RECORD;
  v_badge RECORD;
  v_positive INTEGER;
  v_total INTEGER;
  v_pct DECIMAL;
BEGIN
  IF NEW.goal_id IS NOT NULL THEN
    SELECT * INTO v_goal FROM business_goals WHERE id = NEW.goal_id;
    SELECT * INTO v_badge FROM badge_library WHERE id = v_goal.badge_id;
    
    SELECT COUNT(*), COUNT(*) FILTER (WHERE rating >= 4)
    INTO v_total, v_positive
    FROM sentiment_logs WHERE goal_id = NEW.goal_id;
    
    v_pct := CASE WHEN v_total > 0 THEN (v_positive::DECIMAL / v_total * 100) ELSE 0 END;
    
    UPDATE business_goals SET
      current_positive_scans = v_positive,
      current_sentiment_pct = v_pct,
      total_scans = v_total,
      health_pct = CASE 
        WHEN v_positive >= v_badge.required_positive_scans AND v_pct >= v_badge.required_sentiment_pct THEN 100
        WHEN v_total > 0 THEN LEAST(100, (v_positive * 100 / v_badge.required_positive_scans))
        ELSE 0
      END,
      is_badge_earned = (v_positive >= v_badge.required_positive_scans AND v_pct >= v_badge.required_sentiment_pct),
      badge_earned_at = CASE
        WHEN NOT v_goal.is_badge_earned AND v_positive >= v_badge.required_positive_scans AND v_pct >= v_badge.required_sentiment_pct THEN NOW()
        ELSE v_goal.badge_earned_at
      END,
      badge_published = (v_positive >= v_badge.required_positive_scans AND v_pct >= v_badge.required_sentiment_pct),
      updated_at = NOW()
    WHERE id = NEW.goal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_goal_progress ON sentiment_logs;
CREATE TRIGGER trg_update_goal_progress
  AFTER INSERT ON sentiment_logs
  FOR EACH ROW EXECUTE FUNCTION update_goal_progress();

-- 8. RLS
-- ============================================
ALTER TABLE badge_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_vault ENABLE ROW LEVEL SECURITY;

-- Badge library: public read
DROP POLICY IF EXISTS "badge_library_read" ON badge_library;
CREATE POLICY "badge_library_read" ON badge_library FOR SELECT USING (true);
DROP POLICY IF EXISTS "badge_library_service" ON badge_library;
CREATE POLICY "badge_library_service" ON badge_library FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Business goals: owner can manage, public can read earned
DROP POLICY IF EXISTS "goals_public_read" ON business_goals;
CREATE POLICY "goals_public_read" ON business_goals FOR SELECT USING (true);
DROP POLICY IF EXISTS "goals_service" ON business_goals;
CREATE POLICY "goals_service" ON business_goals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Sentiment logs: public insert (QR scans), service read
DROP POLICY IF EXISTS "sentiment_public_insert" ON sentiment_logs;
CREATE POLICY "sentiment_public_insert" ON sentiment_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "sentiment_service" ON sentiment_logs;
CREATE POLICY "sentiment_service" ON sentiment_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Rewards: service role manages, public can verify codes
DROP POLICY IF EXISTS "rewards_public_read" ON rewards_vault;
CREATE POLICY "rewards_public_read" ON rewards_vault FOR SELECT USING (true);
DROP POLICY IF EXISTS "rewards_service" ON rewards_vault;
CREATE POLICY "rewards_service" ON rewards_vault FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON badge_library TO anon;
GRANT SELECT ON business_goals TO anon;
GRANT SELECT, INSERT ON sentiment_logs TO anon;
GRANT SELECT ON rewards_vault TO anon;
GRANT ALL ON badge_library TO authenticated;
GRANT ALL ON business_goals TO authenticated;
GRANT ALL ON sentiment_logs TO authenticated;
GRANT ALL ON rewards_vault TO authenticated;
GRANT ALL ON badge_library TO service_role;
GRANT ALL ON business_goals TO service_role;
GRANT ALL ON sentiment_logs TO service_role;
GRANT ALL ON rewards_vault TO service_role;

-- 9. Seed Badge Library
-- ============================================
INSERT INTO badge_library (badge_key, badge_label, badge_description, badge_color, category, required_positive_scans, required_sentiment_pct, applicable_industries) VALUES
  ('legendary_service', 'Legendary Service', 'Consistently delivers exceptional customer experience', '#FFB800', 'service', 50, 90, '{}'),
  ('sparkling_restrooms', 'Sparkling Restrooms', 'Maintains pristine restroom facilities', '#00D4FF', 'cleanliness', 30, 85, '{"restaurant","gym","barbershop"}'),
  ('fair_pricing', 'Fair Pricing', 'Customers consistently report good value for money', '#39FF14', 'value', 40, 85, '{}'),
  ('expert_baristas', 'Expert Baristas', 'Staff knowledge and skill exceeds expectations', '#8B5CF6', 'expertise', 30, 90, '{"bakery","restaurant"}'),
  ('verified_air', 'Verified Air', 'HVAC system certified by GL365 Pro', '#00FF88', 'pro_stamp', 1, 100, '{"restaurant","gym","barbershop","bakery"}'),
  ('clean_space', 'Clean Space', 'Verified cleanliness through customer sentiment', '#00D4FF', 'cleanliness', 50, 90, '{}'),
  ('community_favorite', 'Community Favorite', '100+ positive feedback from the community', '#FF8C00', 'community', 100, 80, '{}'),
  ('network_leader', 'Network Leader', 'Perfect record with 200+ verified interactions', '#FFD700', 'leadership', 200, 95, '{}'),
  ('great_ambiance', 'Great Ambiance', 'Atmosphere and vibe consistently praised', '#EC4899', 'vibe', 40, 85, '{"restaurant","barbershop"}'),
  ('fast_response', 'Fast Response', 'Quick response time to customer inquiries', '#39FF14', 'service', 30, 90, '{"plumbing","electrical","hvac","roofing"}'),
  ('safety_first', 'Safety First', 'Verified safety protocols and practices', '#FF4444', 'pro_stamp', 1, 100, '{"electrical","plumbing","roofing"}'),
  ('eco_friendly', 'Eco Friendly', 'Demonstrates environmental responsibility', '#39FF14', 'sustainability', 30, 85, '{}')
ON CONFLICT (badge_key) DO NOTHING;

-- Done!
