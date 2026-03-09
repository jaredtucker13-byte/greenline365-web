-- Migration 037: Add smart_attributes JSONB column to businesses table
-- Stores category-specific fields rendered by the SmartCard component.
-- Dining: cuisine_type, price_range, outdoor_seating, reservations
-- Services: license_number, service_radius_miles, emergency_available
-- Professional: years_experience, practice_areas[], certifications[]
-- General: established_year, languages[], accepts_insurance

ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS smart_attributes JSONB DEFAULT '{}'::jsonb;

-- Index for efficient querying of JSONB keys
CREATE INDEX IF NOT EXISTS idx_businesses_smart_attributes
  ON businesses USING gin (smart_attributes);

COMMENT ON COLUMN businesses.smart_attributes IS
  'Category-specific metadata rendered by SmartCard (cuisine, license, experience, etc.)';
