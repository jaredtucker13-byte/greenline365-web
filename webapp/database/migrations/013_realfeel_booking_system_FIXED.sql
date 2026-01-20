-- ============================================
-- REAL-FEEL AI BOOKING SYSTEM MIGRATION (FIXED)
-- ============================================
-- Run each section separately if needed

-- ============================================
-- PART 1: ADD COLUMNS TO BUSINESSES TABLE
-- ============================================

-- Add weather-awareness columns
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_weather_dependent BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS weather_threshold INTEGER DEFAULT 50;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tenant_status TEXT DEFAULT 'normal';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Add context_config column with default JSON
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS context_config JSONB DEFAULT '{
  "industry_type": "indoor",
  "weather_gate": {
    "enabled": false,
    "rain_threshold": 50,
    "heat_threshold": 95,
    "cold_threshold": 32,
    "severe_weather_only": true
  },
  "booking_rules": {
    "nudge_cancellations": true,
    "max_availability_options": 3,
    "require_reschedule_id": true
  },
  "warm_transfer": {
    "enabled": false,
    "research_on_hold": true,
    "whisper_duration_seconds": 10
  }
}'::jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(tenant_status);
CREATE INDEX IF NOT EXISTS idx_businesses_weather_dependent ON businesses(is_weather_dependent);

-- ============================================
-- PART 2: CALL LOGS TABLE
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

CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view business call logs" ON call_logs;
CREATE POLICY "Users can view business call logs" ON call_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = call_logs.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access to call logs" ON call_logs;
CREATE POLICY "Service role full access to call logs" ON call_logs
  FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT ON call_logs TO authenticated;
GRANT ALL ON call_logs TO service_role;

-- ============================================
-- PART 3: CALL AUDITS TABLE
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

CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_type ON call_audits(audit_type);

ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view business audits" ON call_audits;
CREATE POLICY "Users can view business audits" ON call_audits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = call_audits.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

GRANT SELECT ON call_audits TO authenticated;
GRANT ALL ON call_audits TO service_role;

-- ============================================
-- PART 4: WEATHER ALERTS TABLE
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

CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active ON weather_alerts(business_id, is_active);

ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view business weather alerts" ON weather_alerts;
CREATE POLICY "Users can view business weather alerts" ON weather_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = weather_alerts.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

GRANT SELECT ON weather_alerts TO authenticated;
GRANT ALL ON weather_alerts TO service_role;

-- ============================================
-- PART 5: WARM TRANSFER QUEUE TABLE
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

CREATE INDEX IF NOT EXISTS idx_warm_transfer_business ON warm_transfer_queue(business_id);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_status ON warm_transfer_queue(status);

ALTER TABLE warm_transfer_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view business transfers" ON warm_transfer_queue;
CREATE POLICY "Users can view business transfers" ON warm_transfer_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = warm_transfer_queue.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

GRANT SELECT ON warm_transfer_queue TO authenticated;
GRANT ALL ON warm_transfer_queue TO service_role;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
