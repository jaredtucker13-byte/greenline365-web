-- ============================================================
-- STEP 5: Create Social & Analytics tables
-- Run after step 4 succeeds
-- ============================================================

-- Social connections
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  account_id TEXT,
  account_name TEXT,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage social" ON social_connections;
CREATE POLICY "Users manage social" ON social_connections FOR ALL TO authenticated USING (user_id = auth.uid());

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  entity_type TEXT,
  entity_id UUID,
  source TEXT,
  value FLOAT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view analytics" ON analytics_events;
CREATE POLICY "Users view analytics" ON analytics_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow tracking" ON analytics_events;
CREATE POLICY "Allow tracking" ON analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

SELECT 'Social & Analytics tables created successfully!' as result;
