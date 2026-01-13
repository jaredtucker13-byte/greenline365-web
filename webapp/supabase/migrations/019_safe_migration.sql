-- ============================================================
-- GREENLINE365 SAFE MIGRATION v5
-- ONLY touches user tables - skips all system/extension tables
-- ============================================================

-- ============================================
-- PART 1: Create CRM Tables (if not exist)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  value DECIMAL(12,2) DEFAULT 0,
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  lead_id UUID,
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  purchase_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'sale',
  source TEXT,
  campaign_id UUID,
  customer_id UUID,
  lead_id UUID,
  description TEXT,
  invoice_id TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  campaign_id UUID,
  template_id UUID,
  recipient_email TEXT NOT NULL,
  recipient_id UUID,
  link_url TEXT,
  link_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 2: Create Social & Analytics Tables
-- ============================================

CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  account_id TEXT,
  account_name TEXT,
  profile_url TEXT,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  platforms TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}',
  source TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  entity_type TEXT,
  entity_id UUID,
  visitor_id TEXT,
  session_id TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  value FLOAT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: Create Audit Logs Table
-- ============================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  session_id TEXT,
  action TEXT NOT NULL,
  action_category TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  description TEXT,
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success',
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 years'),
  is_sensitive BOOLEAN DEFAULT false,
  compliance_flags TEXT[] DEFAULT '{}'
);

-- ============================================
-- PART 4: Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON crm_leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(user_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_customers_user ON crm_customers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_user ON crm_revenue(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, occurred_at DESC);

-- ============================================
-- PART 5: Enable RLS on NEW tables only
-- (Not touching any existing/system tables)
-- ============================================

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 6: Create RLS Policies
-- ============================================

-- CRM Leads
DROP POLICY IF EXISTS "Users manage own leads" ON crm_leads;
CREATE POLICY "Users manage own leads" ON crm_leads FOR ALL TO authenticated USING (user_id = auth.uid());

-- CRM Customers
DROP POLICY IF EXISTS "Users manage own customers" ON crm_customers;
CREATE POLICY "Users manage own customers" ON crm_customers FOR ALL TO authenticated USING (user_id = auth.uid());

-- CRM Revenue
DROP POLICY IF EXISTS "Users manage own revenue" ON crm_revenue;
CREATE POLICY "Users manage own revenue" ON crm_revenue FOR ALL TO authenticated USING (user_id = auth.uid());

-- CRM Email Events
DROP POLICY IF EXISTS "Users view own email events" ON crm_email_events;
CREATE POLICY "Users view own email events" ON crm_email_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow email event inserts" ON crm_email_events;
CREATE POLICY "Allow email event inserts" ON crm_email_events FOR INSERT TO authenticated, anon WITH CHECK (true);

-- Social Connections
DROP POLICY IF EXISTS "Users manage own social" ON social_connections;
CREATE POLICY "Users manage own social" ON social_connections FOR ALL TO authenticated USING (user_id = auth.uid());

-- Social Posts
DROP POLICY IF EXISTS "Users manage own posts" ON social_posts;
CREATE POLICY "Users manage own posts" ON social_posts FOR ALL TO authenticated USING (user_id = auth.uid());

-- Analytics Events
DROP POLICY IF EXISTS "Users view own analytics" ON analytics_events;
CREATE POLICY "Users view own analytics" ON analytics_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow event tracking" ON analytics_events;
CREATE POLICY "Allow event tracking" ON analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Audit Logs (append-only)
DROP POLICY IF EXISTS "Audit insert only" ON audit_logs;
CREATE POLICY "Audit insert only" ON audit_logs FOR INSERT TO authenticated, anon WITH CHECK (true);
DROP POLICY IF EXISTS "Users view own audits" ON audit_logs;
CREATE POLICY "Users view own audits" ON audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Block audit updates" ON audit_logs;
CREATE POLICY "Block audit updates" ON audit_logs FOR UPDATE TO authenticated USING (false);
DROP POLICY IF EXISTS "Block audit deletes" ON audit_logs;
CREATE POLICY "Block audit deletes" ON audit_logs FOR DELETE TO authenticated USING (false);

-- ============================================
-- PART 7: Helper Functions
-- ============================================

-- Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_action_category TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (user_id, action, action_category, resource_type, resource_id, description, changes, metadata)
  VALUES (auth.uid(), p_action, p_action_category, p_resource_type, p_resource_id, p_description, p_changes, p_metadata)
  RETURNING id INTO v_audit_id;
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Convert lead to customer
CREATE OR REPLACE FUNCTION convert_lead_to_customer(p_lead_id UUID) RETURNS UUID AS $$
DECLARE
  v_lead RECORD;
  v_customer_id UUID;
BEGIN
  SELECT * INTO v_lead FROM crm_leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO crm_customers (user_id, name, email, phone, company, lead_id)
  VALUES (v_lead.user_id, v_lead.name, v_lead.email, v_lead.phone, v_lead.company, p_lead_id)
  RETURNING id INTO v_customer_id;
  UPDATE crm_leads SET status = 'converted', converted_at = NOW() WHERE id = p_lead_id;
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 8: CRM Views
-- ============================================

CREATE OR REPLACE VIEW crm_lead_pipeline AS
SELECT user_id, status, COUNT(*) as count, SUM(value) as total_value
FROM crm_leads GROUP BY user_id, status;

CREATE OR REPLACE VIEW crm_revenue_summary AS
SELECT user_id, source, DATE_TRUNC('month', occurred_at) as month,
  SUM(CASE WHEN type != 'refund' THEN amount ELSE -amount END) as net_revenue,
  COUNT(*) as transactions
FROM crm_revenue GROUP BY user_id, source, DATE_TRUNC('month', occurred_at);

-- ============================================
-- DONE!
-- ============================================
SELECT 'SUCCESS: All tables created with RLS policies!' as result;
