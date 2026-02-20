-- ============================================================
-- GREENLINE365 CONSOLIDATED RLS MIGRATION
-- ============================================================
-- Merges: fix_crm_rls.sql, CONSOLIDATED_MIGRATION_FIX.sql,
--         001_fix_rls_policies.sql, 003_enable_rls_missing_tables.sql
--
-- Safe to re-run: uses DROP POLICY IF EXISTS before every CREATE POLICY
-- and IF EXISTS guards for table existence.
-- ============================================================

-- ============================================
-- 0. PREREQUISITES
-- ============================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;

-- ============================================
-- 1. CORE TABLES (from schema.sql)
-- ============================================

-- LOCAL_TRENDS
ALTER TABLE local_trends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for local_trends" ON local_trends;
DROP POLICY IF EXISTS "Users can view own trends" ON local_trends;
DROP POLICY IF EXISTS "Service can manage trends" ON local_trends;
CREATE POLICY "Users can view own trends" ON local_trends FOR SELECT USING (
  client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  OR client_id IS NULL
  OR auth.role() = 'service_role'
);
CREATE POLICY "Service can manage trends" ON local_trends FOR ALL USING (auth.role() = 'service_role');

-- CONTENT_SCHEDULE
ALTER TABLE content_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for content_schedule" ON content_schedule;
DROP POLICY IF EXISTS "Users can view own content" ON content_schedule;
DROP POLICY IF EXISTS "Users can create own content" ON content_schedule;
DROP POLICY IF EXISTS "Users can update own content" ON content_schedule;
DROP POLICY IF EXISTS "Users can delete own content" ON content_schedule;
CREATE POLICY "Users can view own content" ON content_schedule FOR SELECT USING (
  client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()) OR auth.role() = 'service_role'
);
CREATE POLICY "Users can create own content" ON content_schedule FOR INSERT WITH CHECK (
  client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update own content" ON content_schedule FOR UPDATE USING (
  client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can delete own content" ON content_schedule FOR DELETE USING (
  client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid())
);

-- LEADS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for leads" ON leads;
DROP POLICY IF EXISTS "Users can view own leads" ON leads;
DROP POLICY IF EXISTS "Service can manage leads" ON leads;
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (
  metadata->>'client_id' IN (SELECT client_id FROM profiles WHERE id = auth.uid())
  OR auth.role() = 'service_role'
);
CREATE POLICY "Service can manage leads" ON leads FOR ALL USING (auth.role() = 'service_role');

-- ACTIVITY_LOG
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for activity_log" ON activity_log;
DROP POLICY IF EXISTS "Users can view own activity" ON activity_log;
DROP POLICY IF EXISTS "Service can log activity" ON activity_log;
CREATE POLICY "Users can view own activity" ON activity_log FOR SELECT USING (
  user_id = auth.uid()::text OR auth.role() = 'service_role'
);
CREATE POLICY "Service can log activity" ON activity_log FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- CLIENT_CONFIG
ALTER TABLE client_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for client_config" ON client_config;
DROP POLICY IF EXISTS "Users can view own config" ON client_config;
DROP POLICY IF EXISTS "Admins can update config" ON client_config;
CREATE POLICY "Users can view own config" ON client_config FOR SELECT USING (
  client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()) OR auth.role() = 'service_role'
);
CREATE POLICY "Admins can update config" ON client_config FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- DEMO_PROFILES
ALTER TABLE demo_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for demo_profiles" ON demo_profiles;
DROP POLICY IF EXISTS "Anyone can view demos" ON demo_profiles;
DROP POLICY IF EXISTS "Admins can manage demos" ON demo_profiles;
CREATE POLICY "Anyone can view demos" ON demo_profiles FOR SELECT USING (true);
CREATE POLICY "Admins can manage demos" ON demo_profiles FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- DEMO_SESSIONS
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for demo_sessions" ON demo_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON demo_sessions;
DROP POLICY IF EXISTS "Anyone can book demos" ON demo_sessions;
DROP POLICY IF EXISTS "Admins can manage sessions" ON demo_sessions;
CREATE POLICY "Users can view own sessions" ON demo_sessions FOR SELECT USING (
  email IN (SELECT email FROM profiles WHERE id = auth.uid())
  OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  OR auth.role() = 'service_role'
);
CREATE POLICY "Anyone can book demos" ON demo_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage sessions" ON demo_sessions FOR UPDATE USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- INDUSTRIES
ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for industries" ON industries;
DROP POLICY IF EXISTS "Anyone can view industries" ON industries;
DROP POLICY IF EXISTS "Admins can manage industries" ON industries;
CREATE POLICY "Anyone can view industries" ON industries FOR SELECT USING (true);
CREATE POLICY "Admins can manage industries" ON industries FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- WAITLIST_SUBMISSIONS
ALTER TABLE waitlist_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for waitlist_submissions" ON waitlist_submissions;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON waitlist_submissions;
DROP POLICY IF EXISTS "Admins can view waitlist" ON waitlist_submissions;
CREATE POLICY "Anyone can join waitlist" ON waitlist_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view waitlist" ON waitlist_submissions FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- NEWSLETTER_SUBSCRIPTIONS
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for newsletter_subscriptions" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Anyone can subscribe" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Admins can view subscribers" ON newsletter_subscriptions;
DROP POLICY IF EXISTS "Users can unsubscribe" ON newsletter_subscriptions;
CREATE POLICY "Anyone can subscribe" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view subscribers" ON newsletter_subscriptions FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);
CREATE POLICY "Users can unsubscribe" ON newsletter_subscriptions FOR UPDATE
  USING (email IN (SELECT email FROM profiles WHERE id = auth.uid()))
  WITH CHECK (status = 'unsubscribed');

-- DEMO_REQUESTS
ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for demo_requests" ON demo_requests;
DROP POLICY IF EXISTS "Anyone can request demo" ON demo_requests;
DROP POLICY IF EXISTS "Admins can view requests" ON demo_requests;
CREATE POLICY "Anyone can request demo" ON demo_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view requests" ON demo_requests FOR SELECT USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- INGESTED_WEBSITE_DATA
ALTER TABLE ingested_website_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for ingested_website_data" ON ingested_website_data;
DROP POLICY IF EXISTS "Service manages ingested data" ON ingested_website_data;
CREATE POLICY "Service manages ingested data" ON ingested_website_data FOR ALL USING (auth.role() = 'service_role');

-- DEMO_LOCAL_PULSE_EVENTS
ALTER TABLE demo_local_pulse_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for demo_local_pulse_events" ON demo_local_pulse_events;
DROP POLICY IF EXISTS "Anyone can view demo events" ON demo_local_pulse_events;
DROP POLICY IF EXISTS "Admins can manage demo events" ON demo_local_pulse_events;
CREATE POLICY "Anyone can view demo events" ON demo_local_pulse_events FOR SELECT USING (true);
CREATE POLICY "Admins can manage demo events" ON demo_local_pulse_events FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- DEMO_WEEKLY_TREND_IDEAS
ALTER TABLE demo_weekly_trend_ideas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for demo_weekly_trend_ideas" ON demo_weekly_trend_ideas;
DROP POLICY IF EXISTS "Anyone can view demo ideas" ON demo_weekly_trend_ideas;
DROP POLICY IF EXISTS "Admins can manage demo ideas" ON demo_weekly_trend_ideas;
CREATE POLICY "Anyone can view demo ideas" ON demo_weekly_trend_ideas FOR SELECT USING (true);
CREATE POLICY "Admins can manage demo ideas" ON demo_weekly_trend_ideas FOR ALL USING (
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
);

-- ============================================
-- 2. CRM TABLES (deduplicated — single set of clean policies)
-- ============================================

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can view leads" ON crm_leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON crm_leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON crm_leads;
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON crm_leads;
DROP POLICY IF EXISTS "Service role full access leads" ON crm_leads;
DROP POLICY IF EXISTS "Users manage leads" ON crm_leads;

-- user_isolation: each user sees only their own leads
CREATE POLICY "crm_leads_user_isolation" ON crm_leads FOR ALL TO authenticated
  USING (owner_id = auth.uid());
-- service_role: full access for API/backend operations
CREATE POLICY "crm_leads_service_role" ON crm_leads FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON crm_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);

-- CRM_LEAD_ACTIVITIES
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_lead_activities') THEN
    ALTER TABLE crm_lead_activities ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can view activities" ON crm_lead_activities;
    DROP POLICY IF EXISTS "crm_activities_user" ON crm_lead_activities;
    DROP POLICY IF EXISTS "crm_activities_service" ON crm_lead_activities;
    CREATE POLICY "crm_activities_user" ON crm_lead_activities FOR SELECT TO authenticated
      USING (lead_id IN (SELECT id FROM crm_leads WHERE owner_id = auth.uid()));
    CREATE POLICY "crm_activities_service" ON crm_lead_activities FOR ALL TO service_role
      USING (true);
  END IF;
END $$;

-- CRM_EMAIL_EVENTS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_email_events') THEN
    ALTER TABLE crm_email_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can view email events" ON crm_email_events;
    DROP POLICY IF EXISTS "Service role full access events" ON crm_email_events;
    DROP POLICY IF EXISTS "crm_email_events_service" ON crm_email_events;
    CREATE POLICY "crm_email_events_service" ON crm_email_events FOR ALL TO service_role
      USING (true);
  END IF;
END $$;

-- CRM_EMAIL_CAMPAIGNS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_email_campaigns') THEN
    ALTER TABLE crm_email_campaigns ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can manage campaigns" ON crm_email_campaigns;
    DROP POLICY IF EXISTS "crm_campaigns_user" ON crm_email_campaigns;
    DROP POLICY IF EXISTS "crm_campaigns_service" ON crm_email_campaigns;
    CREATE POLICY "crm_campaigns_user" ON crm_email_campaigns FOR ALL TO authenticated
      USING (created_by = auth.uid());
    CREATE POLICY "crm_campaigns_service" ON crm_email_campaigns FOR ALL TO service_role
      USING (true);
  END IF;
END $$;

-- CRM_INVITE_CODES
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_invite_codes') THEN
    ALTER TABLE crm_invite_codes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can manage invites" ON crm_invite_codes;
    DROP POLICY IF EXISTS "crm_invites_service" ON crm_invite_codes;
    CREATE POLICY "crm_invites_service" ON crm_invite_codes FOR ALL TO service_role
      USING (true);
  END IF;
END $$;

-- CRM_CUSTOMERS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_customers') THEN
    ALTER TABLE crm_customers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users manage customers" ON crm_customers;
    DROP POLICY IF EXISTS "crm_customers_user" ON crm_customers;
    DROP POLICY IF EXISTS "crm_customers_service" ON crm_customers;
    CREATE POLICY "crm_customers_user" ON crm_customers FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "crm_customers_service" ON crm_customers FOR ALL TO service_role
      USING (true);
    CREATE INDEX IF NOT EXISTS idx_crm_customers_user ON crm_customers(user_id);
  END IF;
END $$;

-- CRM_REVENUE
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_revenue') THEN
    ALTER TABLE crm_revenue ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users manage revenue" ON crm_revenue;
    DROP POLICY IF EXISTS "crm_revenue_user" ON crm_revenue;
    DROP POLICY IF EXISTS "crm_revenue_service" ON crm_revenue;
    CREATE POLICY "crm_revenue_user" ON crm_revenue FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "crm_revenue_service" ON crm_revenue FOR ALL TO service_role
      USING (true);
    CREATE INDEX IF NOT EXISTS idx_crm_revenue_user ON crm_revenue(user_id);
  END IF;
END $$;

-- SOCIAL_CONNECTIONS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_connections') THEN
    ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users manage social" ON social_connections;
    DROP POLICY IF EXISTS "Users can manage own social connections" ON social_connections;
    DROP POLICY IF EXISTS "social_connections_user" ON social_connections;
    CREATE POLICY "social_connections_user" ON social_connections FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);
  END IF;
END $$;

-- ============================================
-- 3. DYNAMIC TABLES (guarded by IF EXISTS)
-- ============================================

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_memories') THEN
    ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own memories" ON agent_memories;
    DROP POLICY IF EXISTS "Service can manage memories" ON agent_memories;
    CREATE POLICY "Users can view own memories" ON agent_memories FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can manage memories" ON agent_memories FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_personalities') THEN
    ALTER TABLE ai_personalities ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can view personalities" ON ai_personalities;
    DROP POLICY IF EXISTS "Admins can manage personalities" ON ai_personalities;
    CREATE POLICY "Anyone can view personalities" ON ai_personalities FOR SELECT USING (true);
    CREATE POLICY "Admins can manage personalities" ON ai_personalities FOR ALL USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_usage_tracking') THEN
    ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own usage" ON api_usage_tracking;
    DROP POLICY IF EXISTS "Service can log usage" ON api_usage_tracking;
    CREATE POLICY "Users can view own usage" ON api_usage_tracking FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can log usage" ON api_usage_tracking FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
    ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can update own appointments" ON appointments;
    CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availability_rules') THEN
    ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own availability" ON availability_rules;
    CREATE POLICY "Users can manage own availability" ON availability_rules FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availability_overrides') THEN
    ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own overrides" ON availability_overrides;
    CREATE POLICY "Users can manage own overrides" ON availability_overrides FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_images') THEN
    ALTER TABLE blog_images ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can view blog images" ON blog_images;
    DROP POLICY IF EXISTS "Admins can manage images" ON blog_images;
    CREATE POLICY "Anyone can view blog images" ON blog_images FOR SELECT USING (true);
    CREATE POLICY "Admins can manage images" ON blog_images FOR ALL USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_performance') THEN
    ALTER TABLE blog_performance ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Admins can view performance" ON blog_performance;
    CREATE POLICY "Admins can view performance" ON blog_performance FOR SELECT USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_profiles') THEN
    ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own brand" ON brand_profiles;
    DROP POLICY IF EXISTS "Users can update own brand" ON brand_profiles;
    CREATE POLICY "Users can view own brand" ON brand_profiles FOR SELECT USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
    CREATE POLICY "Users can update own brand" ON brand_profiles FOR UPDATE USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_facts') THEN
    ALTER TABLE brand_facts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own brand facts" ON brand_facts;
    CREATE POLICY "Users can view own brand facts" ON brand_facts FOR SELECT USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_voice_profiles') THEN
    ALTER TABLE brand_voice_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage own voice" ON brand_voice_profiles;
    CREATE POLICY "Users can manage own voice" ON brand_voice_profiles FOR ALL USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'businesses') THEN
    ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own business" ON businesses;
    DROP POLICY IF EXISTS "Users can update own business" ON businesses;
    CREATE POLICY "Users can view own business" ON businesses FOR SELECT USING (owner_id = auth.uid());
    CREATE POLICY "Users can update own business" ON businesses FOR UPDATE USING (owner_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_directory') THEN
    ALTER TABLE business_directory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Anyone can view directory" ON business_directory;
    DROP POLICY IF EXISTS "Service can manage directory" ON business_directory;
    CREATE POLICY "Anyone can view directory" ON business_directory FOR SELECT USING (true);
    CREATE POLICY "Service can manage directory" ON business_directory FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own messages" ON chat_messages;
    DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
    CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_sessions') THEN
    ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own sessions" ON chat_sessions;
    DROP POLICY IF EXISTS "Users can create sessions" ON chat_sessions;
    CREATE POLICY "Users can view own sessions" ON chat_sessions FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can create sessions" ON chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own client data" ON clients;
    DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
    CREATE POLICY "Users can view own client data" ON clients FOR SELECT USING (id = auth.uid());
    CREATE POLICY "Admins can view all clients" ON clients FOR SELECT USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own customers" ON customers;
    DROP POLICY IF EXISTS "Users can manage own customers" ON customers;
    CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
    CREATE POLICY "Users can manage own customers" ON customers FOR ALL USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consumer_accounts') THEN
    ALTER TABLE consumer_accounts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own account" ON consumer_accounts;
    DROP POLICY IF EXISTS "Users can update own account" ON consumer_accounts;
    CREATE POLICY "Users can view own account" ON consumer_accounts FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can update own account" ON consumer_accounts FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_requests') THEN
    ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own requests" ON content_requests;
    DROP POLICY IF EXISTS "Users can create requests" ON content_requests;
    CREATE POLICY "Users can view own requests" ON content_requests FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can create requests" ON content_requests FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_approvals') THEN
    ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own approvals" ON content_approvals;
    DROP POLICY IF EXISTS "Admins can manage approvals" ON content_approvals;
    CREATE POLICY "Users can view own approvals" ON content_approvals FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Admins can manage approvals" ON content_approvals FOR ALL USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'generated_content') THEN
    ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own content" ON generated_content;
    DROP POLICY IF EXISTS "Service can create content" ON generated_content;
    CREATE POLICY "Users can view own content" ON generated_content FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can create content" ON generated_content FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view own events" ON events;
    DROP POLICY IF EXISTS "Service can log events" ON events;
    CREATE POLICY "Users can view own events" ON events FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can log events" ON events FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_queue') THEN
    ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Service manages job queue" ON job_queue;
    CREATE POLICY "Service manages job queue" ON job_queue FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- 4. GRANT CLEANUP
-- ============================================

REVOKE ALL ON local_trends FROM anon;
REVOKE ALL ON content_schedule FROM anon;
REVOKE ALL ON leads FROM anon;
REVOKE ALL ON activity_log FROM anon;
REVOKE ALL ON client_config FROM anon;
REVOKE ALL ON ingested_website_data FROM anon;

GRANT SELECT ON demo_profiles TO anon;
GRANT SELECT ON industries TO anon;
GRANT SELECT ON demo_local_pulse_events TO anon;
GRANT SELECT ON demo_weekly_trend_ideas TO anon;
GRANT INSERT ON waitlist_submissions TO anon;
GRANT INSERT ON newsletter_subscriptions TO anon;
GRANT INSERT ON demo_requests TO anon;
GRANT INSERT ON demo_sessions TO anon;

-- ============================================
-- 5. VERIFICATION
-- ============================================

DO $$
DECLARE
  rls_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
  SELECT COUNT(*) INTO total_count FROM pg_tables WHERE schemaname = 'public';
  RAISE NOTICE 'Consolidated RLS migration complete. Tables with RLS: % / %', rls_count, total_count;
END $$;
