-- ============================================
-- MIGRATION 018: Performance Optimizations
-- Speed & query performance improvements
-- ============================================

-- 1. Composite indexes for common query patterns
-- ============================================

-- Properties: tenant + full_address search (most common query)
CREATE INDEX IF NOT EXISTS idx_properties_tenant_created ON properties(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_tenant_address ON properties(tenant_id, address_line1);

-- Contacts: fast phone lookup (critical for pre-greeting)
CREATE INDEX IF NOT EXISTS idx_contacts_phone_lookup ON contacts(tenant_id, phone_normalized, property_id);

-- Assets: property + type combo (Property Passport loads)
CREATE INDEX IF NOT EXISTS idx_assets_property_type ON assets(property_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_install_date ON assets(property_id, install_date) WHERE install_date IS NOT NULL;

-- Interactions: recent activity queries
CREATE INDEX IF NOT EXISTS idx_interactions_recent ON interactions(tenant_id, created_at DESC) INCLUDE (interaction_type, summary, sentiment_score);

-- Filing Cabinet: category + year combo (most filtered view)
CREATE INDEX IF NOT EXISTS idx_filing_tenant_cat_year ON filing_cabinet(tenant_id, category, tax_year) WHERE deleted_at IS NULL;

-- Referrals: active referrals by tenant
CREATE INDEX IF NOT EXISTS idx_referrals_active ON referrals(referring_tenant_id, status, created_at DESC);

-- Contractor directory: search by industry + rating
CREATE INDEX IF NOT EXISTS idx_contractor_industry_rating ON contractor_directory(tenant_id, industry, avg_rating DESC) WHERE is_active = true;

-- Audit logs: recent by tenant
CREATE INDEX IF NOT EXISTS idx_audit_recent ON audit_logs(tenant_id, created_at DESC);

-- 2. Materialized view for property dashboard stats
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_property_stats AS
SELECT
  p.tenant_id,
  COUNT(DISTINCT p.id) AS total_properties,
  COUNT(DISTINCT c.id) AS total_contacts,
  COUNT(DISTINCT a.id) AS total_assets,
  COUNT(DISTINCT i.id) AS total_interactions,
  COALESCE(SUM(p.lifetime_value), 0) AS total_lifetime_value,
  MAX(i.created_at) AS last_interaction_at
FROM properties p
LEFT JOIN contacts c ON c.property_id = p.id
LEFT JOIN assets a ON a.property_id = p.id
LEFT JOIN interactions i ON i.property_id = p.id
GROUP BY p.tenant_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_property_stats_tenant ON mv_property_stats(tenant_id);

-- Function to refresh stats (call periodically or after major changes)
CREATE OR REPLACE FUNCTION refresh_property_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_property_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Auto-update updated_at timestamps on new tables
-- ============================================
DO $$
BEGIN
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

-- 4. Auto-increment service counters on new interaction
-- ============================================
CREATE OR REPLACE FUNCTION update_property_service_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE properties SET
    last_service_date = CURRENT_DATE,
    total_service_count = total_service_count + 1,
    updated_at = NOW()
  WHERE id = NEW.property_id;

  -- Also update contact stats
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

DROP TRIGGER IF EXISTS trg_update_property_stats ON interactions;
CREATE TRIGGER trg_update_property_stats
  AFTER INSERT ON interactions
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

-- Done! Database optimized.
