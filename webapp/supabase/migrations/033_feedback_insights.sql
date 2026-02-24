-- ============================================
-- FEEDBACK INSIGHTS — Pattern Detection Results
-- ============================================
-- Stores patterns detected from anonymous employee feedback.
-- Individual feedback is NEVER shown to owners — only patterns.
-- A pattern requires 3+ separate mentions of the same theme.

CREATE TABLE IF NOT EXISTS feedback_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Pattern details
  theme TEXT NOT NULL,                  -- e.g. "Communication gaps", "Tool quality"
  pattern_summary TEXT NOT NULL,        -- AI-generated summary (no individual attribution)
  mention_count INT NOT NULL DEFAULT 0, -- How many separate feedback entries mention this theme
  sentiment_trend TEXT CHECK (sentiment_trend IN ('worsening', 'stable', 'improving')),
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',

  -- Recommended actions
  recommended_actions TEXT[], -- AI-suggested actions for the owner

  -- Detection metadata
  time_span_days INT DEFAULT 30,   -- How many days of data this pattern covers
  detected_at TIMESTAMPTZ DEFAULT NOW(),

  -- Admin response
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  owner_response TEXT,        -- What action the owner decided to take
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One pattern per theme per business (upserted on re-detection)
  UNIQUE(business_id, theme)
);

CREATE INDEX idx_feedback_insights_business ON feedback_insights(business_id);
CREATE INDEX idx_feedback_insights_unresolved ON feedback_insights(business_id, is_resolved)
  WHERE NOT is_resolved;
CREATE INDEX idx_feedback_insights_urgency ON feedback_insights(business_id, urgency);

-- RLS: Only business owners/admins can see insights
ALTER TABLE feedback_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can view insights" ON feedback_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = feedback_insights.business_id
      AND user_businesses.user_id = auth.uid()
      AND user_businesses.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Business admins can update insights" ON feedback_insights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = feedback_insights.business_id
      AND user_businesses.user_id = auth.uid()
      AND user_businesses.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Service role full access to insights" ON feedback_insights
  FOR ALL TO service_role USING (true);

GRANT SELECT, UPDATE ON feedback_insights TO authenticated;
GRANT ALL ON feedback_insights TO service_role;

-- ============================================
-- MIGRATION 033 COMPLETE
-- ============================================
