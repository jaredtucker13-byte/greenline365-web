-- ============================================
-- DAILY TREND HUNTER: AUTO-JOURNALING TABLES
-- Run this in Supabase SQL Editor
-- ============================================

-- Add expiry tracking to local_trends
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE local_trends ADD COLUMN IF NOT EXISTS zip_code TEXT;

CREATE INDEX IF NOT EXISTS idx_local_trends_expires ON local_trends(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_local_trends_user ON local_trends(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_local_trends_zip ON local_trends(zip_code);

-- ============================================
-- TREND HISTORY TABLE
-- Stores all trend requests and responses for auto-journaling
-- ============================================
CREATE TABLE IF NOT EXISTS trend_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  zip_code TEXT NOT NULL,
  trend_type TEXT CHECK (trend_type IN ('live_pulse', 'weekly_batch', 'manual')),
  n8n_request JSONB DEFAULT '{}',
  n8n_response JSONB DEFAULT '{}',
  trends_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'timeout'))
);

CREATE INDEX IF NOT EXISTS idx_trend_history_user ON trend_history(user_id);
CREATE INDEX IF NOT EXISTS idx_trend_history_zip ON trend_history(zip_code);
CREATE INDEX IF NOT EXISTS idx_trend_history_created ON trend_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trend_history_expires ON trend_history(expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE trend_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trend history" ON trend_history
  FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service can manage trend history" ON trend_history
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- BUSINESS SERVICES TABLE
-- Stores user's business services for context-aware suggestions
-- ============================================
CREATE TABLE IF NOT EXISTS business_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  service_name TEXT NOT NULL,
  category TEXT,
  pricing JSONB DEFAULT '{}',
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_services_user ON business_services(user_id);
CREATE INDEX IF NOT EXISTS idx_business_services_active ON business_services(active) WHERE active = true;

ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own services" ON business_services
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- CONTENT PERFORMANCE TABLE
-- Tracks post engagement for auto-journaling
-- ============================================
CREATE TABLE IF NOT EXISTS content_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID,
  platform TEXT CHECK (platform IN ('instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'other')),
  caption_text TEXT,
  post_time TIMESTAMPTZ,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate NUMERIC,
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_performance_user ON content_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_content_performance_platform ON content_performance(platform);
CREATE INDEX IF NOT EXISTS idx_content_performance_created ON content_performance(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_performance_score ON content_performance(performance_score DESC);

ALTER TABLE content_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own performance data" ON content_performance
  FOR ALL USING (user_id = auth.uid());

-- ============================================
-- PLATFORM METRICS TABLE
-- Real website stats from auto-journaling
-- ============================================
CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_name ON platform_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_platform_metrics_calculated ON platform_metrics(calculated_at DESC);

ALTER TABLE platform_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view metrics" ON platform_metrics
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM super_admins)
  );

CREATE POLICY "Service can manage metrics" ON platform_metrics
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- USER ACTIONS TABLE
-- Auto-journaling: Tracks every user action
-- ============================================
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_category TEXT CHECK (action_category IN ('content', 'trend', 'settings', 'navigation', 'integration', 'other')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_created ON user_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_created ON user_actions(user_id, created_at DESC);

ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own actions" ON user_actions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service can log actions" ON user_actions
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR user_id = auth.uid());

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Daily Trend Hunter tables created successfully!';
  RAISE NOTICE '📊 Tables created:';
  RAISE NOTICE '   - trend_history (auto-journaling)';
  RAISE NOTICE '   - business_services (context-aware suggestions)';
  RAISE NOTICE '   - content_performance (engagement tracking)';
  RAISE NOTICE '   - platform_metrics (real stats)';
  RAISE NOTICE '   - user_actions (all actions logged)';
  RAISE NOTICE '🔐 RLS policies enabled on all tables';
END $$;