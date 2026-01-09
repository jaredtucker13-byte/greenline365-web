-- ============================================
-- SUPABASE SECURITY FIX: RLS POLICIES
-- Run this in Supabase SQL Editor
-- ============================================

-- This script adds proper Row Level Security (RLS) policies
-- to tables that are currently missing them or have overly permissive policies

-- ============================================
-- STEP 1: ADD is_super_admin TO PROFILES
-- ============================================

-- Add super admin flag for god mode access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Update your account to super admin (replace with your actual user ID)
-- To find your user ID, run: SELECT id, email FROM auth.users WHERE email = 'jared.tucker13@gmail.com';
-- UPDATE profiles SET is_super_admin = true WHERE email = 'jared.tucker13@gmail.com';

CREATE INDEX IF NOT EXISTS idx_profiles_is_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;

-- ============================================
-- STEP 2: FIX OVERLY PERMISSIVE POLICIES
-- ============================================

-- Remove "Allow all" policies and replace with proper ones

-- LOCAL_TRENDS: User-scoped data
DROP POLICY IF EXISTS "Allow all for local_trends" ON local_trends;

CREATE POLICY "Users can view own trends" ON local_trends
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
    OR client_id IS NULL -- Public trends
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Service can manage trends" ON local_trends
  FOR ALL USING (auth.role() = 'service_role');

-- CONTENT_SCHEDULE: User-scoped content
DROP POLICY IF EXISTS "Allow all for content_schedule" ON content_schedule;

CREATE POLICY "Users can view own content" ON content_schedule
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can create own content" ON content_schedule
  FOR INSERT WITH CHECK (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own content" ON content_schedule
  FOR UPDATE USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own content" ON content_schedule
  FOR DELETE USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
  );

-- LEADS: User-scoped leads
DROP POLICY IF EXISTS "Allow all for leads" ON leads;

CREATE POLICY "Users can view own leads" ON leads
  FOR SELECT USING (
    metadata->>'client_id' IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Service can manage leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

-- ACTIVITY_LOG: Read-only for users, write for service
DROP POLICY IF EXISTS "Allow all for activity_log" ON activity_log;

CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (
    user_id = auth.uid()::text
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Service can log activity" ON activity_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- CLIENT_CONFIG: Client-scoped configuration
DROP POLICY IF EXISTS "Allow all for client_config" ON client_config;

CREATE POLICY "Users can view own config" ON client_config
  FOR SELECT USING (
    client_id IN (
      SELECT client_id FROM profiles WHERE id = auth.uid()
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Admins can update config" ON client_config
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- DEMO_PROFILES: Public read, admin write
DROP POLICY IF EXISTS "Allow all for demo_profiles" ON demo_profiles;

CREATE POLICY "Anyone can view demos" ON demo_profiles
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage demos" ON demo_profiles
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- DEMO_SESSIONS: User-scoped demo bookings
DROP POLICY IF EXISTS "Allow all for demo_sessions" ON demo_sessions;

CREATE POLICY "Users can view own sessions" ON demo_sessions
  FOR SELECT USING (
    email IN (SELECT email FROM profiles WHERE id = auth.uid())
    OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Anyone can book demos" ON demo_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can manage sessions" ON demo_sessions
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- INDUSTRIES: Public read, admin write
DROP POLICY IF EXISTS "Allow all for industries" ON industries;

CREATE POLICY "Anyone can view industries" ON industries
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage industries" ON industries
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- WAITLIST: Public write, admin read
DROP POLICY IF EXISTS "Allow all for waitlist_submissions" ON waitlist_submissions;

CREATE POLICY "Anyone can join waitlist" ON waitlist_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view waitlist" ON waitlist_submissions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- NEWSLETTER: Public write, admin read
DROP POLICY IF EXISTS "Allow all for newsletter_subscriptions" ON newsletter_subscriptions;

CREATE POLICY "Anyone can subscribe" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view subscribers" ON newsletter_subscriptions
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can unsubscribe" ON newsletter_subscriptions
  FOR UPDATE USING (
    email IN (SELECT email FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    status = 'unsubscribed'
  );

-- DEMO_REQUESTS: Public write, admin read
DROP POLICY IF EXISTS "Allow all for demo_requests" ON demo_requests;

CREATE POLICY "Anyone can request demo" ON demo_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view requests" ON demo_requests
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- INGESTED_WEBSITE_DATA: Service role only
DROP POLICY IF EXISTS "Allow all for ingested_website_data" ON ingested_website_data;

CREATE POLICY "Service manages ingested data" ON ingested_website_data
  FOR ALL USING (auth.role() = 'service_role');

-- DEMO_LOCAL_PULSE_EVENTS: Public read, admin write
DROP POLICY IF EXISTS "Allow all for demo_local_pulse_events" ON demo_local_pulse_events;

CREATE POLICY "Anyone can view demo events" ON demo_local_pulse_events
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage demo events" ON demo_local_pulse_events
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- DEMO_WEEKLY_TREND_IDEAS: Public read, admin write
DROP POLICY IF EXISTS "Allow all for demo_weekly_trend_ideas" ON demo_weekly_trend_ideas;

CREATE POLICY "Anyone can view demo ideas" ON demo_weekly_trend_ideas
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage demo ideas" ON demo_weekly_trend_ideas
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
    OR auth.role() = 'service_role'
  );

-- ============================================
-- STEP 3: GRANT PERMISSIONS
-- ============================================

-- Revoke overly permissive grants
REVOKE ALL ON local_trends FROM anon;
REVOKE ALL ON content_schedule FROM anon;
REVOKE ALL ON leads FROM anon;
REVOKE ALL ON activity_log FROM anon;
REVOKE ALL ON client_config FROM anon;
REVOKE ALL ON ingested_website_data FROM anon;

-- Grant appropriate permissions
GRANT SELECT ON demo_profiles TO anon;
GRANT SELECT ON industries TO anon;
GRANT SELECT ON demo_local_pulse_events TO anon;
GRANT SELECT ON demo_weekly_trend_ideas TO anon;
GRANT INSERT ON waitlist_submissions TO anon;
GRANT INSERT ON newsletter_subscriptions TO anon;
GRANT INSERT ON demo_requests TO anon;
GRANT INSERT ON demo_sessions TO anon;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Update your profile to super admin';
  RAISE NOTICE '2. Run the performance indexes script';
  RAISE NOTICE '3. Test with authenticated and anonymous users';
END $$;
