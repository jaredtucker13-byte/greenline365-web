-- ============================================
-- REAL-FEEL AI BOOKING SYSTEM - SIMPLE VERSION
-- No RLS policies - just tables and columns
-- ============================================

-- Add missing columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_weather_dependent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weather_threshold INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS tenant_status TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS retell_agent_id TEXT,
ADD COLUMN IF NOT EXISTS twilio_phone_number TEXT,
ADD COLUMN IF NOT EXISTS context_config JSONB DEFAULT '{}'::jsonb;

-- Create call_logs table
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

-- Create call_audits table
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
  resolved_by UUID,
  ai_suggestion TEXT,
  prompt_adjustment_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create weather_alerts table
CREATE TABLE IF NOT EXISTS weather_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity_level INTEGER DEFAULT 1,
  zip_code TEXT,
  city TEXT,
  weather_data JSONB DEFAULT '{}'::jsonb,
  forecast_summary TEXT,
  affected_appointments INTEGER DEFAULT 0,
  auto_reschedule_triggered BOOLEAN DEFAULT false,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create warm_transfer_queue table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_business ON warm_transfer_queue(business_id);
