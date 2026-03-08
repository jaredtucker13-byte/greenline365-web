-- ============================================================
-- FIX MISSING COLUMNS & TABLES
-- Safe to run multiple times (all operations use IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- 1. phone_otp: add missing code_salt column
--    send-otp/route.ts inserts code_salt but the original
--    phone-otp-schema.sql never defined it.
-- ============================================================
ALTER TABLE phone_otp
  ADD COLUMN IF NOT EXISTS code_salt TEXT;

-- ============================================================
-- 2. social_connections: add columns that migration 015 defines
--    but step5_social_analytics.sql omitted.
--    Ensures the table matches what social/route.ts expects
--    regardless of which migration was originally applied.
-- ============================================================
ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS profile_url TEXT,
  ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

-- Add the UNIQUE constraint if it doesn't already exist.
-- This is required for the upsert in social/route.ts
-- (onConflict: 'user_id,platform').
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'social_connections_user_id_platform_key'
  ) THEN
    ALTER TABLE social_connections
      ADD CONSTRAINT social_connections_user_id_platform_key
      UNIQUE (user_id, platform);
  END IF;
END $$;

-- ============================================================
-- 3. Indexes (idempotent)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_social_connections_user
  ON social_connections(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_social_connections_platform
  ON social_connections(platform, is_active);

CREATE INDEX IF NOT EXISTS idx_phone_otp_phone
  ON phone_otp(phone);

-- ============================================================
-- VERIFICATION QUERIES (run these after to confirm)
-- ============================================================
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_name = 'phone_otp'
--  ORDER BY ordinal_position;
--
-- SELECT column_name, data_type
--   FROM information_schema.columns
--  WHERE table_name = 'social_connections'
--  ORDER BY ordinal_position;
