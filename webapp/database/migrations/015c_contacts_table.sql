-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 3: Contacts Table
-- Run this THIRD (after 015b)
-- ============================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  
  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT,
  
  phone TEXT NOT NULL,
  phone_normalized TEXT,
  
  email TEXT,
  
  -- Role at the property
  role TEXT DEFAULT 'owner',
  is_primary BOOLEAN DEFAULT false,
  
  -- Communication preferences
  preferred_contact_method TEXT DEFAULT 'phone',
  best_time_to_call TEXT,
  do_not_call BOOLEAN DEFAULT false,
  
  -- Relationship scoring (CRS)
  relationship_score INTEGER DEFAULT 50,
  total_interactions INTEGER DEFAULT 0,
  first_contact_date DATE,
  last_contact_date DATE,
  
  -- Personal details for rapport
  personal_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- External CRM
  external_crm_id TEXT,
  external_crm_provider TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Trigger to auto-generate full_name and phone_normalized
CREATE OR REPLACE FUNCTION generate_contact_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '');
  NEW.phone_normalized := regexp_replace(NEW.phone, '[^0-9]', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_contact_fields
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION generate_contact_fields();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_property ON contacts(property_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_normalized ON contacts(tenant_id, phone_normalized);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(tenant_id, email);

-- RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for contacts" ON contacts;
CREATE POLICY "Tenant isolation for contacts" ON contacts
  FOR ALL USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to contacts" ON contacts;
CREATE POLICY "Service role full access to contacts" ON contacts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON contacts TO authenticated;
GRANT ALL ON contacts TO service_role;
