-- ============================================
-- SMS MESSAGES TABLE
-- ============================================
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  body TEXT NOT NULL,
  message_sid TEXT,
  status TEXT DEFAULT 'pending',
  message_type TEXT DEFAULT 'general', -- 'confirmation', 'reminder', 'followup', 'general'
  booking_id UUID REFERENCES bookings(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_messages_from ON sms_messages(from_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_to ON sms_messages(to_number);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_booking ON sms_messages(booking_id);

-- Add sms_confirmed column to bookings if not exists
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sms_confirmed BOOLEAN DEFAULT false;

-- RLS
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sms_messages_service_role" ON sms_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON sms_messages TO service_role;
