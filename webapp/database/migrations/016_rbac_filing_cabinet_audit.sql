-- ============================================
-- MIGRATION 016: RBAC, Filing Cabinet (FIXED)
-- Works with existing audit_logs and properties
-- ============================================

-- 1. Add tenant_role to profiles (safe)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'tenant_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tenant_role TEXT DEFAULT 'owner';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name TEXT;
  END IF;
END $$;

-- 2. Team Members Table (new)
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'tech',
  invited_by UUID,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- 3. Filing Cabinet Table (new)
-- ============================================
CREATE TABLE IF NOT EXISTS filing_cabinet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  mime_type TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  subcategory TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  tax_year INTEGER,
  job_id TEXT,
  uploaded_by UUID NOT NULL,
  uploaded_by_role TEXT NOT NULL DEFAULT 'owner',
  visibility TEXT NOT NULL DEFAULT 'owner_only',
  ai_extracted_data JSONB DEFAULT '{}'::jsonb,
  ai_processed BOOLEAN DEFAULT false,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filing_cabinet_tenant ON filing_cabinet(tenant_id);
CREATE INDEX IF NOT EXISTS idx_filing_cabinet_category ON filing_cabinet(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_filing_cabinet_tax_year ON filing_cabinet(tenant_id, tax_year);

-- 4. Add missing columns to existing audit_logs (safe)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_type') THEN
    ALTER TABLE audit_logs ADD COLUMN entity_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'entity_id') THEN
    ALTER TABLE audit_logs ADD COLUMN entity_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'severity') THEN
    ALTER TABLE audit_logs ADD COLUMN severity TEXT DEFAULT 'info';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'old_value') THEN
    ALTER TABLE audit_logs ADD COLUMN old_value JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'new_value') THEN
    ALTER TABLE audit_logs ADD COLUMN new_value JSONB;
  END IF;
END $$;

-- 5. Enable RLS on new tables
-- ============================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_cabinet ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- ============================================
DROP POLICY IF EXISTS "team_members_tenant_read" ON team_members;
CREATE POLICY "team_members_tenant_read" ON team_members
  FOR SELECT USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "team_members_owner_write" ON team_members;
CREATE POLICY "team_members_owner_write" ON team_members
  FOR ALL USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "filing_cabinet_tenant_insert" ON filing_cabinet;
CREATE POLICY "filing_cabinet_tenant_insert" ON filing_cabinet
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "filing_cabinet_role_read" ON filing_cabinet;
CREATE POLICY "filing_cabinet_role_read" ON filing_cabinet
  FOR SELECT USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "filing_cabinet_owner_delete" ON filing_cabinet;
CREATE POLICY "filing_cabinet_owner_delete" ON filing_cabinet
  FOR DELETE USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid() AND role = 'owner')
  );

-- 7. Helper Functions
-- ============================================
CREATE OR REPLACE FUNCTION get_user_tenant_role(p_user_id UUID, p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM user_businesses WHERE user_id = p_user_id AND business_id = p_tenant_id;
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;
  SELECT role INTO v_role FROM team_members WHERE user_id = p_user_id AND tenant_id = p_tenant_id AND is_active = true;
  RETURN COALESCE(v_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_property_health_score(p_property_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 100;
  v_asset RECORD;
  v_age_years NUMERIC;
BEGIN
  FOR v_asset IN SELECT * FROM assets WHERE property_id = p_property_id
  LOOP
    IF v_asset.install_date IS NOT NULL THEN
      v_age_years := EXTRACT(YEAR FROM AGE(NOW(), v_asset.install_date));
      IF v_age_years > 15 THEN v_score := v_score - 20;
      ELSIF v_age_years > 10 THEN v_score := v_score - 10;
      ELSIF v_age_years > 5 THEN v_score := v_score - 5;
      END IF;
    ELSE
      v_score := v_score - 10;
    END IF;
  END LOOP;
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! Now run 017.
