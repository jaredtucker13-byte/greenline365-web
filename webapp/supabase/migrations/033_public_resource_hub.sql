-- ============================================================
-- 033: Public Resource Hub & Download Tracking
-- ============================================================
-- Adds:
--   1. is_public_resource column on directory_listings
--   2. resource_links table for downloadable maps/guides/GPX files
--   3. resource_downloads table for tracking download popularity
--   4. destination_tips table for "Local Secret" insider tips
--   5. RPC function get_dynamic_counts() for live stat counts
--   6. RPC function get_destination_weather_coords() for lat/lng lookup
-- ============================================================

-- 1. Add is_public_resource flag to listings
ALTER TABLE directory_listings
  ADD COLUMN IF NOT EXISTS is_public_resource BOOLEAN DEFAULT FALSE;

-- Index for fast filtering
CREATE INDEX IF NOT EXISTS idx_listings_public_resource
  ON directory_listings (is_public_resource)
  WHERE is_public_resource = TRUE;

-- Also add voted_by_count and verified_since_date if missing
ALTER TABLE directory_listings
  ADD COLUMN IF NOT EXISTS voted_by_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_since_date DATE;

-- ============================================================
-- 2. Resource Links (downloadable assets per listing)
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,                   -- Supabase Storage URL
  file_type TEXT NOT NULL DEFAULT 'pdf',    -- pdf, gpx, jpg, png
  file_size_bytes BIGINT,
  download_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,       -- show prominently on destination page
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for listing lookups
CREATE INDEX IF NOT EXISTS idx_resource_links_listing
  ON resource_links (listing_id);

-- RLS
ALTER TABLE resource_links ENABLE ROW LEVEL SECURITY;

-- Public can read resource links
CREATE POLICY "resource_links_public_read" ON resource_links
  FOR SELECT USING (true);

-- Only authenticated users (portal owners) can manage their resources
CREATE POLICY "resource_links_owner_manage" ON resource_links
  FOR ALL
  USING (
    listing_id IN (
      SELECT id FROM directory_listings
      WHERE tenant_id = auth.uid()
    )
  );

-- ============================================================
-- 3. Download Tracking
-- ============================================================
CREATE TABLE IF NOT EXISTS resource_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resource_links(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  ip_hash TEXT,                             -- hashed for privacy, dedup
  user_agent TEXT,
  referer TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource
  ON resource_downloads (resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_listing
  ON resource_downloads (listing_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_date
  ON resource_downloads (downloaded_at DESC);

-- RLS
ALTER TABLE resource_downloads ENABLE ROW LEVEL SECURITY;

-- Insert-only for public (anyone can download)
CREATE POLICY "resource_downloads_public_insert" ON resource_downloads
  FOR INSERT WITH CHECK (true);

-- Listing owners can view their download stats
CREATE POLICY "resource_downloads_owner_read" ON resource_downloads
  FOR SELECT
  USING (
    listing_id IN (
      SELECT id FROM directory_listings
      WHERE tenant_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Destination Insider Tips
-- ============================================================
CREATE TABLE IF NOT EXISTS destination_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_slug TEXT NOT NULL,           -- e.g. 'st-pete-beach', 'key-west'
  listing_id UUID REFERENCES directory_listings(id) ON DELETE SET NULL,
  tip_text TEXT NOT NULL,                   -- "Park in the south lot to avoid the $5 fee"
  tip_category TEXT DEFAULT 'general',      -- parking, timing, savings, insider, safety
  submitted_by TEXT,                        -- admin name or 'system'
  is_approved BOOLEAN DEFAULT TRUE,
  upvotes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destination_tips_slug
  ON destination_tips (destination_slug);

-- RLS
ALTER TABLE destination_tips ENABLE ROW LEVEL SECURITY;

-- Public read for approved tips
CREATE POLICY "destination_tips_public_read" ON destination_tips
  FOR SELECT USING (is_approved = TRUE);

-- Admin manage (service role bypasses RLS)

-- ============================================================
-- 5. Dynamic Count RPC
-- ============================================================
-- Returns live counts to replace ALL hard-coded numbers sitewide
CREATE OR REPLACE FUNCTION get_dynamic_counts()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_businesses', (
      SELECT COUNT(*) FROM directory_listings WHERE is_published = TRUE
    ),
    'total_categories', (
      SELECT COUNT(DISTINCT industry) FROM directory_listings WHERE is_published = TRUE
    ),
    'total_destinations', (
      SELECT COUNT(DISTINCT destination_slug) FROM destination_tips
    ),
    'total_claimed', (
      SELECT COUNT(*) FROM directory_listings WHERE is_published = TRUE AND is_claimed = TRUE
    ),
    'total_premium', (
      SELECT COUNT(*) FROM directory_listings WHERE is_published = TRUE AND tier IN ('growth', 'authority', 'dominator')
    ),
    'total_public_resources', (
      SELECT COUNT(*) FROM directory_listings WHERE is_published = TRUE AND is_public_resource = TRUE
    ),
    'total_resource_downloads', (
      SELECT COALESCE(SUM(download_count), 0) FROM resource_links
    ),
    'category_counts', (
      SELECT json_object_agg(industry, cnt)
      FROM (
        SELECT industry, COUNT(*) as cnt
        FROM directory_listings
        WHERE is_published = TRUE
        GROUP BY industry
      ) sub
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================
-- 6. Category-specific live count (for carousel cards)
-- ============================================================
CREATE OR REPLACE FUNCTION get_category_count(p_industry TEXT)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM directory_listings
  WHERE is_published = TRUE
    AND industry = p_industry;
$$;

-- ============================================================
-- 7. Increment download counter (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_download_count(p_resource_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE resource_links
  SET download_count = download_count + 1,
      updated_at = NOW()
  WHERE id = p_resource_id;
END;
$$;
