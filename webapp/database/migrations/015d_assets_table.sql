-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 4: Assets Table
-- Run this FOURTH (after 015c)
-- ============================================

CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Asset identification
  asset_type TEXT NOT NULL,  -- 'HVAC', 'Water Heater', 'Roof', 'Sprinkler', etc.
  
  -- JSONB for industry-specific metadata (polymorphic)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Lifecycle tracking
  install_date DATE,
  warranty_expiry DATE,
  expected_lifespan_years INTEGER,
  
  -- Verification & Data Decay
  last_verified TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  confidence_score INTEGER DEFAULT 100,
  
  -- Service history
  last_service_date DATE,
  total_service_count INTEGER DEFAULT 0,
  
  -- Model/Serial
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  
  -- Location within property
  location_description TEXT,
  
  -- Status
  status TEXT DEFAULT 'active',
  
  -- Notes
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_property ON assets(property_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(tenant_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_brand ON assets(tenant_id, brand);
CREATE INDEX IF NOT EXISTS idx_assets_metadata ON assets USING gin (metadata);

-- RLS
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for assets" ON assets;
CREATE POLICY "Tenant isolation for assets" ON assets
  FOR ALL USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to assets" ON assets;
CREATE POLICY "Service role full access to assets" ON assets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON assets TO authenticated;
GRANT ALL ON assets TO service_role;
