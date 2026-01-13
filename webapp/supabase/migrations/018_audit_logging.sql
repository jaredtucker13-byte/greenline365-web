-- ============================================================
-- AUDIT LOGGING SYSTEM FOR SOC2 COMPLIANCE
-- Tracks all significant actions for security & compliance
-- ============================================================

-- ============================================
-- AUDIT LOG TABLE
-- Append-only, tamper-resistant audit trail
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- WHO performed the action
  user_id UUID,                    -- Auth user ID (null for system actions)
  user_email TEXT,                 -- Denormalized for easier querying
  session_id TEXT,                 -- Session tracking
  
  -- WHAT action was performed
  action TEXT NOT NULL,            -- e.g., 'user.login', 'lead.create', 'settings.update'
  action_category TEXT NOT NULL,   -- auth, data, admin, system, security
  resource_type TEXT,              -- e.g., 'lead', 'customer', 'blog_post', 'user'
  resource_id TEXT,                -- ID of affected resource
  
  -- DETAILS of the action
  description TEXT,                -- Human-readable description
  changes JSONB,                   -- Before/after values for updates
  metadata JSONB DEFAULT '{}',     -- Additional context
  
  -- OUTCOME
  status TEXT DEFAULT 'success',   -- success, failure, denied
  error_message TEXT,              -- If failed, why
  
  -- WHERE it happened from
  ip_address INET,
  user_agent TEXT,
  geo_location JSONB,              -- {country, city, region}
  
  -- WHEN it happened
  occurred_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Compliance fields
  retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 years'), -- SOC2 requires 7 year retention
  is_sensitive BOOLEAN DEFAULT false,  -- Flag for PII-related actions
  compliance_flags TEXT[] DEFAULT '{}'  -- e.g., {'gdpr', 'ccpa', 'hipaa'}
);

-- Make table append-only (no updates or deletes allowed via RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow inserts, no updates or deletes
DROP POLICY IF EXISTS "Audit logs are append-only" ON audit_logs;
CREATE POLICY "Audit logs are append-only" 
  ON audit_logs FOR INSERT 
  TO authenticated, anon
  WITH CHECK (true);

-- Admins can read all audit logs (check for super_admins table existence)
DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'super_admins' AND table_schema = 'public') THEN
    CREATE POLICY "Admins can read audit logs" 
      ON audit_logs FOR SELECT 
      TO authenticated 
      USING (
        -- Check if user is super admin (table may have user_id or id column)
        EXISTS (
          SELECT 1 FROM super_admins sa 
          WHERE sa.user_id = auth.uid() OR sa.id = auth.uid()
        )
        -- Or users can see their own audit logs
        OR user_id = auth.uid()
      );
  ELSE
    -- If no super_admins table, just allow users to see their own logs
    CREATE POLICY "Admins can read audit logs" 
      ON audit_logs FOR SELECT 
      TO authenticated 
      USING (user_id = auth.uid());
  END IF;
END $$;

-- Block all updates and deletes (append-only)
DROP POLICY IF EXISTS "Block audit log modifications" ON audit_logs;
CREATE POLICY "Block audit log modifications" 
  ON audit_logs FOR UPDATE 
  TO authenticated 
  USING (false);

DROP POLICY IF EXISTS "Block audit log deletions" ON audit_logs;
CREATE POLICY "Block audit log deletions" 
  ON audit_logs FOR DELETE 
  TO authenticated 
  USING (false);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(action_category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status) WHERE status != 'success';

-- ============================================
-- AUDIT LOG FUNCTION
-- Call this to log any action
-- ============================================
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT,
  p_action_category TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_changes JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL,
  p_is_sensitive BOOLEAN DEFAULT false,
  p_compliance_flags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Get current user info
  v_user_id := auth.uid();
  
  -- Get user email if available
  IF v_user_id IS NOT NULL THEN
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id, user_email, action, action_category,
    resource_type, resource_id, description, changes,
    metadata, status, error_message, is_sensitive, compliance_flags
  ) VALUES (
    v_user_id, v_user_email, p_action, p_action_category,
    p_resource_type, p_resource_id, p_description, p_changes,
    p_metadata, p_status, p_error_message, p_is_sensitive, p_compliance_flags
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTOMATIC AUDIT TRIGGERS
-- Automatically log changes to critical tables
-- Only creates triggers if tables exist
-- ============================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func() 
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_changes JSONB;
  v_resource_id TEXT;
BEGIN
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := TG_TABLE_NAME || '.create';
    v_changes := jsonb_build_object('new', to_jsonb(NEW));
    v_resource_id := NEW.id::TEXT;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_TABLE_NAME || '.update';
    v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW));
    v_resource_id := NEW.id::TEXT;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := TG_TABLE_NAME || '.delete';
    v_changes := jsonb_build_object('old', to_jsonb(OLD));
    v_resource_id := OLD.id::TEXT;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    user_id, action, action_category, resource_type, resource_id,
    description, changes, metadata
  ) VALUES (
    auth.uid(),
    v_action,
    'data',
    TG_TABLE_NAME,
    v_resource_id,
    TG_OP || ' on ' || TG_TABLE_NAME,
    v_changes,
    jsonb_build_object('trigger', TG_NAME, 'schema', TG_TABLE_SCHEMA)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to critical tables ONLY if they exist
-- CRM Leads
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_crm_leads ON crm_leads;
    CREATE TRIGGER audit_crm_leads
      AFTER INSERT OR UPDATE OR DELETE ON crm_leads
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- CRM Customers  
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_customers' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_crm_customers ON crm_customers;
    CREATE TRIGGER audit_crm_customers
      AFTER INSERT OR UPDATE OR DELETE ON crm_customers
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- CRM Revenue
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_revenue' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_crm_revenue ON crm_revenue;
    CREATE TRIGGER audit_crm_revenue
      AFTER INSERT OR UPDATE OR DELETE ON crm_revenue
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- Memory Core Profiles (Brand Voice)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_core_profiles' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_memory_core_profiles ON memory_core_profiles;
    CREATE TRIGGER audit_memory_core_profiles
      AFTER INSERT OR UPDATE OR DELETE ON memory_core_profiles
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- Knowledge Chunks
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_knowledge_chunks' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_memory_knowledge_chunks ON memory_knowledge_chunks;
    CREATE TRIGGER audit_memory_knowledge_chunks
      AFTER INSERT OR UPDATE OR DELETE ON memory_knowledge_chunks
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- Blog Posts
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_blog_posts ON blog_posts;
    CREATE TRIGGER audit_blog_posts
      AFTER INSERT OR UPDATE OR DELETE ON blog_posts
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- Social Connections (sensitive - tracks OAuth tokens)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_connections' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS audit_social_connections ON social_connections;
    CREATE TRIGGER audit_social_connections
      AFTER INSERT OR UPDATE OR DELETE ON social_connections
      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
  END IF;
END $$;

-- ============================================
-- AUTH EVENT LOGGING
-- Track authentication events
-- ============================================
CREATE OR REPLACE FUNCTION log_auth_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, user_email, action, action_category,
    description, metadata, is_sensitive, compliance_flags
  ) VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'user.signup'
      ELSE 'user.update'
    END,
    'auth',
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'New user registration'
      ELSE 'User profile updated'
    END,
    jsonb_build_object(
      'provider', NEW.raw_app_meta_data->>'provider',
      'email_confirmed', NEW.email_confirmed_at IS NOT NULL
    ),
    true,
    ARRAY['gdpr', 'ccpa']
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Apply this trigger in Supabase Dashboard under Auth > Hooks
-- as triggers on auth.users require special permissions

-- ============================================
-- COMPLIANCE VIEWS
-- Pre-built queries for compliance reporting
-- ============================================

-- Failed login attempts (security monitoring)
CREATE OR REPLACE VIEW audit_failed_logins AS
SELECT 
  user_email,
  ip_address,
  COUNT(*) as attempt_count,
  MIN(occurred_at) as first_attempt,
  MAX(occurred_at) as last_attempt
FROM audit_logs
WHERE action = 'user.login' 
  AND status = 'failure'
  AND occurred_at > NOW() - INTERVAL '24 hours'
GROUP BY user_email, ip_address
HAVING COUNT(*) >= 3;

-- Data access log (who accessed what)
CREATE OR REPLACE VIEW audit_data_access AS
SELECT 
  occurred_at,
  user_email,
  action,
  resource_type,
  resource_id,
  ip_address,
  status
FROM audit_logs
WHERE action_category = 'data'
ORDER BY occurred_at DESC;

-- Sensitive data access (PII handling)
CREATE OR REPLACE VIEW audit_sensitive_access AS
SELECT 
  occurred_at,
  user_email,
  action,
  resource_type,
  description,
  compliance_flags
FROM audit_logs
WHERE is_sensitive = true
ORDER BY occurred_at DESC;

-- Admin actions log
CREATE OR REPLACE VIEW audit_admin_actions AS
SELECT 
  occurred_at,
  user_email,
  action,
  resource_type,
  resource_id,
  description,
  changes,
  status
FROM audit_logs
WHERE action_category = 'admin'
ORDER BY occurred_at DESC;

-- Grant access to views
GRANT SELECT ON audit_failed_logins TO authenticated;
GRANT SELECT ON audit_data_access TO authenticated;
GRANT SELECT ON audit_sensitive_access TO authenticated;
GRANT SELECT ON audit_admin_actions TO authenticated;

-- ============================================
-- RETENTION POLICY FUNCTION
-- Automatically archive old audit logs
-- ============================================
CREATE OR REPLACE FUNCTION archive_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  -- In a real implementation, you'd move to an archive table
  -- For now, we just count what would be archived
  -- SOC2 requires 7 year retention, so we don't actually delete
  
  SELECT COUNT(*) INTO v_archived_count
  FROM audit_logs
  WHERE occurred_at < NOW() - INTERVAL '7 years';
  
  -- Log the archive operation itself
  INSERT INTO audit_logs (
    action, action_category, description, metadata
  ) VALUES (
    'audit.archive_check',
    'system',
    'Checked for audit logs eligible for archival',
    jsonb_build_object('eligible_count', v_archived_count)
  );
  
  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SUMMARY
-- After running this migration:
-- 1. All CRM actions are automatically logged (if tables exist)
-- 2. All Memory/Knowledge changes are logged (if tables exist)
-- 3. Blog post changes are logged (if table exists)
-- 4. Social connections are logged (if table exists)
-- 5. Admins can view all logs, users see their own
-- 6. Logs are append-only (tamper-resistant)
-- 7. 7-year retention for SOC2 compliance
-- ============================================
