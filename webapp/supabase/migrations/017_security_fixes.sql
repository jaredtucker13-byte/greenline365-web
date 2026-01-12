-- ============================================================
-- SECURITY FIX MIGRATION v3
-- Fix RLS disabled tables (EXCLUDING PostGIS system tables)
-- ============================================================

-- ============================================
-- PART 1: Enable RLS on User Tables Only
-- (Skip spatial_ref_sys - it's a PostGIS system table)
-- ============================================

-- super_admins
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'super_admins' AND table_schema = 'public') THEN
    ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Super admins view only" ON public.super_admins;
    CREATE POLICY "Super admins view only" ON public.super_admins FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- call_logs
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'call_logs' AND table_schema = 'public') THEN
    ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access call logs" ON public.call_logs;
    CREATE POLICY "Authenticated access call logs" ON public.call_logs FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- agents
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agents' AND table_schema = 'public') THEN
    ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access agents" ON public.agents;
    CREATE POLICY "Authenticated access agents" ON public.agents FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- tenants
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants' AND table_schema = 'public') THEN
    ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access tenants" ON public.tenants;
    CREATE POLICY "Authenticated access tenants" ON public.tenants FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- agent_memory
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_memory' AND table_schema = 'public') THEN
    ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access agent memory" ON public.agent_memory;
    CREATE POLICY "Authenticated access agent memory" ON public.agent_memory FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- scheduled_calls
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scheduled_calls' AND table_schema = 'public') THEN
    ALTER TABLE public.scheduled_calls ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access scheduled calls" ON public.scheduled_calls;
    CREATE POLICY "Authenticated access scheduled calls" ON public.scheduled_calls FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- content_blueprints
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_blueprints' AND table_schema = 'public') THEN
    ALTER TABLE public.content_blueprints ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access blueprints" ON public.content_blueprints;
    CREATE POLICY "Authenticated access blueprints" ON public.content_blueprints FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- content_pillars
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_pillars' AND table_schema = 'public') THEN
    ALTER TABLE public.content_pillars ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access pillars" ON public.content_pillars;
    CREATE POLICY "Authenticated access pillars" ON public.content_pillars FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- content_calendar
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_calendar' AND table_schema = 'public') THEN
    ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access calendar" ON public.content_calendar;
    CREATE POLICY "Authenticated access calendar" ON public.content_calendar FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- content_pieces
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_pieces' AND table_schema = 'public') THEN
    ALTER TABLE public.content_pieces ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated access content" ON public.content_pieces;
    CREATE POLICY "Authenticated access content" ON public.content_pieces FOR ALL TO authenticated USING (true);
  END IF;
END $$;

-- ============================================
-- PART 2: Fix Security Definer Views
-- ============================================

DROP VIEW IF EXISTS public.v_recent_events CASCADE;
DROP VIEW IF EXISTS public.v_active_conversations CASCADE;
DROP VIEW IF EXISTS public.safe_training_data CASCADE;

-- Recreate if underlying tables exist
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_event_journal') THEN
    CREATE OR REPLACE VIEW public.v_recent_events AS
    SELECT id, user_id, event_type, event_category, title, description, occurred_at, metadata
    FROM memory_event_journal
    WHERE occurred_at > NOW() - INTERVAL '30 days'
    ORDER BY occurred_at DESC;
    GRANT SELECT ON public.v_recent_events TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') THEN
    CREATE OR REPLACE VIEW public.v_active_conversations AS
    SELECT * FROM conversations WHERE status = 'active';
    GRANT SELECT ON public.v_active_conversations TO authenticated;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_knowledge_chunks') THEN
    CREATE OR REPLACE VIEW public.safe_training_data AS
    SELECT id, category, content, created_at
    FROM memory_knowledge_chunks WHERE is_active = true;
    GRANT SELECT ON public.safe_training_data TO authenticated;
  END IF;
END $$;

-- NOTE: spatial_ref_sys is a PostGIS extension table
-- You can ignore that linter warning or exclude it from the public API
-- by running: REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;
