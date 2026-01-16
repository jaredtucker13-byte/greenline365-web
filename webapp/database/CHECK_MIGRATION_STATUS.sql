-- ============================================
-- MIGRATION STATUS CHECKER
-- ============================================
-- Run this in Supabase SQL Editor to see which migrations you need

-- Check 1: Do the main tables exist?
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'businesses') 
    THEN '✅ businesses exists' 
    ELSE '❌ RUN: CLEAN_MIGRATION_ALL_IN_ONE.sql' 
  END as table_businesses,
  
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_businesses') 
    THEN '✅ user_businesses exists' 
    ELSE '❌ RUN: CLEAN_MIGRATION_ALL_IN_ONE.sql' 
  END as table_user_businesses,
  
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_codes') 
    THEN '✅ access_codes exists' 
    ELSE '❌ RUN: CLEAN_MIGRATION_ALL_IN_ONE.sql' 
  END as table_access_codes,
  
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_identity_chunks') 
    THEN '✅ memory_identity_chunks exists' 
    ELSE '❌ RUN: CLEAN_MIGRATION_ALL_IN_ONE.sql' 
  END as table_memory_identity,
  
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_knowledge_chunks') 
    THEN '✅ memory_knowledge_chunks exists' 
    ELSE '❌ RUN: CLEAN_MIGRATION_ALL_IN_ONE.sql' 
  END as table_memory_knowledge;

-- Check 2: Does access_codes have the created_by column?
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'access_codes' 
    AND column_name = 'created_by'
  ) 
    THEN '✅ created_by column exists' 
    ELSE '❌ RUN: FIX_ACCESS_CODES_COLUMN.sql' 
  END as access_codes_created_by;

-- Check 3: Do RLS policies exist for access_codes?
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'access_codes'
  ) 
    THEN '✅ RLS policies exist for access_codes' 
    ELSE '❌ RUN: FIX_PROFILE_AND_RLS.sql' 
  END as access_codes_rls;

-- Check 4: Are you marked as admin?
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = '677b536d-6521-4ac8-a0a5-98278b35f4cc' 
    AND is_admin = true
  ) 
    THEN '✅ You are an admin' 
    ELSE '❌ RUN: FIX_PROFILE_AND_RLS.sql' 
  END as admin_status;

-- Check 5: Are you linked to any businesses?
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM user_businesses 
    WHERE user_id = '677b536d-6521-4ac8-a0a5-98278b35f4cc'
  ) 
    THEN '✅ You are linked to businesses' 
    ELSE '⚠️ OPTIONAL: You can link yourself to test businesses later' 
  END as business_linkage;

-- ============================================
-- SUMMARY REPORT
-- ============================================
-- After running the above checks, you'll see ✅ or ❌ for each item
-- Only run the migrations that show ❌
