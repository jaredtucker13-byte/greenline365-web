-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 2: Properties Table
-- Run this SECOND (after 015a)
-- ============================================

CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Address fields
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  
  -- Computed full address for display (NOT generated - we'll update manually)
  full_address TEXT,
  
  -- Property details
  gate_code TEXT,
  access_notes TEXT,
  property_type TEXT DEFAULT 'residential',
  unit_number TEXT,
  
  -- Geolocation
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Tracking
  first_service_date DATE,
  last_service_date DATE,
  total_service_count INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10, 2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create trigger to auto-generate full_address
CREATE OR REPLACE FUNCTION generate_full_address()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_address := COALESCE(NEW.address_line1, '') || ' ' || 
                      COALESCE(NEW.address_line2, '') || ' ' ||
                      COALESCE(NEW.city, '') || ', ' || 
                      COALESCE(NEW.state, '') || ' ' || 
                      COALESCE(NEW.zip_code, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_full_address
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION generate_full_address();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(tenant_id, zip_code);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(tenant_id, city);
CREATE INDEX IF NOT EXISTS idx_properties_full_address_trgm ON properties USING gin (full_address gin_trgm_ops);

-- RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for properties" ON properties;
CREATE POLICY "Tenant isolation for properties" ON properties
  FOR ALL USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to properties" ON properties;
CREATE POLICY "Service role full access to properties" ON properties
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON properties TO authenticated;
GRANT ALL ON properties TO service_role;
