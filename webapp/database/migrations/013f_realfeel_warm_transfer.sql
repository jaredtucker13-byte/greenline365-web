-- PART 6: Create warm_transfer_queue table
-- Run this SIXTH

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
