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


-- ============================================
-- DEMO PROFILES TABLE
-- Stores demo configurations for B2B pitches
-- Populated from /config/demo-profiles.yml
-- ============================================
CREATE TABLE IF NOT EXISTS demo_profiles (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  city_location TEXT,
  industry TEXT,
  primary_color TEXT DEFAULT '#39FF14',
  accent_color TEXT DEFAULT '#0CE293',
  description TEXT,
  logo_url TEXT,
  is_default BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demo_profiles_slug ON demo_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_demo_profiles_industry ON demo_profiles(industry);

ALTER TABLE demo_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for demo_profiles" ON demo_profiles
  FOR ALL
  USING (true);

GRANT ALL ON demo_profiles TO anon;
GRANT ALL ON demo_profiles TO service_role;

-- ============================================
-- DEMO SESSIONS TABLE
-- Tracks individual demo bookings/sessions
-- ============================================
CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  website TEXT,
  industry TEXT,
  phone TEXT,
  demo_profile_id TEXT REFERENCES demo_profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_email ON demo_sessions(email);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_status ON demo_sessions(status);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_demo_profile ON demo_sessions(demo_profile_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_created_at ON demo_sessions(created_at DESC);

ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for demo_sessions" ON demo_sessions
  FOR ALL
  USING (true);

GRANT ALL ON demo_sessions TO anon;
GRANT ALL ON demo_sessions TO service_role;

-- ============================================
-- INDUSTRIES TABLE
-- Maps industries to default demo profiles
-- Populated from /config/industries.yml
-- ============================================
CREATE TABLE IF NOT EXISTS industries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  default_demo_profile_id TEXT REFERENCES demo_profiles(id),
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_industries_default_profile ON industries(default_demo_profile_id);

ALTER TABLE industries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for industries" ON industries
  FOR ALL
  USING (true);

GRANT ALL ON industries TO anon;
GRANT ALL ON industries TO service_role;

-- ============================================
-- WAITLIST SUBMISSIONS TABLE
-- Stores waitlist signups
-- ============================================
CREATE TABLE IF NOT EXISTS waitlist_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  industry TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'invited', 'converted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist_submissions(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_submissions(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_submissions(created_at DESC);

ALTER TABLE waitlist_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for waitlist_submissions" ON waitlist_submissions
  FOR ALL
  USING (true);

GRANT ALL ON waitlist_submissions TO anon;
GRANT ALL ON waitlist_submissions TO service_role;

-- ============================================
-- NEWSLETTER SUBSCRIPTIONS TABLE
-- Stores newsletter signups
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  source TEXT DEFAULT 'website',
  preferences JSONB DEFAULT '{}',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_status ON newsletter_subscriptions(status);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for newsletter_subscriptions" ON newsletter_subscriptions
  FOR ALL
  USING (true);

GRANT ALL ON newsletter_subscriptions TO anon;
GRANT ALL ON newsletter_subscriptions TO service_role;


-- ============================================
-- DEMO REQUESTS TABLE
-- Tracks demo requests with website URL for future scraping
-- ============================================
CREATE TABLE IF NOT EXISTS demo_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  industry TEXT,
  website_url TEXT,
  selected_demo_profile_id TEXT REFERENCES demo_profiles(id),
  scrape_status TEXT DEFAULT 'pending' CHECK (scrape_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  scraped_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_demo_requests_email ON demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_demo_requests_scrape_status ON demo_requests(scrape_status);
CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at ON demo_requests(created_at DESC);

ALTER TABLE demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for demo_requests" ON demo_requests
  FOR ALL
  USING (true);

GRANT ALL ON demo_requests TO anon;
GRANT ALL ON demo_requests TO service_role;

-- ============================================
-- INGESTED WEBSITE DATA TABLE
-- Stores scraped website content for demo personalization
-- ============================================
CREATE TABLE IF NOT EXISTS ingested_website_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_request_id UUID REFERENCES demo_requests(id),
  website_url TEXT NOT NULL,
  business_name TEXT,
  services TEXT[],
  key_phrases TEXT[],
  raw_content TEXT,
  structured_data JSONB DEFAULT '{}',
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ingested_website_url ON ingested_website_data(website_url);
CREATE INDEX IF NOT EXISTS idx_ingested_demo_request ON ingested_website_data(demo_request_id);

ALTER TABLE ingested_website_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for ingested_website_data" ON ingested_website_data
  FOR ALL
  USING (true);

GRANT ALL ON ingested_website_data TO anon;
GRANT ALL ON ingested_website_data TO service_role;

-- ============================================
-- DEMO LOCAL PULSE EVENTS (Seeded Demo Data)
-- Seeded local events for demo presentations
-- ============================================
CREATE TABLE IF NOT EXISTS demo_local_pulse_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_profile_id TEXT REFERENCES demo_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  expected_traffic TEXT CHECK (expected_traffic IN ('low', 'medium', 'high')),
  category TEXT,
  suggested_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_local_pulse_profile ON demo_local_pulse_events(demo_profile_id);

ALTER TABLE demo_local_pulse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for demo_local_pulse_events" ON demo_local_pulse_events
  FOR ALL
  USING (true);

GRANT ALL ON demo_local_pulse_events TO anon;
GRANT ALL ON demo_local_pulse_events TO service_role;

-- ============================================
-- DEMO WEEKLY TREND IDEAS (Seeded Demo Data)
-- Seeded content ideas for demo presentations
-- ============================================
CREATE TABLE IF NOT EXISTS demo_weekly_trend_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_profile_id TEXT REFERENCES demo_profiles(id),
  title TEXT NOT NULL,
  content TEXT,
  platforms TEXT[],
  optimal_time TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_weekly_trends_profile ON demo_weekly_trend_ideas(demo_profile_id);

ALTER TABLE demo_weekly_trend_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for demo_weekly_trend_ideas" ON demo_weekly_trend_ideas
  FOR ALL
  USING (true);

GRANT ALL ON demo_weekly_trend_ideas TO anon;
GRANT ALL ON demo_weekly_trend_ideas TO service_role;
