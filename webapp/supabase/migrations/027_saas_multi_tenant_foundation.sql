-- =====================================================
-- GL365 SaaS Multi-Tenant Foundation
-- Migration 027: Adds per-tenant Cal.com, Retell, Twilio,
-- A2P compliance, and customer journal columns
-- =====================================================

-- =====================================================
-- 1. EXTEND TENANTS TABLE WITH SAAS COLUMNS
-- =====================================================

-- Config type (A/B/C)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS config_type TEXT DEFAULT 'A'
  CHECK (config_type IN ('A', 'B', 'C'));

-- Cal.com per-tenant credentials
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_api_key TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_event_type_id INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_event_type_ids JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_username TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_email TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_password_enc TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_booking_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_status TEXT DEFAULT 'not_started'
  CHECK (calcom_status IN ('not_started', 'pending_verification', 'verified', 'configured', 'live'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_setup_step INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_google_linked BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS calcom_timezone TEXT DEFAULT 'America/New_York';

-- Retell per-tenant agent
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS retell_llm_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS retell_phone_number TEXT;

-- Twilio sub-account per tenant
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS twilio_sub_sid TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS twilio_sub_auth_token_enc TEXT;

-- Agent configuration
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS agent_name TEXT DEFAULT 'Grace';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_voice TEXT DEFAULT 'warm and professional';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS greeting_phrase TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS emergency_keywords TEXT[] DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS after_hours_behavior TEXT DEFAULT 'take_message'
  CHECK (after_hours_behavior IN ('take_message', 'book_callback', 'emergency_only'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS transfer_phone TEXT;

-- Staff members (for Config B)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS staff JSONB DEFAULT '[]';

-- CRM integration (for Config C)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS external_crm_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS external_crm_webhook_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS external_crm_api_key_vault_id TEXT;

-- Intake Blueprint (full sales discovery data)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS intake_blueprint JSONB;

-- Onboarding tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending'
  CHECK (onboarding_status IN ('pending', 'discovery', 'proposal_sent', 'contract_signed', 'building', 'testing', 'active', 'paused', 'churned'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_started_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Billing
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS setup_fee INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS monthly_fee INTEGER DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ;

-- Privacy policy
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS privacy_policy_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS privacy_policy_html TEXT;

-- Slack notification tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slack_channel_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS slack_user_id TEXT;


-- =====================================================
-- 2. A2P COMPLIANCE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS a2p_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Brand registration
  legal_business_name TEXT,
  business_type TEXT CHECK (business_type IN ('llc', 'corp', 'sole_prop', 'partnership', 'nonprofit')),
  ein_vault_id TEXT,                -- UUID reference to Supabase Vault secret
  business_address TEXT,
  business_phone TEXT,
  business_website TEXT,
  industry_vertical TEXT,

  -- Contact person
  contact_name TEXT,
  contact_email_vault_id TEXT,      -- UUID reference to Vault
  contact_phone_vault_id TEXT,      -- UUID reference to Vault

  -- Campaign details (AI-generated, editable)
  campaign_description TEXT,
  message_samples JSONB DEFAULT '[]',   -- Array of 2-5 sample messages
  opt_in_method TEXT,
  opt_in_message TEXT,
  opt_out_keywords TEXT DEFAULT 'STOP, CANCEL, QUIT, UNSUBSCRIBE, END',
  help_keywords TEXT DEFAULT 'HELP, INFO, SUPPORT',
  privacy_policy_url TEXT,

  -- Twilio registration IDs
  twilio_brand_sid TEXT,
  twilio_campaign_sid TEXT,
  brand_status TEXT DEFAULT 'draft'
    CHECK (brand_status IN ('draft', 'pending', 'verified', 'failed', 'suspended')),
  campaign_status TEXT DEFAULT 'draft'
    CHECK (campaign_status IN ('draft', 'pending', 'active', 'failed', 'suspended')),

  -- Billing
  brand_registration_fee NUMERIC(8,2) DEFAULT 4.50,
  campaign_monthly_fee NUMERIC(8,2) DEFAULT 10.00,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  last_reviewed_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_a2p_tenant ON a2p_registrations(tenant_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS a2p_registrations_updated_at ON a2p_registrations;
CREATE TRIGGER a2p_registrations_updated_at
  BEFORE UPDATE ON a2p_registrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- 3. CUSTOMER JOURNAL TABLE (Auto-Journal System)
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_journal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Customer identification (at least one required)
  contact_id UUID,
  contact_phone TEXT,
  contact_email TEXT,
  contact_name TEXT,

  -- Event data
  source TEXT NOT NULL,             -- 'ai_call', 'calcom', 'google_calendar', 'sms', 'review', 'crm', 'n8n'
  event_type TEXT NOT NULL,         -- 'call_completed', 'booking_created', 'review_posted', 'sms_received', etc.
  summary TEXT NOT NULL,            -- AI-written 1-sentence summary
  raw_data JSONB,                   -- Original payload for debugging

  -- Metadata
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  importance TEXT DEFAULT 'normal' CHECK (importance IN ('low', 'normal', 'high', 'critical')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_tenant ON customer_journal(tenant_id);
CREATE INDEX IF NOT EXISTS idx_journal_phone ON customer_journal(contact_phone);
CREATE INDEX IF NOT EXISTS idx_journal_email ON customer_journal(contact_email);
CREATE INDEX IF NOT EXISTS idx_journal_source ON customer_journal(source);
CREATE INDEX IF NOT EXISTS idx_journal_created ON customer_journal(created_at DESC);


-- =====================================================
-- 4. A2P AUDIT LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS a2p_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  action TEXT NOT NULL,             -- 'vault_reveal', 'copy_field', 'submit_brand', 'submit_campaign'
  field_name TEXT,                  -- Which field was accessed
  performed_by TEXT,                -- User email or 'system'
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_a2p_audit_tenant ON a2p_audit_log(tenant_id);


-- =====================================================
-- 5. ENABLE RLS
-- =====================================================

ALTER TABLE a2p_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE a2p_audit_log ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (server-side only)
CREATE POLICY "Service role full access" ON a2p_registrations FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON customer_journal FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON a2p_audit_log FOR ALL
  USING (true) WITH CHECK (true);


-- =====================================================
-- 6. VERIFY
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 027 complete: SaaS multi-tenant foundation tables created';
  RAISE NOTICE '  - tenants table extended with Cal.com, Retell, Twilio, A2P columns';
  RAISE NOTICE '  - a2p_registrations table created';
  RAISE NOTICE '  - customer_journal table created';
  RAISE NOTICE '  - a2p_audit_log table created';
END
$$;
