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
