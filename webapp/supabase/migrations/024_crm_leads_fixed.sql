-- CRM Leads Table (Enhanced) - FIXED ORDER
-- Run this migration in Supabase SQL Editor

-- Step 1: Create the main leads table first
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Info
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  country TEXT,
  timezone TEXT,
  
  -- Source & Attribution
  source TEXT DEFAULT 'website',
  source_detail TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer_url TEXT,
  
  -- Interest & Segmentation
  interest_type TEXT,
  desired_plan TEXT,
  use_case TEXT,
  company_size TEXT,
  priority TEXT DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  
  -- Status & Verification
  status TEXT DEFAULT 'new',
  verification_token TEXT,
  verification_code TEXT,
  verification_expires TIMESTAMPTZ,
  verification_attempts INTEGER DEFAULT 0,
  last_verification_sent_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  
  -- Email Flags
  email_opt_in BOOLEAN DEFAULT TRUE,
  email_opt_out BOOLEAN DEFAULT FALSE,
  newsletter_opt_in BOOLEAN DEFAULT FALSE,
  bounce_flag BOOLEAN DEFAULT FALSE,
  spam_flag BOOLEAN DEFAULT FALSE,
  unsubscribed_at TIMESTAMPTZ,
  
  -- Assignment & Ownership
  owner_id UUID,
  assigned_at TIMESTAMPTZ,
  
  -- Lead Scoring
  lead_score INTEGER DEFAULT 0,
  
  -- Consent & Compliance
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  consent_ip TEXT,
  gdpr_consent BOOLEAN DEFAULT FALSE,
  
  -- Notes & Custom Data
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  invited_at TIMESTAMPTZ,
  onboarded_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  
  -- Unique constraint on email
  UNIQUE(email)
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_priority ON crm_leads(priority);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);

-- Step 3: Create related tables
CREATE TABLE IF NOT EXISTS crm_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  activity_data JSONB DEFAULT '{}',
  performed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_lead_activities(lead_id);

CREATE TABLE IF NOT EXISTS crm_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  sg_event_id TEXT,
  sg_message_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_lead ON crm_email_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON crm_email_events(email);

-- Step 4: Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_events ENABLE ROW LEVEL SECURITY;

-- Step 5: Create policies
DROP POLICY IF EXISTS "Authenticated users can view leads" ON crm_leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON crm_leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON crm_leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON crm_leads;
DROP POLICY IF EXISTS "Service role full access leads" ON crm_leads;

CREATE POLICY "Authenticated users can view leads" ON crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON crm_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON crm_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON crm_leads FOR DELETE TO authenticated USING (true);
CREATE POLICY "Service role full access leads" ON crm_leads FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Authenticated users can view activities" ON crm_lead_activities;
CREATE POLICY "Authenticated users can view activities" ON crm_lead_activities FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can view email events" ON crm_email_events;
CREATE POLICY "Authenticated users can view email events" ON crm_email_events FOR ALL TO authenticated USING (true);
