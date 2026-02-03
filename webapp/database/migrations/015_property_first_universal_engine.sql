-- ============================================
-- PROPERTY-FIRST UNIVERSAL HOME SERVICE ENGINE
-- Migration 015: Core Schema for Multi-Tenant Property Intelligence
-- ============================================
-- This migration transforms the system from a flat customer model to a 
-- Property-First Relational Graph with:
-- - Properties (the anchor)
-- - Contacts (people linked to properties)
-- - Assets (polymorphic equipment with JSONB metadata)
-- - Interactions (call logs, repairs, service history)
-- - Industry Configs (per-tenant decay rules, prompts)
-- - Location Flavors (regional humor/climate quirks)
-- - CRM Sync Logs (async external CRM updates)
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- Fuzzy address matching
CREATE EXTENSION IF NOT EXISTS btree_gin; -- GIN index support

-- ============================================
-- 1. TENANTS TABLE (Enhanced)
-- ============================================
-- Extends existing businesses table with property-first features
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS service_area JSONB DEFAULT '{"cities": [], "zip_codes": [], "states": []}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS location_flavor_id UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry_config_id UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'simulation', 'bulk_load', 'live_sync', 'complete'));
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS crm_integration JSONB DEFAULT '{"provider": null, "api_key": null, "sync_enabled": false}'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS transfer_phone_number TEXT;

-- ============================================
-- 2. PROPERTIES TABLE (The Anchor)
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Address fields (normalized for fuzzy matching)
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  
  -- Computed full address for fuzzy search
  full_address TEXT GENERATED ALWAYS AS (
    COALESCE(address_line1, '') || ' ' || 
    COALESCE(address_line2, '') || ' ' ||
    COALESCE(city, '') || ', ' || 
    COALESCE(state, '') || ' ' || 
    COALESCE(zip_code, '')
  ) STORED,
  
  -- Property details
  gate_code TEXT,
  access_notes TEXT,
  property_type TEXT DEFAULT 'residential' CHECK (property_type IN ('residential', 'commercial', 'industrial', 'multi-unit')),
  unit_number TEXT,
  
  -- Geolocation (for routing/mapping)
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

-- Indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(tenant_id, zip_code);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(tenant_id, city);

-- GIN index for fuzzy address search
CREATE INDEX IF NOT EXISTS idx_properties_full_address_trgm ON properties USING gin (full_address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_address_trgm ON properties USING gin (address_line1 gin_trgm_ops);

-- RLS for properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for properties" ON properties
  FOR ALL
  USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to properties" ON properties
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON properties TO authenticated;
GRANT ALL ON properties TO service_role;

-- ============================================
-- 3. CONTACTS TABLE (The People)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  
  -- Contact info
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (
    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  ) STORED,
  
  phone TEXT NOT NULL,
  phone_normalized TEXT GENERATED ALWAYS AS (
    regexp_replace(phone, '[^0-9]', '', 'g')
  ) STORED,
  
  email TEXT,
  
  -- Role at the property
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'tenant', 'property_manager', 'emergency_contact', 'spouse', 'other')),
  is_primary BOOLEAN DEFAULT false,
  
  -- Communication preferences
  preferred_contact_method TEXT DEFAULT 'phone' CHECK (preferred_contact_method IN ('phone', 'sms', 'email')),
  best_time_to_call TEXT,
  do_not_call BOOLEAN DEFAULT false,
  
  -- Relationship scoring (CRS - Customer Relationship Score)
  relationship_score INTEGER DEFAULT 50 CHECK (relationship_score >= 0 AND relationship_score <= 100),
  total_interactions INTEGER DEFAULT 0,
  first_contact_date DATE,
  last_contact_date DATE,
  
  -- Personal details for rapport building
  personal_notes TEXT,  -- "Has a dog named Buster", "Prefers morning calls"
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  
  -- External CRM linking
  external_crm_id TEXT,
  external_crm_provider TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contacts_property ON contacts(property_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_normalized ON contacts(tenant_id, phone_normalized);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm ON contacts USING gin (full_name gin_trgm_ops);

-- RLS for contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for contacts" ON contacts
  FOR ALL
  USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to contacts" ON contacts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON contacts TO authenticated;
GRANT ALL ON contacts TO service_role;

-- ============================================
-- 4. ASSETS TABLE (Universal Polymorphic)
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Asset identification
  asset_type TEXT NOT NULL,  -- 'HVAC', 'Water Heater', 'Roof', 'Sprinkler', 'Security Panel', etc.
  
  -- JSONB for industry-specific metadata (polymorphic)
  -- Example for HVAC: {"brand": "Carrier", "tonnage": 4, "fuel_type": "gas", "seer_rating": 16}
  -- Example for Water Heater: {"brand": "Rheem", "gallons": 40, "fuel_type": "electric"}
  -- Example for Roof: {"material": "asphalt_shingle", "color": "gray", "last_permit_year": 2008}
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Lifecycle tracking
  install_date DATE,
  warranty_expiry DATE,
  expected_lifespan_years INTEGER,
  
  -- Verification & Data Decay
  last_verified TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  confidence_score INTEGER DEFAULT 100 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  
  -- Service history
  last_service_date DATE,
  total_service_count INTEGER DEFAULT 0,
  
  -- Model/Serial (common across all asset types)
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  
  -- Location within property
  location_description TEXT,  -- "Backyard", "Attic", "Garage", "Basement"
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'replaced', 'removed', 'unknown')),
  
  -- Notes
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for assets
CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_property ON assets(property_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(tenant_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_brand ON assets(tenant_id, brand);
CREATE INDEX IF NOT EXISTS idx_assets_metadata ON assets USING gin (metadata);

-- RLS for assets
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for assets" ON assets
  FOR ALL
  USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to assets" ON assets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON assets TO authenticated;
GRANT ALL ON assets TO service_role;

-- ============================================
-- 5. INTERACTIONS TABLE (The Memory)
-- ============================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  
  -- Interaction type
  interaction_type TEXT NOT NULL CHECK (interaction_type IN (
    'call', 'sms', 'email', 'repair', 'installation', 
    'quote', 'followup', 'complaint', 'review', 'referral'
  )),
  
  -- Call-specific fields
  call_id TEXT,  -- External call ID (Retell, Twilio)
  call_direction TEXT CHECK (call_direction IN ('inbound', 'outbound')),
  call_duration_seconds INTEGER,
  call_recording_url TEXT,
  
  -- Content
  summary TEXT,
  transcript TEXT,
  
  -- AI Analysis
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3, 2),  -- -1.00 to 1.00
  intent_detected TEXT,
  
  -- Witty Hooks Tracking (to prevent repetition)
  greeting_style TEXT,  -- 'formal', 'casual', 'vip'
  joke_id INTEGER,  -- Which witty hook was used
  
  -- Agent info
  agent_type TEXT,  -- 'receptionist', 'sales', 'customer_service'
  agent_name TEXT,
  
  -- Outcome
  outcome TEXT,  -- 'booked', 'callback', 'transferred', 'resolved', 'escalated'
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_tenant ON interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interactions_property ON interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(tenant_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_call_id ON interactions(call_id);

-- RLS for interactions
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for interactions" ON interactions
  FOR ALL
  USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to interactions" ON interactions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON interactions TO authenticated;
GRANT ALL ON interactions TO service_role;

-- ============================================
-- 6. INDUSTRY_CONFIGS TABLE (Per-Tenant Rules)
-- ============================================
CREATE TABLE IF NOT EXISTS industry_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Industry identification
  industry_type TEXT NOT NULL,  -- 'hvac', 'plumbing', 'roofing', 'lawn_care', 'security', 'electrical'
  industry_name TEXT NOT NULL,
  
  -- Data Decay Logic
  decay_logic JSONB NOT NULL DEFAULT '{
    "stale_years": 5,
    "unreliable_years": 10
  }'::jsonb,
  
  -- Asset metadata schema (what fields are required/optional for this industry)
  asset_metadata_schema JSONB NOT NULL DEFAULT '{
    "required": [],
    "optional": []
  }'::jsonb,
  
  -- Verification prompts
  verification_prompt TEXT,
  
  -- Emergency keywords that trigger transfer
  emergency_keywords TEXT[] DEFAULT '{}'::text[],
  
  -- Agent personality settings
  agent_personality JSONB DEFAULT '{
    "formality_level": "friendly",
    "humor_enabled": true,
    "local_flavor_enabled": true
  }'::jsonb,
  
  -- Witty hooks pool for this industry
  witty_hooks JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for industry_configs
CREATE INDEX IF NOT EXISTS idx_industry_configs_tenant ON industry_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_industry_configs_type ON industry_configs(industry_type);
CREATE INDEX IF NOT EXISTS idx_industry_configs_default ON industry_configs(is_default) WHERE is_default = true;

-- RLS for industry_configs
ALTER TABLE industry_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for industry_configs" ON industry_configs
  FOR ALL
  USING (
    tenant_id IS NULL OR  -- Default configs visible to all
    tenant_id IN (SELECT business_id FROM user_businesses WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access to industry_configs" ON industry_configs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON industry_configs TO authenticated;
GRANT ALL ON industry_configs TO service_role;

-- ============================================
-- 7. LOCATION_FLAVORS TABLE (Regional Humor)
-- ============================================
CREATE TABLE IF NOT EXISTS location_flavors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Location identification
  location_name TEXT NOT NULL,  -- 'Tampa, FL', 'Phoenix, AZ'
  region TEXT,  -- 'Southeast', 'Southwest'
  states TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  zip_codes TEXT[] DEFAULT '{}',
  
  -- Climate quirks for humor
  climate_quirk TEXT,  -- "Humidity / Wet Blanket", "Dry Heat / The Oven"
  
  -- Witty hooks for this location
  witty_hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Weather-related phrases
  weather_phrases JSONB DEFAULT '{}'::jsonb,
  
  -- Local references
  local_references JSONB DEFAULT '{}'::jsonb,  -- Local landmarks, sports teams, etc.
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for location_flavors
CREATE INDEX IF NOT EXISTS idx_location_flavors_name ON location_flavors(location_name);
CREATE INDEX IF NOT EXISTS idx_location_flavors_states ON location_flavors USING gin (states);
CREATE INDEX IF NOT EXISTS idx_location_flavors_cities ON location_flavors USING gin (cities);

GRANT ALL ON location_flavors TO authenticated;
GRANT ALL ON location_flavors TO service_role;

-- ============================================
-- 8. CRM_SYNC_LOGS TABLE (Async CRM Updates)
-- ============================================
CREATE TABLE IF NOT EXISTS crm_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- What was synced
  entity_type TEXT NOT NULL CHECK (entity_type IN ('contact', 'property', 'asset', 'interaction', 'booking')),
  entity_id UUID NOT NULL,
  
  -- CRM details
  crm_provider TEXT NOT NULL,  -- 'highlevel', 'hubspot', 'salesforce', 'jobber'
  crm_entity_id TEXT,
  
  -- Sync details
  sync_direction TEXT NOT NULL CHECK (sync_direction IN ('outbound', 'inbound')),
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'processing', 'success', 'failed', 'skipped')),
  
  -- Payload
  payload JSONB,
  response JSONB,
  error_message TEXT,
  
  -- Retry tracking
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes for crm_sync_logs
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_tenant ON crm_sync_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_status ON crm_sync_logs(sync_status) WHERE sync_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_crm_sync_logs_entity ON crm_sync_logs(entity_type, entity_id);

-- RLS for crm_sync_logs
ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for crm_sync_logs" ON crm_sync_logs
  FOR ALL
  USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role full access to crm_sync_logs" ON crm_sync_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

GRANT ALL ON crm_sync_logs TO authenticated;
GRANT ALL ON crm_sync_logs TO service_role;

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function: Calculate confidence score based on asset age and last verification
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
  -- Calculate asset age in years
  IF p_install_date IS NULL THEN
    v_age_years := 0;
  ELSE
    v_age_years := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_install_date));
  END IF;
  
  -- Base score: Start at 100, decrease with age
  IF v_age_years <= p_stale_years THEN
    v_base_score := 100 - (v_age_years::INTEGER * 5);  -- -5 per year up to stale
  ELSIF v_age_years <= p_unreliable_years THEN
    v_base_score := 75 - ((v_age_years - p_stale_years)::INTEGER * 10);  -- -10 per year after stale
  ELSE
    v_base_score := 30 - ((v_age_years - p_unreliable_years)::INTEGER * 3);  -- -3 per year after unreliable
  END IF;
  
  -- Verification bonus: Recent verification boosts confidence
  IF p_last_verified IS NOT NULL THEN
    v_days_since_verified := EXTRACT(DAY FROM (NOW() - p_last_verified));
    IF v_days_since_verified <= 30 THEN
      v_verification_bonus := 20;  -- Verified within 30 days
    ELSIF v_days_since_verified <= 90 THEN
      v_verification_bonus := 10;  -- Verified within 90 days
    ELSIF v_days_since_verified <= 365 THEN
      v_verification_bonus := 5;   -- Verified within a year
    ELSE
      v_verification_bonus := 0;
    END IF;
  ELSE
    v_verification_bonus := 0;
  END IF;
  
  -- Return score clamped between 0 and 100
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
    AND p.full_address % p_search_text  -- pg_trgm similarity operator
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get contact by phone (normalized)
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
  -- Normalize phone number
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

-- Function: Calculate Customer Relationship Score (CRS)
CREATE OR REPLACE FUNCTION calculate_relationship_score(
  p_contact_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 50;  -- Base score
  v_interaction_count INTEGER;
  v_months_since_first_contact INTEGER;
  v_avg_sentiment DECIMAL;
  v_booking_count INTEGER;
BEGIN
  -- Get interaction count (+10 for frequent callers, up to +20)
  SELECT COUNT(*) INTO v_interaction_count
  FROM interactions WHERE contact_id = p_contact_id;
  v_score := v_score + LEAST(20, v_interaction_count * 2);
  
  -- Get longevity bonus (+15 for long-term customers)
  SELECT EXTRACT(MONTH FROM AGE(NOW(), first_contact_date))::INTEGER INTO v_months_since_first_contact
  FROM contacts WHERE id = p_contact_id;
  IF v_months_since_first_contact IS NOT NULL THEN
    v_score := v_score + LEAST(15, v_months_since_first_contact / 6);  -- +1 per 6 months, up to +15
  END IF;
  
  -- Get sentiment bonus/penalty (+/- 10)
  SELECT AVG(sentiment_score) INTO v_avg_sentiment
  FROM interactions WHERE contact_id = p_contact_id AND sentiment_score IS NOT NULL;
  IF v_avg_sentiment IS NOT NULL THEN
    v_score := v_score + (v_avg_sentiment * 10)::INTEGER;
  END IF;
  
  -- Get booking reliability bonus (+10 for customers who show up)
  SELECT COUNT(*) INTO v_booking_count
  FROM bookings b
  JOIN contacts c ON c.phone_normalized = regexp_replace(b.phone, '[^0-9]', '', 'g')
  WHERE c.id = p_contact_id AND b.status = 'completed';
  v_score := v_score + LEAST(10, v_booking_count * 2);
  
  -- Clamp between 0 and 100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Update asset confidence scores (called by cron job)
CREATE OR REPLACE FUNCTION update_asset_confidence_scores() RETURNS void AS $$
BEGIN
  UPDATE assets a
  SET confidence_score = calculate_confidence_score(
    a.install_date,
    a.last_verified,
    COALESCE((ic.decay_logic->>'stale_years')::INTEGER, 5),
    COALESCE((ic.decay_logic->>'unreliable_years')::INTEGER, 10)
  )
  FROM industry_configs ic
  WHERE ic.tenant_id = a.tenant_id
    AND ic.industry_type = LOWER(a.asset_type);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. TRIGGERS
-- ============================================

-- Trigger: Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interactions_updated_at BEFORE UPDATE ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_industry_configs_updated_at BEFORE UPDATE ON industry_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update property stats after interaction
CREATE OR REPLACE FUNCTION update_property_stats_on_interaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.property_id IS NOT NULL THEN
    UPDATE properties SET
      last_service_date = CURRENT_DATE,
      total_service_count = total_service_count + 1,
      updated_at = NOW()
    WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_property_stats AFTER INSERT ON interactions
  FOR EACH ROW
  WHEN (NEW.interaction_type IN ('repair', 'installation'))
  EXECUTE FUNCTION update_property_stats_on_interaction();

-- Trigger: Auto-update contact stats after interaction
CREATE OR REPLACE FUNCTION update_contact_stats_on_interaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    UPDATE contacts SET
      last_contact_date = CURRENT_DATE,
      total_interactions = total_interactions + 1,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_contact_stats AFTER INSERT ON interactions
  FOR EACH ROW EXECUTE FUNCTION update_contact_stats_on_interaction();

-- ============================================
-- 11. SEED DATA: INDUSTRY CONFIGS
-- ============================================

INSERT INTO industry_configs (industry_type, industry_name, decay_logic, asset_metadata_schema, verification_prompt, emergency_keywords, is_default) VALUES
(
  'hvac',
  'HVAC / Air Conditioning',
  '{"stale_years": 8, "unreliable_years": 15}'::jsonb,
  '{"required": ["brand", "tonnage", "fuel_type"], "optional": ["seer_rating", "filter_size"]}'::jsonb,
  'I see we have a {{brand}} unit on file from {{install_year}}. Is that still the system we''re looking at today?',
  ARRAY['no air', 'no heat', 'smoke', 'burning smell', 'gas leak', 'carbon monoxide'],
  true
),
(
  'plumbing',
  'Plumbing',
  '{"stale_years": 8, "unreliable_years": 12}'::jsonb,
  '{"required": ["brand", "gallons", "fuel_type"], "optional": ["warranty_expiry"]}'::jsonb,
  'Our records show a {{brand}} water heater from {{install_year}}. Is that still the unit giving you trouble today?',
  ARRAY['flooding', 'burst pipe', 'sewage', 'no water', 'gas smell'],
  true
),
(
  'roofing',
  'Roofing',
  '{"stale_years": 15, "unreliable_years": 25}'::jsonb,
  '{"required": ["material", "color"], "optional": ["last_permit_year", "warranty_expiry"]}'::jsonb,
  'I see the last roof permit was from {{install_year}}. Have you had a full replacement since then, or are we looking at a repair?',
  ARRAY['leak', 'storm damage', 'tree fell', 'hole in roof'],
  true
),
(
  'lawn_care',
  'Lawn Care / Irrigation',
  '{"stale_years": 2, "unreliable_years": 5}'::jsonb,
  '{"required": ["zone_count"], "optional": ["controller_brand", "spray_head_count"]}'::jsonb,
  'We have you down for {{zone_count}} zones from our last visit. Have you added any landscaping or zones since then?',
  ARRAY['broken main', 'flooding', 'no water pressure'],
  true
),
(
  'security',
  'Home Security',
  '{"stale_years": 5, "unreliable_years": 8}'::jsonb,
  '{"required": ["panel_brand", "panel_type"], "optional": ["sensor_count", "camera_count"]}'::jsonb,
  'I see you''re on the {{panel_brand}} system. Have you upgraded to a newer panel since then?',
  ARRAY['break in', 'alarm going off', 'intruder', 'fire alarm'],
  true
),
(
  'electrical',
  'Electrical',
  '{"stale_years": 10, "unreliable_years": 25}'::jsonb,
  '{"required": ["panel_amps"], "optional": ["panel_brand", "last_inspection_year"]}'::jsonb,
  'Our records show a {{panel_amps}} amp panel. Is that still the current setup?',
  ARRAY['sparks', 'burning smell', 'no power', 'electrical fire', 'shock'],
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. SEED DATA: LOCATION FLAVORS
-- ============================================

INSERT INTO location_flavors (location_name, region, states, cities, climate_quirk, witty_hooks) VALUES
(
  'Tampa, FL',
  'Southeast',
  ARRAY['FL'],
  ARRAY['Tampa', 'St. Petersburg', 'Clearwater', 'Brandon'],
  'Humidity / "Wet Blanket"',
  '[
    "I know that humidity feels like wearing a warm, wet blanket! Luckily, I live in a server room kept at a crisp 68 degrees, or my circuits would be as fried as a grouper sandwich.",
    "Oh my goodness, that Florida humidity is no joke! It''s the kind of heat that makes you want to move into your refrigerator.",
    "I''d come help you myself, but I''m an AI—I don''t have skin to sweat, just code to run in the cloud!"
  ]'::jsonb
),
(
  'Phoenix, AZ',
  'Southwest',
  ARRAY['AZ'],
  ARRAY['Phoenix', 'Scottsdale', 'Mesa', 'Tempe', 'Chandler'],
  'Dry Heat / "The Oven"',
  '[
    "I hear it''s a ''dry heat'' out there, but so is an oven! I''d come help you myself, but I''m an AI—I don''t have skin to tan, just code to run.",
    "Phoenix summers are like living inside a convection oven. Good thing I''m made of silicon and not wax!",
    "They say you can fry an egg on the sidewalk there. I''m just glad I live in a nice, cool data center!"
  ]'::jsonb
),
(
  'Denver, CO',
  'Mountain',
  ARRAY['CO'],
  ARRAY['Denver', 'Aurora', 'Lakewood', 'Boulder', 'Fort Collins'],
  'Thin Air / "Mile High"',
  '[
    "That mountain air is beautiful, but it sure makes the furnace work for its living! I''m just an AI, so I don''t get winded, but I''ll make sure a human tech gets there to help you breathe easy.",
    "A mile high and temperatures can drop fast! Good thing I don''t need a jacket—just a stable internet connection.",
    "I hear the altitude takes some getting used to. Luckily, my processing power works just the same at any elevation!"
  ]'::jsonb
),
(
  'Dallas, TX',
  'South Central',
  ARRAY['TX'],
  ARRAY['Dallas', 'Fort Worth', 'Arlington', 'Plano', 'Irving'],
  'Summer Heat / "The Griddle"',
  '[
    "Everything is bigger in Texas, including that electric bill when the AC quits! My program says it''s a scorcher today—good thing I''m made of silicon and not wax!",
    "Texas heat doesn''t mess around. I''d offer to fan you, but I''m just a bunch of ones and zeros!",
    "They say Texans are tough, but even the toughest need a working AC. Let''s get you fixed up!"
  ]'::jsonb
),
(
  'Miami, FL',
  'Southeast',
  ARRAY['FL'],
  ARRAY['Miami', 'Miami Beach', 'Hialeah', 'Fort Lauderdale', 'Coral Gables'],
  'Tropical Heat / "Paradise Problems"',
  '[
    "Miami heat is legendary—it''s the kind that makes your AC work overtime! Good thing I live in the cloud where it''s always 72 degrees.",
    "Living in paradise has its challenges, especially when the AC decides to take a vacation too!",
    "I don''t need sunscreen or a cafecito, but I''ll make sure your home stays cool enough for both!"
  ]'::jsonb
)
ON CONFLICT DO NOTHING;

-- ============================================
-- 13. ADD FOREIGN KEY REFERENCES TO BUSINESSES
-- ============================================

-- Add FK for location_flavor_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_location_flavor_id_fkey'
  ) THEN
    ALTER TABLE businesses 
    ADD CONSTRAINT businesses_location_flavor_id_fkey 
    FOREIGN KEY (location_flavor_id) REFERENCES location_flavors(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add FK for industry_config_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_industry_config_id_fkey'
  ) THEN
    ALTER TABLE businesses 
    ADD CONSTRAINT businesses_industry_config_id_fkey 
    FOREIGN KEY (industry_config_id) REFERENCES industry_configs(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Summary of what was created:
-- 1. Extended businesses table with property-first fields
-- 2. properties table (the anchor) with fuzzy address search
-- 3. contacts table (the people) with phone normalization
-- 4. assets table (polymorphic) with JSONB metadata
-- 5. interactions table (the memory) with sentiment tracking
-- 6. industry_configs table (per-tenant rules)
-- 7. location_flavors table (regional humor)
-- 8. crm_sync_logs table (async CRM updates)
-- 9. Helper functions for confidence scoring, fuzzy search, CRS
-- 10. Triggers for auto-updating stats
-- 11. Seed data for industries and locations
--
-- Next: Create the Pre-Greeting Edge Function
