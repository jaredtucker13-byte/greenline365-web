-- ============================================
-- PHONE OTP VERIFICATION SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Step 1: Add phone verification columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Step 2: Create phone_otp table for OTP storage
CREATE TABLE IF NOT EXISTS phone_otp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_phone_otp_email ON phone_otp(email);
CREATE INDEX IF NOT EXISTS idx_phone_otp_user_id ON phone_otp(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_otp_expires_at ON phone_otp(expires_at);

-- Enable RLS
ALTER TABLE phone_otp ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role full access to phone_otp" ON phone_otp
  FOR ALL
  USING (true);

GRANT ALL ON phone_otp TO service_role;
GRANT ALL ON phone_otp TO anon;

-- ============================================
-- UPDATE: Allow service role to update profiles
-- ============================================
CREATE POLICY "Service role can update all profiles" ON profiles
  FOR UPDATE
  USING (true);

-- ============================================
-- VERIFICATION: Check tables exist
-- ============================================
-- After running, verify with:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT * FROM information_schema.tables WHERE table_name = 'phone_otp';
