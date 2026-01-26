-- ============================================
-- ADD MISSING BUSINESS_ID COLUMNS
-- ============================================
-- This adds business_id to any table that's missing it

-- Add to call_logs if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'call_logs' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE call_logs ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added business_id to call_logs';
  ELSE
    RAISE NOTICE 'call_logs already has business_id';
  END IF;
END $$;

-- Add to weather_alerts if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weather_alerts' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE weather_alerts ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added business_id to weather_alerts';
  ELSE
    RAISE NOTICE 'weather_alerts already has business_id';
  END IF;
END $$;

-- Add to warm_transfer_queue if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'warm_transfer_queue' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE warm_transfer_queue ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added business_id to warm_transfer_queue';
  ELSE
    RAISE NOTICE 'warm_transfer_queue already has business_id';
  END IF;
END $$;

-- Add to agent_memory if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_memory' AND column_name = 'business_id'
  ) THEN
    ALTER TABLE agent_memory ADD COLUMN business_id UUID REFERENCES businesses(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added business_id to agent_memory';
  ELSE
    RAISE NOTICE 'agent_memory already has business_id';
  END IF;
END $$;

-- Create sms_messages if it doesn't exist
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

-- Now add all the indexes (this should work now)
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(tenant_status);
CREATE INDEX IF NOT EXISTS idx_businesses_weather_dependent ON businesses(is_weather_dependent);
CREATE INDEX IF NOT EXISTS idx_businesses_zip_code ON businesses(zip_code);

CREATE INDEX IF NOT EXISTS idx_call_logs_business ON call_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_call_audits_business ON call_audits(business_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_call_log ON call_audits(call_log_id);
CREATE INDEX IF NOT EXISTS idx_call_audits_created ON call_audits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weather_alerts_business ON weather_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_weather_alerts_created ON weather_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_warm_transfer_business ON warm_transfer_queue(business_id);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_status ON warm_transfer_queue(status);
CREATE INDEX IF NOT EXISTS idx_warm_transfer_created ON warm_transfer_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_messages_business ON sms_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_from ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_memory_business ON agent_memory(business_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_phone ON agent_memory(customer_phone);

-- Enable RLS
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE warm_transfer_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "call_logs_service_role" ON call_logs;
CREATE POLICY "call_logs_service_role" ON call_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "call_audits_service_role" ON call_audits;
CREATE POLICY "call_audits_service_role" ON call_audits FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "weather_alerts_service_role" ON weather_alerts;
CREATE POLICY "weather_alerts_service_role" ON weather_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "warm_transfer_service_role" ON warm_transfer_queue;
CREATE POLICY "warm_transfer_service_role" ON warm_transfer_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "sms_messages_service_role" ON sms_messages;
CREATE POLICY "sms_messages_service_role" ON sms_messages FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "agent_memory_service_role" ON agent_memory;
CREATE POLICY "agent_memory_service_role" ON agent_memory FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON call_logs TO service_role;
GRANT ALL ON call_audits TO service_role;
GRANT ALL ON weather_alerts TO service_role;
GRANT ALL ON warm_transfer_queue TO service_role;
GRANT ALL ON sms_messages TO service_role;
GRANT ALL ON agent_memory TO service_role;

DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete!';
  RAISE NOTICE '✅ business_id columns verified';
  RAISE NOTICE '✅ All indexes created';
  RAISE NOTICE '✅ Ready to test SMS and Voice AI!';
END $$;
