-- ============================================================
-- STEP 2: Check column names in existing tables
-- This shows us if tables use user_id or tenant_id
-- ============================================================

SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('crm_leads', 'crm_customers', 'crm_revenue', 'social_connections', 'audit_logs', 'memory_core_profiles', 'memory_knowledge_chunks')
AND column_name IN ('user_id', 'tenant_id', 'owner_id')
ORDER BY table_name, column_name;
