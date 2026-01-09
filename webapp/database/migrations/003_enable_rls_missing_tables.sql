-- ============================================
-- ENABLE RLS ON ALL MISSING TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- This script enables RLS on the ~79 tables that exist in Supabase
-- but are not in schema.sql

-- ============================================
-- QUERY TO FIND TABLES WITHOUT RLS
-- ============================================

-- Run this first to see which tables need RLS:
/*
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = false
ORDER BY tablename;
*/

-- ============================================
-- ENABLE RLS ON COMMON TABLES
-- ============================================

-- Agent & AI Tables
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_memories') THEN
    ALTER TABLE agent_memories ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own memories" ON agent_memories FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can manage memories" ON agent_memories FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_personalities') THEN
    ALTER TABLE ai_personalities ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can view personalities" ON ai_personalities FOR SELECT USING (true);
    CREATE POLICY "Admins can manage personalities" ON ai_personalities FOR ALL USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
    );
  END IF;
END $$;

-- API & Usage Tracking
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_usage_tracking') THEN
    ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own usage" ON api_usage_tracking FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can log usage" ON api_usage_tracking FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Appointments & Scheduling
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
    ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own appointments" ON appointments FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can create appointments" ON appointments FOR INSERT WITH CHECK (user_id = auth.uid());
    CREATE POLICY "Users can update own appointments" ON appointments FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availability_rules') THEN
    ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage own availability" ON availability_rules FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'availability_overrides') THEN
    ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage own overrides" ON availability_overrides FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- Blog & Content
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_images') THEN
    ALTER TABLE blog_images ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can view blog images" ON blog_images FOR SELECT USING (true);
    CREATE POLICY "Admins can manage images" ON blog_images FOR ALL USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_performance') THEN
    ALTER TABLE blog_performance ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Admins can view performance" ON blog_performance FOR SELECT USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true) OR auth.role() = 'service_role'
    );
  END IF;
END $$;

-- Brand Management
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_profiles') THEN
    ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own brand" ON brand_profiles FOR SELECT USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
    CREATE POLICY "Users can update own brand" ON brand_profiles FOR UPDATE USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_facts') THEN
    ALTER TABLE brand_facts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own brand facts" ON brand_facts FOR SELECT USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_voice_profiles') THEN
    ALTER TABLE brand_voice_profiles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can manage own voice" ON brand_voice_profiles FOR ALL USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- Business Data
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'businesses') THEN
    ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own business" ON businesses FOR SELECT USING (owner_id = auth.uid());
    CREATE POLICY "Users can update own business" ON businesses FOR UPDATE USING (owner_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'business_directory') THEN
    ALTER TABLE business_directory ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Anyone can view directory" ON business_directory FOR SELECT USING (true);
    CREATE POLICY "Service can manage directory" ON business_directory FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Chat & Messaging
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own messages" ON chat_messages FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_sessions') THEN
    ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own sessions" ON chat_sessions FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can create sessions" ON chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- Client Management
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own client data" ON clients FOR SELECT USING (id = auth.uid());
    CREATE POLICY "Admins can view all clients" ON clients FOR SELECT USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own customers" ON customers FOR SELECT USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
    CREATE POLICY "Users can manage own customers" ON customers FOR ALL USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'consumer_accounts') THEN
    ALTER TABLE consumer_accounts ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own account" ON consumer_accounts FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can update own account" ON consumer_accounts FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- Content Management
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_requests') THEN
    ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own requests" ON content_requests FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Users can create requests" ON content_requests FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_approvals') THEN
    ALTER TABLE content_approvals ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own approvals" ON content_approvals FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Admins can manage approvals" ON content_approvals FOR ALL USING (
      auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    );
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'generated_content') THEN
    ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own content" ON generated_content FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can create content" ON generated_content FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- Events & Tracking
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users can view own events" ON events FOR SELECT USING (user_id = auth.uid());
    CREATE POLICY "Service can log events" ON events FOR INSERT WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- System Tables
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_queue') THEN
    ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service manages job queue" ON job_queue FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- VERIFY RLS ENABLED
-- ============================================

-- Run this to verify all tables have RLS enabled:
/*
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY rls_enabled, tablename;
*/

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  rls_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO rls_count FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
  SELECT COUNT(*) INTO total_count FROM pg_tables WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ RLS enabled on additional tables!';
  RAISE NOTICE '📊 Tables with RLS: % / %', rls_count, total_count;
  RAISE NOTICE '📋 Run the verification query to check remaining tables';
END $$;