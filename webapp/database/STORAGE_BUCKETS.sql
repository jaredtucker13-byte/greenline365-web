-- ============================================
-- STORAGE BUCKET SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Create storage bucket for studio assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-assets',
  'studio-assets',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Create storage bucket for business assets (logos, themes)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'business-assets',
  'business-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Storage policies for studio-assets
DROP POLICY IF EXISTS "Public read studio assets" ON storage.objects;
CREATE POLICY "Public read studio assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'studio-assets');

DROP POLICY IF EXISTS "Auth upload studio assets" ON storage.objects;
CREATE POLICY "Auth upload studio assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'studio-assets');

DROP POLICY IF EXISTS "Auth delete studio assets" ON storage.objects;
CREATE POLICY "Auth delete studio assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'studio-assets');

-- Storage policies for business-assets
DROP POLICY IF EXISTS "Public read business assets" ON storage.objects;
CREATE POLICY "Public read business assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'business-assets');

DROP POLICY IF EXISTS "Auth upload business assets" ON storage.objects;
CREATE POLICY "Auth upload business assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'business-assets');

SELECT '✅ Storage buckets configured!' as status;
