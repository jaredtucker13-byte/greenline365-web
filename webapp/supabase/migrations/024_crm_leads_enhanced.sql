-- CRM Leads Table (Enhanced)
-- Combines waitlist, newsletter, and all lead sources into one unified CRM

-- First, let's create the main leads table
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
  source TEXT DEFAULT 'website', -- website, partner, event, ad, referral
  source_detail TEXT, -- specific page, campaign name, referrer
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer_url TEXT,
  
  -- Interest & Segmentation
  interest_type TEXT, -- beta, early_access, pricing_info, enterprise, newsletter
  desired_plan TEXT,
  use_case TEXT,
  company_size TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[] DEFAULT '{}',
  
  -- Status & Verification
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'unverified', 'verified', 'invited', 'onboarded', 'converted', 'churned', 'unsubscribed', 'archived')),
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
  owner_id UUID REFERENCES auth.users(id),
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_priority ON crm_leads(priority);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON crm_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_verification ON crm_leads(status, verification_attempts, last_verification_sent_at) 
  WHERE status = 'unverified' AND bounce_flag = FALSE AND email_opt_out = FALSE;

-- Lead Activity Log
CREATE TABLE IF NOT EXISTS crm_lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- email_sent, email_opened, email_clicked, status_change, note_added, tag_added, assigned, verified, invited
  activity_data JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_lead_activities(activity_type);

-- Email Events (from SendGrid webhooks)
CREATE TABLE IF NOT EXISTS crm_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  event_type TEXT NOT NULL, -- delivered, opened, clicked, bounced, dropped, spamreport, unsubscribe
  event_data JSONB DEFAULT '{}',
  sg_event_id TEXT,
  sg_message_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_events_lead ON crm_email_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON crm_email_events(email);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON crm_email_events(event_type);

-- Email Campaigns (for tracking sent campaigns)
CREATE TABLE IF NOT EXISTS crm_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT,
  template_id TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  segment_filter JSONB DEFAULT '{}', -- filter criteria for leads
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invite Codes (for staged product access)
CREATE TABLE IF NOT EXISTS crm_invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES crm_email_campaigns(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'revoked')),
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON crm_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_lead ON crm_invite_codes(lead_id);

-- Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_invite_codes ENABLE ROW LEVEL SECURITY;

-- Policies (admin/authenticated users can access)
CREATE POLICY "Authenticated users can view leads" ON crm_leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert leads" ON crm_leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update leads" ON crm_leads FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete leads" ON crm_leads FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view activities" ON crm_lead_activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can view email events" ON crm_email_events FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage campaigns" ON crm_email_campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage invites" ON crm_invite_codes FOR ALL TO authenticated USING (true);

-- Service role for API operations
CREATE POLICY "Service role full access leads" ON crm_leads FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access activities" ON crm_lead_activities FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access events" ON crm_email_events FOR ALL TO service_role USING (true);

-- Function to update lead score
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_id UUID) RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  lead_record RECORD;
BEGIN
  SELECT * INTO lead_record FROM crm_leads WHERE id = lead_id;
  
  -- Base score for verification
  IF lead_record.status = 'verified' THEN score := score + 20; END IF;
  
  -- Company size scoring
  IF lead_record.company_size = 'enterprise' THEN score := score + 30;
  ELSIF lead_record.company_size = 'mid-market' THEN score := score + 20;
  ELSIF lead_record.company_size = 'small' THEN score := score + 10;
  END IF;
  
  -- Interest type scoring
  IF lead_record.interest_type = 'enterprise' THEN score := score + 25;
  ELSIF lead_record.interest_type = 'beta' THEN score := score + 15;
  END IF;
  
  -- Has company info
  IF lead_record.company IS NOT NULL THEN score := score + 10; END IF;
  
  -- Has phone
  IF lead_record.phone IS NOT NULL THEN score := score + 5; END IF;
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update lead score
CREATE OR REPLACE FUNCTION update_lead_score_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.lead_score := calculate_lead_score(NEW.id);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lead_score_update
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_score_trigger();
