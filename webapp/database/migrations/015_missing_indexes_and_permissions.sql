-- ============================================
-- MISSING INDEXES AND PERMISSIONS
-- ============================================
-- This migration adds the indexes that failed in 013g
-- and ensures all RLS policies are properly configured
-- Run this in Supabase SQL Editor

-- ============================================
-- PART 1: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for businesses table (Real-Feel columns)
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(tenant_status);
CREATE INDEX IF NOT EXISTS idx_businesses_weather_dependent ON businesses(is_weather_dependent);

-- Indexes for call_logs
CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);

-- Indexes for call_audits
CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_call_log ON call_audits(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_created ON call_audits(created_at DESC);

-- Indexes for weather_alerts
CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_severity ON weather_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_created ON weather_alerts(created_at DESC);

-- Indexes for warm_transfer_queue
CREATE INDEX IF NOT EXISTS idx_warm_transfer_business ON warm_transfer_queue(business_id);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_status ON warm_transfer_queue(status);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_created ON warm_transfer_queue(created_at DESC);

-- Indexes for sms_messages (if table exists)
CREATE INDEX IF NOT EXISTS idx_sms_messages_from ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_booking ON sms_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);

-- ============================================
-- PART 2: ENABLE ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on Real-Feel tables
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warm_transfer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 3: CREATE RLS POLICIES
-- ============================================

-- Policies for call_logs
DROP POLICY IF EXISTS "call_logs_service_role" ON call_logs;
CREATE POLICY "call_logs_service_role" ON call_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "call_logs_authenticated_select" ON call_logs;
CREATE POLICY "call_logs_authenticated_select" ON call_logs
  FOR SELECT TO authenticated USING (true);

-- Policies for call_audits
DROP POLICY IF EXISTS "call_audits_service_role" ON call_audits;
CREATE POLICY "call_audits_service_role" ON call_audits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "call_audits_authenticated_select" ON call_audits;
CREATE POLICY "call_audits_authenticated_select" ON call_audits
  FOR SELECT TO authenticated USING (true);

-- Policies for weather_alerts
DROP POLICY IF EXISTS "weather_alerts_service_role" ON weather_alerts;
CREATE POLICY "weather_alerts_service_role" ON weather_alerts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "weather_alerts_authenticated_select" ON weather_alerts;
CREATE POLICY "weather_alerts_authenticated_select" ON weather_alerts
  FOR SELECT TO authenticated USING (true);

-- Policies for warm_transfer_queue
DROP POLICY IF EXISTS "warm_transfer_service_role" ON warm_transfer_queue;
CREATE POLICY "warm_transfer_service_role" ON warm_transfer_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "warm_transfer_authenticated_select" ON warm_transfer_queue;
CREATE POLICY "warm_transfer_authenticated_select" ON warm_transfer_queue
  FOR SELECT TO authenticated USING (true);

-- Policies for sms_messages (already has policy from 014, but ensure it exists)
DROP POLICY IF EXISTS "sms_messages_service_role" ON sms_messages;
CREATE POLICY "sms_messages_service_role" ON sms_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- PART 4: GRANT PERMISSIONS
-- ============================================

-- Grant permissions to service_role
GRANT ALL ON call_logs TO service_role;
GRANT ALL ON call_audits TO service_role;
GRANT ALL ON weather_alerts TO service_role;
GRANT ALL ON warm_transfer_queue TO service_role;
GRANT ALL ON sms_messages TO service_role;

-- Grant SELECT to authenticated users
GRANT SELECT ON call_logs TO authenticated;
GRANT SELECT ON call_audits TO authenticated;
GRANT SELECT ON weather_alerts TO authenticated;
GRANT SELECT ON warm_transfer_queue TO authenticated;
GRANT SELECT ON sms_messages TO authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify success:

-- Check indexes were created:
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE tablename IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages')
-- ORDER BY tablename, indexname;

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages');

-- Check policies exist:
-- SELECT tablename, policyname FROM pg_policies 
-- WHERE tablename IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages');
