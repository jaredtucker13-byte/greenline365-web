-- Blog System for GreenLine365 (Clean Install)
-- Run this in Supabase SQL Editor

-- First, drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS blog_analytics CASCADE;
DROP TABLE IF EXISTS blog_posts CASCADE;
DROP TABLE IF EXISTS blog_categories CASCADE;

-- Create the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Blog Categories
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts Table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  
  -- AI Enhancement
  original_content TEXT,
  ai_enhanced_content TEXT,
  seo_score INTEGER,
  
  -- Metadata
  category TEXT,
  tags TEXT[],
  
  -- Images
  featured_image TEXT,
  images JSONB DEFAULT '[]',
  
  -- SEO
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Author
  author_name TEXT DEFAULT 'Jared Tucker',
  author_email TEXT,
  
  -- Publishing
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Analytics
CREATE TABLE blog_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  views INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  read_time_avg INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_tenant_id ON blog_posts(tenant_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_tags ON blog_posts USING GIN(tags);

-- Default categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Business Growth', 'business-growth', 'Strategies and insights for growing your business'),
  ('Marketing Automation', 'marketing-automation', 'Automating your marketing for maximum impact'),
  ('Local Business Tips', 'local-business-tips', 'Tips for succeeding in your local market'),
  ('AI & Technology', 'ai-technology', 'Latest in AI and technology for business'),
  ('Industry Insights', 'industry-insights', 'Deep dives into specific industries');

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to blog_posts" ON blog_posts FOR ALL USING (true);
CREATE POLICY "Allow all access to blog_categories" ON blog_categories FOR ALL USING (true);
CREATE POLICY "Allow all access to blog_analytics" ON blog_analytics FOR ALL USING (true);

-- Auto-update timestamps trigger
DROP TRIGGER IF EXISTS blog_posts_updated_at ON blog_posts;
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Verify creation
SELECT 'Blog tables created successfully!' as status;
SELECT count(*) as categories_count FROM blog_categories;
