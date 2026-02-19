-- ============================================================
-- 00004_cleanup_test_data.sql
-- Removes stress test / seed / dummy data before soft launch
-- Run ONCE in production, then archive or delete this file
-- ============================================================

BEGIN;

-- 1. Remove stress-test bookings (14 entries from load testing)
--    These have telltale patterns: sequential creation within seconds,
--    test email domains, or 'stress' / 'test' / 'load test' in notes.
DELETE FROM bookings
WHERE
  -- Test email patterns
  email ILIKE '%@test.%'
  OR email ILIKE '%@example.%'
  OR email ILIKE '%+test%@%'
  OR email ILIKE 'test%@%'
  OR email ILIKE 'loadtest%@%'
  -- Explicit test markers in name or notes
  OR name ILIKE '%stress test%'
  OR name ILIKE '%load test%'
  OR name ILIKE '%test booking%'
  OR notes ILIKE '%stress test%'
  OR notes ILIKE '%load test%'
  OR notes ILIKE '%test data%';

-- 2. Remove orphaned analytics entries (no matching blog post)
DELETE FROM blog_analytics
WHERE post_id NOT IN (SELECT id FROM blog_posts);

-- 3. Remove draft blog posts with placeholder/test content
DELETE FROM blog_posts
WHERE status = 'draft'
  AND (
    title ILIKE '%test post%'
    OR title ILIKE '%lorem ipsum%'
    OR title ILIKE '%untitled%'
    OR content ILIKE '%lorem ipsum dolor sit amet%'
  );

-- 4. Remove test entries from CRM leads
DELETE FROM crm_leads
WHERE
  email ILIKE '%@test.%'
  OR email ILIKE '%@example.%'
  OR email ILIKE 'test%@%'
  OR name ILIKE '%test lead%'
  OR name ILIKE '%test user%';

-- 5. Remove test chat sessions
DELETE FROM chat_sessions
WHERE
  visitor_name ILIKE '%test%'
  OR visitor_email ILIKE '%@test.%'
  OR visitor_email ILIKE '%@example.%';

-- 6. Remove test OTP entries (expired or test emails)
DELETE FROM otp_codes
WHERE
  expires_at < NOW()
  OR email ILIKE '%@test.%'
  OR email ILIKE '%@example.%';

-- 7. Clean up expired rate-limit or session artifacts
-- (These are handled in-memory but just in case of DB-backed sessions)
DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '7 days';

-- 8. Remove any test images from storage metadata (if tracked in DB)
-- Note: Actual storage files must be removed via Supabase Storage API

-- 9. Reset sequences if needed (optional, uncomment if desired)
-- SELECT setval('bookings_id_seq', COALESCE((SELECT MAX(id) FROM bookings), 0) + 1, false);

COMMIT;

-- Summary: Run this query to verify cleanup results
-- SELECT 'bookings' AS table_name, COUNT(*) AS remaining FROM bookings
-- UNION ALL SELECT 'blog_posts', COUNT(*) FROM blog_posts
-- UNION ALL SELECT 'blog_analytics', COUNT(*) FROM blog_analytics
-- UNION ALL SELECT 'crm_leads', COUNT(*) FROM crm_leads
-- UNION ALL SELECT 'chat_sessions', COUNT(*) FROM chat_sessions
-- UNION ALL SELECT 'otp_codes', COUNT(*) FROM otp_codes;
