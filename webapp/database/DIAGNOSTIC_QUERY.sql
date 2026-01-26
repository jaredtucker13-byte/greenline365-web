-- ============================================
-- DIAGNOSTIC QUERY - RUN THIS FIRST
-- ============================================
-- This will show us what tables and columns exist
-- Copy and paste this into Supabase SQL Editor and run it

-- Check if businesses table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'businesses'
) as businesses_exists;

-- Check if bookings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'bookings'
) as bookings_exists;

-- Check what columns businesses table has (if it exists)
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'businesses'
ORDER BY ordinal_position;

-- List all tables in public schema
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check which Real-Feel tables already exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('call_logs', 'call_audits', 'weather_alerts', 'warm_transfer_queue', 'sms_messages', 'agent_memory')
ORDER BY table_name;
