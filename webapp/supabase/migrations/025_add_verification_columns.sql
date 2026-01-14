-- ============================================
-- ADD VERIFICATION COLUMNS TO WAITLIST
-- Run this in Supabase SQL Editor
-- ============================================

-- Add verification columns to waitlist_submissions
ALTER TABLE waitlist_submissions 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS verification_code TEXT,
ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index on verification_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_verification_token 
ON waitlist_submissions(verification_token) 
WHERE verification_token IS NOT NULL;

-- Update status check constraint to include 'verified' status
ALTER TABLE waitlist_submissions 
DROP CONSTRAINT IF EXISTS waitlist_submissions_status_check;

ALTER TABLE waitlist_submissions 
ADD CONSTRAINT waitlist_submissions_status_check 
CHECK (status IN ('pending', 'verified', 'approved', 'rejected', 'converted'));

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'waitlist_submissions'
ORDER BY ordinal_position;
