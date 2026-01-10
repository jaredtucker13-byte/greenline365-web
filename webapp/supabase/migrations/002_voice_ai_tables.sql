-- GreenLine365 Voice AI Booking System
-- Run this in Supabase SQL Editor

-- =====================================================
-- BOOKINGS TABLE
-- Stores all appointments created via voice AI or web
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  
  -- Booking details
  service_type TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  
  -- Status tracking
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  confirmation_number TEXT UNIQUE,
  
  -- Additional info
  notes TEXT,
  source TEXT DEFAULT 'web', -- 'web', 'voice_ai', 'phone', 'walk_in'
  
  -- Cancellation tracking
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(preferred_date);
CREATE INDEX IF NOT EXISTS idx_bookings_confirmation ON bookings(confirmation_number);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- =====================================================
-- LEADS TABLE
-- Stores potential customers from voice AI calls
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Lead info
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Interest & source
  interest TEXT,
  source TEXT DEFAULT 'voice_ai_call',
  
  -- Notes from conversation
  notes TEXT,
  
  -- Follow-up tracking
  follow_up_date DATE,
  follow_up_completed BOOLEAN DEFAULT FALSE,
  assigned_to UUID,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date);

-- =====================================================
-- CALL LOGS TABLE
-- Tracks all voice AI calls
-- =====================================================
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Call identifiers
  retell_call_id TEXT UNIQUE,
  twilio_call_sid TEXT,
  
  -- Phone numbers
  from_number TEXT,
  to_number TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  
  -- Call details
  agent_id TEXT,
  duration_seconds INTEGER,
  status TEXT,
  
  -- Transcript and analysis
  transcript TEXT,
  summary TEXT,
  sentiment TEXT,
  
  -- Linked records
  booking_id UUID REFERENCES bookings(id),
  lead_id UUID REFERENCES leads(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_call_logs_retell ON call_logs(retell_call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(created_at);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users (admin access)
CREATE POLICY "Allow all for authenticated users" ON bookings
  FOR ALL USING (true);
  
CREATE POLICY "Allow all for authenticated users" ON leads
  FOR ALL USING (true);
  
CREATE POLICY "Allow all for authenticated users" ON call_logs
  FOR ALL USING (true);

-- =====================================================
-- AUTO-UPDATE TIMESTAMP FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables
DROP TRIGGER IF EXISTS bookings_updated_at ON bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS leads_updated_at ON leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- INSERT INTO bookings (customer_name, customer_phone, service_type, preferred_date, preferred_time, confirmation_number, source)
-- VALUES 
--   ('John Doe', '+1234567890', 'Consultation', CURRENT_DATE + 1, '10:00', 'GL123ABC', 'voice_ai'),
--   ('Jane Smith', '+0987654321', 'Strategy Session', CURRENT_DATE + 2, '14:30', 'GL456DEF', 'web');

COMMENT ON TABLE bookings IS 'Appointments created via voice AI, web, or other channels';
COMMENT ON TABLE leads IS 'Potential customers captured from voice AI calls';
COMMENT ON TABLE call_logs IS 'Log of all voice AI calls with transcripts and outcomes';
