-- ============================================================
-- GREENLINE365 CONSOLIDATED MIGRATION SCRIPT
-- Run this in Supabase SQL Editor to fix all migration issues
-- Safe to run multiple times - handles existing objects
-- ============================================================

-- ============================================
-- STEP 1: Run migrations 015-016 first if not already done
-- ============================================

-- 015: Social Connections & Analytics (if not exists)
CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  account_id TEXT,
  account_name TEXT,
  profile_url TEXT,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_social_connections_platform ON social_connections(platform, is_active);

ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own social connections" ON social_connections;
CREATE POLICY "Users can manage own social connections" ON social_connections FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  platforms TEXT[] NOT NULL,
  status TEXT DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  results JSONB DEFAULT '{}',
  source TEXT,
  related_entity_type TEXT,
  related_entity_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id, status, scheduled_for);
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own social posts" ON social_posts;
CREATE POLICY "Users can manage own social posts" ON social_posts FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT,
  entity_type TEXT,
  entity_id UUID,
  visitor_id TEXT,
  session_id TEXT,
  source TEXT,
  medium TEXT,
  campaign TEXT,
  referrer TEXT,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  value FLOAT,
  metadata JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time ON analytics_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON analytics_events(entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(user_id, event_name, occurred_at DESC);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_events;
CREATE POLICY "Users can view own analytics" ON analytics_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow anonymous event tracking" ON analytics_events;
CREATE POLICY "Allow anonymous event tracking" ON analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 016: CRM Tables
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT DEFAULT 'new',
  source TEXT,
  value DECIMAL(12,2) DEFAULT 0,
  first_contact_at TIMESTAMPTZ,
  last_contact_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  assigned_to TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_user ON crm_leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(user_id, email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(user_id, source);

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own leads" ON crm_leads;
CREATE POLICY "Users manage own leads" ON crm_leads FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS crm_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  lead_id UUID REFERENCES crm_leads(id),
  lifetime_value DECIMAL(12,2) DEFAULT 0,
  first_purchase_at TIMESTAMPTZ,
  last_purchase_at TIMESTAMPTZ,
  purchase_count INT DEFAULT 0,
  status TEXT DEFAULT 'active',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_customers_user ON crm_customers(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers(user_id, email);

ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own customers" ON crm_customers;
CREATE POLICY "Users manage own customers" ON crm_customers FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS crm_email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  campaign_id UUID,
  template_id UUID,
  recipient_email TEXT NOT NULL,
  recipient_id UUID,
  link_url TEXT,
  link_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_events_user ON crm_email_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_email_events_campaign ON crm_email_events(campaign_id, event_type);
CREATE INDEX IF NOT EXISTS idx_crm_email_events_recipient ON crm_email_events(recipient_email, event_type);

ALTER TABLE crm_email_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view own email events" ON crm_email_events;
CREATE POLICY "Users view own email events" ON crm_email_events FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Allow email event inserts" ON crm_email_events;
CREATE POLICY "Allow email event inserts" ON crm_email_events FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE TABLE IF NOT EXISTS crm_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'sale',
  source TEXT,
  campaign_id UUID,
  customer_id UUID REFERENCES crm_customers(id),
  lead_id UUID REFERENCES crm_leads(id),
  description TEXT,
  invoice_id TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_revenue_user ON crm_revenue(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_source ON crm_revenue(user_id, source);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_customer ON crm_revenue(customer_id);

ALTER TABLE crm_revenue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own revenue" ON crm_revenue;
CREATE POLICY "Users manage own revenue" ON crm_revenue FOR ALL TO authenticated USING (user_id = auth.uid());

-- CRM Helper Functions
CREATE OR REPLACE FUNCTION increment_customer_ltv(p_customer_id UUID, p_amount DECIMAL) RETURNS VOID AS $$
BEGIN
  UPDATE crm_customers SET lifetime_value = lifetime_value + p_amount, purchase_count = purchase_count + 1, last_purchase_at = NOW(), updated_at = NOW() WHERE id = p_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION convert_lead_to_customer(p_lead_id UUID) RETURNS UUID AS $$
DECLARE v_lead RECORD; v_customer_id UUID;
BEGIN
  SELECT * INTO v_lead FROM crm_leads WHERE id = p_lead_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  INSERT INTO crm_customers (user_id, name, email, phone, company, lead_id) VALUES (v_lead.user_id, v_lead.name, v_lead.email, v_lead.phone, v_lead.company, p_lead_id) RETURNING id INTO v_customer_id;
  UPDATE crm_leads SET status = 'converted', converted_at = NOW(), updated_at = NOW() WHERE id = p_lead_id;
  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRM Views
CREATE OR REPLACE VIEW crm_lead_pipeline AS
SELECT user_id, status, COUNT(*) as count, SUM(value) as total_value, AVG(value) as avg_value FROM crm_leads GROUP BY user_id, status;

CREATE OR REPLACE VIEW crm_revenue_by_channel AS
SELECT user_id, source, DATE_TRUNC('month', occurred_at) as month, SUM(CASE WHEN type != 'refund' THEN amount ELSE -amount END) as net_revenue, COUNT(*) as transaction_count FROM crm_revenue GROUP BY user_id, source, DATE_TRUNC('month', occurred_at);


-- ============================================
-- STEP 2: Security Fixes (017)
-- Enable RLS on tables that need it
-- ============================================

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'super_admins' AND table_schema = 'public') THEN ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Super admins view only" ON public.super_admins; CREATE POLICY "Super admins view only" ON public.super_admins FOR SELECT TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs' AND table_schema = 'public') THEN ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access call logs" ON public.call_logs; CREATE POLICY "Authenticated access call logs" ON public.call_logs FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents' AND table_schema = 'public') THEN ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access agents" ON public.agents; CREATE POLICY "Authenticated access agents" ON public.agents FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access tenants" ON public.tenants; CREATE POLICY "Authenticated access tenants" ON public.tenants FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_memory' AND table_schema = 'public') THEN ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access agent memory" ON public.agent_memory; CREATE POLICY "Authenticated access agent memory" ON public.agent_memory FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_calls' AND table_schema = 'public') THEN ALTER TABLE public.scheduled_calls ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access scheduled calls" ON public.scheduled_calls; CREATE POLICY "Authenticated access scheduled calls" ON public.scheduled_calls FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_blueprints' AND table_schema = 'public') THEN ALTER TABLE public.content_blueprints ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access blueprints" ON public.content_blueprints; CREATE POLICY "Authenticated access blueprints" ON public.content_blueprints FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_pillars' AND table_schema = 'public') THEN ALTER TABLE public.content_pillars ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access pillars" ON public.content_pillars; CREATE POLICY "Authenticated access pillars" ON public.content_pillars FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_calendar' AND table_schema = 'public') THEN ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access calendar" ON public.content_calendar; CREATE POLICY "Authenticated access calendar" ON public.content_calendar FOR ALL TO authenticated USING (true); END IF; END $$;

DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_pieces' AND table_schema = 'public') THEN ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY; DROP POLICY IF EXISTS "Authenticated access content" ON public.content_pieces; CREATE POLICY "Authenticated access content" ON public.content_pieces FOR ALL TO authenticated USING (true); END IF; END $$;

-- Fix views - drop first to avoid conflicts
DROP VIEW IF EXISTS public.v_recent_events CASCADE;
DROP VIEW IF EXISTS public.v_active_conversations CASCADE;
DROP VIEW IF EXISTS public.safe_training_data CASCADE;

-- Recreate v_recent_events
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_event_journal' AND table_schema = 'public') THEN
    CREATE VIEW public.v_recent_events AS
    SELECT id, user_id, event_type, event_category, title, description, occurred_at, metadata
    FROM memory_event_journal WHERE occurred_at > NOW() - INTERVAL '30 days' ORDER BY occurred_at DESC;
    GRANT SELECT ON public.v_recent_events TO authenticated;
  END IF;
END $$;

-- Recreate v_active_conversations (from memory_context_buffer NOT conversations)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_context_buffer' AND table_schema = 'public') THEN
    CREATE VIEW public.v_active_conversations AS
    SELECT user_id, session_id, COUNT(*) as message_count, MIN(created_at) as started_at, MAX(created_at) as last_activity
    FROM memory_context_buffer WHERE context_type = 'message' AND expires_at > NOW() GROUP BY user_id, session_id;
    GRANT SELECT ON public.v_active_conversations TO authenticated;
  END IF;
END $$;

-- Recreate safe_training_data
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_knowledge_chunks' AND table_schema = 'public') THEN
    CREATE VIEW public.safe_training_data AS SELECT id, category, content, created_at FROM memory_knowledge_chunks WHERE is_active = true;
    GRANT SELECT ON public.safe_training_data TO authenticated;
  END IF;
END $$;


-- ============================================
-- STEP 3: Audit Logging (018)
-- ============================================

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

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs are append-only" ON audit_logs;
CREATE POLICY "Audit logs are append-only" ON audit_logs FOR INSERT TO authenticated, anon WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read audit logs" ON audit_logs;
CREATE POLICY "Admins can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Block audit log modifications" ON audit_logs;
CREATE POLICY "Block audit log modifications" ON audit_logs FOR UPDATE TO authenticated USING (false);

DROP POLICY IF EXISTS "Block audit log deletions" ON audit_logs;
CREATE POLICY "Block audit log deletions" ON audit_logs FOR DELETE TO authenticated USING (false);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_time ON audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(action_category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status) WHERE status != 'success';

-- Audit function
CREATE OR REPLACE FUNCTION log_audit_event(
  p_action TEXT, p_action_category TEXT, p_resource_type TEXT DEFAULT NULL, p_resource_id TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL, p_changes JSONB DEFAULT NULL, p_metadata JSONB DEFAULT '{}',
  p_status TEXT DEFAULT 'success', p_error_message TEXT DEFAULT NULL, p_is_sensitive BOOLEAN DEFAULT false, p_compliance_flags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE v_audit_id UUID; v_user_id UUID; v_user_email TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NOT NULL THEN SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id; END IF;
  INSERT INTO audit_logs (user_id, user_email, action, action_category, resource_type, resource_id, description, changes, metadata, status, error_message, is_sensitive, compliance_flags)
  VALUES (v_user_id, v_user_email, p_action, p_action_category, p_resource_type, p_resource_id, p_description, p_changes, p_metadata, p_status, p_error_message, p_is_sensitive, p_compliance_flags) RETURNING id INTO v_audit_id;
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic audit trigger
CREATE OR REPLACE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
DECLARE v_action TEXT; v_changes JSONB; v_resource_id TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN v_action := TG_TABLE_NAME || '.create'; v_changes := jsonb_build_object('new', to_jsonb(NEW)); v_resource_id := NEW.id::TEXT;
  ELSIF TG_OP = 'UPDATE' THEN v_action := TG_TABLE_NAME || '.update'; v_changes := jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW)); v_resource_id := NEW.id::TEXT;
  ELSIF TG_OP = 'DELETE' THEN v_action := TG_TABLE_NAME || '.delete'; v_changes := jsonb_build_object('old', to_jsonb(OLD)); v_resource_id := OLD.id::TEXT;
  END IF;
  INSERT INTO audit_logs (user_id, action, action_category, resource_type, resource_id, description, changes, metadata)
  VALUES (auth.uid(), v_action, 'data', TG_TABLE_NAME, v_resource_id, TG_OP || ' on ' || TG_TABLE_NAME, v_changes, jsonb_build_object('trigger', TG_NAME, 'schema', TG_TABLE_SCHEMA));
  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers conditionally
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads' AND table_schema = 'public') THEN DROP TRIGGER IF EXISTS audit_crm_leads ON crm_leads; CREATE TRIGGER audit_crm_leads AFTER INSERT OR UPDATE OR DELETE ON crm_leads FOR EACH ROW EXECUTE FUNCTION audit_trigger_func(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_customers' AND table_schema = 'public') THEN DROP TRIGGER IF EXISTS audit_crm_customers ON crm_customers; CREATE TRIGGER audit_crm_customers AFTER INSERT OR UPDATE OR DELETE ON crm_customers FOR EACH ROW EXECUTE FUNCTION audit_trigger_func(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_revenue' AND table_schema = 'public') THEN DROP TRIGGER IF EXISTS audit_crm_revenue ON crm_revenue; CREATE TRIGGER audit_crm_revenue AFTER INSERT OR UPDATE OR DELETE ON crm_revenue FOR EACH ROW EXECUTE FUNCTION audit_trigger_func(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_core_profiles' AND table_schema = 'public') THEN DROP TRIGGER IF EXISTS audit_memory_core_profiles ON memory_core_profiles; CREATE TRIGGER audit_memory_core_profiles AFTER INSERT OR UPDATE OR DELETE ON memory_core_profiles FOR EACH ROW EXECUTE FUNCTION audit_trigger_func(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_knowledge_chunks' AND table_schema = 'public') THEN DROP TRIGGER IF EXISTS audit_memory_knowledge_chunks ON memory_knowledge_chunks; CREATE TRIGGER audit_memory_knowledge_chunks AFTER INSERT OR UPDATE OR DELETE ON memory_knowledge_chunks FOR EACH ROW EXECUTE FUNCTION audit_trigger_func(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blog_posts' AND table_schema = 'public') THEN DROP TRIGGER IF EXISTS audit_blog_posts ON blog_posts; CREATE TRIGGER audit_blog_posts AFTER INSERT OR UPDATE OR DELETE ON blog_posts FOR EACH ROW EXECUTE FUNCTION audit_trigger_func(); END IF; END $$;
DO $$ BEGIN IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'social_connections' AND table_schema = 'public') THEN DROP TRIGGER IF EXISTS audit_social_connections ON social_connections; CREATE TRIGGER audit_social_connections AFTER INSERT OR UPDATE OR DELETE ON social_connections FOR EACH ROW EXECUTE FUNCTION audit_trigger_func(); END IF; END $$;

-- Compliance views
DROP VIEW IF EXISTS audit_failed_logins CASCADE;
CREATE VIEW audit_failed_logins AS SELECT user_email, ip_address, COUNT(*) as attempt_count, MIN(occurred_at) as first_attempt, MAX(occurred_at) as last_attempt FROM audit_logs WHERE action = 'user.login' AND status = 'failure' AND occurred_at > NOW() - INTERVAL '24 hours' GROUP BY user_email, ip_address HAVING COUNT(*) >= 3;

DROP VIEW IF EXISTS audit_data_access CASCADE;
CREATE VIEW audit_data_access AS SELECT occurred_at, user_email, action, resource_type, resource_id, ip_address, status FROM audit_logs WHERE action_category = 'data' ORDER BY occurred_at DESC;

DROP VIEW IF EXISTS audit_sensitive_access CASCADE;
CREATE VIEW audit_sensitive_access AS SELECT occurred_at, user_email, action, resource_type, description, compliance_flags FROM audit_logs WHERE is_sensitive = true ORDER BY occurred_at DESC;

DROP VIEW IF EXISTS audit_admin_actions CASCADE;
CREATE VIEW audit_admin_actions AS SELECT occurred_at, user_email, action, resource_type, resource_id, description, changes, status FROM audit_logs WHERE action_category = 'admin' ORDER BY occurred_at DESC;

GRANT SELECT ON audit_failed_logins TO authenticated;
GRANT SELECT ON audit_data_access TO authenticated;
GRANT SELECT ON audit_sensitive_access TO authenticated;
GRANT SELECT ON audit_admin_actions TO authenticated;

-- Archive function
CREATE OR REPLACE FUNCTION archive_old_audit_logs() RETURNS INTEGER AS $$
DECLARE v_archived_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_archived_count FROM audit_logs WHERE occurred_at < NOW() - INTERVAL '7 years';
  INSERT INTO audit_logs (action, action_category, description, metadata) VALUES ('audit.archive_check', 'system', 'Checked for audit logs eligible for archival', jsonb_build_object('eligible_count', v_archived_count));
  RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- DONE! All migrations should now be applied.
-- ============================================
SELECT 'SUCCESS: All migrations completed!' as status;
