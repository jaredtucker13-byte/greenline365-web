-- ============================================
-- SAFE MIGRATION - ONLY ADD MISSING PIECES
-- ============================================
-- This uses IF NOT EXISTS everywhere so it won't error
-- if things already exist. Safe to run multiple times.
-- ============================================

-- ============================================
-- PART 1: ADD MISSING COLUMNS TO BUSINESSES
-- ============================================

DO $$ 
BEGIN
  -- Add Real-Feel columns to businesses table
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_weather_dependent BOOLEAN DEFAULT false;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS weather_threshold INTEGER DEFAULT 50;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tenant_status TEXT DEFAULT 'normal';
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS zip_code TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS retell_agent_id TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS context_config JSONB DEFAULT '{}'::jsonb;
  
  RAISE NOTICE 'Business columns added successfully';
END $$;

-- ============================================
-- PART 2: CREATE SMS_MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  message_sid TEXT,
  status TEXT DEFAULT 'pending',
  message_type TEXT DEFAULT 'general',
  booking_id UUID REFERENCES bookings(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 3: ADD ALL INDEXES (SAFE)
-- ============================================

-- Businesses indexes
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(tenant_status);
CREATE INDEX IF NOT EXISTS idx_businesses_weather_dependent ON businesses(is_weather_dependent);
CREATE INDEX IF NOT EXISTS idx_businesses_zip_code ON businesses(zip_code);

-- Call logs indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_phone ON call_logs(caller_phone);

-- Call audits indexes
CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_call_log ON call_audits(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_created ON call_audits(created_at DESC);

-- Weather alerts indexes
CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_severity ON weather_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_created ON weather_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active ON weather_alerts(is_active);

-- Warm transfer queue indexes
CREATE INDEX IF NOT EXISTS idx_warm_transfer_business ON warm_transfer_queue(business_id);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_status ON warm_transfer_queue(status);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_created ON warm_transfer_queue(created_at DESC);

-- SMS messages indexes
CREATE INDEX IF NOT EXISTS idx_sms_messages_business ON sms_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_from ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_booking ON sms_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);

-- Agent memory indexes
CREATE INDEX IF NOT EXISTS idx_agent_memory_business ON agent_memory(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_phone ON agent_memory(customer_phone);
CREATE INDEX IF NOT EXISTS idx_agent_memory_key ON agent_memory(memory_key);
CREATE INDEX IF NOT EXISTS idx_agent_memory_accessed ON agent_memory(last_accessed_at DESC);

-- ============================================
-- PART 4: ENABLE RLS (SAFE)
-- ============================================

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warm_transfer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 5: CREATE POLICIES (SAFE)
-- ============================================

-- Call logs policies
DROP POLICY IF EXISTS "call_logs_service_role" ON call_logs;
CREATE POLICY "call_logs_service_role" ON call_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Call audits policies
DROP POLICY IF EXISTS "call_audits_service_role" ON call_audits;
CREATE POLICY "call_audits_service_role" ON call_audits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Weather alerts policies
DROP POLICY IF EXISTS "weather_alerts_service_role" ON weather_alerts;
CREATE POLICY "weather_alerts_service_role" ON weather_alerts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Warm transfer policies
DROP POLICY IF EXISTS "warm_transfer_service_role" ON warm_transfer_queue;
CREATE POLICY "warm_transfer_service_role" ON warm_transfer_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- SMS messages policies
DROP POLICY IF EXISTS "sms_messages_service_role" ON sms_messages;
CREATE POLICY "sms_messages_service_role" ON sms_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Agent memory policies
DROP POLICY IF EXISTS "agent_memory_service_role" ON agent_memory;
CREATE POLICY "agent_memory_service_role" ON agent_memory
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- PART 6: GRANT PERMISSIONS
-- ============================================

GRANT ALL ON call_logs TO service_role;
GRANT ALL ON call_audits TO service_role;
GRANT ALL ON weather_alerts TO service_role;
GRANT ALL ON warm_transfer_queue TO service_role;
GRANT ALL ON sms_messages TO service_role;
GRANT ALL ON agent_memory TO service_role;

GRANT SELECT ON call_logs TO authenticated;
GRANT SELECT ON call_audits TO authenticated;
GRANT SELECT ON weather_alerts TO authenticated;
GRANT SELECT ON warm_transfer_queue TO authenticated;
GRANT SELECT ON sms_messages TO authenticated;
GRANT SELECT ON agent_memory TO authenticated;

-- ============================================
-- PART 7: ADD BOOKINGS COLUMNS (SAFE)
-- ============================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sms_confirmed BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS weather_checked BOOLEAN DEFAULT false;

-- ============================================
-- SUCCESS!
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '✅ All indexes added';
  RAISE NOTICE '✅ RLS policies configured';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE 'You can now test SMS and voice AI systems!';
END $$;
