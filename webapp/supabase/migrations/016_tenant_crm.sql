-- ============================================================
-- TENANT CRM SYSTEM
-- Each tenant (business) gets their own CRM to track:
-- - Their leads/customers
-- - Email campaign performance
-- - Revenue and ROI
-- ============================================================

-- ============================================
-- LEADS TABLE
-- Potential customers for each tenant
-- ============================================
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- The tenant who owns this lead
  
  -- Contact Info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Lead Status
  status TEXT DEFAULT 'new', -- new, contacted, qualified, proposal, negotiation, converted, lost
  source TEXT, -- website, referral, social, email_campaign, cold_call, event, other
  
  -- Value
  value DECIMAL(12,2) DEFAULT 0, -- Estimated deal value
  
  -- Tracking
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to TEXT, -- For teams
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON crm_leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(user_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(user_id, source);

-- RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own leads" ON crm_leads;
CREATE POLICY "Users manage own leads" 
  ON crm_leads FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ============================================
-- CUSTOMERS TABLE
-- Converted leads / paying customers
-- ============================================
CREATE TABLE IF NOT EXISTS crm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Contact Info
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Origin
  lead_id UUID REFERENCES crm_leads(id),
  
  -- Value Tracking
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  purchase_count INT DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, inactive, churned
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_customers_user ON crm_customers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers(user_id, email);

-- RLS
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own customers" ON crm_customers;
CREATE POLICY "Users manage own customers" 
  ON crm_customers FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ============================================
-- EMAIL EVENTS TABLE
-- Track email campaign performance
-- ============================================
CREATE TABLE IF NOT EXISTS crm_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Event Info
  event_type TEXT NOT NULL, -- sent, delivered, opened, clicked, bounced, unsubscribed, complained
  
  -- References
  campaign_id UUID, -- Links to email campaign
  template_id UUID,
  recipient_email TEXT NOT NULL,
  recipient_id UUID, -- Links to lead or customer
  
  -- Click tracking
  link_url TEXT, -- For click events
  link_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_email_events_user ON crm_email_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_email_events_campaign ON crm_email_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_crm_email_events_recipient ON crm_email_events(recipient_email, event_type);

-- RLS
ALTER TABLE crm_email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own email events" ON crm_email_events;
CREATE POLICY "Users view own email events" 
  ON crm_email_events FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Allow inserts for webhooks (email provider callbacks)
DROP POLICY IF EXISTS "Allow email event inserts" ON crm_email_events;
CREATE POLICY "Allow email event inserts" 
  ON crm_email_events FOR INSERT 
  TO authenticated, anon 
  WITH CHECK (true);

-- ============================================
-- REVENUE TABLE
-- Track all revenue for ROI calculations
-- ============================================
CREATE TABLE IF NOT EXISTS crm_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Amount
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'sale', -- sale, recurring, refund, fee
  
  -- Attribution
  source TEXT, -- email_campaign, social, direct, referral, organic, paid_ad
  campaign_id UUID,
  customer_id UUID REFERENCES crm_customers(id),
  lead_id UUID REFERENCES crm_leads(id),
  
  -- Description
  description TEXT,
  invoice_id TEXT,
  
  -- Timing
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_revenue_user ON crm_revenue(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_source ON crm_revenue(user_id, source);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_customer ON crm_revenue(customer_id);

-- RLS
ALTER TABLE crm_revenue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own revenue" ON crm_revenue;
CREATE POLICY "Users manage own revenue" 
  ON crm_revenue FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ============================================
-- HELPER FUNCTION: Increment Customer LTV
-- ============================================
CREATE OR REPLACE FUNCTION increment_customer_ltv(p_customer_id UUID, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE crm_customers
  SET 
    lifetime_value = lifetime_value + p_amount,
    purchase_count = purchase_count + 1,
    last_purchase_at = NOW(),
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Convert Lead to Customer
-- ============================================
CREATE OR REPLACE FUNCTION convert_lead_to_customer(p_lead_id UUID)
RETURNS UUID AS $$
DECLARE
  v_lead RECORD;
  v_customer_id UUID;
BEGIN
  -- Get lead data
  SELECT * INTO v_lead FROM crm_leads WHERE id = p_lead_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Create customer
  INSERT INTO crm_customers (user_id, name, email, phone, company, lead_id)
  VALUES (v_lead.user_id, v_lead.name, v_lead.email, v_lead.phone, v_lead.company, p_lead_id)
  RETURNING id INTO v_customer_id;
  
  -- Update lead status
  UPDATE crm_leads 
  SET status = 'converted', converted_at = NOW(), updated_at = NOW()
  WHERE id = p_lead_id;
  
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Lead Pipeline Summary
-- ============================================
CREATE OR REPLACE VIEW crm_lead_pipeline AS
SELECT 
  user_id,
  status,
  COUNT(*) as count,
  SUM(value) as total_value,
  AVG(value) as avg_value
FROM crm_leads
GROUP BY user_id, status;

-- ============================================
-- VIEW: Revenue by Channel
-- ============================================
CREATE OR REPLACE VIEW crm_revenue_by_channel AS
SELECT 
  user_id,
  source,
  DATE_TRUNC('month', occurred_at) as month,
  SUM(CASE WHEN type != 'refund' THEN amount ELSE -amount END) as net_revenue,
  COUNT(*) as transaction_count
FROM crm_revenue
GROUP BY user_id, source, DATE_TRUNC('month', occurred_at);
