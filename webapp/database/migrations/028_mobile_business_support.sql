-- ══════════════════════════════════════════════════════════════
-- 028: Mobile Business Support
-- Adds is_mobile_business flag and service_radius_miles for
-- businesses that travel to customers ("We Come to You").
-- ══════════════════════════════════════════════════════════════

ALTER TABLE directory_listings
  ADD COLUMN IF NOT EXISTS is_mobile_business BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS service_radius_miles INTEGER DEFAULT NULL;

-- Index for filtering mobile businesses
CREATE INDEX IF NOT EXISTS idx_listings_mobile ON directory_listings (is_mobile_business) WHERE is_mobile_business = true;

-- Auto-flag existing mobile-services industry listings
UPDATE directory_listings
  SET is_mobile_business = true
  WHERE industry = 'mobile-services' AND is_mobile_business = false;
