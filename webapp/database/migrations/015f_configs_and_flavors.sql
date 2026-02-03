-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 6: Industry Configs & Location Flavors
-- Run this SIXTH (after 015e)
-- ============================================

-- Industry Configs Table
CREATE TABLE IF NOT EXISTS industry_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  industry_type TEXT NOT NULL,
  industry_name TEXT NOT NULL,
  
  decay_logic JSONB NOT NULL DEFAULT '{"stale_years": 5, "unreliable_years": 10}'::jsonb,
  asset_metadata_schema JSONB NOT NULL DEFAULT '{"required": [], "optional": []}'::jsonb,
  verification_prompt TEXT,
  emergency_keywords TEXT[] DEFAULT '{}'::text[],
  
  agent_personality JSONB DEFAULT '{"formality_level": "friendly", "humor_enabled": true}'::jsonb,
  witty_hooks JSONB DEFAULT '[]'::jsonb,
  
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_industry_configs_tenant ON industry_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_industry_configs_type ON industry_configs(industry_type);

ALTER TABLE industry_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for industry_configs" ON industry_configs;
CREATE POLICY "Tenant isolation for industry_configs" ON industry_configs
  FOR ALL USING (tenant_id IS NULL OR tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to industry_configs" ON industry_configs;
CREATE POLICY "Service role full access to industry_configs" ON industry_configs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON industry_configs TO authenticated;
GRANT ALL ON industry_configs TO service_role;

-- Location Flavors Table
CREATE TABLE IF NOT EXISTS location_flavors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  location_name TEXT NOT NULL,
  region TEXT,
  states TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  zip_codes TEXT[] DEFAULT '{}',
  
  climate_quirk TEXT,
  witty_hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
  weather_phrases JSONB DEFAULT '{}'::jsonb,
  local_references JSONB DEFAULT '{}'::jsonb,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_flavors_name ON location_flavors(location_name);

GRANT ALL ON location_flavors TO authenticated;
GRANT ALL ON location_flavors TO service_role;

-- CRM Sync Logs Table
CREATE TABLE IF NOT EXISTS crm_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  crm_provider TEXT NOT NULL,
  crm_entity_id TEXT,
  
  sync_direction TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  
  payload JSONB,
  response JSONB,
  error_message TEXT,
  
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_tenant ON crm_sync_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_status ON crm_sync_logs(sync_status);

ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for crm_sync_logs" ON crm_sync_logs;
CREATE POLICY "Tenant isolation for crm_sync_logs" ON crm_sync_logs
  FOR ALL USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to crm_sync_logs" ON crm_sync_logs;
CREATE POLICY "Service role full access to crm_sync_logs" ON crm_sync_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON crm_sync_logs TO authenticated;
GRANT ALL ON crm_sync_logs TO service_role;
