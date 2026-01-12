-- ============================================================
-- SOCIAL CONNECTIONS TABLE
-- Stores user's connected social media accounts
-- Users provide their own OAuth tokens
-- ============================================================

CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Platform info
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'twitter', 'linkedin'
  
  -- Credentials (should be encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  
  -- Account info
  account_id TEXT,
  account_name TEXT,
  profile_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  UNIQUE(user_id, platform)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_connections_user 
ON social_connections(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_social_connections_platform 
ON social_connections(platform, is_active);

-- Row Level Security
ALTER TABLE social_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own social connections" ON social_connections;
CREATE POLICY "Users can manage own social connections" 
  ON social_connections FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ============================================================
-- SOCIAL POSTS TABLE
-- Tracks posts scheduled/published to social platforms
-- ============================================================

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Content
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  
  -- Platform targeting
  platforms TEXT[] NOT NULL, -- ['instagram', 'facebook', 'twitter']
  
  -- Scheduling
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'published', 'failed'
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Results (per platform)
  results JSONB DEFAULT '{}',
  -- {
  --   "instagram": { "post_id": "xxx", "success": true },
  --   "facebook": { "post_id": "yyy", "success": true }
  -- }
  
  -- Metadata
  source TEXT, -- 'manual', 'blog_share', 'ai_generated'
  related_entity_type TEXT,
  related_entity_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_posts_user 
ON social_posts(user_id, status, scheduled_for);

-- Row Level Security
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own social posts" ON social_posts;
CREATE POLICY "Users can manage own social posts" 
  ON social_posts FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ============================================================
-- ANALYTICS EVENTS TABLE
-- Granular tracking for real analytics
-- ============================================================

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Event info
  event_name TEXT NOT NULL, -- 'page_view', 'blog_view', 'email_open', 'link_click'
  event_category TEXT, -- 'content', 'email', 'social', 'lead'
  
  -- Entity reference
  entity_type TEXT, -- 'blog', 'email', 'social_post'
  entity_id UUID,
  
  -- Visitor info
  visitor_id TEXT, -- Anonymous or identified
  session_id TEXT,
  
  -- Context
  source TEXT, -- 'direct', 'email', 'social', 'search'
  medium TEXT,
  campaign TEXT,
  referrer TEXT,
  
  -- Device/Location
  device_type TEXT, -- 'mobile', 'desktop', 'tablet'
  browser TEXT,
  country TEXT,
  city TEXT,
  
  -- Metrics
  value FLOAT, -- For engagement scores, time on page, etc.
  metadata JSONB DEFAULT '{}',
  
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time 
ON analytics_events(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_entity 
ON analytics_events(entity_type, entity_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name 
ON analytics_events(user_id, event_name, occurred_at DESC);

-- Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own analytics" ON analytics_events;
CREATE POLICY "Users can view own analytics" 
  ON analytics_events FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Allow inserts from anonymous (for tracking)
DROP POLICY IF EXISTS "Allow anonymous event tracking" ON analytics_events;
CREATE POLICY "Allow anonymous event tracking" 
  ON analytics_events FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);
