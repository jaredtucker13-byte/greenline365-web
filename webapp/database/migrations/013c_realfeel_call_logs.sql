-- PART 3: Create call_logs table
-- Run this THIRD

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
