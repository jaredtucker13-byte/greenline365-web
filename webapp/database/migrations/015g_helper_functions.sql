-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 7: Helper Functions
-- Run this SEVENTH (after 015f)
-- ============================================

-- Function: Calculate confidence score
CREATE OR REPLACE FUNCTION calculate_confidence_score(
  p_install_date DATE,
  p_last_verified TIMESTAMPTZ,
  p_stale_years INTEGER DEFAULT 5,
  p_unreliable_years INTEGER DEFAULT 10
) RETURNS INTEGER AS $$
DECLARE
  v_age_years DECIMAL;
  v_days_since_verified DECIMAL;
  v_base_score INTEGER;
  v_verification_bonus INTEGER;
BEGIN
  IF p_install_date IS NULL THEN
    v_age_years := 0;
  ELSE
    v_age_years := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_install_date));
  END IF;
  
  IF v_age_years <= p_stale_years THEN
    v_base_score := 100 - (v_age_years::INTEGER * 5);
  ELSIF v_age_years <= p_unreliable_years THEN
    v_base_score := 75 - ((v_age_years - p_stale_years)::INTEGER * 10);
  ELSE
    v_base_score := 30 - ((v_age_years - p_unreliable_years)::INTEGER * 3);
  END IF;
  
  IF p_last_verified IS NOT NULL THEN
    v_days_since_verified := EXTRACT(DAY FROM (NOW() - p_last_verified));
    IF v_days_since_verified <= 30 THEN
      v_verification_bonus := 20;
    ELSIF v_days_since_verified <= 90 THEN
      v_verification_bonus := 10;
    ELSIF v_days_since_verified <= 365 THEN
      v_verification_bonus := 5;
    ELSE
      v_verification_bonus := 0;
    END IF;
  ELSE
    v_verification_bonus := 0;
  END IF;
  
  RETURN GREATEST(0, LEAST(100, v_base_score + v_verification_bonus));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Fuzzy search properties by address
CREATE OR REPLACE FUNCTION search_properties_fuzzy(
  p_tenant_id UUID,
  p_search_text TEXT,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  full_address TEXT,
  similarity_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_address,
    similarity(p.full_address, p_search_text) AS similarity_score
  FROM properties p
  WHERE p.tenant_id = p_tenant_id
    AND (p.full_address ILIKE '%' || p_search_text || '%' 
         OR similarity(p.full_address, p_search_text) > 0.1)
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get contact by phone
CREATE OR REPLACE FUNCTION get_contact_by_phone(
  p_tenant_id UUID,
  p_phone TEXT
) RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  property_id UUID,
  property_address TEXT,
  relationship_score INTEGER
) AS $$
DECLARE
  v_normalized_phone TEXT;
BEGIN
  v_normalized_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  RETURN QUERY
  SELECT 
    c.id AS contact_id,
    c.full_name AS contact_name,
    c.property_id,
    p.full_address AS property_address,
    c.relationship_score
  FROM contacts c
  LEFT JOIN properties p ON p.id = c.property_id
  WHERE c.tenant_id = p_tenant_id
    AND c.phone_normalized = v_normalized_phone;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers (skip if already exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_properties_updated_at') THEN
    CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_updated_at') THEN
    CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_assets_updated_at') THEN
    CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_interactions_updated_at') THEN
    CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
