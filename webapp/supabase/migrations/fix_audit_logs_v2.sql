-- ============================================================
-- FIX: audit_logs with CORRECT column names
-- Uses: tenant_id, created_at, actor_id
-- ============================================================

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Audit insert only" ON audit_logs;
DROP POLICY IF EXISTS "Users view own audits" ON audit_logs;
DROP POLICY IF EXISTS "Block audit updates" ON audit_logs;
DROP POLICY IF EXISTS "Block audit deletes" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs are append-only" ON audit_logs;
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Block audit log modifications" ON audit_logs;
DROP POLICY IF EXISTS "Block audit log deletions" ON audit_logs;

-- Create policies using actual column names
CREATE POLICY "Audit insert only" ON audit_logs 
  FOR INSERT TO authenticated, anon 
  WITH CHECK (true);

CREATE POLICY "Users view own audits" ON audit_logs 
  FOR SELECT TO authenticated 
  USING (tenant_id = auth.uid() OR actor_id = auth.uid());

-- Block modifications (append-only for SOC2)
CREATE POLICY "Block audit updates" ON audit_logs 
  FOR UPDATE TO authenticated 
  USING (false);

CREATE POLICY "Block audit deletes" ON audit_logs 
  FOR DELETE TO authenticated 
  USING (false);

-- Indexes using actual column names
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);

SELECT 'audit_logs RLS policies created successfully!' as result;
