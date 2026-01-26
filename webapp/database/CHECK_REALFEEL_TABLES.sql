-- Check the structure of the Real-Feel tables
-- to see if they have business_id columns

-- Check call_logs structure
SELECT 'call_logs' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'call_logs'
ORDER BY ordinal_position;

-- Check call_audits structure
SELECT 'call_audits' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'call_audits'
ORDER BY ordinal_position;

-- Check if sms_messages exists and its structure
SELECT 'sms_messages' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'sms_messages'
ORDER BY ordinal_position;
