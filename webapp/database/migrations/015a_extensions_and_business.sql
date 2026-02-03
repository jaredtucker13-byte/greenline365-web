-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 1: Extensions & Business Columns
-- Run this FIRST
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Add new columns to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS service_area JSONB DEFAULT '{"cities": [], "zip_codes": [], "states": []}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location_flavor_id UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry_config_id UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS crm_integration JSONB DEFAULT '{"provider": null, "api_key": null, "sync_enabled": false}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS transfer_phone_number TEXT;
