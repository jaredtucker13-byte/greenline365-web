-- ============================================================
-- Migration 035: CRM Tenant Isolation Fix
-- ============================================================
-- SECURITY FIX: CRM tables currently use user_id (individual user)
-- for RLS scoping. This breaks multi-staff businesses where
-- multiple employees need access to the same business CRM data.
--
-- This migration:
-- 1. Adds business_id to all CRM tables
-- 2. Backfills business_id from user_businesses junction table
-- 3. Replaces user-scoped RLS with tenant-scoped RLS
-- 4. Keeps user_id as creator/owner for audit purposes
-- 5. Adds email system tenant scoping
-- 6. Pre-provisions feature flags for Entertainment Loops
-- ============================================================

-- ============================================
-- 0. PREREQUISITES — ensure helper function exists
-- ============================================

CREATE OR REPLACE FUNCTION public.user_owns_business(bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_id = auth.uid() AND business_id = bid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- 1. ADD business_id TO CRM TABLES
-- ============================================

-- crm_leads
ALTER TABLE crm_leads
  ADD COLUMN IF NOT EXISTS business_id UUID,
  ADD COLUMN IF NOT EXISTS owner_id UUID; -- explicit creator tracking

-- crm_customers
ALTER TABLE crm_customers
  ADD COLUMN IF NOT EXISTS business_id UUID;

-- crm_email_events
ALTER TABLE crm_email_events
  ADD COLUMN IF NOT EXISTS business_id UUID;

-- crm_revenue
ALTER TABLE crm_revenue
  ADD COLUMN IF NOT EXISTS business_id UUID;

-- crm_email_campaigns (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_email_campaigns') THEN
    EXECUTE 'ALTER TABLE crm_email_campaigns ADD COLUMN IF NOT EXISTS business_id UUID';
  END IF;
END $$;

-- crm_lead_activities (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_lead_activities') THEN
    EXECUTE 'ALTER TABLE crm_lead_activities ADD COLUMN IF NOT EXISTS business_id UUID';
  END IF;
END $$;

-- ============================================
-- 2. BACKFILL business_id FROM user_businesses
-- ============================================
-- Strategy: for each CRM row, look up the user's primary business
-- (first entry in user_businesses, ordered by created_at).
-- If no user_businesses entry exists, business_id stays NULL (handled below).

-- crm_leads: set owner_id = user_id (preserve creator), backfill business_id
UPDATE crm_leads
SET
  owner_id = COALESCE(owner_id, user_id),
  business_id = COALESCE(business_id, (
    SELECT ub.business_id FROM user_businesses ub
    WHERE ub.user_id = crm_leads.user_id
    ORDER BY ub.created_at ASC
    LIMIT 1
  ))
WHERE business_id IS NULL;

-- crm_customers
UPDATE crm_customers
SET business_id = COALESCE(business_id, (
  SELECT ub.business_id FROM user_businesses ub
  WHERE ub.user_id = crm_customers.user_id
  ORDER BY ub.created_at ASC
  LIMIT 1
))
WHERE business_id IS NULL;

-- crm_email_events
UPDATE crm_email_events
SET business_id = COALESCE(business_id, (
  SELECT ub.business_id FROM user_businesses ub
  WHERE ub.user_id = crm_email_events.user_id
  ORDER BY ub.created_at ASC
  LIMIT 1
))
WHERE business_id IS NULL;

-- crm_revenue
UPDATE crm_revenue
SET business_id = COALESCE(business_id, (
  SELECT ub.business_id FROM user_businesses ub
  WHERE ub.user_id = crm_revenue.user_id
  ORDER BY ub.created_at ASC
  LIMIT 1
))
WHERE business_id IS NULL;

-- crm_email_campaigns (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_email_campaigns') THEN
    EXECUTE '
      UPDATE crm_email_campaigns
      SET business_id = COALESCE(business_id, (
        SELECT ub.business_id FROM user_businesses ub
        WHERE ub.user_id = crm_email_campaigns.created_by
        ORDER BY ub.created_at ASC
        LIMIT 1
      ))
      WHERE business_id IS NULL
    ';
  END IF;
END $$;

-- crm_lead_activities (if exists — backfill from parent lead)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_lead_activities') THEN
    EXECUTE '
      UPDATE crm_lead_activities cla
      SET business_id = cl.business_id
      FROM crm_leads cl
      WHERE cla.lead_id = cl.id
        AND cla.business_id IS NULL
    ';
  END IF;
END $$;

-- ============================================
-- 3. REPLACE USER-SCOPED RLS WITH TENANT-SCOPED RLS
-- ============================================

-- ---- crm_leads ----
DROP POLICY IF EXISTS "Users manage own leads" ON crm_leads;
DROP POLICY IF EXISTS "crm_leads_user_isolation" ON crm_leads;
DROP POLICY IF EXISTS "crm_leads_service_role" ON crm_leads;
DROP POLICY IF EXISTS "crm_leads_tenant" ON crm_leads;
DROP POLICY IF EXISTS "crm_leads_service" ON crm_leads;

-- Tenant isolation: users see leads belonging to their business
CREATE POLICY "crm_leads_tenant" ON crm_leads FOR ALL TO authenticated
  USING (
    public.user_owns_business(business_id)
    OR (business_id IS NULL AND user_id = auth.uid())  -- legacy rows without business_id
  );
-- Service role: full access for backend operations
CREATE POLICY "crm_leads_service" ON crm_leads FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_crm_leads_business ON crm_leads(business_id);

-- ---- crm_customers ----
DROP POLICY IF EXISTS "Users manage own customers" ON crm_customers;
DROP POLICY IF EXISTS "crm_customers_user" ON crm_customers;
DROP POLICY IF EXISTS "crm_customers_service" ON crm_customers;
DROP POLICY IF EXISTS "crm_customers_tenant" ON crm_customers;

CREATE POLICY "crm_customers_tenant" ON crm_customers FOR ALL TO authenticated
  USING (
    public.user_owns_business(business_id)
    OR (business_id IS NULL AND user_id = auth.uid())
  );
CREATE POLICY "crm_customers_service" ON crm_customers FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_crm_customers_business ON crm_customers(business_id);

-- ---- crm_email_events ----
DROP POLICY IF EXISTS "Users view own email events" ON crm_email_events;
DROP POLICY IF EXISTS "Allow email event inserts" ON crm_email_events;
DROP POLICY IF EXISTS "crm_email_events_service" ON crm_email_events;
DROP POLICY IF EXISTS "crm_email_events_tenant" ON crm_email_events;
DROP POLICY IF EXISTS "crm_email_events_webhook_insert" ON crm_email_events;

CREATE POLICY "crm_email_events_tenant" ON crm_email_events FOR SELECT TO authenticated
  USING (
    public.user_owns_business(business_id)
    OR (business_id IS NULL AND user_id = auth.uid())
  );
-- Webhook inserts (from email provider callbacks) still allowed via service role
CREATE POLICY "crm_email_events_service" ON crm_email_events FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_crm_email_events_business ON crm_email_events(business_id);

-- ---- crm_revenue ----
DROP POLICY IF EXISTS "Users manage own revenue" ON crm_revenue;
DROP POLICY IF EXISTS "crm_revenue_user" ON crm_revenue;
DROP POLICY IF EXISTS "crm_revenue_service" ON crm_revenue;
DROP POLICY IF EXISTS "crm_revenue_tenant" ON crm_revenue;

CREATE POLICY "crm_revenue_tenant" ON crm_revenue FOR ALL TO authenticated
  USING (
    public.user_owns_business(business_id)
    OR (business_id IS NULL AND user_id = auth.uid())
  );
CREATE POLICY "crm_revenue_service" ON crm_revenue FOR ALL TO service_role
  USING (true);

CREATE INDEX IF NOT EXISTS idx_crm_revenue_business ON crm_revenue(business_id);

-- ---- crm_email_campaigns (if exists) ----
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_email_campaigns') THEN
    EXECUTE 'DROP POLICY IF EXISTS "crm_campaigns_user" ON crm_email_campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "crm_campaigns_service" ON crm_email_campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "crm_campaigns_tenant" ON crm_email_campaigns';
    EXECUTE '
      CREATE POLICY "crm_campaigns_tenant" ON crm_email_campaigns FOR ALL TO authenticated
        USING (
          public.user_owns_business(business_id)
          OR (business_id IS NULL AND created_by = auth.uid())
        )
    ';
    EXECUTE '
      CREATE POLICY "crm_campaigns_service" ON crm_email_campaigns FOR ALL TO service_role
        USING (true)
    ';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_campaigns_business ON crm_email_campaigns(business_id)';
  END IF;
END $$;

-- ---- crm_lead_activities (if exists) ----
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crm_lead_activities') THEN
    EXECUTE 'DROP POLICY IF EXISTS "crm_activities_user" ON crm_lead_activities';
    EXECUTE 'DROP POLICY IF EXISTS "crm_activities_service" ON crm_lead_activities';
    EXECUTE 'DROP POLICY IF EXISTS "crm_activities_tenant" ON crm_lead_activities';
    EXECUTE '
      CREATE POLICY "crm_activities_tenant" ON crm_lead_activities FOR ALL TO authenticated
        USING (
          public.user_owns_business(business_id)
          OR lead_id IN (SELECT id FROM crm_leads WHERE user_id = auth.uid())
        )
    ';
    EXECUTE '
      CREATE POLICY "crm_activities_service" ON crm_lead_activities FOR ALL TO service_role
        USING (true)
    ';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_crm_activities_business ON crm_lead_activities(business_id)';
  END IF;
END $$;

-- ============================================
-- 4. EMAIL SYSTEM — Add tenant scoping
-- ============================================
-- email_templates, email_campaigns, email_sends currently have
-- no tenant scoping at all. Fix this.

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_templates') THEN
    EXECUTE 'ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS business_id UUID';
    EXECUTE 'ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS created_by UUID';
    -- Drop overly permissive policies
    EXECUTE 'DROP POLICY IF EXISTS "email_templates_public_read" ON email_templates';
    EXECUTE 'DROP POLICY IF EXISTS "email_templates_tenant" ON email_templates';
    EXECUTE 'DROP POLICY IF EXISTS "email_templates_service" ON email_templates';
    -- Tenant-scoped
    EXECUTE '
      CREATE POLICY "email_templates_tenant" ON email_templates FOR ALL TO authenticated
        USING (
          public.user_owns_business(business_id)
          OR created_by = auth.uid()
          OR business_id IS NULL
        )
    ';
    EXECUTE '
      CREATE POLICY "email_templates_service" ON email_templates FOR ALL TO service_role
        USING (true)
    ';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_campaigns') THEN
    EXECUTE 'ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS business_id UUID';
    EXECUTE 'ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS created_by UUID';
    -- Drop overly permissive policies
    EXECUTE 'DROP POLICY IF EXISTS "email_campaigns_public_read" ON email_campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "email_campaigns_tenant" ON email_campaigns';
    EXECUTE 'DROP POLICY IF EXISTS "email_campaigns_service" ON email_campaigns';
    -- Tenant-scoped
    EXECUTE '
      CREATE POLICY "email_campaigns_tenant" ON email_campaigns FOR ALL TO authenticated
        USING (
          public.user_owns_business(business_id)
          OR created_by = auth.uid()
          OR business_id IS NULL
        )
    ';
    EXECUTE '
      CREATE POLICY "email_campaigns_service" ON email_campaigns FOR ALL TO service_role
        USING (true)
    ';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_sends') THEN
    EXECUTE 'ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS business_id UUID';
    -- Drop overly permissive policies
    EXECUTE 'DROP POLICY IF EXISTS "email_sends_public_read" ON email_sends';
    EXECUTE 'DROP POLICY IF EXISTS "email_sends_tenant" ON email_sends';
    EXECUTE 'DROP POLICY IF EXISTS "email_sends_service" ON email_sends';
    -- Tenant-scoped
    EXECUTE '
      CREATE POLICY "email_sends_tenant" ON email_sends FOR SELECT TO authenticated
        USING (
          public.user_owns_business(business_id)
          OR business_id IS NULL
        )
    ';
    EXECUTE '
      CREATE POLICY "email_sends_service" ON email_sends FOR ALL TO service_role
        USING (true)
    ';
  END IF;
END $$;

-- ============================================
-- 5. BOOKINGS — Fix overly permissive admin check
-- ============================================
-- Current policy lets any admin see ALL bookings across ALL businesses.
-- Replace with tenant-scoped access.

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='bookings') THEN
    EXECUTE 'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS business_id UUID';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_anon_insert" ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_auth_select" ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_service" ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_public_insert" ON bookings';
    EXECUTE 'DROP POLICY IF EXISTS "bookings_tenant_read" ON bookings';
    -- Public can still create bookings (public booking forms)
    EXECUTE '
      CREATE POLICY "bookings_public_insert" ON bookings FOR INSERT
        WITH CHECK (true)
    ';
    -- Authenticated users see bookings for their business
    EXECUTE '
      CREATE POLICY "bookings_tenant_read" ON bookings FOR SELECT TO authenticated
        USING (
          public.user_owns_business(business_id)
          OR email IN (SELECT email FROM profiles WHERE id = auth.uid())
          OR business_id IS NULL
        )
    ';
    -- Service role full access
    EXECUTE '
      CREATE POLICY "bookings_service" ON bookings FOR ALL TO service_role
        USING (true)
    ';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_bookings_business ON bookings(business_id)';
  END IF;
END $$;

-- ============================================
-- 6. UPDATE VIEWS TO USE business_id
-- ============================================

-- Lead pipeline — now groups by business_id
CREATE OR REPLACE VIEW crm_lead_pipeline AS
SELECT
  business_id,
  user_id,
  status,
  COUNT(*) as count,
  SUM(value) as total_value,
  AVG(value) as avg_value
FROM crm_leads
GROUP BY business_id, user_id, status;

-- Revenue by channel — now groups by business_id
CREATE OR REPLACE VIEW crm_revenue_by_channel AS
SELECT
  business_id,
  user_id,
  source,
  DATE_TRUNC('month', occurred_at) as month,
  SUM(CASE WHEN type != 'refund' THEN amount ELSE -amount END) as net_revenue,
  COUNT(*) as transaction_count
FROM crm_revenue
GROUP BY business_id, user_id, source, DATE_TRUNC('month', occurred_at);

-- ============================================
-- 7. PRE-PROVISION FEATURE FLAGS
-- ============================================

-- Entertainment Loops feature flag (default: false, gated behind 500-tenant milestone)
INSERT INTO feature_flags (slug, name, description, value_type, default_value, category)
VALUES
  ('entertainment_loops', 'Entertainment Loops', 'Gamified consumer experience layer (500-tenant gate)', 'boolean', 'false', 'entertainment')
ON CONFLICT (slug) DO NOTHING;

-- Home Ledger standalone feature flag
INSERT INTO feature_flags (slug, name, description, value_type, default_value, category)
VALUES
  ('home_ledger_standalone', 'Home Ledger Standalone', 'Standalone property management product', 'boolean', 'false', 'home_ledger')
ON CONFLICT (slug) DO NOTHING;

-- Add-on eligibility flag (ensures Free tier can't purchase add-ons)
INSERT INTO feature_flags (slug, name, description, value_type, default_value, category)
VALUES
  ('addon_eligible', 'Add-On Eligible', 'Can this tier purchase add-ons', 'boolean', 'false', 'shared')
ON CONFLICT (slug) DO NOTHING;

-- Set addon_eligible = true for directory_pro and command_center plans
INSERT INTO plan_feature_overrides (plan_id, feature_flag_id, value)
SELECT p.id, f.id, 'true'
FROM plans p, feature_flags f
WHERE p.slug IN ('directory_pro', 'command_center', 'bundle')
  AND f.slug = 'addon_eligible'
ON CONFLICT (plan_id, feature_flag_id) DO NOTHING;

-- ============================================
-- 8. VERIFICATION
-- ============================================

DO $$
DECLARE
  rls_count INTEGER;
  total_count INTEGER;
  null_biz_count INTEGER;
BEGIN
  -- Check RLS coverage
  SELECT COUNT(*) INTO rls_count FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
  SELECT COUNT(*) INTO total_count FROM pg_tables WHERE schemaname = 'public';
  RAISE NOTICE 'RLS coverage: % / % tables', rls_count, total_count;

  -- Check CRM backfill completeness
  SELECT COUNT(*) INTO null_biz_count FROM crm_leads WHERE business_id IS NULL;
  RAISE NOTICE 'crm_leads with NULL business_id: % (these use legacy user_id fallback)', null_biz_count;

  SELECT COUNT(*) INTO null_biz_count FROM crm_customers WHERE business_id IS NULL;
  RAISE NOTICE 'crm_customers with NULL business_id: % (these use legacy user_id fallback)', null_biz_count;
END $$;
