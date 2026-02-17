-- ============================================================
-- BOOKING SUITE ONBOARDING & FEATURE GATING
-- Adds has_booking_suite flag, plan_level, and Volt-Amps test tenant
-- ============================================================

-- ============================================
-- 1. ADD has_booking_suite TO BOTH TABLES
-- ============================================

-- Add to tenants table (backend/webhook system)
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS has_booking_suite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plan_level TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS calcom_api_key TEXT,
ADD COLUMN IF NOT EXISTS calcom_event_type_id TEXT,
ADD COLUMN IF NOT EXISTS calcom_booking_link TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS retell_phone_number TEXT,
ADD COLUMN IF NOT EXISTS booking_buffer_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT TRUE;

-- Add to businesses table (frontend/UI system)
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS has_booking_suite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plan_level TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS domain TEXT,
ADD COLUMN IF NOT EXISTS calcom_api_key TEXT,
ADD COLUMN IF NOT EXISTS calcom_event_type_id TEXT,
ADD COLUMN IF NOT EXISTS calcom_booking_link TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS retell_phone_number TEXT,
ADD COLUMN IF NOT EXISTS booking_buffer_minutes INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS test_mode BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'inactive';

-- Indexes for upsert lookups
CREATE INDEX IF NOT EXISTS idx_tenants_business_email ON tenants(business_email);
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_businesses_business_email ON businesses(business_email);
CREATE INDEX IF NOT EXISTS idx_businesses_domain ON businesses(domain);

-- Add staff_assigned and calcom_booking_id to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS staff_assigned TEXT,
ADD COLUMN IF NOT EXISTS calcom_booking_id TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_calcom ON bookings(calcom_booking_id);

-- ============================================
-- 2. BOOKING SYNC LOG TABLE
-- Tracks every sync event from the orchestrator
-- ============================================
CREATE TABLE IF NOT EXISTS booking_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,

  -- Event info
  event_type TEXT NOT NULL, -- booking.created, booking.updated, booking.cancelled
  source TEXT NOT NULL,     -- calcom, retell, manual, api

  -- Booking reference
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  external_booking_id TEXT, -- Cal.com booking ID

  -- Sync status
  sync_status TEXT DEFAULT 'pending', -- pending, synced, conflict, failed

  -- Conflict detection
  google_cal_checked BOOLEAN DEFAULT FALSE,
  google_cal_free BOOLEAN,
  supabase_conflict_checked BOOLEAN DEFAULT FALSE,
  supabase_conflict_free BOOLEAN,
  buffer_checked BOOLEAN DEFAULT FALSE,
  buffer_clear BOOLEAN,

  -- Email notification
  email_sent BOOLEAN DEFAULT FALSE,
  email_recipient TEXT,
  email_test_mode BOOLEAN DEFAULT FALSE,

  -- Payload
  raw_payload JSONB,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_sync_log_tenant ON booking_sync_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_booking_sync_log_status ON booking_sync_log(sync_status);

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE booking_sync_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access sync_log" ON booking_sync_log FOR ALL TO service_role USING (true);
CREATE POLICY "Authenticated can view sync_log" ON booking_sync_log FOR SELECT TO authenticated USING (true);

-- ============================================
-- 4. UPSERT FUNCTION FOR TENANT ONBOARDING
-- ============================================
CREATE OR REPLACE FUNCTION upsert_booking_tenant(
  p_business_email TEXT,
  p_domain TEXT DEFAULT NULL,
  p_business_name TEXT DEFAULT NULL,
  p_owner_name TEXT DEFAULT NULL,
  p_owner_email TEXT DEFAULT NULL,
  p_plan_level TEXT DEFAULT 'trial_pro'
)
RETURNS TABLE (
  tenant_id UUID,
  business_id UUID,
  is_new BOOLEAN,
  has_booking_suite BOOLEAN
) AS $$
DECLARE
  v_tenant_id UUID;
  v_business_id UUID;
  v_is_new BOOLEAN := FALSE;
  v_slug TEXT;
BEGIN
  -- Check if tenant exists by business_email or domain
  SELECT t.id INTO v_tenant_id
  FROM tenants t
  WHERE t.business_email = p_business_email
     OR (p_domain IS NOT NULL AND t.domain = p_domain)
  LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    -- EXISTS: Toggle has_booking_suite = true, don't overwrite profile data
    UPDATE tenants SET
      has_booking_suite = TRUE,
      updated_at = NOW()
    WHERE id = v_tenant_id;

    -- Also update businesses table if linked
    UPDATE businesses SET
      has_booking_suite = TRUE,
      updated_at = NOW()
    WHERE business_email = p_business_email
       OR (p_domain IS NOT NULL AND domain = p_domain);

    SELECT b.id INTO v_business_id
    FROM businesses b
    WHERE b.business_email = p_business_email
       OR (p_domain IS NOT NULL AND b.domain = p_domain)
    LIMIT 1;

    v_is_new := FALSE;
  ELSE
    -- NEW: Create new UUID and record with plan_level = 'trial_pro'
    v_tenant_id := gen_random_uuid();
    v_slug := lower(regexp_replace(COALESCE(p_business_name, 'business'), '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(v_tenant_id::text, 1, 8);

    INSERT INTO tenants (id, business_name, owner_name, owner_email, business_email, domain, plan_level, has_booking_suite, plan)
    VALUES (v_tenant_id, COALESCE(p_business_name, 'New Business'), p_owner_name, p_owner_email, p_business_email, p_domain, p_plan_level, TRUE, 'pro');

    -- Also create in businesses table
    v_business_id := gen_random_uuid();
    INSERT INTO businesses (id, name, slug, tier, business_email, domain, plan_level, has_booking_suite, email)
    VALUES (v_business_id, COALESCE(p_business_name, 'New Business'), v_slug, 'tier3', p_business_email, p_domain, p_plan_level, TRUE, p_owner_email);

    v_is_new := TRUE;
  END IF;

  RETURN QUERY SELECT v_tenant_id, v_business_id, v_is_new, TRUE::BOOLEAN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. INSERT VOLT-AMPS ELECTRICAL SERVICES TEST TENANT
-- ============================================
DO $$
DECLARE
  v_tenant_id UUID;
  v_business_id UUID;
BEGIN
  -- Check if Volt-Amps already exists
  SELECT id INTO v_tenant_id FROM tenants WHERE business_name = 'Volt-Amps Electrical Services' LIMIT 1;

  IF v_tenant_id IS NULL THEN
    v_tenant_id := gen_random_uuid();
    v_business_id := gen_random_uuid();

    -- Create tenant record
    INSERT INTO tenants (
      id, business_name, owner_name, owner_email, business_email, domain,
      ai_agent_name, ai_personality, greeting_message,
      plan, plan_level, has_booking_suite, test_mode,
      booking_buffer_minutes
    ) VALUES (
      v_tenant_id,
      'Volt-Amps Electrical Services',
      'Jared Tucker',
      'jared.tucker13@gmail.com',
      'jared.tucker13@gmail.com',
      'voltamps-electrical.com',
      'Volt',
      'friendly, professional, and knowledgeable about electrical services. You speak clearly and reassure customers about safety.',
      'Hi there! Thanks for calling Volt-Amps Electrical Services. This is Volt, your AI assistant. How can I help you today?',
      'pro',
      'trial_pro',
      TRUE,
      TRUE,
      15
    );

    -- Create business record
    INSERT INTO businesses (
      id, name, slug, tier, industry,
      business_email, domain, plan_level, has_booking_suite, test_mode,
      email, booking_buffer_minutes,
      settings
    ) VALUES (
      v_business_id,
      'Volt-Amps Electrical Services',
      'volt-amps-electrical',
      'tier3',
      'electrical',
      'jared.tucker13@gmail.com',
      'voltamps-electrical.com',
      'trial_pro',
      TRUE,
      TRUE,
      'jared.tucker13@gmail.com',
      15,
      '{
        "features": {
          "content_forge": true,
          "mockup_generator": true,
          "social_posting": true,
          "crm": true,
          "analytics": true,
          "knowledge_base": true,
          "blog": true,
          "email": true,
          "sms": true,
          "bookings": true,
          "ai_receptionist": true,
          "calendar": true
        },
        "limits": {
          "social_posts_per_month": 500,
          "ai_generations_per_month": 200
        },
        "branding": {
          "primary_color": "#FFD700",
          "logo_url": null
        }
      }'::jsonb
    );

    -- Create default services for Volt-Amps
    INSERT INTO tenant_services (tenant_id, name, description, duration_minutes, price, price_type, requires_human, buffer_after_minutes, sort_order)
    VALUES
      (v_tenant_id, 'Electrical Inspection', 'Full home or commercial electrical inspection', 60, 149.00, 'fixed', FALSE, 15, 1),
      (v_tenant_id, 'Panel Upgrade Consultation', 'Discuss panel upgrade needs and get a quote', 30, 0, 'free', FALSE, 15, 2),
      (v_tenant_id, 'Emergency Repair', 'Urgent electrical repair service', 90, 199.00, 'fixed', TRUE, 15, 3),
      (v_tenant_id, 'EV Charger Installation', 'Electric vehicle charger installation consultation', 45, 0, 'free', FALSE, 15, 4),
      (v_tenant_id, 'General Electrical Work', 'Outlet installation, wiring, lighting, etc.', 120, NULL, 'quote', TRUE, 15, 5)
    ON CONFLICT DO NOTHING;

    -- Create 24/7 AI booking availability
    INSERT INTO tenant_availability (tenant_id, day_of_week, start_time, end_time)
    SELECT v_tenant_id, d, '08:00'::TIME, '18:00'::TIME
    FROM generate_series(1, 5) AS d -- Monday-Friday
    ON CONFLICT DO NOTHING;

    -- Weekend limited hours
    INSERT INTO tenant_availability (tenant_id, day_of_week, start_time, end_time)
    VALUES
      (v_tenant_id, 6, '09:00'::TIME, '14:00'::TIME), -- Saturday
      (v_tenant_id, 0, '10:00'::TIME, '13:00'::TIME)  -- Sunday (emergency only)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Volt-Amps Electrical Services created: tenant_id=%, business_id=%', v_tenant_id, v_business_id;
  ELSE
    -- Update existing to enable booking suite
    UPDATE tenants SET has_booking_suite = TRUE, test_mode = TRUE WHERE id = v_tenant_id;
    RAISE NOTICE 'Volt-Amps already exists, enabled booking suite: tenant_id=%', v_tenant_id;
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT 'Booking suite onboarding migration complete!' AS status;
