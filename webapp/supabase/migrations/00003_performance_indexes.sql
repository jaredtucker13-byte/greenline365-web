-- ============================================================
-- GREENLINE365 — CRITICAL PERFORMANCE INDEXES
-- ============================================================
-- Adds missing indexes for foreign keys, status columns,
-- timestamps, and common query patterns.
-- Safe to re-run: all IF NOT EXISTS.
-- ============================================================

-- ============================================
-- 1. PROFILES (core lookup table)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;
CREATE INDEX IF NOT EXISTS idx_profiles_client_id ON profiles(client_id);

-- ============================================
-- 2. BOOKINGS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(source);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_preferred_dt ON bookings(preferred_datetime);
CREATE INDEX IF NOT EXISTS idx_bookings_status_dt ON bookings(status, preferred_datetime);

-- ============================================
-- 3. BLOG POSTS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published ON blog_posts(status, published_at DESC);

-- ============================================
-- 4. CRM TABLES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON crm_leads(source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_priority ON crm_leads(priority);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner ON crm_leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_leads_owner_status ON crm_leads(owner_id, status);

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='crm_lead_activities') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_lead_activities(lead_id);
    CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_lead_activities(activity_type);
    CREATE INDEX IF NOT EXISTS idx_crm_activities_created ON crm_lead_activities(created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='crm_email_events') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_ee_lead ON crm_email_events(lead_id);
    CREATE INDEX IF NOT EXISTS idx_crm_ee_email ON crm_email_events(email);
    CREATE INDEX IF NOT EXISTS idx_crm_ee_type ON crm_email_events(event_type);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='crm_customers') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_customers_user ON crm_customers(user_id);
    CREATE INDEX IF NOT EXISTS idx_crm_customers_email ON crm_customers(email);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='crm_revenue') THEN
    CREATE INDEX IF NOT EXISTS idx_crm_revenue_user ON crm_revenue(user_id);
    CREATE INDEX IF NOT EXISTS idx_crm_revenue_date ON crm_revenue(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 5. CONTENT MANAGEMENT
-- ============================================
CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON content_schedule(status);
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled ON content_schedule(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_schedule_client ON content_schedule(client_id);

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='scheduled_content') THEN
    CREATE INDEX IF NOT EXISTS idx_sched_content_client ON scheduled_content(client_id);
    CREATE INDEX IF NOT EXISTS idx_sched_content_status ON scheduled_content(status);
    CREATE INDEX IF NOT EXISTS idx_sched_content_scheduled ON scheduled_content(scheduled_at);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_pillars') THEN
    CREATE INDEX IF NOT EXISTS idx_content_pillars_tenant ON content_pillars(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_calendar') THEN
    CREATE INDEX IF NOT EXISTS idx_content_cal_tenant ON content_calendar(tenant_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='content_pieces') THEN
    CREATE INDEX IF NOT EXISTS idx_content_pieces_tenant ON content_pieces(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON content_pieces(status);
  END IF;
END $$;

-- ============================================
-- 6. PROPERTIES & FIELD SERVICE
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='properties') THEN
    CREATE INDEX IF NOT EXISTS idx_properties_tenant ON properties(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='contacts') THEN
    CREATE INDEX IF NOT EXISTS idx_contacts_tenant ON contacts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_property ON contacts(property_id);
    CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='assets') THEN
    CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_assets_property ON assets(property_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='interactions') THEN
    CREATE INDEX IF NOT EXISTS idx_interactions_tenant ON interactions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_property ON interactions(property_id);
    CREATE INDEX IF NOT EXISTS idx_interactions_created ON interactions(created_at DESC);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='incidents') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON incidents(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_property ON incidents(property_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
  END IF;
END $$;

-- ============================================
-- 7. VOICE AI & COMMUNICATION
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='call_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_call_logs_tenant ON call_logs(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_call_logs_status ON call_logs(status);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='sms_messages') THEN
    CREATE INDEX IF NOT EXISTS idx_sms_tenant ON sms_messages(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_messages(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 8. MEMORY & INTELLIGENCE
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='memory_identity_chunks') THEN
    CREATE INDEX IF NOT EXISTS idx_mic_business ON memory_identity_chunks(business_id);
    CREATE INDEX IF NOT EXISTS idx_mic_type ON memory_identity_chunks(chunk_type);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='memory_knowledge_chunks') THEN
    CREATE INDEX IF NOT EXISTS idx_mkc_business ON memory_knowledge_chunks(business_id);
    CREATE INDEX IF NOT EXISTS idx_mkc_type ON memory_knowledge_chunks(chunk_type);
  END IF;
END $$;

-- ============================================
-- 9. BRAIN SYSTEM
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='brain_thoughts') THEN
    CREATE INDEX IF NOT EXISTS idx_brain_thoughts_user ON brain_thoughts(user_id);
    CREATE INDEX IF NOT EXISTS idx_brain_thoughts_created ON brain_thoughts(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 10. SOCIAL
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='social_connections') THEN
    CREATE INDEX IF NOT EXISTS idx_social_connections_user ON social_connections(user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='social_posts') THEN
    CREATE INDEX IF NOT EXISTS idx_social_posts_user ON social_posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_social_posts_created ON social_posts(created_at DESC);
  END IF;
END $$;

-- ============================================
-- 11. ANALYTICS & EVENTS
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='analytics_events') THEN
    CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================
-- 12. EMAIL & CAMPAIGNS
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='email_campaigns') THEN
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);
    CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
  END IF;
END $$;

-- ============================================
-- 13. DIRECTORY & REFERRALS
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='directory_listings') THEN
    CREATE INDEX IF NOT EXISTS idx_dir_listings_business ON directory_listings(business_id);
    CREATE INDEX IF NOT EXISTS idx_dir_listings_category ON directory_listings(category);
    CREATE INDEX IF NOT EXISTS idx_dir_listings_city ON directory_listings(city);
  END IF;
END $$;

-- ============================================
-- 14. STORAGE & BILLING
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='payment_transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_payment_tx_tenant ON payment_transactions(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_payment_tx_created ON payment_transactions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON payment_transactions(status);
  END IF;
END $$;

-- ============================================
-- 15. MULTI-TENANT
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='user_businesses') THEN
    CREATE INDEX IF NOT EXISTS idx_ub_user ON user_businesses(user_id);
    CREATE INDEX IF NOT EXISTS idx_ub_business ON user_businesses(business_id);
    CREATE INDEX IF NOT EXISTS idx_ub_composite ON user_businesses(user_id, business_id);
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='businesses') THEN
    CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
    CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
  END IF;
END $$;

-- ============================================
-- 16. AUDIT
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='audit_logs') THEN
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
  END IF;
END $$;

-- ============================================
-- 17. MISC
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_local_trends_location ON local_trends(location);
CREATE INDEX IF NOT EXISTS idx_local_trends_created ON local_trends(created_at DESC);

DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname='public' AND tablename='phone_otp') THEN
    CREATE INDEX IF NOT EXISTS idx_phone_otp_email ON phone_otp(email);
    CREATE INDEX IF NOT EXISTS idx_phone_otp_expires ON phone_otp(expires_at);
  END IF;
END $$;

-- ============================================
-- DONE
-- ============================================
DO $$
DECLARE
  idx_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO idx_count FROM pg_indexes WHERE schemaname = 'public';
  RAISE NOTICE 'Performance indexes migration complete. Total indexes: %', idx_count;
END $$;
