-- ============================================
-- MIGRATION 020: Add destination_zone to directory_listings
-- Supports destination guides (mini-directories)
-- ============================================

ALTER TABLE directory_listings 
ADD COLUMN IF NOT EXISTS destination_zone TEXT;

CREATE INDEX IF NOT EXISTS idx_directory_destination_zone 
ON directory_listings(destination_zone) 
WHERE destination_zone IS NOT NULL;

-- Composite index for destination + industry queries
CREATE INDEX IF NOT EXISTS idx_directory_dest_industry 
ON directory_listings(destination_zone, industry) 
WHERE destination_zone IS NOT NULL AND is_published = true;
