-- ============================================================
-- SECURITY FIX MIGRATION
-- Fix RLS disabled tables and Security Definer views
-- Run this to pass Supabase security linter
-- ============================================================

-- ============================================
-- PART 1: Enable RLS on Tables Missing It
-- ============================================

-- super_admins - Admin users table
ALTER TABLE IF EXISTS public.super_admins ENABLE ROW LEVEL SECURITY;

-- Only allow super admins to view this table
DROP POLICY IF EXISTS "Super admins only" ON public.super_admins;
CREATE POLICY "Super admins only" 
  ON public.super_admins FOR ALL 
  TO authenticated 
  USING (
    auth.uid() IN (SELECT user_id FROM public.super_admins)
  );

-- call_logs - Voice call logs
ALTER TABLE IF EXISTS public.call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own call logs" ON public.call_logs;
CREATE POLICY "Users view own call logs" 
  ON public.call_logs FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- agents - AI agents configuration
ALTER TABLE IF EXISTS public.agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own agents" ON public.agents;
CREATE POLICY "Users manage own agents" 
  ON public.agents FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- tenants - Multi-tenant table
ALTER TABLE IF EXISTS public.tenants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own tenant" ON public.tenants;
CREATE POLICY "Users view own tenant" 
  ON public.tenants FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- agent_memory - AI agent memory
ALTER TABLE IF EXISTS public.agent_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own agent memory" ON public.agent_memory;
CREATE POLICY "Users manage own agent memory" 
  ON public.agent_memory FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- scheduled_calls - Scheduled voice calls
ALTER TABLE IF EXISTS public.scheduled_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own scheduled calls" ON public.scheduled_calls;
CREATE POLICY "Users manage own scheduled calls" 
  ON public.scheduled_calls FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- content_blueprints - Content templates
ALTER TABLE IF EXISTS public.content_blueprints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own blueprints" ON public.content_blueprints;
CREATE POLICY "Users manage own blueprints" 
  ON public.content_blueprints FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- Allow public read for shared blueprints
DROP POLICY IF EXISTS "Public read shared blueprints" ON public.content_blueprints;
CREATE POLICY "Public read shared blueprints" 
  ON public.content_blueprints FOR SELECT 
  TO authenticated 
  USING (is_public = true OR user_id = auth.uid());

-- content_pillars - Content categories/pillars
ALTER TABLE IF EXISTS public.content_pillars ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own pillars" ON public.content_pillars;
CREATE POLICY "Users manage own pillars" 
  ON public.content_pillars FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- content_calendar - Content scheduling
ALTER TABLE IF EXISTS public.content_calendar ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own calendar" ON public.content_calendar;
CREATE POLICY "Users manage own calendar" 
  ON public.content_calendar FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- content_pieces - Individual content items
ALTER TABLE IF EXISTS public.content_pieces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own content" ON public.content_pieces;
CREATE POLICY "Users manage own content" 
  ON public.content_pieces FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- spatial_ref_sys - PostGIS system table (usually shouldn't be exposed)
-- This is a PostGIS extension table - best to restrict it
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Block all access (it's a system table)
DROP POLICY IF EXISTS "Block spatial_ref_sys access" ON public.spatial_ref_sys;
CREATE POLICY "Block spatial_ref_sys access" 
  ON public.spatial_ref_sys FOR ALL 
  TO authenticated 
  USING (false);

-- ============================================
-- PART 2: Fix Security Definer Views
-- These bypass RLS - we need to drop and recreate without SECURITY DEFINER
-- ============================================

-- Drop problematic views
DROP VIEW IF EXISTS public.v_recent_events CASCADE;
DROP VIEW IF EXISTS public.v_active_conversations CASCADE;
DROP VIEW IF EXISTS public.safe_training_data CASCADE;

-- Recreate v_recent_events WITHOUT security definer
-- This view respects the caller's RLS policies
CREATE OR REPLACE VIEW public.v_recent_events AS
SELECT 
  id,
  user_id,
  event_type,
  event_category,
  title,
  description,
  occurred_at,
  metadata
FROM memory_event_journal
WHERE occurred_at > NOW() - INTERVAL '30 days'
ORDER BY occurred_at DESC;

-- Grant access (RLS on underlying table will filter results)
GRANT SELECT ON public.v_recent_events TO authenticated;

-- Recreate v_active_conversations WITHOUT security definer
CREATE OR REPLACE VIEW public.v_active_conversations AS
SELECT 
  id,
  user_id,
  session_id,
  started_at,
  last_message_at,
  message_count,
  status
FROM conversations
WHERE status = 'active'
  AND last_message_at > NOW() - INTERVAL '24 hours';

-- Grant access
GRANT SELECT ON public.v_active_conversations TO authenticated;

-- Recreate safe_training_data WITHOUT security definer
-- This should only show non-sensitive, anonymized data
CREATE OR REPLACE VIEW public.safe_training_data AS
SELECT 
  id,
  category,
  content,
  created_at
FROM memory_knowledge_chunks
WHERE is_active = true
  AND category NOT IN ('anti-knowledge', 'policies'); -- Exclude sensitive categories

-- Grant access
GRANT SELECT ON public.safe_training_data TO authenticated;

-- ============================================
-- PART 3: Add missing user_id columns if needed
-- Some tables might not have user_id - add it
-- ============================================

-- Check and add user_id to tables if missing
DO $$
BEGIN
  -- Add user_id to content_blueprints if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_blueprints' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.content_blueprints ADD COLUMN user_id UUID;
  END IF;
  
  -- Add is_public to content_blueprints if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_blueprints' AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.content_blueprints ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;
  
  -- Add user_id to content_pillars if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_pillars' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.content_pillars ADD COLUMN user_id UUID;
  END IF;
  
  -- Add user_id to content_calendar if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_calendar' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.content_calendar ADD COLUMN user_id UUID;
  END IF;
  
  -- Add user_id to content_pieces if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'content_pieces' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.content_pieces ADD COLUMN user_id UUID;
  END IF;
  
  -- Add user_id to call_logs if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.call_logs ADD COLUMN user_id UUID;
  END IF;
  
  -- Add user_id to agents if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN user_id UUID;
  END IF;
  
  -- Add user_id to agent_memory if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_memory' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.agent_memory ADD COLUMN user_id UUID;
  END IF;
  
  -- Add user_id to scheduled_calls if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'scheduled_calls' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.scheduled_calls ADD COLUMN user_id UUID;
  END IF;
  
  -- Add user_id to tenants if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.tenants ADD COLUMN user_id UUID;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- Run this to check RLS is enabled on all tables
-- ============================================

-- This should return no rows after running the migration
-- SELECT tablename FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename NOT IN ('schema_migrations')
-- AND NOT EXISTS (
--   SELECT 1 FROM pg_class c
--   JOIN pg_namespace n ON n.oid = c.relnamespace
--   WHERE c.relname = tablename
--   AND n.nspname = 'public'
--   AND c.relrowsecurity = true
-- );
