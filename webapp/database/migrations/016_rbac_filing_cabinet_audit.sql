-- ============================================
-- MIGRATION 016: RBAC, Filing Cabinet & Audit Logs
-- SAFE-WAY: Creates if not exists, skips if exists
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Enhanced Profiles with RBAC Roles
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'tenant_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tenant_role TEXT DEFAULT 'owner' 
      CHECK (tenant_role IN ('owner', 'manager', 'tech', 'guest'));
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
END $$;

-- 2. Team Members Table
-- ============================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'tech' CHECK (role IN ('owner', 'manager', 'tech', 'guest')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_team_members_tenant ON team_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);

-- 3. Filing Cabinet Table
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
  category TEXT NOT NULL DEFAULT 'general' 
    CHECK (category IN ('receipt', 'warranty', 'contract', 'invoice', 'tax_document', 'job_photo', 'insurance', 'permit', 'general')),
  subcategory TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  tax_year INTEGER,
  job_id TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  uploaded_by_role TEXT NOT NULL DEFAULT 'owner',
  visibility TEXT NOT NULL DEFAULT 'owner_only' 
    CHECK (visibility IN ('owner_only', 'manager_up', 'all_staff', 'public')),
  ai_extracted_data JSONB DEFAULT '{}'::jsonb,
  ai_processed BOOLEAN DEFAULT false,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_filing_cabinet_tenant ON filing_cabinet(tenant_id);
CREATE INDEX IF NOT EXISTS idx_filing_cabinet_property ON filing_cabinet(property_id);
CREATE INDEX IF NOT EXISTS idx_filing_cabinet_category ON filing_cabinet(tenant_id, category);
CREATE INDEX IF NOT EXISTS idx_filing_cabinet_tax_year ON filing_cabinet(tenant_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_filing_cabinet_uploaded_by ON filing_cabinet(uploaded_by);

-- 4. Audit Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(tenant_id, created_at DESC);

-- 5. Enable RLS
-- ============================================
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_cabinet ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (Safe: drop if exists, then create)
-- ============================================

-- Team Members
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

-- Filing Cabinet: INSERT (anyone in tenant can upload)
DROP POLICY IF EXISTS "filing_cabinet_tenant_insert" ON filing_cabinet;
CREATE POLICY "filing_cabinet_tenant_insert" ON filing_cabinet
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

-- Filing Cabinet: SELECT (owners/managers see all, techs see own recent only)
DROP POLICY IF EXISTS "filing_cabinet_role_read" ON filing_cabinet;
CREATE POLICY "filing_cabinet_role_read" ON filing_cabinet
  FOR SELECT USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
    AND (
      EXISTS (
        SELECT 1 FROM team_members 
        WHERE team_members.user_id = auth.uid() 
        AND team_members.tenant_id = filing_cabinet.tenant_id
        AND team_members.role IN ('owner', 'manager')
      )
      OR (uploaded_by = auth.uid() AND created_at > NOW() - INTERVAL '5 minutes')
      OR EXISTS (
        SELECT 1 FROM user_businesses 
        WHERE user_id = auth.uid() 
        AND business_id = filing_cabinet.tenant_id
        AND role = 'owner'
      )
    )
  );

-- Filing Cabinet: DELETE (owners only)
DROP POLICY IF EXISTS "filing_cabinet_owner_delete" ON filing_cabinet;
CREATE POLICY "filing_cabinet_owner_delete" ON filing_cabinet
  FOR DELETE USING (
    tenant_id IN (
      SELECT business_id FROM user_businesses 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Audit Logs: Read
DROP POLICY IF EXISTS "audit_logs_read" ON audit_logs;
CREATE POLICY "audit_logs_read" ON audit_logs
  FOR SELECT USING (
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

-- Audit Logs: Insert (always allowed for system logging)
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- 7. Helper Functions
-- ============================================

CREATE OR REPLACE FUNCTION get_user_tenant_role(p_user_id UUID, p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM user_businesses
  WHERE user_id = p_user_id AND business_id = p_tenant_id;
  IF v_role IS NOT NULL THEN RETURN v_role; END IF;

  SELECT role INTO v_role
  FROM team_members
  WHERE user_id = p_user_id AND tenant_id = p_tenant_id AND is_active = true;

  RETURN COALESCE(v_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_audit_event(
  p_tenant_id UUID, p_user_id UUID, p_action TEXT, p_entity_type TEXT,
  p_entity_id TEXT DEFAULT NULL, p_description TEXT DEFAULT NULL,
  p_old_value JSONB DEFAULT NULL, p_new_value JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_email TEXT;
  v_role TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  v_role := get_user_tenant_role(p_user_id, p_tenant_id);
  INSERT INTO audit_logs (tenant_id, user_id, user_email, user_role, action, entity_type, entity_id, description, old_value, new_value, severity)
  VALUES (p_tenant_id, p_user_id, v_email, v_role, p_action, p_entity_type, p_entity_id, p_description, p_old_value, p_new_value, p_severity)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_property_health_score(p_property_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 100;
  v_asset RECORD;
  v_age_years NUMERIC;
  v_last_service_days INTEGER;
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
    IF v_asset.confidence_score IS NOT NULL AND v_asset.confidence_score < 50 THEN
      v_score := v_score - 10;
    END IF;
  END LOOP;

  SELECT EXTRACT(DAY FROM AGE(NOW(), MAX(created_at)))::INTEGER
  INTO v_last_service_days FROM interactions WHERE property_id = p_property_id;

  IF v_last_service_days IS NULL THEN v_score := v_score - 15;
  ELSIF v_last_service_days > 365 THEN v_score := v_score - 10;
  ELSIF v_last_service_days > 180 THEN v_score := v_score - 5;
  END IF;

  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Done! Run 017 next.
