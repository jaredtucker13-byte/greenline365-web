-- ============================================================
-- MIGRATION 020: Fix Tenant Isolation RLS Policies
-- ============================================================
-- PROBLEM: Multiple tables have RLS policies with USING (true),
-- which allows ANY authenticated user to read ALL records across
-- ALL tenants. This is a critical security flaw for a multi-tenant
-- platform.
--
-- SOLUTION: Replace permissive policies with ownership-based checks
-- so each user can only access records belonging to their own tenant.
--
-- TABLES AFFECTED:
--   tenants, scheduled_calls, call_logs, agents, agent_memory,
--   content_blueprints, content_pillars, content_calendar, content_pieces
--
-- APPROACH:
--   1. Add owner_id column to tenants (links to auth.users)
--   2. Add tenant_id to call_logs if missing
--   3. Create helper function user_tenant_ids() for reuse
--   4. Drop all USING(true) policies and replace with proper checks
--   5. Add separate SELECT/INSERT/UPDATE/DELETE policies
-- ============================================================


-- ============================================================
-- STEP 1: Add owner_id to tenants table
-- This is the critical link between auth.users and tenant ownership.
-- Previously, tenants only had owner_email (text) with no FK to auth.
-- ============================================================

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Backfill owner_id from profiles where email matches owner_email.
-- This links existing tenants to their Supabase auth user.
UPDATE tenants t
SET owner_id = p.id
FROM profiles p
WHERE t.owner_email = p.email
  AND t.owner_id IS NULL;

-- Index for fast lookups when checking tenant ownership
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON tenants(owner_id);


-- ============================================================
-- STEP 2: Add tenant_id to call_logs if missing
-- The original 002_voice_ai_tables.sql created call_logs without
-- tenant_id, but later migrations (00002) assume it exists.
-- ============================================================

ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_call_logs_tenant ON call_logs(tenant_id);


-- ============================================================
-- STEP 3: Create helper function user_tenant_ids()
-- Returns all tenant IDs owned by the current authenticated user.
-- Used in RLS policies to avoid repeating the subquery everywhere.
-- Marked STABLE + SECURITY DEFINER so it can read the tenants table
-- even when called from within an RLS policy context.
-- ============================================================

CREATE OR REPLACE FUNCTION public.user_tenant_ids()
RETURNS SETOF UUID AS $$
  SELECT id FROM public.tenants WHERE owner_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION public.user_tenant_ids() IS
  'Returns all tenant IDs owned by the currently authenticated user. '
  'Used by RLS policies to enforce tenant isolation.';


-- ============================================================
-- STEP 4: Fix RLS policies per table
-- For each table:
--   a) Drop ALL existing permissive policies
--   b) Create granular SELECT/INSERT/UPDATE/DELETE policies
--   c) Add service_role bypass for backend/API operations
-- ============================================================


-- ============================================================
-- 4a. TENANTS TABLE
-- Ownership check: owner_id = auth.uid()
-- A user can only see/modify tenants they own.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Allow all for authenticated" ON tenants;
    DROP POLICY IF EXISTS "Authenticated access tenants" ON tenants;
    DROP POLICY IF EXISTS "tenants_select" ON tenants;
    DROP POLICY IF EXISTS "tenants_insert" ON tenants;
    DROP POLICY IF EXISTS "tenants_update" ON tenants;
    DROP POLICY IF EXISTS "tenants_delete" ON tenants;
    DROP POLICY IF EXISTS "tenants_service_role" ON tenants;

    -- SELECT: Users can only see their own tenants
    CREATE POLICY "tenants_select" ON tenants
      FOR SELECT TO authenticated
      USING (owner_id = auth.uid());

    -- INSERT: Users can create tenants and must set themselves as owner
    CREATE POLICY "tenants_insert" ON tenants
      FOR INSERT TO authenticated
      WITH CHECK (owner_id = auth.uid());

    -- UPDATE: Users can only update their own tenants
    CREATE POLICY "tenants_update" ON tenants
      FOR UPDATE TO authenticated
      USING (owner_id = auth.uid())
      WITH CHECK (owner_id = auth.uid());

    -- DELETE: Users can only delete their own tenants
    CREATE POLICY "tenants_delete" ON tenants
      FOR DELETE TO authenticated
      USING (owner_id = auth.uid());

    -- SERVICE ROLE: Full access for backend/API operations (webhooks, cron, etc.)
    CREATE POLICY "tenants_service_role" ON tenants
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4b. SCHEDULED_CALLS TABLE
-- Has tenant_id. Users can only access calls for their own tenants.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_calls') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Allow all for authenticated" ON scheduled_calls;
    DROP POLICY IF EXISTS "Authenticated access scheduled calls" ON scheduled_calls;
    DROP POLICY IF EXISTS "scheduled_calls_tenant" ON scheduled_calls;
    DROP POLICY IF EXISTS "scheduled_calls_select" ON scheduled_calls;
    DROP POLICY IF EXISTS "scheduled_calls_insert" ON scheduled_calls;
    DROP POLICY IF EXISTS "scheduled_calls_update" ON scheduled_calls;
    DROP POLICY IF EXISTS "scheduled_calls_delete" ON scheduled_calls;
    DROP POLICY IF EXISTS "scheduled_calls_service_role" ON scheduled_calls;

    -- SELECT: Only see calls belonging to your tenants
    CREATE POLICY "scheduled_calls_select" ON scheduled_calls
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- INSERT: Can only create calls for your own tenants
    CREATE POLICY "scheduled_calls_insert" ON scheduled_calls
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- UPDATE: Can only update calls for your own tenants
    CREATE POLICY "scheduled_calls_update" ON scheduled_calls
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- DELETE: Can only delete calls for your own tenants
    CREATE POLICY "scheduled_calls_delete" ON scheduled_calls
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- SERVICE ROLE: Full access for backend operations
    CREATE POLICY "scheduled_calls_service_role" ON scheduled_calls
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4c. CALL_LOGS TABLE
-- Has tenant_id (added in step 2 if missing).
-- Users can only see call logs for their own tenants.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'call_logs') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON call_logs;
    DROP POLICY IF EXISTS "Authenticated access call logs" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_tenant" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_select" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_insert" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_update" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_delete" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_service" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_service_role" ON call_logs;

    -- SELECT: Only see logs belonging to your tenants
    CREATE POLICY "call_logs_select" ON call_logs
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- INSERT: Can only insert logs for your own tenants
    CREATE POLICY "call_logs_insert" ON call_logs
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- UPDATE: Can only update logs for your own tenants
    CREATE POLICY "call_logs_update" ON call_logs
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- DELETE: Can only delete logs for your own tenants
    CREATE POLICY "call_logs_delete" ON call_logs
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- SERVICE ROLE: Full access for backend operations (Retell webhooks, etc.)
    CREATE POLICY "call_logs_service_role" ON call_logs
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4d. AGENTS TABLE
-- Agents do NOT have tenant_id or user_id. They are shared
-- resources assigned to tenants via tenants.booking_agent_id
-- and tenants.sales_agent_id.
--
-- Policy: Users can SELECT agents assigned to their tenants.
-- Only service_role can create/update/delete agents (admin action).
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agents') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Authenticated access agents" ON agents;
    DROP POLICY IF EXISTS "agents_select" ON agents;
    DROP POLICY IF EXISTS "agents_service_role" ON agents;

    -- SELECT: Users can see agents that are assigned to their tenants.
    -- An agent is visible if any of the user's tenants references it.
    CREATE POLICY "agents_select" ON agents
      FOR SELECT TO authenticated
      USING (
        id IN (
          SELECT booking_agent_id FROM tenants WHERE owner_id = auth.uid()
          UNION
          SELECT sales_agent_id FROM tenants WHERE owner_id = auth.uid()
        )
      );

    -- INSERT/UPDATE/DELETE: Only service_role (admin operations)
    -- Agent management is a platform-level action, not per-tenant.
    CREATE POLICY "agents_service_role" ON agents
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4e. AGENT_MEMORY TABLE
-- Has tenant_id. Users can only access memory records for their tenants.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_memory') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Authenticated access agent memory" ON agent_memory;
    DROP POLICY IF EXISTS "agent_memory_select" ON agent_memory;
    DROP POLICY IF EXISTS "agent_memory_insert" ON agent_memory;
    DROP POLICY IF EXISTS "agent_memory_update" ON agent_memory;
    DROP POLICY IF EXISTS "agent_memory_delete" ON agent_memory;
    DROP POLICY IF EXISTS "agent_memory_service_role" ON agent_memory;

    -- SELECT: Only see memory for your own tenants
    CREATE POLICY "agent_memory_select" ON agent_memory
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- INSERT: Can only create memory for your own tenants
    CREATE POLICY "agent_memory_insert" ON agent_memory
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- UPDATE: Can only update memory for your own tenants
    CREATE POLICY "agent_memory_update" ON agent_memory
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- DELETE: Can only delete memory for your own tenants
    CREATE POLICY "agent_memory_delete" ON agent_memory
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- SERVICE ROLE: Full access for backend operations
    CREATE POLICY "agent_memory_service_role" ON agent_memory
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4f. CONTENT_BLUEPRINTS TABLE
-- Has NO tenant_id or user_id. These are shared format templates
-- (e.g. "The Problem Crusher", "The Authority Stack").
--
-- Policy: All authenticated users can READ blueprints (they are
-- shared resources). Only service_role can create/update/delete.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_blueprints') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Authenticated access blueprints" ON content_blueprints;
    DROP POLICY IF EXISTS "content_blueprints_select" ON content_blueprints;
    DROP POLICY IF EXISTS "content_blueprints_service_role" ON content_blueprints;

    -- SELECT: All authenticated users can read shared blueprints
    -- Blueprints are platform-level templates, not tenant-specific data.
    CREATE POLICY "content_blueprints_select" ON content_blueprints
      FOR SELECT TO authenticated
      USING (true);

    -- INSERT/UPDATE/DELETE: Only service_role (admin operations)
    CREATE POLICY "content_blueprints_service_role" ON content_blueprints
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4g. CONTENT_PILLARS TABLE
-- Has tenant_id. Users can only access pillars for their tenants.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_pillars') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Authenticated access pillars" ON content_pillars;
    DROP POLICY IF EXISTS "content_pillars_select" ON content_pillars;
    DROP POLICY IF EXISTS "content_pillars_insert" ON content_pillars;
    DROP POLICY IF EXISTS "content_pillars_update" ON content_pillars;
    DROP POLICY IF EXISTS "content_pillars_delete" ON content_pillars;
    DROP POLICY IF EXISTS "content_pillars_service_role" ON content_pillars;

    -- SELECT: Only see pillars belonging to your tenants
    CREATE POLICY "content_pillars_select" ON content_pillars
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- INSERT: Can only create pillars for your own tenants
    CREATE POLICY "content_pillars_insert" ON content_pillars
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- UPDATE: Can only update pillars for your own tenants
    CREATE POLICY "content_pillars_update" ON content_pillars
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- DELETE: Can only delete pillars for your own tenants
    CREATE POLICY "content_pillars_delete" ON content_pillars
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- SERVICE ROLE: Full access for backend operations
    CREATE POLICY "content_pillars_service_role" ON content_pillars
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4h. CONTENT_CALENDAR TABLE
-- Has tenant_id. Users can only access calendar entries for their tenants.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_calendar') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Authenticated access calendar" ON content_calendar;
    DROP POLICY IF EXISTS "content_calendar_select" ON content_calendar;
    DROP POLICY IF EXISTS "content_calendar_insert" ON content_calendar;
    DROP POLICY IF EXISTS "content_calendar_update" ON content_calendar;
    DROP POLICY IF EXISTS "content_calendar_delete" ON content_calendar;
    DROP POLICY IF EXISTS "content_calendar_service_role" ON content_calendar;

    -- SELECT: Only see calendar entries belonging to your tenants
    CREATE POLICY "content_calendar_select" ON content_calendar
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- INSERT: Can only create entries for your own tenants
    CREATE POLICY "content_calendar_insert" ON content_calendar
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- UPDATE: Can only update entries for your own tenants
    CREATE POLICY "content_calendar_update" ON content_calendar
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- DELETE: Can only delete entries for your own tenants
    CREATE POLICY "content_calendar_delete" ON content_calendar
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- SERVICE ROLE: Full access for backend operations
    CREATE POLICY "content_calendar_service_role" ON content_calendar
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- 4i. CONTENT_PIECES TABLE
-- Has tenant_id. Users can only access content pieces for their tenants.
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'content_pieces') THEN

    -- Drop all known permissive policies
    DROP POLICY IF EXISTS "Authenticated access content" ON content_pieces;
    DROP POLICY IF EXISTS "content_pieces_select" ON content_pieces;
    DROP POLICY IF EXISTS "content_pieces_insert" ON content_pieces;
    DROP POLICY IF EXISTS "content_pieces_update" ON content_pieces;
    DROP POLICY IF EXISTS "content_pieces_delete" ON content_pieces;
    DROP POLICY IF EXISTS "content_pieces_service_role" ON content_pieces;

    -- SELECT: Only see content pieces belonging to your tenants
    CREATE POLICY "content_pieces_select" ON content_pieces
      FOR SELECT TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- INSERT: Can only create pieces for your own tenants
    CREATE POLICY "content_pieces_insert" ON content_pieces
      FOR INSERT TO authenticated
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- UPDATE: Can only update pieces for your own tenants
    CREATE POLICY "content_pieces_update" ON content_pieces
      FOR UPDATE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()))
      WITH CHECK (tenant_id IN (SELECT public.user_tenant_ids()));

    -- DELETE: Can only delete pieces for your own tenants
    CREATE POLICY "content_pieces_delete" ON content_pieces
      FOR DELETE TO authenticated
      USING (tenant_id IN (SELECT public.user_tenant_ids()));

    -- SERVICE ROLE: Full access for backend operations
    CREATE POLICY "content_pieces_service_role" ON content_pieces
      FOR ALL TO service_role
      USING (true);

  END IF;
END $$;


-- ============================================================
-- STEP 5: Verification query
-- Run this after applying the migration to confirm all policies
-- are correctly in place and no USING(true) policies remain
-- on the affected tables.
-- ============================================================
DO $$
DECLARE
  permissive_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO permissive_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN (
      'tenants', 'scheduled_calls', 'call_logs', 'agents',
      'agent_memory', 'content_blueprints', 'content_pillars',
      'content_calendar', 'content_pieces'
    )
    AND qual = 'true'
    AND roles @> ARRAY['authenticated'];

  IF permissive_count > 0 THEN
    RAISE WARNING '[020] Found % remaining USING(true) policies on tenant tables for authenticated role. Manual review recommended.', permissive_count;
  ELSE
    RAISE NOTICE '[020] Tenant isolation RLS migration complete. All USING(true) policies replaced.';
  END IF;
END $$;
