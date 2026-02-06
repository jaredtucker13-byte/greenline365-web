-- ============================================
-- MIGRATION 018: Property Interactions + Optimizations
-- Creates the missing property service history table
-- and adds performance indexes
-- ============================================

-- 1. Create property_interactions (the 015e table that was skipped)
-- ============================================
CREATE TABLE IF NOT EXISTS property_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL,
  call_id TEXT,
  call_direction TEXT,
  call_duration_seconds INTEGER,
  call_recording_url TEXT,
  summary TEXT,
  transcript TEXT,
  sentiment TEXT,
  sentiment_score DECIMAL(3, 2),
  intent_detected TEXT,
  greeting_style TEXT,
  joke_id INTEGER,
  agent_type TEXT,
  agent_name TEXT,
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_prop_interactions_tenant ON property_interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prop_interactions_property ON property_interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_prop_interactions_contact ON property_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_prop_interactions_type ON property_interactions(tenant_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_prop_interactions_date ON property_interactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prop_interactions_call ON property_interactions(call_id);
CREATE INDEX IF NOT EXISTS idx_prop_interactions_recent ON property_interactions(tenant_id, created_at DESC) INCLUDE (interaction_type, summary, sentiment_score);

-- RLS
ALTER TABLE property_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_property_interactions" ON property_interactions;
CREATE POLICY "tenant_isolation_property_interactions" ON property_interactions
  FOR ALL USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "service_role_property_interactions" ON property_interactions;
CREATE POLICY "service_role_property_interactions" ON property_interactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON property_interactions TO authenticated;
GRANT ALL ON property_interactions TO service_role;

-- 2. Performance indexes on existing tables
-- ============================================
CREATE INDEX IF NOT EXISTS idx_properties_tenant_created ON properties(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_address ON properties(tenant_id, address_line1);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_lookup ON contacts(tenant_id, phone_normalized, property_id);
CREATE INDEX IF NOT EXISTS idx_assets_property_type ON assets(property_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_install_date ON assets(property_id, install_date) WHERE install_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_filing_tenant_cat_year ON filing_cabinet(tenant_id, category, tax_year) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_active ON referrals(referring_tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_industry_rating ON contractor_directory(tenant_id, industry, avg_rating DESC) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_recent ON audit_logs(tenant_id, created_at DESC);

-- 3. Auto-update triggers
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_property_interactions_updated_at') THEN
    CREATE TRIGGER update_property_interactions_updated_at BEFORE UPDATE ON property_interactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_members_updated_at') THEN
    CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_filing_cabinet_updated_at') THEN
    CREATE TRIGGER update_filing_cabinet_updated_at BEFORE UPDATE ON filing_cabinet
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contractor_directory_updated_at') THEN
    CREATE TRIGGER update_contractor_directory_updated_at BEFORE UPDATE ON contractor_directory
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_referrals_updated_at') THEN
    CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON referrals
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 4. Auto-update property stats when interaction is logged
-- ============================================
CREATE OR REPLACE FUNCTION update_property_service_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties SET
    last_service_date = CURRENT_DATE,
    total_service_count = total_service_count + 1,
    updated_at = NOW()
  WHERE id = NEW.property_id;

  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts SET
      last_contact_date = CURRENT_DATE,
      total_interactions = total_interactions + 1,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_property_stats ON property_interactions;
CREATE TRIGGER trg_update_property_stats
  AFTER INSERT ON property_interactions
  FOR EACH ROW
  WHEN (NEW.property_id IS NOT NULL)
  EXECUTE FUNCTION update_property_service_stats();

-- 5. Auto-update referral counters
-- ============================================
CREATE OR REPLACE FUNCTION update_referral_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    UPDATE contractor_directory SET
      total_referrals_completed = total_referrals_completed + 1,
      updated_at = NOW()
    WHERE id = NEW.referred_contractor_id;
  END IF;
  IF TG_OP = 'INSERT' THEN
    UPDATE contractor_directory SET
      total_referrals_received = total_referrals_received + 1,
      updated_at = NOW()
    WHERE id = NEW.referred_contractor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_referral_counters ON referrals;
CREATE TRIGGER trg_update_referral_counters
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION update_referral_counters();

-- Done!
