-- Migration: Add style_guide column to blog_posts
-- This stores the AI-generated page styling for each blog post

-- Add style_guide column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' AND column_name = 'style_guide'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN style_guide JSONB DEFAULT NULL;
        
        COMMENT ON COLUMN blog_posts.style_guide IS 'AI-generated page styling guide including colors, textures, typography, and layout preferences';
    END IF;
END $$;

-- Create index for faster queries when filtering by style
CREATE INDEX IF NOT EXISTS idx_blog_posts_has_style ON blog_posts ((style_guide IS NOT NULL));

-- Verify the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' AND column_name = 'style_guide';
