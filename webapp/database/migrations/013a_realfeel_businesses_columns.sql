-- PART 1: Add columns to businesses table
-- Run this FIRST

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_weather_dependent BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS weather_threshold INTEGER DEFAULT 50;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tenant_status TEXT DEFAULT 'normal';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS zip_code TEXT;
