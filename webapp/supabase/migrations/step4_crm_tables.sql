-- ============================================================
-- STEP 4: Create CRM tables
-- Run after step 3 succeeds
-- ============================================================

-- Leads table
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
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage leads" ON crm_leads;
CREATE POLICY "Users manage leads" ON crm_leads FOR ALL TO authenticated USING (user_id = auth.uid());

-- Customers table
CREATE TABLE IF NOT EXISTS crm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  lead_id UUID,
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  purchase_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage customers" ON crm_customers;
CREATE POLICY "Users manage customers" ON crm_customers FOR ALL TO authenticated USING (user_id = auth.uid());

-- Revenue table
CREATE TABLE IF NOT EXISTS crm_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'sale',
  source TEXT,
  customer_id UUID,
  description TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crm_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage revenue" ON crm_revenue;
CREATE POLICY "Users manage revenue" ON crm_revenue FOR ALL TO authenticated USING (user_id = auth.uid());

SELECT 'CRM tables created successfully!' as result;
