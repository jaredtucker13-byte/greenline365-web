-- ============================================================
-- Create Storage Bucket for Incident Images
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create the bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'incident-images',
  'incident-images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for incident images
DROP POLICY IF EXISTS "Authenticated users can upload incident images" ON storage.objects;
CREATE POLICY "Authenticated users can upload incident images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'incident-images');

DROP POLICY IF EXISTS "Authenticated users can view incident images" ON storage.objects;
CREATE POLICY "Authenticated users can view incident images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'incident-images');

DROP POLICY IF EXISTS "Public can view incident images" ON storage.objects;
CREATE POLICY "Public can view incident images"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'incident-images');

DROP POLICY IF EXISTS "Authenticated users can delete own incident images" ON storage.objects;
CREATE POLICY "Authenticated users can delete own incident images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'incident-images');

SELECT 'Storage bucket created!' as result;
