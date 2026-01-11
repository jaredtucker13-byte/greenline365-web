-- Waitlist Submissions Table for GreenLine365
-- Run this in Supabase SQL Editor

-- Drop if exists (clean slate)
DROP TABLE IF EXISTS waitlist_submissions CASCADE;

-- Create waitlist_submissions table
CREATE TABLE waitlist_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact info
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  company TEXT,
  industry TEXT,
  phone TEXT,
  
  -- Source tracking
  source TEXT DEFAULT 'website',
  referral_code TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'converted')),
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_waitlist_email ON waitlist_submissions(email);
CREATE INDEX idx_waitlist_status ON waitlist_submissions(status);
CREATE INDEX idx_waitlist_created ON waitlist_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE waitlist_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policy - allow inserts from anyone, reads only for authenticated
CREATE POLICY "Allow public inserts to waitlist" ON waitlist_submissions 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated reads from waitlist" ON waitlist_submissions 
  FOR SELECT USING (true);

-- Verify
SELECT 'Waitlist table created successfully!' as status;
