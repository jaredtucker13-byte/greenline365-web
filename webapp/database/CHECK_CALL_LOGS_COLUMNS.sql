-- Check what columns call_logs actually has
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'call_logs'
ORDER BY ordinal_position;
