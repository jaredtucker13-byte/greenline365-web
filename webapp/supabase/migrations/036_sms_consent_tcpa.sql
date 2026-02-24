-- 036: Add TCPA SMS consent tracking columns
-- Required for compliance with TCPA (Telephone Consumer Protection Act)
-- before sending any SMS/text messages to customers

-- Add SMS consent to leads table
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ DEFAULT NULL;

-- Add SMS consent to CRM leads
ALTER TABLE crm_leads
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ DEFAULT NULL;

-- Add SMS consent to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ DEFAULT NULL;

-- Add SMS consent to directory listings (business owners)
ALTER TABLE directory_listings
ADD COLUMN IF NOT EXISTS sms_opt_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sms_consent_at TIMESTAMPTZ DEFAULT NULL;

-- Note: When upgrading to Supabase paid plan, consider adding
-- a dedicated sms_consent_log table for full audit trail
