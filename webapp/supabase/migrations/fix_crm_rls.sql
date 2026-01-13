-- ============================================================
-- Add RLS policies to CRM tables (they use user_id)
-- ============================================================

-- CRM LEADS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage leads" ON crm_leads;
CREATE POLICY "Users manage leads" ON crm_leads 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

-- CRM CUSTOMERS
ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage customers" ON crm_customers;
CREATE POLICY "Users manage customers" ON crm_customers 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

-- CRM REVENUE
ALTER TABLE crm_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage revenue" ON crm_revenue;
CREATE POLICY "Users manage revenue" ON crm_revenue 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

-- SOCIAL CONNECTIONS
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage social" ON social_connections;
CREATE POLICY "Users manage social" ON social_connections 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON crm_leads(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_customers_user ON crm_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_user ON crm_revenue(user_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);

SELECT 'All CRM tables secured with RLS!' as result;
