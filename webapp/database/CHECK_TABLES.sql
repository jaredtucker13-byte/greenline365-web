-- ============================================
-- STEP 1: CHECK CURRENT STATE
-- ============================================
-- Run this first to see what exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('businesses', 'user_businesses', 'memory_identity_chunks', 'memory_knowledge_chunks');

-- If you see NONE of these tables, migration 007 never ran
-- If you see some but not all, migration 007 failed partway through
