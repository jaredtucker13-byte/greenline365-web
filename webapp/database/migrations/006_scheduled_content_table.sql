-- ============================================
-- SCHEDULED CONTENT TABLE
-- For storing calendar events (content, bookings, etc.)
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS scheduled_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('photo', 'product', 'video', 'story', 'reel', 'post')),
  event_type TEXT CHECK (event_type IN ('content', 'booking', 'review', 'launch', 'meeting', 'other')) DEFAULT 'content',
  scheduled_date TIMESTAMPTZ NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  hashtags TEXT[] DEFAULT '{}',
  image_url TEXT,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'published', 'cancelled', 'pending')) DEFAULT 'scheduled',
  color TEXT DEFAULT '#0CE293',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_content_user ON scheduled_content(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_date ON scheduled_content(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_status ON scheduled_content(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_content_type ON scheduled_content(event_type);

-- Enable RLS
ALTER TABLE scheduled_content ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own content" ON scheduled_content
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create own content" ON scheduled_content
  FOR INSERT WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own content" ON scheduled_content
  FOR UPDATE USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete own content" ON scheduled_content
  FOR DELETE USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role full access" ON scheduled_content
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON scheduled_content TO authenticated;
GRANT ALL ON scheduled_content TO service_role;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ scheduled_content table created successfully!';
END $$;
