-- ============================================
-- DIAGNOSTIC: Check what tables exist
-- Run this FIRST to see your current state
-- ============================================

SELECT '=== CHECKING DATABASE STATE ===' as status;

-- Check for key tables
SELECT 
  'businesses' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
  'user_businesses' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_businesses') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
  'profiles' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

SELECT 
  'access_codes' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_codes') 
    THEN '✅ EXISTS' ELSE '❌ MISSING' END as status;

-- Check user_businesses columns (if exists)
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'user_businesses'
ORDER BY ordinal_position;

-- Check businesses columns (if exists)
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'businesses'
ORDER BY ordinal_position;
