-- DIAGNOSTIC: What tables and columns do we have?
-- Run this first to see what exists

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
