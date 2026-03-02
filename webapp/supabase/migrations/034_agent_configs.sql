-- ============================================================
-- Migration 034: Agent Configs Table
-- ============================================================
-- Central control table for all cron/agentic workers.
-- Each agent checks this table before executing to determine
-- if it's active, what its schedule is, and stores run metadata.
-- ============================================================

CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT UNIQUE NOT NULL,  -- 'orchestrator', 'trend_scanner', 'weekly_digest'
  agent_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  schedule TEXT NOT NULL,  -- cron expression like '0 */3 * * *'
  research_topics JSONB DEFAULT '[]'::jsonb,
  last_run TIMESTAMPTZ,
  last_status TEXT DEFAULT 'pending',  -- 'success', 'failed', 'pending', 'disabled'
  last_duration_ms INTEGER,
  retention_days INTEGER DEFAULT 30,
  config JSONB DEFAULT '{}'::jsonb,  -- flexible config per agent
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed the 3 agents
INSERT INTO agent_configs (agent_id, agent_name, description, schedule) VALUES
('orchestrator', 'System Orchestrator', 'Health checks, email sending, deal expiration, log cleanup', '0 * * * *'),
('trend_scanner', 'Trend Scanner', 'AI-powered local trend scanning via Perplexity + Claude pipeline', '0 */3 * * *'),
('weekly_digest', 'Weekly Trend Digest', 'Compiles weekly trend summary and sends digest email', '0 9 * * 1')
ON CONFLICT (agent_id) DO NOTHING;

-- RLS
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "service_role_full_access_agent_configs"
  ON agent_configs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to read agent configs (for admin dashboards)
CREATE POLICY "authenticated_read_agent_configs"
  ON agent_configs FOR SELECT
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_agent_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agent_configs_updated_at
  BEFORE UPDATE ON agent_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_configs_updated_at();

-- ============================================================
-- Weekly Digests Table
-- ============================================================
-- Stores compiled weekly trend digest reports.
-- ============================================================

CREATE TABLE IF NOT EXISTS weekly_digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_trends INTEGER DEFAULT 0,
  by_category JSONB DEFAULT '[]'::jsonb,
  top_locations JSONB DEFAULT '[]'::jsonb,
  html_content TEXT,
  email_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE weekly_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access_weekly_digests"
  ON weekly_digests FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "authenticated_read_weekly_digests"
  ON weekly_digests FOR SELECT
  USING (auth.role() = 'authenticated');
