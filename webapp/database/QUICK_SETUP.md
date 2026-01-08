# Quick Database Setup (3 Steps)

## Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/rawlqwjdfzicjepzmcng/sql/new
2. Or: Dashboard → SQL Editor → New Query

## Step 2: Copy & Run This SQL
Copy the ENTIRE block below and paste into the SQL Editor, then click **Run**:

```sql
-- WAITLIST TABLE
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

-- NEWSLETTER TABLE
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

-- BOOKINGS TABLE
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
```

## Step 3: Verify Success
You should see "Success. No rows returned" at the bottom.

To confirm tables were created:
1. Go to Table Editor (left sidebar)
2. You should see: `waitlist_submissions`, `newsletter_subscriptions`, `bookings`

---

## Troubleshooting

**"relation already exists" error?**
- This is OK! It means the table was already created. The `IF NOT EXISTS` clause handles this.

**"permission denied" error?**
- Make sure you're logged in as the project owner in Supabase

**Need to start fresh?**
Run this FIRST to drop existing tables (⚠️ deletes data):
```sql
DROP TABLE IF EXISTS waitlist_submissions CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
```
Then run the create script again.
