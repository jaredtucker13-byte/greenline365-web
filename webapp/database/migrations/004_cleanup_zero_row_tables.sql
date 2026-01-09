-- ============================================
-- IDENTIFY AND CLEANUP ZERO-ROW TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- STEP 1: QUERY TO FIND ALL ZERO-ROW TABLES
-- Run this first to see which tables are empty:

DO $$
DECLARE
  r RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'ZERO-ROW TABLES ANALYSIS';
  RAISE NOTICE '================================================';
  
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('SELECT count(*) FROM %I', r.tablename) INTO row_count;
    
    IF row_count = 0 THEN
      RAISE NOTICE 'Table: % | Rows: 0 | ACTION NEEDED', r.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Review the list above and decide:';
  RAISE NOTICE '- DELETE: Unused/legacy tables';
  RAISE NOTICE '- KEEP: Tables awaiting future data';
  RAISE NOTICE '- DOCUMENT: Add comments explaining their purpose';
END $$;

-- ============================================
-- STEP 2: ADD COMMENTS TO TABLES
-- Document the purpose of each table
-- ============================================

-- Example: Add descriptions to existing tables
COMMENT ON TABLE bookings IS 'Customer booking requests and appointments';
COMMENT ON TABLE content_schedule IS 'Scheduled social media posts and content';
COMMENT ON TABLE local_trends IS 'Daily Trend Hunter: Local events and opportunities';
COMMENT ON TABLE leads IS 'Lead capture from chat, forms, and bookings';
COMMENT ON TABLE activity_log IS 'Auto-journaling: Tracks all user actions';
COMMENT ON TABLE client_config IS 'White-label configuration per client';
COMMENT ON TABLE profiles IS 'User profiles linked to auth.users';
COMMENT ON TABLE demo_profiles IS 'Demo configurations for B2B sales presentations';
COMMENT ON TABLE demo_sessions IS 'Demo booking requests and scheduled sessions';
COMMENT ON TABLE industries IS 'Industry categories for demo targeting';
COMMENT ON TABLE waitlist_submissions IS 'Early access waitlist signups';
COMMENT ON TABLE newsletter_subscriptions IS 'Email newsletter subscribers';
COMMENT ON TABLE demo_requests IS 'Demo requests with website scraping queue';
COMMENT ON TABLE ingested_website_data IS 'Scraped website data for demo personalization';
COMMENT ON TABLE demo_local_pulse_events IS 'Seeded demo events for presentations';
COMMENT ON TABLE demo_weekly_trend_ideas IS 'Seeded content ideas for demos';
COMMENT ON TABLE site_content IS 'CMS content for legal pages (terms, privacy, etc)';
COMMENT ON TABLE site_settings IS 'Global site configuration settings';

-- Add comments to other tables as needed
-- COMMENT ON TABLE [table_name] IS '[description]';

-- ============================================
-- STEP 3: SAFE TABLE DELETION
-- Only run this after confirming tables are truly unused
-- ============================================

-- Template for safely dropping tables:
/*
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'unused_table_name') THEN
    DROP TABLE IF EXISTS unused_table_name CASCADE;
    RAISE NOTICE 'Dropped table: unused_table_name';
  END IF;
END $$;
*/

-- Example: Drop PostGIS-related tables if not using spatial data
-- (Only if PostGIS extension is not being used)
/*
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    DROP TABLE IF EXISTS geography_columns CASCADE;
    DROP TABLE IF EXISTS geometry_columns CASCADE;
    RAISE NOTICE 'Dropped PostGIS tables (extension not installed)';
  END IF;
END $$;
*/

-- ============================================
-- STEP 4: EXPORT TABLE STATISTICS
-- Generate a report of all tables with metadata
-- ============================================

SELECT 
  t.tablename,
  pg_size_pretty(pg_total_relation_size('public.'||t.tablename)) AS total_size,
  (SELECT count(*) FROM pg_indexes WHERE tablename = t.tablename) as index_count,
  t.rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = t.tablename) as policy_count,
  obj_description(('public.'||t.tablename)::regclass) as table_description
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Cleanup analysis complete!';
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Review zero-row tables list';
  RAISE NOTICE '2. Add descriptions using COMMENT ON TABLE';
  RAISE NOTICE '3. Drop truly unused tables';
  RAISE NOTICE '4. Export statistics for documentation';
END $$;