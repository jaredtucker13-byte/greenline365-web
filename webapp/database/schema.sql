-- GreenLine365 Bookings Table Schema
-- Run this SQL in your Supabase SQL Editor

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  business_name TEXT,
  website TEXT,
  industry TEXT,
  needs TEXT[], -- Array of selected needs
  notes TEXT,
  preferred_datetime TIMESTAMPTZ NOT NULL,
  alternate_datetime TIMESTAMPTZ,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  source TEXT DEFAULT 'unknown', -- Track which widget/integration created the booking
  external_calendar_id TEXT, -- For future cal.com/Google Calendar integration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_source ON bookings(source);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts from authenticated and anonymous users
CREATE POLICY "Allow inserts for everyone" ON bookings
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow select for service role only
CREATE POLICY "Allow select for service role" ON bookings
  FOR SELECT
  USING (true);

-- Create policy to allow updates for service role only
CREATE POLICY "Allow updates for service role" ON bookings
  FOR UPDATE
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for anon role (for public API access)
GRANT INSERT ON bookings TO anon;
GRANT SELECT ON bookings TO anon;

-- Grant full permissions for service role
GRANT ALL ON bookings TO service_role;

-- ============================================
-- CONTENT SCHEDULE TABLE
-- Used by Schedule Blast Edge Function
-- ============================================
CREATE TABLE IF NOT EXISTS content_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  media_urls TEXT[],
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'cancelled')),
  client_id TEXT,
  metadata JSONB DEFAULT '{}',
  publish_results JSONB,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_schedule_status ON content_schedule(status);
CREATE INDEX IF NOT EXISTS idx_content_schedule_scheduled_at ON content_schedule(scheduled_at);

ALTER TABLE content_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for content_schedule" ON content_schedule
  FOR ALL
  USING (true);

GRANT ALL ON content_schedule TO anon;
GRANT ALL ON content_schedule TO service_role;

-- ============================================
-- LOCAL TRENDS TABLE
-- Used by Local Trends Edge Function (Daily Trend Hunter)
-- ============================================
CREATE TABLE IF NOT EXISTS local_trends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  expected_traffic TEXT CHECK (expected_traffic IN ('low', 'medium', 'high')),
  category TEXT CHECK (category IN ('sports', 'community', 'business', 'entertainment', 'weather', 'other')),
  suggested_action TEXT,
  source TEXT,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_local_trends_location ON local_trends(location);
CREATE INDEX IF NOT EXISTS idx_local_trends_created_at ON local_trends(created_at DESC);

ALTER TABLE local_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for local_trends" ON local_trends
  FOR ALL
  USING (true);

GRANT ALL ON local_trends TO anon;
GRANT ALL ON local_trends TO service_role;

-- ============================================
-- LEADS TABLE
-- Used by Lead Alerts Edge Function
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT,
  source TEXT DEFAULT 'chat' CHECK (source IN ('chat', 'form', 'booking', 'external')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  tags TEXT[],
  conversation_id TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for leads" ON leads
  FOR ALL
  USING (true);

GRANT ALL ON leads TO anon;
GRANT ALL ON leads TO service_role;

-- ============================================
-- ACTIVITY LOG TABLE
-- Used for tracking actions across the system
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for activity_log" ON activity_log
  FOR ALL
  USING (true);

GRANT ALL ON activity_log TO anon;
GRANT ALL ON activity_log TO service_role;

-- ============================================
-- CLIENT CONFIG TABLE
-- Used by Demo Controller for client-specific settings
-- ============================================
CREATE TABLE IF NOT EXISTS client_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  city TEXT,
  primary_color TEXT DEFAULT '#39FF14',
  accent_color TEXT DEFAULT '#0CE293',
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_client_config_client_id ON client_config(client_id);

ALTER TABLE client_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for client_config" ON client_config
  FOR ALL
  USING (true);

GRANT ALL ON client_config TO anon;
GRANT ALL ON client_config TO service_role;
