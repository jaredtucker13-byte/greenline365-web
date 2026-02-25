-- ============================================
-- PRODUCTION OPS TABLES
-- Migration 027: Migration tracker, feature registry, system health
-- These tables power the agentic orchestrator worker
-- ============================================

-- ============================================
-- MIGRATION TRACKER
-- Records every migration that has been applied.
-- The runner checks this before executing anything.
-- ============================================
CREATE TABLE IF NOT EXISTS _migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL, -- MD5 hash of the SQL content at time of execution
  source_dir TEXT NOT NULL DEFAULT 'database/migrations', -- Which directory it came from
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by TEXT DEFAULT 'system', -- 'system' = runner, 'manual' = pasted into SQL editor
  duration_ms INTEGER, -- How long the migration took
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  rolled_back_at TIMESTAMPTZ -- If this migration was reversed
);

CREATE INDEX IF NOT EXISTS idx_migrations_filename ON _migrations(filename);
CREATE INDEX IF NOT EXISTS idx_migrations_applied ON _migrations(applied_at DESC);

-- ============================================
-- FEATURE REGISTRY
-- Controls which features are active per business type / pricing tier.
-- The app checks this at runtime. No redeploy needed to toggle features.
-- ============================================
CREATE TABLE IF NOT EXISTS feature_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key TEXT NOT NULL, -- e.g. 'blast_deals', 'content_forge', 'booking_system'
  feature_name TEXT NOT NULL, -- Human-readable: "Blast Deals", "Content Forge"
  description TEXT,

  -- Who gets this feature
  pricing_tiers TEXT[] DEFAULT '{}', -- e.g. {'operator', 'commander', 'sovereign'}
  business_types TEXT[] DEFAULT '{}', -- e.g. {'retail', 'food', 'beauty'} or empty = all types

  -- Feature state
  enabled BOOLEAN DEFAULT true,
  rollout_percent INTEGER DEFAULT 100 CHECK (rollout_percent >= 0 AND rollout_percent <= 100),

  -- Metadata
  category TEXT, -- 'core', 'ai', 'marketing', 'operations', 'analytics'
  requires_setup BOOLEAN DEFAULT false, -- Does the owner need to configure something first?
  setup_route TEXT, -- e.g. '/admin-v2/settings/blast-deals'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(feature_key)
);

-- Seed the feature registry with GL365 features
INSERT INTO feature_registry (feature_key, feature_name, description, pricing_tiers, business_types, category) VALUES
  ('directory_listing', 'Directory Listing', 'Business listing in GL365 directory', '{operator,commander,sovereign}', '{}', 'core'),
  ('content_forge', 'Content Forge', 'AI-powered content creation engine', '{operator,commander,sovereign}', '{}', 'ai'),
  ('blast_deals', 'Blast Deals', 'QR code flash promotions via Local Pulse', '{operator,commander,sovereign}', '{retail,food,beauty,fitness,entertainment}', 'marketing'),
  ('local_pulse', 'Local Pulse', 'AI trend scanning and deal suggestions', '{operator,commander,sovereign}', '{retail,food,beauty,fitness,entertainment}', 'ai'),
  ('brain_system', 'Business Brain', 'AI knowledge base and brand voice', '{commander,sovereign}', '{}', 'ai'),
  ('booking_system', 'Booking System', 'Full appointment and scheduling engine', '{commander,sovereign}', '{}', 'operations'),
  ('crm', 'CRM', 'Customer relationship management', '{commander,sovereign}', '{}', 'operations'),
  ('realfeel', 'RealFeel Analytics', 'Customer sentiment and reputation tracking', '{commander,sovereign}', '{}', 'analytics'),
  ('filing_cabinet', 'Filing Cabinet', 'Document storage and management', '{commander,sovereign}', '{}', 'operations'),
  ('creative_studio', 'Creative Studio', 'Design workflow and asset management', '{sovereign}', '{}', 'ai'),
  ('white_label', 'White Label Portal', 'Custom-branded client portal', '{sovereign}', '{}', 'core'),
  ('voice_ai', 'Voice AI', 'AI phone agent (Retell)', '{sovereign}', '{}', 'ai'),
  ('sms_campaigns', 'SMS Campaigns', 'Text message marketing (Twilio)', '{commander,sovereign}', '{}', 'marketing'),
  ('email_campaigns', 'Email Campaigns', 'Email marketing automation', '{operator,commander,sovereign}', '{}', 'marketing')
ON CONFLICT (feature_key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_feature_registry_key ON feature_registry(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_registry_tiers ON feature_registry USING GIN(pricing_tiers);
CREATE INDEX IF NOT EXISTS idx_feature_registry_types ON feature_registry USING GIN(business_types);

ALTER TABLE feature_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read features" ON feature_registry
  FOR SELECT USING (true);

CREATE POLICY "Service can manage features" ON feature_registry
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- SYSTEM HEALTH LOG
-- The orchestrator worker writes health check results here.
-- Queryable history of system state over time.
-- ============================================
CREATE TABLE IF NOT EXISTS _system_health_log (
  id SERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  overall_status TEXT NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'down')),

  -- Individual service checks
  checks JSONB NOT NULL DEFAULT '{}',
  -- Example: {
  --   "supabase": { "status": "healthy", "latency_ms": 45 },
  --   "openrouter": { "status": "healthy", "latency_ms": 200 },
  --   "stripe": { "status": "degraded", "error": "timeout" },
  --   "sendgrid": { "status": "healthy", "latency_ms": 100 }
  -- }

  -- Seed data validation
  seed_status JSONB DEFAULT '{}',
  -- Example: {
  --   "email_templates": { "expected": 2, "found": 2, "ok": true },
  --   "industries": { "expected": 11, "found": 11, "ok": true },
  --   "feature_registry": { "expected": 14, "found": 14, "ok": true }
  -- }

  -- Migration status
  migration_status JSONB DEFAULT '{}',
  -- Example: {
  --   "total_files": 48,
  --   "applied": 45,
  --   "pending": ["026_blast_deals.sql", "027_ops_tables.sql", "028_new.sql"],
  --   "ok": false
  -- }

  -- Actions taken by the orchestrator
  actions_taken JSONB DEFAULT '[]',
  -- Example: [
  --   { "action": "ran_migration", "target": "027_ops_tables.sql", "result": "success" },
  --   { "action": "seeded_data", "target": "email_templates", "result": "success" }
  -- ]

  -- Environment
  environment TEXT DEFAULT 'production',
  git_sha TEXT,
  deploy_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_health_log_checked ON _system_health_log(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_log_status ON _system_health_log(overall_status);

-- Keep only last 30 days of health logs (cleanup via orchestrator)
-- No RLS needed — this is internal system data accessed via service role only

-- ============================================
-- REQUIRED SEED DATA MANIFEST
-- Tells the seed validator what MUST exist in the database.
-- The orchestrator checks this and auto-seeds if missing.
-- ============================================
CREATE TABLE IF NOT EXISTS _required_seeds (
  id SERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  description TEXT,
  min_rows INTEGER NOT NULL DEFAULT 1, -- Minimum expected rows
  check_query TEXT NOT NULL, -- SQL that returns a count
  seed_query TEXT, -- SQL to run if check fails (auto-heal)
  is_critical BOOLEAN DEFAULT true, -- If true, system is "degraded" without it
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Register required seed data
INSERT INTO _required_seeds (table_name, description, min_rows, check_query, seed_query, is_critical) VALUES
(
  'deal_email_templates',
  'Deal distribution + post-purchase thank-you email templates',
  2,
  'SELECT count(*) FROM deal_email_templates',
  NULL, -- Too complex to auto-seed, flag for manual action
  true
),
(
  'feature_registry',
  'Feature flags for all GL365 modules',
  10,
  'SELECT count(*) FROM feature_registry',
  NULL,
  true
)
ON CONFLICT DO NOTHING;

-- ============================================
-- SUCCESS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '=== Production Ops tables created ===';
  RAISE NOTICE '  _migrations — tracks every migration applied';
  RAISE NOTICE '  feature_registry — runtime feature flags per tier/type';
  RAISE NOTICE '  _system_health_log — health check history';
  RAISE NOTICE '  _required_seeds — seed data manifest for validation';
  RAISE NOTICE '  14 features seeded into registry';
END $$;
