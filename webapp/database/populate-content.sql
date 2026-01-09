-- Populate site_content with existing Terms and Trust content
-- This script extracts the hardcoded content and stores it in the database
-- Run this in Supabase SQL Editor

-- Insert Terms of Service
INSERT INTO site_content (key, value, description)
VALUES (
  'terms_of_service',
  'Terms content will be managed from admin panel',
  'Terms of Service legal agreement'
)
ON CONFLICT (key) DO NOTHING;

-- Insert Trust & Security content
INSERT INTO site_content (key, value, description)
VALUES (
  'trust_security',
  'Trust & Security content will be managed from admin panel',
  'Trust & Security whitepaper content'
)
ON CONFLICT (key) DO NOTHING;

-- Insert Privacy Policy placeholder
INSERT INTO site_content (key, value, description)
VALUES (
  'privacy_policy',
  'Privacy Policy content will be managed from admin panel. This is a placeholder that can be edited by administrators.',
  'Privacy Policy content'
)
ON CONFLICT (key) DO NOTHING;
