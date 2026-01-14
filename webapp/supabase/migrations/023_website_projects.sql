-- Website Projects Table
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS website_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  source_type TEXT DEFAULT 'scratch' CHECK (source_type IN ('url', 'upload', 'scratch')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'published')),
  sections JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  generated_code TEXT,
  preview_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_website_projects_user_id ON website_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_website_projects_status ON website_projects(status);
CREATE INDEX IF NOT EXISTS idx_website_projects_updated_at ON website_projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE website_projects ENABLE ROW LEVEL SECURITY;

-- Users can only access their own projects
CREATE POLICY "Users can view own projects" ON website_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON website_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON website_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON website_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON website_projects TO authenticated;
