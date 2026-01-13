-- ============================================================
-- FIX: audit_logs uses tenant_id, not user_id
-- Run this to fix the RLS policies
-- ============================================================

-- Enable RLS (if not already)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Audit insert only" ON audit_logs;
DROP POLICY IF EXISTS "Users view own audits" ON audit_logs;
DROP POLICY IF EXISTS "Block audit updates" ON audit_logs;
DROP POLICY IF EXISTS "Block audit deletes" ON audit_logs;

-- Create policies using tenant_id (the actual column name)
CREATE POLICY "Audit insert only" ON audit_logs 
  FOR INSERT TO authenticated, anon 
  WITH CHECK (true);

CREATE POLICY "Users view own audits" ON audit_logs 
  FOR SELECT TO authenticated 
  USING (tenant_id = auth.uid());

-- Block modifications (append-only for SOC2)
CREATE POLICY "Block audit updates" ON audit_logs 
  FOR UPDATE TO authenticated 
  USING (false);

CREATE POLICY "Block audit deletes" ON audit_logs 
  FOR DELETE TO authenticated 
  USING (false);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, occurred_at DESC);

SELECT 'audit_logs policies fixed!' as result;
