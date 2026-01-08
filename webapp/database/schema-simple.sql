-- ============================================
-- GREENLINE365 SIMPLIFIED SCHEMA
-- Apply this FIRST - Just the core tables
-- ============================================

-- 1. WAITLIST SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS waitlist_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  industry TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

ALTER TABLE waitlist_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlist_allow_all" ON waitlist_submissions FOR ALL USING (true);

GRANT ALL ON waitlist_submissions TO anon;
GRANT ALL ON waitlist_submissions TO service_role;

-- 2. NEWSLETTER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active',
  source TEXT DEFAULT 'website',
  preferences JSONB DEFAULT '{}',
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "newsletter_allow_all" ON newsletter_subscriptions FOR ALL USING (true);

GRANT ALL ON newsletter_subscriptions TO anon;
GRANT ALL ON newsletter_subscriptions TO service_role;

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  company TEXT,
  role TEXT,
  business_name TEXT,
  website TEXT,
  industry TEXT,
  needs TEXT[],
  notes TEXT,
  preferred_datetime TIMESTAMPTZ NOT NULL,
  alternate_datetime TIMESTAMPTZ,
  email TEXT NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'unknown',
  external_calendar_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_allow_all" ON bookings FOR ALL USING (true);

GRANT ALL ON bookings TO anon;
GRANT ALL ON bookings TO service_role;
