-- ============================================
-- SAFE: Add Remaining Tables (After Properties Exists)
-- Run this AFTER 015_safe_add_properties.sql succeeds
-- ============================================

-- 1. CONTACTS TABLE
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT,
  full_name TEXT,
  phone TEXT NOT NULL,
  phone_normalized TEXT,
  email TEXT,
  role TEXT DEFAULT 'owner',
  is_primary BOOLEAN DEFAULT false,
  preferred_contact_method TEXT DEFAULT 'phone',
  best_time_to_call TEXT,
  do_not_call BOOLEAN DEFAULT false,
  relationship_score INTEGER DEFAULT 50,
  total_interactions INTEGER DEFAULT 0,
  first_contact_date DATE,
  last_contact_date DATE,
  personal_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  external_crm_id TEXT,
  external_crm_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. ASSETS TABLE
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  install_date DATE,
  warranty_expiry DATE,
  expected_lifespan_years INTEGER,
  last_verified TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  confidence_score INTEGER DEFAULT 100,
  last_service_date DATE,
  total_service_count INTEGER DEFAULT 0,
  brand TEXT,
  model_number TEXT,
  serial_number TEXT,
  location_description TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 3. INTERACTIONS TABLE
CREATE TABLE IF NOT EXISTS interactions (
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
  created_by UUID REFERENCES auth.users(id)
);

-- 4. INDUSTRY_CONFIGS TABLE
CREATE TABLE IF NOT EXISTS industry_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  industry_type TEXT NOT NULL,
  industry_name TEXT NOT NULL,
  decay_logic JSONB NOT NULL DEFAULT '{"stale_years": 5, "unreliable_years": 10}'::jsonb,
  asset_metadata_schema JSONB NOT NULL DEFAULT '{"required": [], "optional": []}'::jsonb,
  verification_prompt TEXT,
  emergency_keywords TEXT[] DEFAULT '{}'::text[],
  agent_personality JSONB DEFAULT '{"formality_level": "friendly", "humor_enabled": true}'::jsonb,
  witty_hooks JSONB DEFAULT '[]'::jsonb,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. LOCATION_FLAVORS TABLE
CREATE TABLE IF NOT EXISTS location_flavors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL,
  region TEXT,
  states TEXT[] DEFAULT '{}',
  cities TEXT[] DEFAULT '{}',
  zip_codes TEXT[] DEFAULT '{}',
  climate_quirk TEXT,
  witty_hooks JSONB NOT NULL DEFAULT '[]'::jsonb,
  weather_phrases JSONB DEFAULT '{}'::jsonb,
  local_references JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CRM_SYNC_LOGS TABLE
CREATE TABLE IF NOT EXISTS crm_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  crm_provider TEXT NOT NULL,
  crm_entity_id TEXT,
  sync_direction TEXT NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB,
  response JSONB,
  error_message TEXT,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

SELECT 'All tables created successfully!' as status;
