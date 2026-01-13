-- Email Verifications Table for Double Opt-In
-- Run this migration in Supabase SQL Editor

-- Create the email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  source TEXT NOT NULL CHECK (source IN ('waitlist', 'newsletter', 'crm', 'demo')),
  token TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint on email + source combination
  UNIQUE(email, source)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_verifications_email ON email_verifications(email);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_source ON email_verifications(source);
CREATE INDEX IF NOT EXISTS idx_email_verifications_verified ON email_verifications(verified);

-- Enable Row Level Security
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow inserts from service role (API)
CREATE POLICY "Service role can manage email_verifications" ON email_verifications
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add verified column to waitlist table if it doesn't exist
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Create newsletter_subscribers table if not exists
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  verified BOOLEAN DEFAULT FALSE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage newsletter_subscribers" ON newsletter_subscribers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON email_verifications TO service_role;
GRANT ALL ON newsletter_subscribers TO service_role;
