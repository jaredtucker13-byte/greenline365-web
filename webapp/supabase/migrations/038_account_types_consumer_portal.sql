-- ============================================
-- ACCOUNT TYPES & CONSUMER PORTAL SYSTEM
-- Migration 038: Consumer vs Business account types,
-- email verification tracking, consumer favorites
-- ============================================

-- ============================================
-- 1. PROFILES TABLE EXTENSIONS
-- Add account_type, email_verified, phone, zip_code
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'consumer'
  CHECK (account_type IN ('consumer', 'business'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_account_type ON profiles(account_type);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);

-- ============================================
-- 2. BACKFILL EXISTING USERS
-- All current users are business owners (or admins)
-- ============================================
UPDATE profiles SET account_type = 'business' WHERE account_type = 'consumer' OR account_type IS NULL;
UPDATE profiles SET email_verified = true WHERE email_verified = false OR email_verified IS NULL;

-- ============================================
-- 3. UPDATE PROFILE CREATION TRIGGER
-- Now accepts account_type from user metadata
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, account_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'account_type', 'consumer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. LINK CONSUMER_PROFILES TO AUTH USERS
-- Allows authenticated consumers to see their deal history
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'consumer_profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE consumer_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_consumer_profiles_user_id
  ON consumer_profiles(user_id) WHERE user_id IS NOT NULL;

-- ============================================
-- 5. CONSUMER FAVORITES TABLE
-- Allows consumers to save/bookmark businesses
-- ============================================
CREATE TABLE IF NOT EXISTS consumer_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_consumer_favorites_user ON consumer_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_consumer_favorites_listing ON consumer_favorites(listing_id);

ALTER TABLE consumer_favorites ENABLE ROW LEVEL SECURITY;

-- Users can manage their own favorites
CREATE POLICY "Users can view own favorites" ON consumer_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON consumer_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON consumer_favorites
  FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON consumer_favorites TO authenticated;

-- ============================================
-- 6. EMAIL VERIFICATION CODES TABLE
-- Stores verification codes for email confirmation
-- ============================================
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_user ON email_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_code ON email_verification_codes(email, code);

ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can manage verification codes (API routes use service role)
CREATE POLICY "Service can manage verification codes" ON email_verification_codes
  FOR ALL USING (auth.role() = 'service_role');

-- Users can read their own codes (for client-side checking)
CREATE POLICY "Users can view own codes" ON email_verification_codes
  FOR SELECT USING (auth.uid() = user_id);

GRANT ALL ON email_verification_codes TO authenticated;
GRANT ALL ON email_verification_codes TO service_role;

-- ============================================
-- 7. CONSUMER RLS ON CONSUMER_PROFILES
-- Allow authenticated consumers to see their own profile
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'consumer_profiles' AND policyname = 'Consumers can view own profile'
  ) THEN
    CREATE POLICY "Consumers can view own profile" ON consumer_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
