-- ============================================
-- ADD MISSING COLUMNS TO CALL_LOGS
-- ============================================

-- Add all the columns that call_logs should have
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_id TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'inbound';
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS caller_phone TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS caller_email TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS caller_name TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS weather_context JSONB DEFAULT '{}'::jsonb;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS perplexity_brief TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS prospect_website TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS conversation_summary TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS intent_detected TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS booking_id TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cancellation_attempted BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS cancellation_nudged BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS nudge_successful BOOLEAN DEFAULT false;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS transferred_to TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS whisper_content TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS recording_url TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS retell_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Add missing columns to weather_alerts
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS alert_type TEXT;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS severity_level INTEGER DEFAULT 1;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS weather_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS forecast_summary TEXT;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS affected_appointments INTEGER DEFAULT 0;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS auto_reschedule_triggered BOOLEAN DEFAULT false;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS valid_until TIMESTAMPTZ;
ALTER TABLE weather_alerts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to warm_transfer_queue
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS call_log_id UUID REFERENCES call_logs(id);
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS caller_name TEXT;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS caller_phone TEXT;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS caller_company TEXT;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS prospect_website TEXT;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS perplexity_research JSONB DEFAULT '{}'::jsonb;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS weather_context JSONB DEFAULT '{}'::jsonb;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS whisper_script TEXT;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS target_agent_id TEXT;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS target_phone TEXT;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS research_started_at TIMESTAMPTZ;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS research_completed_at TIMESTAMPTZ;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS transfer_initiated_at TIMESTAMPTZ;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS transfer_completed_at TIMESTAMPTZ;
ALTER TABLE warm_transfer_queue ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes');

-- Add missing columns to agent_memory
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS memory_type TEXT DEFAULT 'general';
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS memory_key TEXT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS memory_value TEXT;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 1.0;
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE agent_memory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Now recreate the indexes (should work now)
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_phone ON call_logs(caller_phone);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_severity ON weather_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_active ON weather_alerts(is_active);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_call_log ON warm_transfer_queue(call_log_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_phone ON agent_memory(customer_phone);
CREATE INDEX IF NOT EXISTS idx_agent_memory_key ON agent_memory(memory_key);
CREATE INDEX IF NOT EXISTS idx_agent_memory_accessed ON agent_memory(last_accessed_at DESC);

DO $$
BEGIN
  RAISE NOTICE '✅ All missing columns added!';
  RAISE NOTICE '✅ All indexes created successfully!';
  RAISE NOTICE '✅ Database is now ready for Real-Feel AI system!';
END $$;
