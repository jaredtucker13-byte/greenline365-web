-- ============================================
-- PERFORMANCE OPTIMIZATION: ADD CRITICAL INDEXES
-- Run this in Supabase SQL Editor AFTER RLS fixes
-- ============================================

-- This script adds indexes to improve query performance
-- Target: Handle 1000+ concurrent users with <100ms query times

-- ============================================
-- EXISTING TABLES FROM SCHEMA.SQL
-- ============================================

-- BOOKINGS: Additional indexes
CREATE INDEX IF NOT EXISTS idx_bookings_email_status ON bookings(email, status);
CREATE INDEX IF NOT EXISTS idx_bookings_datetime ON bookings(preferred_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_industry ON bookings(industry) WHERE industry IS NOT NULL;

-- CONTENT_SCHEDULE: Performance indexes
CREATE INDEX IF NOT EXISTS idx_content_client_status ON content_schedule(client_id, status);
CREATE INDEX IF NOT EXISTS idx_content_scheduled_status ON content_schedule(scheduled_at, status) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_content_published ON content_schedule(published_at DESC) WHERE published_at IS NOT NULL;

-- LOCAL_TRENDS: Query optimization
CREATE INDEX IF NOT EXISTS idx_trends_location_date ON local_trends(location, event_date);
CREATE INDEX IF NOT EXISTS idx_trends_client_created ON local_trends(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_category_traffic ON local_trends(category, expected_traffic);

-- LEADS: Lead management indexes
CREATE INDEX IF NOT EXISTS idx_leads_email_phone ON leads(email, phone);
CREATE INDEX IF NOT EXISTS idx_leads_source_status ON leads(source, status);
CREATE INDEX IF NOT EXISTS idx_leads_conversation ON leads(conversation_id) WHERE conversation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_metadata_client ON leads((metadata->>'client_id')) WHERE metadata->>'client_id' IS NOT NULL;

-- ACTIVITY_LOG: Log query optimization
CREATE INDEX IF NOT EXISTS idx_activity_user_action ON activity_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_log(user_id, created_at DESC);

-- CLIENT_CONFIG: Config lookups
CREATE INDEX IF NOT EXISTS idx_client_config_updated ON client_config(updated_at DESC);

-- DEMO_SESSIONS: Demo management
CREATE INDEX IF NOT EXISTS idx_demo_sessions_scheduled ON demo_sessions(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demo_sessions_profile_status ON demo_sessions(demo_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_completed ON demo_sessions(completed_at DESC) WHERE completed_at IS NOT NULL;

-- DEMO_REQUESTS: Request processing
CREATE INDEX IF NOT EXISTS idx_demo_requests_website ON demo_requests(website_url) WHERE website_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demo_requests_profile_scrape ON demo_requests(selected_demo_profile_id, scrape_status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_updated ON demo_requests(updated_at DESC);

-- INGESTED_WEBSITE_DATA: Data retrieval
CREATE INDEX IF NOT EXISTS idx_ingested_expires ON ingested_website_data(expires_at) WHERE expires_at IS NOT NULL;

-- PROFILES: User lookups
CREATE INDEX IF NOT EXISTS idx_profiles_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_super_admin ON profiles(is_super_admin) WHERE is_super_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_updated ON profiles(updated_at DESC);

-- SITE_CONTENT: Content management
CREATE INDEX IF NOT EXISTS idx_site_content_updated ON site_content(updated_at DESC);

-- ============================================
-- ADDITIONAL TABLES (NOT IN SCHEMA.SQL)
-- These tables exist in Supabase but need indexes
-- ============================================

-- Add IF NOT EXISTS to prevent errors if tables don't exist yet

-- AGENT_MEMORIES
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_memories') THEN
    CREATE INDEX IF NOT EXISTS idx_agent_memories_user ON agent_memories(user_id);
    CREATE INDEX IF NOT EXISTS idx_agent_memories_created ON agent_memories(created_at DESC);
  END IF;
END $$;

-- API_USAGE_TRACKING
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'api_usage_tracking') THEN
    CREATE INDEX IF NOT EXISTS idx_api_usage_user ON api_usage_tracking(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage_tracking(endpoint);
    CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_tracking(created_at DESC);
  END IF;
END $$;

-- APPOINTMENTS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'appointments') THEN
    CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments(user_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_client ON appointments(client_id);
    CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_datetime);
    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
  END IF;
END $$;

-- BRAND_PROFILES
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'brand_profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_brand_profiles_client ON brand_profiles(client_id);
    CREATE INDEX IF NOT EXISTS idx_brand_profiles_updated ON brand_profiles(updated_at DESC);
  END IF;
END $$;

-- BUSINESSES
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'businesses') THEN
    CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
    CREATE INDEX IF NOT EXISTS idx_businesses_created ON businesses(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
  END IF;
END $$;

-- CHAT_MESSAGES
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
  END IF;
END $$;

-- CHAT_SESSIONS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_sessions') THEN
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_created ON chat_sessions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
  END IF;
END $$;

-- CLIENTS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clients') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
    CREATE INDEX IF NOT EXISTS idx_clients_created ON clients(created_at DESC);
  END IF;
END $$;

-- CONTENT_REQUESTS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_requests') THEN
    CREATE INDEX IF NOT EXISTS idx_content_requests_user ON content_requests(user_id);
    CREATE INDEX IF NOT EXISTS idx_content_requests_status ON content_requests(status);
    CREATE INDEX IF NOT EXISTS idx_content_requests_created ON content_requests(created_at DESC);
  END IF;
END $$;

-- CUSTOMERS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customers') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
    CREATE INDEX IF NOT EXISTS idx_customers_client ON customers(client_id);
    CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at DESC);
  END IF;
END $$;

-- EVENTS
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events') THEN
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
  END IF;
END $$;

-- GENERATED_CONTENT
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'generated_content') THEN
    CREATE INDEX IF NOT EXISTS idx_generated_content_user ON generated_content(user_id);
    CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
    CREATE INDEX IF NOT EXISTS idx_generated_content_created ON generated_content(created_at DESC);
  END IF;
END $$;

-- JOB_QUEUE
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_queue') THEN
    CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
    CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority DESC);
    CREATE INDEX IF NOT EXISTS idx_job_queue_created ON job_queue(created_at);
    CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue(scheduled_at) WHERE scheduled_at IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================

-- User + Time range queries (very common)
CREATE INDEX IF NOT EXISTS idx_activity_log_user_time ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_schedule_client_time ON content_schedule(client_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_leads_status_created ON leads(status, created_at DESC);

-- Multi-column WHERE clauses
CREATE INDEX IF NOT EXISTS idx_bookings_status_datetime ON bookings(status, preferred_datetime) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_content_status_scheduled ON content_schedule(status, scheduled_at) WHERE status = 'scheduled';

-- ============================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ============================================

-- Active/pending records only
CREATE INDEX IF NOT EXISTS idx_bookings_active ON bookings(preferred_datetime) WHERE status IN ('pending', 'confirmed');
CREATE INDEX IF NOT EXISTS idx_demo_sessions_upcoming ON demo_sessions(scheduled_at) WHERE status = 'scheduled' AND scheduled_at > NOW();

-- ============================================
-- TEXT SEARCH INDEXES (if full-text search needed)
-- ============================================

-- Add GIN indexes for JSONB columns with frequent searches
CREATE INDEX IF NOT EXISTS idx_leads_metadata_gin ON leads USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_content_schedule_metadata_gin ON content_schedule USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_client_config_settings_gin ON client_config USING GIN (settings);

-- ============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================

-- Update statistics for query planner optimization
ANALYZE bookings;
ANALYZE content_schedule;
ANALYZE local_trends;
ANALYZE leads;
ANALYZE activity_log;
ANALYZE profiles;
ANALYZE demo_sessions;
ANALYZE demo_requests;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count 
  FROM pg_indexes 
  WHERE schemaname = 'public';
  
  RAISE NOTICE '✅ Performance indexes added successfully!';
  RAISE NOTICE '📊 Total indexes in public schema: %', index_count;
  RAISE NOTICE '📋 Next steps:';
  RAISE NOTICE '1. Monitor slow query log';
  RAISE NOTICE '2. Run EXPLAIN ANALYZE on critical queries';
  RAISE NOTICE '3. Test with realistic data volume';
  RAISE NOTICE '4. Adjust indexes based on actual query patterns';
END $$;
