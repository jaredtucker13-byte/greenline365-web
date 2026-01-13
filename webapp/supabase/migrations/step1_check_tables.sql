-- ============================================================
-- STEP 1: Check what tables already exist
-- Run this FIRST to see your current state
-- ============================================================

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('crm_leads', 'crm_customers', 'crm_revenue', 'social_connections', 'audit_logs')
ORDER BY table_name;
