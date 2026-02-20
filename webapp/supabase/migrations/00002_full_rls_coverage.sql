-- ============================================================
-- GREENLINE365 — FULL RLS COVERAGE + PERFORMANCE INDEXES
-- ============================================================
-- Covers ALL tables NOT already in 00001_consolidated_rls.sql.
-- Safe to re-run: every statement uses IF EXISTS / IF NOT EXISTS.
--
-- Table classification:
--   user_scoped  → user_id = auth.uid()
--   client_scoped → tenant_id / business_id checked via user_businesses
--   public_read  → SELECT true, write restricted
--   admin_only   → is_admin check
--   service_only → service_role only
-- ============================================================

-- ============================================
-- HELPER: reusable tenant-check function
-- ============================================
CREATE OR REPLACE FUNCTION public.user_owns_business(bid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_businesses
    WHERE user_id = auth.uid() AND business_id = bid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================
-- 1. BOOKINGS & SCHEDULING
-- ============================================

-- bookings (already has RLS in schema.sql but policies are too permissive)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='bookings') THEN
    ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Allow inserts for everyone" ON bookings;
    DROP POLICY IF EXISTS "Allow select for service role" ON bookings;
    DROP POLICY IF EXISTS "Allow updates for service role" ON bookings;
    DROP POLICY IF EXISTS "bookings_anon_insert" ON bookings;
    DROP POLICY IF EXISTS "bookings_auth_select" ON bookings;
    DROP POLICY IF EXISTS "bookings_service" ON bookings;
    -- Anyone can create a booking (public form)
    CREATE POLICY "bookings_anon_insert" ON bookings FOR INSERT WITH CHECK (true);
    -- Authenticated users see their own bookings; admins see all
    CREATE POLICY "bookings_auth_select" ON bookings FOR SELECT TO authenticated
      USING (email IN (SELECT email FROM profiles WHERE id = auth.uid())
             OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    -- Service role full access
    CREATE POLICY "bookings_service" ON bookings FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_bookings_preferred_dt ON bookings(preferred_datetime);
  END IF;
END $$;

-- scheduled_content
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='scheduled_content') THEN
    ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "scheduled_content_user" ON scheduled_content;
    DROP POLICY IF EXISTS "scheduled_content_service" ON scheduled_content;
    CREATE POLICY "scheduled_content_user" ON scheduled_content FOR ALL TO authenticated
      USING (client_id IN (SELECT client_id FROM profiles WHERE id = auth.uid()));
    CREATE POLICY "scheduled_content_service" ON scheduled_content FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_scheduled_content_client ON scheduled_content(client_id);
    CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
  END IF;
END $$;

-- scheduled_calls
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='scheduled_calls') THEN
    ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "scheduled_calls_tenant" ON scheduled_calls;
    DROP POLICY IF EXISTS "scheduled_calls_service" ON scheduled_calls;
    CREATE POLICY "scheduled_calls_tenant" ON scheduled_calls FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "scheduled_calls_service" ON scheduled_calls FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_scheduled_calls_tenant ON scheduled_calls(tenant_id);
  END IF;
END $$;

-- tenant_services
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='tenant_services') THEN
    ALTER TABLE tenant_services ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tenant_services_user" ON tenant_services;
    DROP POLICY IF EXISTS "tenant_services_service" ON tenant_services;
    CREATE POLICY "tenant_services_user" ON tenant_services FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "tenant_services_service" ON tenant_services FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- tenant_availability
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='tenant_availability') THEN
    ALTER TABLE tenant_availability ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tenant_availability_user" ON tenant_availability;
    DROP POLICY IF EXISTS "tenant_availability_service" ON tenant_availability;
    CREATE POLICY "tenant_availability_user" ON tenant_availability FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "tenant_availability_service" ON tenant_availability FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- blocked_times
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='blocked_times') THEN
    ALTER TABLE blocked_times ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "blocked_times_user" ON blocked_times;
    DROP POLICY IF EXISTS "blocked_times_service" ON blocked_times;
    CREATE POLICY "blocked_times_user" ON blocked_times FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "blocked_times_service" ON blocked_times FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 2. VOICE AI & COMMUNICATION
-- ============================================

-- call_logs
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='call_logs') THEN
    ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "call_logs_tenant" ON call_logs;
    DROP POLICY IF EXISTS "call_logs_service" ON call_logs;
    CREATE POLICY "call_logs_tenant" ON call_logs FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "call_logs_service" ON call_logs FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_call_logs_tenant ON call_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);
  END IF;
END $$;

-- call_audits
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='call_audits') THEN
    ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "call_audits_tenant" ON call_audits;
    DROP POLICY IF EXISTS "call_audits_service" ON call_audits;
    CREATE POLICY "call_audits_tenant" ON call_audits FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "call_audits_service" ON call_audits FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- weather_alerts
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='weather_alerts') THEN
    ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "weather_alerts_tenant" ON weather_alerts;
    DROP POLICY IF EXISTS "weather_alerts_service" ON weather_alerts;
    CREATE POLICY "weather_alerts_tenant" ON weather_alerts FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "weather_alerts_service" ON weather_alerts FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- warm_transfer_queue
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='warm_transfer_queue') THEN
    ALTER TABLE warm_transfer_queue ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "warm_transfer_tenant" ON warm_transfer_queue;
    DROP POLICY IF EXISTS "warm_transfer_service" ON warm_transfer_queue;
    CREATE POLICY "warm_transfer_tenant" ON warm_transfer_queue FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "warm_transfer_service" ON warm_transfer_queue FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- sms_messages
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='sms_messages') THEN
    ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "sms_tenant" ON sms_messages;
    DROP POLICY IF EXISTS "sms_service" ON sms_messages;
    CREATE POLICY "sms_tenant" ON sms_messages FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "sms_service" ON sms_messages FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_sms_tenant ON sms_messages(tenant_id);
  END IF;
END $$;

-- ============================================
-- 3. PROPERTIES & FIELD SERVICE
-- ============================================

-- properties
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='properties') THEN
    ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "properties_tenant" ON properties;
    DROP POLICY IF EXISTS "properties_service" ON properties;
    CREATE POLICY "properties_tenant" ON properties FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "properties_service" ON properties FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
  END IF;
END $$;

-- contacts (field-service contacts, not CRM)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='contacts') THEN
    ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "contacts_tenant" ON contacts;
    DROP POLICY IF EXISTS "contacts_service" ON contacts;
    CREATE POLICY "contacts_tenant" ON contacts FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "contacts_service" ON contacts FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
  END IF;
END $$;

-- assets
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='assets') THEN
    ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "assets_tenant" ON assets;
    DROP POLICY IF EXISTS "assets_service" ON assets;
    CREATE POLICY "assets_tenant" ON assets FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "assets_service" ON assets FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);
  END IF;
END $$;

-- interactions
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='interactions') THEN
    ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "interactions_tenant" ON interactions;
    DROP POLICY IF EXISTS "interactions_service" ON interactions;
    CREATE POLICY "interactions_tenant" ON interactions FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "interactions_service" ON interactions FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_interactions_tenant ON interactions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_property ON interactions(property_id);
  END IF;
END $$;

-- property_interactions
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='property_interactions') THEN
    ALTER TABLE property_interactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "property_interactions_tenant" ON property_interactions;
    DROP POLICY IF EXISTS "property_interactions_service" ON property_interactions;
    CREATE POLICY "property_interactions_tenant" ON property_interactions FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "property_interactions_service" ON property_interactions FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- incidents
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='incidents') THEN
    ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "incidents_tenant" ON incidents;
    DROP POLICY IF EXISTS "incidents_service" ON incidents;
    CREATE POLICY "incidents_tenant" ON incidents FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "incidents_service" ON incidents FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- incident_images
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='incident_images') THEN
    ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "incident_images_tenant" ON incident_images;
    DROP POLICY IF EXISTS "incident_images_service" ON incident_images;
    CREATE POLICY "incident_images_tenant" ON incident_images FOR ALL TO authenticated
      USING (incident_id IN (SELECT id FROM incidents WHERE public.user_owns_business(tenant_id)));
    CREATE POLICY "incident_images_service" ON incident_images FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- signature_events
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='signature_events') THEN
    ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "signature_events_tenant" ON signature_events;
    DROP POLICY IF EXISTS "signature_events_service" ON signature_events;
    CREATE POLICY "signature_events_tenant" ON signature_events FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "signature_events_service" ON signature_events FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 4. MULTI-TENANT & BUSINESS CONFIG
-- ============================================

-- user_businesses (junction table)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='user_businesses') THEN
    ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "ub_user" ON user_businesses;
    DROP POLICY IF EXISTS "ub_service" ON user_businesses;
    CREATE POLICY "ub_user" ON user_businesses FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "ub_service" ON user_businesses FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_ub_user ON user_businesses(user_id);
    CREATE INDEX IF NOT EXISTS idx_ub_business ON user_businesses(business_id);
  END IF;
END $$;

-- tenants (legacy)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='tenants') THEN
    ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "tenants_service" ON tenants;
    CREATE POLICY "tenants_service" ON tenants FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- business_themes
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='business_themes') THEN
    ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "business_themes_user" ON business_themes;
    DROP POLICY IF EXISTS "business_themes_service" ON business_themes;
    CREATE POLICY "business_themes_user" ON business_themes FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "business_themes_service" ON business_themes FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- custom_domains
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='custom_domains') THEN
    ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "custom_domains_user" ON custom_domains;
    DROP POLICY IF EXISTS "custom_domains_service" ON custom_domains;
    CREATE POLICY "custom_domains_user" ON custom_domains FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "custom_domains_service" ON custom_domains FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- pricing_tiers
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='pricing_tiers') THEN
    ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "pricing_tiers_read" ON pricing_tiers;
    DROP POLICY IF EXISTS "pricing_tiers_service" ON pricing_tiers;
    CREATE POLICY "pricing_tiers_read" ON pricing_tiers FOR SELECT USING (true);
    CREATE POLICY "pricing_tiers_service" ON pricing_tiers FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- industry_configs
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='industry_configs') THEN
    ALTER TABLE industry_configs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "industry_configs_tenant" ON industry_configs;
    DROP POLICY IF EXISTS "industry_configs_service" ON industry_configs;
    CREATE POLICY "industry_configs_tenant" ON industry_configs FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "industry_configs_service" ON industry_configs FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- location_flavors
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='location_flavors') THEN
    ALTER TABLE location_flavors ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "location_flavors_tenant" ON location_flavors;
    DROP POLICY IF EXISTS "location_flavors_service" ON location_flavors;
    CREATE POLICY "location_flavors_tenant" ON location_flavors FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "location_flavors_service" ON location_flavors FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- team_members
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='team_members') THEN
    ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "team_members_user" ON team_members;
    DROP POLICY IF EXISTS "team_members_service" ON team_members;
    CREATE POLICY "team_members_user" ON team_members FOR ALL TO authenticated
      USING (user_id = auth.uid() OR public.user_owns_business(business_id));
    CREATE POLICY "team_members_service" ON team_members FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 5. CONTENT MANAGEMENT
-- ============================================

-- blog_posts
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='blog_posts') THEN
    ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "blog_posts_public_read" ON blog_posts;
    DROP POLICY IF EXISTS "blog_posts_admin_write" ON blog_posts;
    DROP POLICY IF EXISTS "blog_posts_service" ON blog_posts;
    CREATE POLICY "blog_posts_public_read" ON blog_posts FOR SELECT USING (status = 'published' OR auth.role() = 'authenticated');
    CREATE POLICY "blog_posts_admin_write" ON blog_posts FOR ALL TO authenticated
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "blog_posts_service" ON blog_posts FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
    CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
  END IF;
END $$;

-- blog_categories
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='blog_categories') THEN
    ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "blog_categories_read" ON blog_categories;
    DROP POLICY IF EXISTS "blog_categories_service" ON blog_categories;
    CREATE POLICY "blog_categories_read" ON blog_categories FOR SELECT USING (true);
    CREATE POLICY "blog_categories_service" ON blog_categories FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- blog_analytics
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='blog_analytics') THEN
    ALTER TABLE blog_analytics ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "blog_analytics_admin" ON blog_analytics;
    DROP POLICY IF EXISTS "blog_analytics_service" ON blog_analytics;
    CREATE POLICY "blog_analytics_admin" ON blog_analytics FOR SELECT TO authenticated
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "blog_analytics_service" ON blog_analytics FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- content_blueprints (templates — public read)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_blueprints') THEN
    ALTER TABLE content_blueprints ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "content_blueprints_read" ON content_blueprints;
    DROP POLICY IF EXISTS "content_blueprints_service" ON content_blueprints;
    CREATE POLICY "content_blueprints_read" ON content_blueprints FOR SELECT USING (true);
    CREATE POLICY "content_blueprints_service" ON content_blueprints FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- content_pillars
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_pillars') THEN
    ALTER TABLE content_pillars ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "content_pillars_tenant" ON content_pillars;
    DROP POLICY IF EXISTS "content_pillars_service" ON content_pillars;
    CREATE POLICY "content_pillars_tenant" ON content_pillars FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "content_pillars_service" ON content_pillars FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- content_calendar
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_calendar') THEN
    ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "content_calendar_tenant" ON content_calendar;
    DROP POLICY IF EXISTS "content_calendar_service" ON content_calendar;
    CREATE POLICY "content_calendar_tenant" ON content_calendar FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "content_calendar_service" ON content_calendar FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- content_pieces
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_pieces') THEN
    ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "content_pieces_tenant" ON content_pieces;
    DROP POLICY IF EXISTS "content_pieces_service" ON content_pieces;
    CREATE POLICY "content_pieces_tenant" ON content_pieces FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "content_pieces_service" ON content_pieces FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- content_performance
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_performance') THEN
    ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "content_performance_tenant" ON content_performance;
    DROP POLICY IF EXISTS "content_performance_service" ON content_performance;
    CREATE POLICY "content_performance_tenant" ON content_performance FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "content_performance_service" ON content_performance FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 6. MEMORY & INTELLIGENCE SYSTEM
-- ============================================

-- memory_identity_chunks
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='memory_identity_chunks') THEN
    ALTER TABLE memory_identity_chunks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "mic_user" ON memory_identity_chunks;
    DROP POLICY IF EXISTS "mic_service" ON memory_identity_chunks;
    CREATE POLICY "mic_user" ON memory_identity_chunks FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "mic_service" ON memory_identity_chunks FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_mic_business ON memory_identity_chunks(business_id);
  END IF;
END $$;

-- memory_knowledge_chunks
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='memory_knowledge_chunks') THEN
    ALTER TABLE memory_knowledge_chunks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "mkc_user" ON memory_knowledge_chunks;
    DROP POLICY IF EXISTS "mkc_service" ON memory_knowledge_chunks;
    CREATE POLICY "mkc_user" ON memory_knowledge_chunks FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "mkc_service" ON memory_knowledge_chunks FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_mkc_business ON memory_knowledge_chunks(business_id);
  END IF;
END $$;

-- memory_core_profiles
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='memory_core_profiles') THEN
    ALTER TABLE memory_core_profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "mcp_user" ON memory_core_profiles;
    DROP POLICY IF EXISTS "mcp_service" ON memory_core_profiles;
    CREATE POLICY "mcp_user" ON memory_core_profiles FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "mcp_service" ON memory_core_profiles FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- memory_event_journal
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='memory_event_journal') THEN
    ALTER TABLE memory_event_journal ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "mej_user" ON memory_event_journal;
    DROP POLICY IF EXISTS "mej_service" ON memory_event_journal;
    CREATE POLICY "mej_user" ON memory_event_journal FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "mej_service" ON memory_event_journal FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- memory_context_buffer
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='memory_context_buffer') THEN
    ALTER TABLE memory_context_buffer ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "mcb_user" ON memory_context_buffer;
    DROP POLICY IF EXISTS "mcb_service" ON memory_context_buffer;
    CREATE POLICY "mcb_user" ON memory_context_buffer FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "mcb_service" ON memory_context_buffer FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- agent_memory
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='agent_memory') THEN
    ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "am_user" ON agent_memory;
    DROP POLICY IF EXISTS "am_service" ON agent_memory;
    CREATE POLICY "am_user" ON agent_memory FOR SELECT TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "am_service" ON agent_memory FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- agents (AI agent configs — service only)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='agents') THEN
    ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "agents_service" ON agents;
    CREATE POLICY "agents_service" ON agents FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 7. BRAIN SYSTEM
-- ============================================

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='brain_thoughts') THEN
    ALTER TABLE brain_thoughts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "brain_thoughts_user" ON brain_thoughts;
    DROP POLICY IF EXISTS "brain_thoughts_service" ON brain_thoughts;
    CREATE POLICY "brain_thoughts_user" ON brain_thoughts FOR ALL TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "brain_thoughts_service" ON brain_thoughts FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_brain_thoughts_user ON brain_thoughts(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='brain_people') THEN
    ALTER TABLE brain_people ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "brain_people_user" ON brain_people;
    DROP POLICY IF EXISTS "brain_people_service" ON brain_people;
    CREATE POLICY "brain_people_user" ON brain_people FOR ALL TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "brain_people_service" ON brain_people FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='brain_projects') THEN
    ALTER TABLE brain_projects ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "brain_projects_user" ON brain_projects;
    DROP POLICY IF EXISTS "brain_projects_service" ON brain_projects;
    CREATE POLICY "brain_projects_user" ON brain_projects FOR ALL TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "brain_projects_service" ON brain_projects FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='brain_ideas') THEN
    ALTER TABLE brain_ideas ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "brain_ideas_user" ON brain_ideas;
    DROP POLICY IF EXISTS "brain_ideas_service" ON brain_ideas;
    CREATE POLICY "brain_ideas_user" ON brain_ideas FOR ALL TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "brain_ideas_service" ON brain_ideas FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='brain_admin') THEN
    ALTER TABLE brain_admin ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "brain_admin_admin" ON brain_admin;
    DROP POLICY IF EXISTS "brain_admin_service" ON brain_admin;
    CREATE POLICY "brain_admin_admin" ON brain_admin FOR ALL TO authenticated
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "brain_admin_service" ON brain_admin FOR ALL TO service_role USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='brain_reminder_config') THEN
    ALTER TABLE brain_reminder_config ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "brain_reminder_user" ON brain_reminder_config;
    DROP POLICY IF EXISTS "brain_reminder_service" ON brain_reminder_config;
    CREATE POLICY "brain_reminder_user" ON brain_reminder_config FOR ALL TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "brain_reminder_service" ON brain_reminder_config FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 8. ANALYTICS & SOCIAL
-- ============================================

-- analytics_events
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='analytics_events') THEN
    ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "analytics_events_user" ON analytics_events;
    DROP POLICY IF EXISTS "analytics_events_service" ON analytics_events;
    CREATE POLICY "analytics_events_user" ON analytics_events FOR SELECT TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "analytics_events_service" ON analytics_events FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
  END IF;
END $$;

-- social_posts
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='social_posts') THEN
    ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "social_posts_user" ON social_posts;
    DROP POLICY IF EXISTS "social_posts_service" ON social_posts;
    CREATE POLICY "social_posts_user" ON social_posts FOR ALL TO authenticated USING (user_id = auth.uid());
    CREATE POLICY "social_posts_service" ON social_posts FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
  END IF;
END $$;

-- trend_history
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='trend_history') THEN
    ALTER TABLE trend_history ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "trend_history_tenant" ON trend_history;
    DROP POLICY IF EXISTS "trend_history_service" ON trend_history;
    CREATE POLICY "trend_history_tenant" ON trend_history FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "trend_history_service" ON trend_history FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- business_services
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='business_services') THEN
    ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "business_services_tenant" ON business_services;
    DROP POLICY IF EXISTS "business_services_service" ON business_services;
    CREATE POLICY "business_services_tenant" ON business_services FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "business_services_service" ON business_services FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- platform_metrics (service only — system-wide)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='platform_metrics') THEN
    ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "platform_metrics_admin" ON platform_metrics;
    DROP POLICY IF EXISTS "platform_metrics_service" ON platform_metrics;
    CREATE POLICY "platform_metrics_admin" ON platform_metrics FOR SELECT TO authenticated
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "platform_metrics_service" ON platform_metrics FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 9. EMAIL & CAMPAIGNS
-- ============================================

-- email_templates
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='email_templates') THEN
    ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "email_templates_auth" ON email_templates;
    DROP POLICY IF EXISTS "email_templates_service" ON email_templates;
    CREATE POLICY "email_templates_auth" ON email_templates FOR ALL TO authenticated
      USING (created_by = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "email_templates_service" ON email_templates FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- email_campaigns
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='email_campaigns') THEN
    ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "email_campaigns_user" ON email_campaigns;
    DROP POLICY IF EXISTS "email_campaigns_service" ON email_campaigns;
    CREATE POLICY "email_campaigns_user" ON email_campaigns FOR ALL TO authenticated
      USING (created_by = auth.uid());
    CREATE POLICY "email_campaigns_service" ON email_campaigns FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- email_sends
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='email_sends') THEN
    ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "email_sends_service" ON email_sends;
    CREATE POLICY "email_sends_service" ON email_sends FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- email_verifications
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='email_verifications') THEN
    ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "email_verifications_service" ON email_verifications;
    CREATE POLICY "email_verifications_service" ON email_verifications FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- email_unsubscribes
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='email_unsubscribes') THEN
    ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "email_unsub_service" ON email_unsubscribes;
    CREATE POLICY "email_unsub_service" ON email_unsubscribes FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- newsletter_subscribers (may differ from newsletter_subscriptions)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='newsletter_subscribers') THEN
    ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "newsletter_subscribers_insert" ON newsletter_subscribers;
    DROP POLICY IF EXISTS "newsletter_subscribers_admin" ON newsletter_subscribers;
    DROP POLICY IF EXISTS "newsletter_subscribers_service" ON newsletter_subscribers;
    CREATE POLICY "newsletter_subscribers_insert" ON newsletter_subscribers FOR INSERT WITH CHECK (true);
    CREATE POLICY "newsletter_subscribers_admin" ON newsletter_subscribers FOR SELECT TO authenticated
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "newsletter_subscribers_service" ON newsletter_subscribers FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 10. DESIGN & VISUAL
-- ============================================

-- design_proposals
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='design_proposals') THEN
    ALTER TABLE design_proposals ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "design_proposals_user" ON design_proposals;
    DROP POLICY IF EXISTS "design_proposals_service" ON design_proposals;
    CREATE POLICY "design_proposals_user" ON design_proposals FOR ALL TO authenticated
      USING (tenant_id = auth.uid());
    CREATE POLICY "design_proposals_service" ON design_proposals FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- living_canvas_frames
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='living_canvas_frames') THEN
    ALTER TABLE living_canvas_frames ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "lcf_tenant" ON living_canvas_frames;
    DROP POLICY IF EXISTS "lcf_service" ON living_canvas_frames;
    CREATE POLICY "lcf_tenant" ON living_canvas_frames FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "lcf_service" ON living_canvas_frames FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- living_canvas_templates
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='living_canvas_templates') THEN
    ALTER TABLE living_canvas_templates ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "lct_read" ON living_canvas_templates;
    DROP POLICY IF EXISTS "lct_service" ON living_canvas_templates;
    CREATE POLICY "lct_read" ON living_canvas_templates FOR SELECT USING (true);
    CREATE POLICY "lct_service" ON living_canvas_templates FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- living_canvas_compositions
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='living_canvas_compositions') THEN
    ALTER TABLE living_canvas_compositions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "lcc_tenant" ON living_canvas_compositions;
    DROP POLICY IF EXISTS "lcc_service" ON living_canvas_compositions;
    CREATE POLICY "lcc_tenant" ON living_canvas_compositions FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "lcc_service" ON living_canvas_compositions FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- style_presets
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='style_presets') THEN
    ALTER TABLE style_presets ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "style_presets_user" ON style_presets;
    DROP POLICY IF EXISTS "style_presets_service" ON style_presets;
    CREATE POLICY "style_presets_user" ON style_presets FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "style_presets_service" ON style_presets FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- signature_models
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='signature_models') THEN
    ALTER TABLE signature_models ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "signature_models_tenant" ON signature_models;
    DROP POLICY IF EXISTS "signature_models_service" ON signature_models;
    CREATE POLICY "signature_models_tenant" ON signature_models FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "signature_models_service" ON signature_models FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- studio_products
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='studio_products') THEN
    ALTER TABLE studio_products ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "studio_products_tenant" ON studio_products;
    DROP POLICY IF EXISTS "studio_products_service" ON studio_products;
    CREATE POLICY "studio_products_tenant" ON studio_products FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "studio_products_service" ON studio_products FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- studio_mockups
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='studio_mockups') THEN
    ALTER TABLE studio_mockups ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "studio_mockups_tenant" ON studio_mockups;
    DROP POLICY IF EXISTS "studio_mockups_service" ON studio_mockups;
    CREATE POLICY "studio_mockups_tenant" ON studio_mockups FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "studio_mockups_service" ON studio_mockups FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- mockup_scenes
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='mockup_scenes') THEN
    ALTER TABLE mockup_scenes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "mockup_scenes_read" ON mockup_scenes;
    DROP POLICY IF EXISTS "mockup_scenes_service" ON mockup_scenes;
    CREATE POLICY "mockup_scenes_read" ON mockup_scenes FOR SELECT USING (true);
    CREATE POLICY "mockup_scenes_service" ON mockup_scenes FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 11. ACCESS CONTROL & AUTH
-- ============================================

-- phone_otp
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='phone_otp') THEN
    ALTER TABLE phone_otp ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "phone_otp_service" ON phone_otp;
    CREATE POLICY "phone_otp_service" ON phone_otp FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- access_codes
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='access_codes') THEN
    ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "access_codes_service" ON access_codes;
    CREATE POLICY "access_codes_service" ON access_codes FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- code_redemptions
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='code_redemptions') THEN
    ALTER TABLE code_redemptions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "code_redemptions_service" ON code_redemptions;
    CREATE POLICY "code_redemptions_service" ON code_redemptions FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- entitlement_overrides
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='entitlement_overrides') THEN
    ALTER TABLE entitlement_overrides ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "entitlement_overrides_admin" ON entitlement_overrides;
    DROP POLICY IF EXISTS "entitlement_overrides_service" ON entitlement_overrides;
    CREATE POLICY "entitlement_overrides_admin" ON entitlement_overrides FOR ALL TO authenticated
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "entitlement_overrides_service" ON entitlement_overrides FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- super_admins
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='super_admins') THEN
    ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "super_admins_service" ON super_admins;
    CREATE POLICY "super_admins_service" ON super_admins FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 12. DIRECTORY & REFERRALS
-- ============================================

-- directory_listings
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='directory_listings') THEN
    ALTER TABLE directory_listings ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "dir_listings_read" ON directory_listings;
    DROP POLICY IF EXISTS "dir_listings_owner" ON directory_listings;
    DROP POLICY IF EXISTS "dir_listings_service" ON directory_listings;
    CREATE POLICY "dir_listings_read" ON directory_listings FOR SELECT USING (true);
    CREATE POLICY "dir_listings_owner" ON directory_listings FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "dir_listings_service" ON directory_listings FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- directory_badges
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='directory_badges') THEN
    ALTER TABLE directory_badges ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "dir_badges_read" ON directory_badges;
    DROP POLICY IF EXISTS "dir_badges_service" ON directory_badges;
    CREATE POLICY "dir_badges_read" ON directory_badges FOR SELECT USING (true);
    CREATE POLICY "dir_badges_service" ON directory_badges FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- directory_feedback
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='directory_feedback') THEN
    ALTER TABLE directory_feedback ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "dir_feedback_insert" ON directory_feedback;
    DROP POLICY IF EXISTS "dir_feedback_service" ON directory_feedback;
    CREATE POLICY "dir_feedback_insert" ON directory_feedback FOR INSERT WITH CHECK (true);
    CREATE POLICY "dir_feedback_service" ON directory_feedback FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- contractor_directory
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='contractor_directory') THEN
    ALTER TABLE contractor_directory ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "contractor_dir_tenant" ON contractor_directory;
    DROP POLICY IF EXISTS "contractor_dir_service" ON contractor_directory;
    CREATE POLICY "contractor_dir_tenant" ON contractor_directory FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "contractor_dir_service" ON contractor_directory FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- contractor_reviews
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='contractor_reviews') THEN
    ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "contractor_reviews_user" ON contractor_reviews;
    DROP POLICY IF EXISTS "contractor_reviews_service" ON contractor_reviews;
    CREATE POLICY "contractor_reviews_user" ON contractor_reviews FOR ALL TO authenticated
      USING (reviewer_id = auth.uid());
    CREATE POLICY "contractor_reviews_service" ON contractor_reviews FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- referrals
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='referrals') THEN
    ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "referrals_tenant" ON referrals;
    DROP POLICY IF EXISTS "referrals_service" ON referrals;
    CREATE POLICY "referrals_tenant" ON referrals FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "referrals_service" ON referrals FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 13. STORAGE & BILLING
-- ============================================

-- filing_cabinet
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='filing_cabinet') THEN
    ALTER TABLE filing_cabinet ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "filing_cabinet_tenant" ON filing_cabinet;
    DROP POLICY IF EXISTS "filing_cabinet_service" ON filing_cabinet;
    CREATE POLICY "filing_cabinet_tenant" ON filing_cabinet FOR ALL TO authenticated
      USING (public.user_owns_business(business_id));
    CREATE POLICY "filing_cabinet_service" ON filing_cabinet FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- storage_usage_events
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='storage_usage_events') THEN
    ALTER TABLE storage_usage_events ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "storage_events_tenant" ON storage_usage_events;
    DROP POLICY IF EXISTS "storage_events_service" ON storage_usage_events;
    CREATE POLICY "storage_events_tenant" ON storage_usage_events FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "storage_events_service" ON storage_usage_events FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- tenant_storage_summary
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='tenant_storage_summary') THEN
    ALTER TABLE tenant_storage_summary ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "storage_summary_tenant" ON tenant_storage_summary;
    DROP POLICY IF EXISTS "storage_summary_service" ON tenant_storage_summary;
    CREATE POLICY "storage_summary_tenant" ON tenant_storage_summary FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "storage_summary_service" ON tenant_storage_summary FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- storage_alerts
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='storage_alerts') THEN
    ALTER TABLE storage_alerts ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "storage_alerts_tenant" ON storage_alerts;
    DROP POLICY IF EXISTS "storage_alerts_service" ON storage_alerts;
    CREATE POLICY "storage_alerts_tenant" ON storage_alerts FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "storage_alerts_service" ON storage_alerts FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- payment_transactions
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='payment_transactions') THEN
    ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "payment_tx_tenant" ON payment_transactions;
    DROP POLICY IF EXISTS "payment_tx_service" ON payment_transactions;
    CREATE POLICY "payment_tx_tenant" ON payment_transactions FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "payment_tx_service" ON payment_transactions FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 14. WEBSITE & CMS
-- ============================================

-- website_projects
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='website_projects') THEN
    ALTER TABLE website_projects ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "website_projects_user" ON website_projects;
    DROP POLICY IF EXISTS "website_projects_service" ON website_projects;
    CREATE POLICY "website_projects_user" ON website_projects FOR ALL TO authenticated
      USING (user_id = auth.uid());
    CREATE POLICY "website_projects_service" ON website_projects FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- crm_sync_logs
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='crm_sync_logs') THEN
    ALTER TABLE crm_sync_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "crm_sync_tenant" ON crm_sync_logs;
    DROP POLICY IF EXISTS "crm_sync_service" ON crm_sync_logs;
    CREATE POLICY "crm_sync_tenant" ON crm_sync_logs FOR ALL TO authenticated
      USING (public.user_owns_business(tenant_id));
    CREATE POLICY "crm_sync_service" ON crm_sync_logs FOR ALL TO service_role USING (true);
  END IF;
END $$;

-- ============================================
-- 15. AUDIT & COMPLIANCE
-- ============================================

-- audit_logs (append-only for compliance)
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs') THEN
    ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "audit_logs_admin_read" ON audit_logs;
    DROP POLICY IF EXISTS "audit_logs_service" ON audit_logs;
    CREATE POLICY "audit_logs_admin_read" ON audit_logs FOR SELECT TO authenticated
      USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));
    CREATE POLICY "audit_logs_service" ON audit_logs FOR ALL TO service_role USING (true);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 16. CATCH-ALL: remaining tables from Supabase
-- ============================================
-- Any table that exists but wasn't explicitly handled above gets
-- service_role-only as a safe default. This prevents unauthenticated access.

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
      AND tablename NOT IN ('spatial_ref_sys', 'geography_columns', 'geometry_columns')
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    EXECUTE format(
      'CREATE POLICY "default_service_only_%s" ON %I FOR ALL TO service_role USING (true)',
      tbl.tablename, tbl.tablename
    );
    RAISE NOTICE 'Enabled RLS + service_role default on: %', tbl.tablename;
  END LOOP;
END $$;

-- ============================================
-- 17. VERIFICATION
-- ============================================

DO $$
DECLARE
  rls_count INTEGER;
  total_count INTEGER;
  no_rls_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM pg_tables WHERE schemaname = 'public';
  SELECT COUNT(*) INTO rls_count FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;
  no_rls_count := total_count - rls_count;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS COVERAGE: % / % tables', rls_count, total_count;
  IF no_rls_count > 0 THEN
    RAISE NOTICE 'WARNING: % tables still without RLS', no_rls_count;
  ELSE
    RAISE NOTICE 'ALL tables have RLS enabled';
  END IF;
  RAISE NOTICE '========================================';
END $$;
