-- ============================================
-- COMPLETE REAL-FEEL AI SYSTEM SETUP
-- ============================================
-- This migration ensures ALL Real-Feel tables and SMS tables exist
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: ADD COLUMNS TO BUSINESSES TABLE
-- ============================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_weather_dependent BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS weather_threshold INTEGER DEFAULT 50;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tenant_status TEXT DEFAULT 'normal';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS retell_agent_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT;

-- ============================================
-- PART 2: CREATE CONTEXT_CONFIG JSONB COLUMN
-- ============================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS context_config JSONB DEFAULT '{
  "industry": "",
  "pain_points": [],
  "value_proposition": "",
  "competitor_names": [],
  "booking_flow_preferences": {
    "require_email": false,
    "require_address": false,
    "default_duration_minutes": 30,
    "buffer_minutes": 15
  }
}'::jsonb;

-- ============================================
-- PART 3: CREATE CALL_LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_id TEXT,
  call_type TEXT DEFAULT 'inbound',
  caller_phone TEXT,
  caller_email TEXT,
  caller_name TEXT,
  weather_context JSONB DEFAULT '{}'::jsonb,
  perplexity_brief TEXT,
  prospect_website TEXT,
  conversation_summary TEXT,
  intent_detected TEXT,
  action_taken TEXT,
  booking_id TEXT,
  cancellation_attempted BOOLEAN DEFAULT false,
  cancellation_nudged BOOLEAN DEFAULT false,
  nudge_successful BOOLEAN DEFAULT false,
  transferred_to TEXT,
  whisper_content TEXT,
  duration_seconds INTEGER,
  recording_url TEXT,
  retell_metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 4: CREATE CALL_AUDITS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS call_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_log_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL,
  description TEXT,
  severity TEXT DEFAULT 'low',
  context_snapshot JSONB DEFAULT '{}'::jsonb,
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  ai_suggestion TEXT,
  prompt_adjustment_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 5: CREATE WEATHER_ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity_level INTEGER DEFAULT 1,
  zip_code TEXT,
  city TEXT,
  weather_data JSONB NOT NULL,
  forecast_summary TEXT,
  affected_appointments INTEGER DEFAULT 0,
  auto_reschedule_triggered BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 6: CREATE WARM_TRANSFER_QUEUE TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS warm_transfer_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_log_id UUID REFERENCES call_logs(id),
  caller_name TEXT,
  caller_phone TEXT,
  caller_company TEXT,
  prospect_website TEXT,
  perplexity_research JSONB DEFAULT '{}'::jsonb,
  weather_context JSONB DEFAULT '{}'::jsonb,
  whisper_script TEXT,
  status TEXT DEFAULT 'pending',
  target_agent_id TEXT,
  target_phone TEXT,
  research_started_at TIMESTAMPTZ,
  research_completed_at TIMESTAMPTZ,
  transfer_initiated_at TIMESTAMPTZ,
  transfer_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- ============================================
-- PART 7: CREATE SMS_MESSAGES TABLE
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
  booking_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 8: CREATE AGENT_MEMORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  memory_type TEXT DEFAULT 'general',
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  confidence_score FLOAT DEFAULT 1.0,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PART 9: ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for businesses
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(tenant_status);
CREATE INDEX IF NOT EXISTS idx_businesses_weather_dependent ON businesses(is_weather_dependent);
CREATE INDEX IF NOT EXISTS idx_businesses_zip_code ON businesses(zip_code);

-- Indexes for call_logs
CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_phone ON call_logs(caller_phone);

-- Indexes for call_audits
CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_call_log ON call_audits(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_created ON call_audits(created_at DESC);

-- Indexes for weather_alerts
CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_severity ON weather_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_created ON weather_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active ON weather_alerts(is_active);

-- Indexes for warm_transfer_queue
CREATE INDEX IF NOT EXISTS idx_warm_transfer_business ON warm_transfer_queue(business_id);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_status ON warm_transfer_queue(status);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_created ON warm_transfer_queue(created_at DESC);

-- Indexes for sms_messages
CREATE INDEX IF NOT EXISTS idx_sms_messages_business ON sms_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_from ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_booking ON sms_messages(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);

-- Indexes for agent_memory
CREATE INDEX IF NOT EXISTS idx_agent_memory_business ON agent_memory(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_phone ON agent_memory(customer_phone);
CREATE INDEX IF NOT EXISTS idx_agent_memory_key ON agent_memory(memory_key);
CREATE INDEX IF NOT EXISTS idx_agent_memory_accessed ON agent_memory(last_accessed_at DESC);

-- ============================================
-- PART 10: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warm_transfer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PART 11: CREATE RLS POLICIES
-- ============================================

-- Policies for call_logs
DROP POLICY IF EXISTS "call_logs_service_role" ON call_logs;
CREATE POLICY "call_logs_service_role" ON call_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for call_audits
DROP POLICY IF EXISTS "call_audits_service_role" ON call_audits;
CREATE POLICY "call_audits_service_role" ON call_audits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for weather_alerts
DROP POLICY IF EXISTS "weather_alerts_service_role" ON weather_alerts;
CREATE POLICY "weather_alerts_service_role" ON weather_alerts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for warm_transfer_queue
DROP POLICY IF EXISTS "warm_transfer_service_role" ON warm_transfer_queue;
CREATE POLICY "warm_transfer_service_role" ON warm_transfer_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for sms_messages
DROP POLICY IF EXISTS "sms_messages_service_role" ON sms_messages;
CREATE POLICY "sms_messages_service_role" ON sms_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for agent_memory
DROP POLICY IF EXISTS "agent_memory_service_role" ON agent_memory;
CREATE POLICY "agent_memory_service_role" ON agent_memory
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- PART 12: GRANT PERMISSIONS
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
-- PART 13: ADD MISSING BOOKINGS COLUMNS
-- ============================================

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sms_confirmed BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmation_code TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS weather_checked BOOLEAN DEFAULT false;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'Real-Feel AI System setup complete!';
  RAISE NOTICE 'Tables created: call_logs, call_audits, weather_alerts, warm_transfer_queue, sms_messages, agent_memory';
  RAISE NOTICE 'Indexes created: 25+ performance indexes';
  RAISE NOTICE 'RLS enabled and policies configured';
END $$;
