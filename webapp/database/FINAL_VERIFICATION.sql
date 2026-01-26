-- ============================================
-- FINAL VERIFICATION - CHECK EVERYTHING
-- ============================================

-- 1. Check all Real-Feel tables exist
SELECT 
  'Tables Check' as verification_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages', 'agent_memory');
-- Should return: 6

-- 2. Check all indexes exist
SELECT 
  'Indexes Check' as verification_type,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages', 'agent_memory', 'businesses');
-- Should return: 20+

-- 3. Check RLS is enabled on all tables
SELECT 
  'RLS Check' as verification_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages', 'agent_memory')
ORDER BY tablename;

-- 4. Check policies exist
SELECT 
  'Policies Check' as verification_type,
  COUNT(*) as count
FROM pg_policies
WHERE tablename IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages', 'agent_memory');
-- Should return: 6

-- 5. Check businesses table has Real-Feel columns
SELECT 
  'Business Columns Check' as verification_type,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
  AND column_name IN ('is_weather_dependent', 'weather_threshold', 'tenant_status', 'zip_code', 'retell_agent_id', 'twilio_phone_number', 'context_config')
ORDER BY column_name;
-- Should return: 7 rows

-- 6. Check bookings table has SMS columns
SELECT 
  'Bookings SMS Columns' as verification_type,
  column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'bookings'
  AND column_name IN ('sms_confirmed', 'confirmation_code', 'weather_checked')
ORDER BY column_name;
-- Should return: 3 rows if they exist

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ Database verification complete!';
  RAISE NOTICE 'Review the results above to ensure all components are in place.';
END $$;
