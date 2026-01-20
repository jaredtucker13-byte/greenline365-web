-- ============================================
-- REAL-FEEL AI BOOKING SYSTEM MIGRATION
-- ============================================
-- This migration adds the foundation for the multi-tenant
-- "Real-Feel" AI Booking & Sales Ecosystem:
-- - Weather-aware booking context
-- - Call logs with Perplexity briefs
-- - Audit system for optimization
-- - Industry-specific context gating

-- ============================================
-- 1. ADD WEATHER & CONTEXT CONFIG TO BUSINESSES
-- ============================================

-- Add weather-awareness and context configuration columns
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_weather_dependent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weather_threshold INTEGER DEFAULT 50, -- Rain % threshold
ADD COLUMN IF NOT EXISTS context_config JSONB DEFAULT '{
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
}'::jsonb,
ADD COLUMN IF NOT EXISTS tenant_status TEXT DEFAULT 'normal' CHECK (tenant_status IN ('normal', 'extreme_weather', 'emergency', 'closed')),
ADD COLUMN IF NOT EXISTS zip_code TEXT; -- For weather lookups

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(tenant_status);
CREATE INDEX IF NOT EXISTS idx_businesses_weather_dependent ON businesses(is_weather_dependent);

-- ============================================
-- 2. CALL LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Call identification
  call_id TEXT, -- Retell call ID
  call_type TEXT DEFAULT 'inbound' CHECK (call_type IN ('inbound', 'outbound', 'warm_transfer')),
  
  -- Caller information
  caller_phone TEXT,
  caller_email TEXT,
  caller_name TEXT,
  
  -- Context data (populated before/during call)
  weather_context JSONB DEFAULT '{}'::jsonb,
  perplexity_brief TEXT, -- Sales research from Perplexity
  prospect_website TEXT,
  
  -- Call outcome
  conversation_summary TEXT,
  intent_detected TEXT, -- 'booking', 'cancellation', 'reschedule', 'inquiry', 'sales'
  action_taken TEXT, -- 'booked', 'rescheduled', 'cancelled', 'transferred', 'none'
  booking_id TEXT, -- Reference to bookings table if applicable
  
  -- Nudge strategy tracking
  cancellation_attempted BOOLEAN DEFAULT false,
  cancellation_nudged BOOLEAN DEFAULT false,
  nudge_successful BOOLEAN DEFAULT false,
  
  -- Transfer data
  transferred_to TEXT, -- Agent/rep name or ID
  whisper_content TEXT, -- AI whisper played to rep
  
  -- Metadata
  duration_seconds INTEGER,
  recording_url TEXT,
  retell_metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for call_logs
CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller ON call_logs(caller_phone, caller_email);
CREATE INDEX IF NOT EXISTS idx_call_logs_intent ON call_logs(business_id, intent_detected);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);

-- RLS for call_logs
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business call logs" ON call_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = call_logs.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access to call logs" ON call_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT SELECT ON call_logs TO authenticated;
GRANT ALL ON call_logs TO service_role;

-- ============================================
-- 3. CALL AUDITS TABLE (For optimization loop)
-- ============================================
CREATE TABLE IF NOT EXISTS call_audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_log_id UUID REFERENCES call_logs(id) ON DELETE CASCADE,
  
  -- Audit type
  audit_type TEXT NOT NULL CHECK (audit_type IN (
    'context_hallucination',  -- Agent talked about irrelevant context
    'weather_gate_failure',   -- Wrong weather behavior
    'nudge_failure',          -- Failed to nudge cancellation
    'transfer_failure',       -- Warm transfer issues
    'booking_error',          -- Calendar/booking issues
    'success',                -- Successful interaction
    'custom'
  )),
  
  -- Details
  description TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Context at time of audit
  context_snapshot JSONB DEFAULT '{}'::jsonb,
  
  -- Resolution
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  
  -- Auto-generated suggestions
  ai_suggestion TEXT,
  prompt_adjustment_applied BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_type ON call_audits(audit_type);
CREATE INDEX IF NOT EXISTS idx_call_audits_severity ON call_audits(severity);
CREATE INDEX IF NOT EXISTS idx_call_audits_unresolved ON call_audits(business_id, is_resolved) WHERE is_resolved = false;

-- RLS
ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business audits" ON call_audits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = call_audits.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

GRANT SELECT ON call_audits TO authenticated;
GRANT ALL ON call_audits TO service_role;

-- ============================================
-- 4. WEATHER ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Alert info
  alert_type TEXT NOT NULL, -- 'rain', 'storm', 'heat', 'cold', 'hurricane', 'blizzard', etc.
  severity_level INTEGER DEFAULT 1, -- 1-5 scale
  
  -- Location
  zip_code TEXT,
  city TEXT,
  
  -- Weather data
  weather_data JSONB NOT NULL, -- Raw API response
  forecast_summary TEXT,
  
  -- Impact
  affected_appointments INTEGER DEFAULT 0,
  auto_reschedule_triggered BOOLEAN DEFAULT false,
  
  -- Validity
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active ON weather_alerts(business_id, is_active);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_zip ON weather_alerts(zip_code);

ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business weather alerts" ON weather_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = weather_alerts.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

GRANT SELECT ON weather_alerts TO authenticated;
GRANT ALL ON weather_alerts TO service_role;

-- ============================================
-- 5. WARM TRANSFER QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS warm_transfer_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  call_log_id UUID REFERENCES call_logs(id),
  
  -- Transfer details
  caller_name TEXT,
  caller_phone TEXT,
  caller_company TEXT,
  prospect_website TEXT,
  
  -- Research data
  perplexity_research JSONB DEFAULT '{}'::jsonb,
  weather_context JSONB DEFAULT '{}'::jsonb,
  
  -- Whisper script
  whisper_script TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'researching', 'ready', 'transferred', 'failed', 'expired')),
  
  -- Target
  target_agent_id TEXT,
  target_phone TEXT,
  
  -- Timestamps
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

CREATE POLICY "Users can view business transfers" ON warm_transfer_queue
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = warm_transfer_queue.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

GRANT SELECT ON warm_transfer_queue TO authenticated;
GRANT ALL ON warm_transfer_queue TO service_role;

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Function to check if business should use weather context
CREATE OR REPLACE FUNCTION should_check_weather(p_business_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_config JSONB;
  v_is_dependent BOOLEAN;
BEGIN
  SELECT is_weather_dependent, context_config 
  INTO v_is_dependent, v_config
  FROM businesses 
  WHERE id = p_business_id;
  
  -- Return true if explicitly weather dependent
  IF v_is_dependent THEN
    RETURN true;
  END IF;
  
  -- Check if weather gate is enabled in config
  IF v_config->'weather_gate'->>'enabled' = 'true' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update business status based on weather
CREATE OR REPLACE FUNCTION update_business_weather_status(
  p_business_id UUID,
  p_severity_level INTEGER,
  p_alert_type TEXT
)
RETURNS void AS $$
BEGIN
  IF p_severity_level >= 4 THEN
    -- Severe weather - emergency mode
    UPDATE businesses 
    SET tenant_status = 'extreme_weather'
    WHERE id = p_business_id;
  ELSIF p_severity_level >= 3 AND p_alert_type IN ('hurricane', 'blizzard', 'tornado') THEN
    -- Major weather event
    UPDATE businesses 
    SET tenant_status = 'extreme_weather'
    WHERE id = p_business_id;
  ELSE
    -- Normal operations
    UPDATE businesses 
    SET tenant_status = 'normal'
    WHERE id = p_business_id
    AND tenant_status = 'extreme_weather';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log call audit
CREATE OR REPLACE FUNCTION log_call_audit(
  p_business_id UUID,
  p_call_log_id UUID,
  p_audit_type TEXT,
  p_description TEXT,
  p_severity TEXT DEFAULT 'low',
  p_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO call_audits (
    business_id, call_log_id, audit_type, description, severity, context_snapshot
  ) VALUES (
    p_business_id, p_call_log_id, p_audit_type, p_description, p_severity, p_context
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. UPDATE EXISTING BUSINESSES WITH DEFAULTS
-- ============================================

-- Set GreenLine365 as indoor (SaaS platform)
UPDATE businesses 
SET 
  is_weather_dependent = false,
  context_config = context_config || '{
    "industry_type": "saas",
    "weather_gate": {
      "enabled": false,
      "severe_weather_only": true
    }
  }'::jsonb
WHERE slug = 'greenline365';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this migration in Supabase
-- 2. Configure tenant-specific weather settings via the admin UI
-- 3. Set up weather API integration endpoints
