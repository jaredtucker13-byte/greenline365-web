-- ============================================
-- MIGRATION 019: Global Directory Foundation
-- Public business directory with earned badges
-- ============================================

-- 1. Directory Listings (public-facing business profiles)
-- ============================================
CREATE TABLE IF NOT EXISTS directory_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Link to GL365 tenant (NULL if free/external)
  tenant_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  
  -- Business info
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE,
  industry TEXT NOT NULL,
  subcategories TEXT[] DEFAULT '{}',
  description TEXT,
  
  -- Contact
  phone TEXT,
  email TEXT,
  website TEXT,
  
  -- Location
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  google_place_id TEXT,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  
  -- Hours (JSONB: {"mon": {"open": "9:00", "close": "17:00"}, ...})
  business_hours JSONB DEFAULT '{}'::jsonb,
  
  -- AI scraped data
  ai_scraped_data JSONB DEFAULT '{}'::jsonb,
  ai_scraped_at TIMESTAMPTZ,
  
  -- Tier: free, growth, authority, dominator
  tier TEXT NOT NULL DEFAULT 'free',
  tier_started_at TIMESTAMPTZ,
  
  -- Trust & ranking
  trust_score INTEGER DEFAULT 0,
  total_feedback_count INTEGER DEFAULT 0,
  avg_feedback_rating DECIMAL(3,2) DEFAULT 0,
  
  -- Visibility
  is_published BOOLEAN DEFAULT true,
  is_claimed BOOLEAN DEFAULT false,
  claimed_by UUID,
  claimed_at TIMESTAMPTZ,
  
  -- Property link (for service businesses — links to property passport)
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_directory_industry ON directory_listings(industry);
CREATE INDEX IF NOT EXISTS idx_directory_city ON directory_listings(city, state);
CREATE INDEX IF NOT EXISTS idx_directory_zip ON directory_listings(zip_code);
CREATE INDEX IF NOT EXISTS idx_directory_tier ON directory_listings(tier);
CREATE INDEX IF NOT EXISTS idx_directory_trust ON directory_listings(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_directory_slug ON directory_listings(slug);
CREATE INDEX IF NOT EXISTS idx_directory_tenant ON directory_listings(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_directory_published ON directory_listings(is_published, industry, city) WHERE is_published = true;

-- Full-text search on business name + description
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_directory_search') THEN
    CREATE INDEX idx_directory_search ON directory_listings 
      USING gin (to_tsvector('english', COALESCE(business_name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(industry, '')));
  END IF;
END $$;

-- 2. Directory Badges (earned, never bought)
-- ============================================
CREATE TABLE IF NOT EXISTS directory_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  
  -- Badge identity
  badge_type TEXT NOT NULL,
  badge_label TEXT NOT NULL,
  badge_color TEXT NOT NULL DEFAULT '#39FF14',
  badge_icon TEXT,
  
  -- How it was earned
  earned_via TEXT NOT NULL,
  earned_details JSONB DEFAULT '{}'::jsonb,
  
  -- Validity
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT,
  
  -- Link to what earned it
  property_interaction_id UUID REFERENCES property_interactions(id),
  feedback_threshold_met BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_badges_listing ON directory_badges(listing_id);
CREATE INDEX IF NOT EXISTS idx_badges_active ON directory_badges(listing_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_badges_type ON directory_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_badges_expires ON directory_badges(expires_at) WHERE expires_at IS NOT NULL AND is_active = true;

-- 3. QR Feedback (public submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS directory_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  
  -- Feedback data
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  feedback_type TEXT DEFAULT 'general',
  
  -- Categories (what they're rating)
  categories JSONB DEFAULT '{}'::jsonb,
  
  -- Red flags
  is_red_flag BOOLEAN DEFAULT false,
  red_flag_type TEXT,
  
  -- Submitter (anonymous by default)
  submitter_name TEXT,
  submitter_email TEXT,
  
  -- AI analysis
  ai_sentiment TEXT,
  ai_sentiment_score DECIMAL(3,2),
  ai_summary TEXT,
  
  -- Source
  source TEXT DEFAULT 'qr',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_listing ON directory_feedback(listing_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON directory_feedback(listing_id, rating);
CREATE INDEX IF NOT EXISTS idx_feedback_red_flag ON directory_feedback(listing_id) WHERE is_red_flag = true;
CREATE INDEX IF NOT EXISTS idx_feedback_recent ON directory_feedback(listing_id, created_at DESC);

-- 4. Auto-update listing stats on new feedback
-- ============================================
CREATE OR REPLACE FUNCTION update_listing_feedback_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE directory_listings SET
    total_feedback_count = (SELECT COUNT(*) FROM directory_feedback WHERE listing_id = NEW.listing_id),
    avg_feedback_rating = (SELECT COALESCE(AVG(rating), 0) FROM directory_feedback WHERE listing_id = NEW.listing_id),
    updated_at = NOW()
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_listing_stats ON directory_feedback;
CREATE TRIGGER trg_update_listing_stats
  AFTER INSERT OR UPDATE OR DELETE ON directory_feedback
  FOR EACH ROW EXECUTE FUNCTION update_listing_feedback_stats();

-- 5. Auto-revoke expired badges (call via cron or edge function)
-- ============================================
CREATE OR REPLACE FUNCTION revoke_expired_badges()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE directory_badges SET
    is_active = false,
    revoked_at = NOW(),
    revoke_reason = 'Expired - maintenance overdue'
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Slug generation function
-- ============================================
CREATE OR REPLACE FUNCTION generate_directory_slug()
RETURNS TRIGGER AS $$
DECLARE
  v_slug TEXT;
  v_count INTEGER;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    v_slug := lower(regexp_replace(NEW.business_name, '[^a-zA-Z0-9]', '-', 'g'));
    v_slug := regexp_replace(v_slug, '-+', '-', 'g');
    v_slug := trim(both '-' from v_slug);
    
    SELECT COUNT(*) INTO v_count FROM directory_listings WHERE slug = v_slug AND id != NEW.id;
    IF v_count > 0 THEN
      v_slug := v_slug || '-' || floor(random() * 9999)::text;
    END IF;
    NEW.slug := v_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_directory_slug ON directory_listings;
CREATE TRIGGER trg_generate_directory_slug
  BEFORE INSERT OR UPDATE ON directory_listings
  FOR EACH ROW EXECUTE FUNCTION generate_directory_slug();

-- 7. RLS — Directory is PUBLIC for reads
-- ============================================
ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can READ published listings
DROP POLICY IF EXISTS "directory_public_read" ON directory_listings;
CREATE POLICY "directory_public_read" ON directory_listings
  FOR SELECT USING (is_published = true);

-- Owners can manage their own listing
DROP POLICY IF EXISTS "directory_owner_write" ON directory_listings;
CREATE POLICY "directory_owner_write" ON directory_listings
  FOR ALL USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
    OR claimed_by = auth.uid()
  );

-- Service role full access
DROP POLICY IF EXISTS "directory_service_role" ON directory_listings;
CREATE POLICY "directory_service_role" ON directory_listings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Badges: public read, service role write
DROP POLICY IF EXISTS "badges_public_read" ON directory_badges;
CREATE POLICY "badges_public_read" ON directory_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "badges_service_write" ON directory_badges;
CREATE POLICY "badges_service_write" ON directory_badges
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Feedback: anyone can read and submit
DROP POLICY IF EXISTS "feedback_public_read" ON directory_feedback;
CREATE POLICY "feedback_public_read" ON directory_feedback FOR SELECT USING (true);

DROP POLICY IF EXISTS "feedback_public_insert" ON directory_feedback;
CREATE POLICY "feedback_public_insert" ON directory_feedback FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "feedback_service_role" ON directory_feedback;
CREATE POLICY "feedback_service_role" ON directory_feedback
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON directory_listings TO anon;
GRANT SELECT ON directory_badges TO anon;
GRANT SELECT, INSERT ON directory_feedback TO anon;
GRANT ALL ON directory_listings TO authenticated;
GRANT ALL ON directory_badges TO authenticated;
GRANT ALL ON directory_feedback TO authenticated;
GRANT ALL ON directory_listings TO service_role;
GRANT ALL ON directory_badges TO service_role;
GRANT ALL ON directory_feedback TO service_role;

-- 8. Seed badge types
-- ============================================
-- These are the badge types that can be earned (reference only, stored in code)
-- 'verified_air'     - HVAC Pro stamps air quality        (Green, earned via CRM service)
-- 'clean_space'      - Sentiment AI verifies cleanliness  (Green, earned via feedback)
-- 'verified_plumbing' - Plumbing Pro stamps system         (Green, earned via CRM service)
-- 'verified_electric' - Electrical Pro stamps system       (Green, earned via CRM service)
-- 'community_favorite' - 50+ positive feedback             (Blue, earned via feedback)
-- 'network_leader'   - Perfect record + 100+ interactions  (Gold, earned via track record)

-- Done! Run in Supabase SQL Editor.
