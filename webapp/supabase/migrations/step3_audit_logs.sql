-- ============================================================
-- STEP 3: Create ONLY the audit_logs table
-- This is the most important one for SOC2
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  session_id TEXT,
  action TEXT NOT NULL,
  action_category TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  description TEXT,
  changes JSONB,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success',
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 years'),
  is_sensitive BOOLEAN DEFAULT false,
  compliance_flags TEXT[] DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Audit insert only" ON audit_logs;
CREATE POLICY "Audit insert only" ON audit_logs FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Users view own audits" ON audit_logs;
CREATE POLICY "Users view own audits" ON audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, occurred_at DESC);

SELECT 'audit_logs table created successfully!' as result;
