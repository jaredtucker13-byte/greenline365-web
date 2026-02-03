-- ============================================
-- SAFE: Add Properties Table (Only if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  full_address TEXT,
  gate_code TEXT,
  access_notes TEXT,
  property_type TEXT DEFAULT 'residential',
  unit_number TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  first_service_date DATE,
  last_service_date DATE,
  total_service_count INTEGER DEFAULT 0,
  lifetime_value DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Done - table created if it didn't exist, no action if it did
SELECT 'Properties table ready!' as status;
