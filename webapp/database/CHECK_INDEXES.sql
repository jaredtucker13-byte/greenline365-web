-- ============================================
-- CHECK SMS TABLE AND INDEXES
-- ============================================

-- 1. Check if sms_messages table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'sms_messages'
) as sms_messages_exists;

-- 2. List ALL indexes on Real-Feel tables
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages', 'agent_memory')
ORDER BY tablename, indexname;

-- 3. Check businesses table columns
SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'businesses'
  AND column_name IN ('is_weather_dependent', 'weather_threshold', 'tenant_status', 'zip_code', 'retell_agent_id', 'twilio_phone_number', 'context_config')
ORDER BY column_name;

-- 4. Check if bookings table exists (needed for foreign key)
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'bookings'
) as bookings_exists;
