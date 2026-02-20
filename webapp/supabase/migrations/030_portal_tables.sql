-- ============================================
-- Sprint 2: Portal Tables
-- listing_photos — ordered photo management
-- listing_menus — section-based menu editor
-- ============================================

-- ============================================
-- LISTING PHOTOS TABLE
-- Replaces the gallery_images TEXT[] approach
-- with proper ordering and cover designation
-- ============================================
CREATE TABLE IF NOT EXISTS listing_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_photos_listing ON listing_photos(listing_id);
CREATE INDEX idx_listing_photos_position ON listing_photos(listing_id, position);

ALTER TABLE listing_photos ENABLE ROW LEVEL SECURITY;

-- Owners can manage their listing photos
CREATE POLICY "Owners can view own listing photos" ON listing_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_photos.listing_id
        AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "Owners can insert listing photos" ON listing_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_photos.listing_id
        AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "Owners can update listing photos" ON listing_photos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_photos.listing_id
        AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "Owners can delete listing photos" ON listing_photos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_photos.listing_id
        AND claimed_by = auth.uid()
    )
  );

-- Public can view photos for published listings
CREATE POLICY "Public can view published listing photos" ON listing_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_photos.listing_id
        AND is_published = true
    )
  );

-- Service role full access
GRANT ALL ON listing_photos TO service_role;
GRANT SELECT ON listing_photos TO anon;
GRANT ALL ON listing_photos TO authenticated;

-- Trigger for updated_at
CREATE TRIGGER update_listing_photos_updated_at
  BEFORE UPDATE ON listing_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- LISTING MENUS TABLE
-- Section-based menu editor stored as JSONB
-- Format: { sections: [{ id, name, position, items: [{ id, name, description, price, photo_url, position }] }] }
-- ============================================
CREATE TABLE IF NOT EXISTS listing_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL UNIQUE REFERENCES directory_listings(id) ON DELETE CASCADE,
  sections JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_menus_listing ON listing_menus(listing_id);

ALTER TABLE listing_menus ENABLE ROW LEVEL SECURITY;

-- Owners can manage their menu
CREATE POLICY "Owners can view own listing menu" ON listing_menus
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_menus.listing_id
        AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "Owners can insert listing menu" ON listing_menus
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_menus.listing_id
        AND claimed_by = auth.uid()
    )
  );

CREATE POLICY "Owners can update listing menu" ON listing_menus
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_menus.listing_id
        AND claimed_by = auth.uid()
    )
  );

-- Public can view menus for published listings
CREATE POLICY "Public can view published listing menu" ON listing_menus
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_menus.listing_id
        AND is_published = true
    )
  );

-- Service role full access
GRANT ALL ON listing_menus TO service_role;
GRANT SELECT ON listing_menus TO anon;
GRANT ALL ON listing_menus TO authenticated;

-- Trigger for updated_at
CREATE TRIGGER update_listing_menus_updated_at
  BEFORE UPDATE ON listing_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- LISTING STATS TABLE
-- Tracks views, clicks, and other engagement
-- ============================================
CREATE TABLE IF NOT EXISTS listing_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES directory_listings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'call', 'website', 'direction', 'share')),
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_listing_stats_listing ON listing_stats(listing_id);
CREATE INDEX idx_listing_stats_type ON listing_stats(listing_id, event_type);
CREATE INDEX idx_listing_stats_created ON listing_stats(created_at);

ALTER TABLE listing_stats ENABLE ROW LEVEL SECURITY;

-- Owners can view their listing stats
CREATE POLICY "Owners can view own listing stats" ON listing_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM directory_listings
      WHERE id = listing_stats.listing_id
        AND claimed_by = auth.uid()
    )
  );

-- Anyone can insert stats (public tracking)
CREATE POLICY "Anyone can insert listing stats" ON listing_stats
  FOR INSERT
  WITH CHECK (true);

GRANT ALL ON listing_stats TO service_role;
GRANT INSERT ON listing_stats TO anon;
GRANT ALL ON listing_stats TO authenticated;
