-- ============================================
-- CONTEXT GRAPH + ANONYMOUS FEEDBACK + NOTIFICATIONS
-- ============================================
-- Migration 032: Three systems that power the Second Brain
--
-- 1. brain_edges — Context graph connecting ALL entities across both brains
-- 2. anonymous_feedback — Identity-stripped employee feedback from Slack
-- 3. notifications — Dashboard bell + email fallback orchestration

-- ────────────────────────────────────────────
-- 1. CONTEXT GRAPH: brain_edges
-- ────────────────────────────────────────────
-- Connects brain items to each other AND to platform entities
-- (properties, incidents, assets, contacts, etc.)
-- Supports both explicit (user/system-created) and AI-inferred edges.

CREATE TABLE IF NOT EXISTS brain_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Source node
  source_type TEXT NOT NULL,  -- brain_person, brain_project, brain_idea, brain_admin, property, incident, asset, contact
  source_id UUID NOT NULL,

  -- Target node
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,

  -- Relationship
  relationship TEXT NOT NULL, -- works_on, has_incident, related_to, assigned_to, mentions, caused_by, at_property, involves_asset, etc.
  strength FLOAT DEFAULT 1.0, -- 1.0 = explicit/confirmed, 0.0-0.99 = AI-inferred confidence

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible context about the relationship
  created_by TEXT NOT NULL DEFAULT 'user', -- user, ai_router, incident_trigger, slack_bot, system

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate edges
  UNIQUE(business_id, source_type, source_id, target_type, target_id, relationship)
);

-- Indexes for graph traversal
CREATE INDEX idx_brain_edges_business ON brain_edges(business_id);
CREATE INDEX idx_brain_edges_source ON brain_edges(business_id, source_type, source_id);
CREATE INDEX idx_brain_edges_target ON brain_edges(business_id, target_type, target_id);
CREATE INDEX idx_brain_edges_relationship ON brain_edges(business_id, relationship);
CREATE INDEX idx_brain_edges_strength ON brain_edges(business_id, strength) WHERE strength < 1.0;

-- RLS
ALTER TABLE brain_edges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view business edges" ON brain_edges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = brain_edges.business_id
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage business edges" ON brain_edges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = brain_edges.business_id
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Service role bypass for triggers and background jobs
CREATE POLICY "Service role full access to edges" ON brain_edges
  FOR ALL TO service_role USING (true);

GRANT ALL ON brain_edges TO authenticated, service_role;

-- ── Graph traversal helper function ──
-- Returns all nodes connected to a given entity (1-hop)
CREATE OR REPLACE FUNCTION get_connected_nodes(
  p_business_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_max_hops INT DEFAULT 1
)
RETURNS TABLE (
  node_type TEXT,
  node_id UUID,
  relationship TEXT,
  direction TEXT,
  strength FLOAT,
  hop INT
) LANGUAGE SQL STABLE AS $$
  -- Outgoing edges (this entity → other)
  SELECT
    e.target_type AS node_type,
    e.target_id AS node_id,
    e.relationship,
    'outgoing'::TEXT AS direction,
    e.strength,
    1 AS hop
  FROM brain_edges e
  WHERE e.business_id = p_business_id
    AND e.source_type = p_entity_type
    AND e.source_id = p_entity_id

  UNION ALL

  -- Incoming edges (other → this entity)
  SELECT
    e.source_type AS node_type,
    e.source_id AS node_id,
    e.relationship,
    'incoming'::TEXT AS direction,
    e.strength,
    1 AS hop
  FROM brain_edges e
  WHERE e.business_id = p_business_id
    AND e.target_type = p_entity_type
    AND e.target_id = p_entity_id;
$$;


-- ────────────────────────────────────────────
-- 2. ANONYMOUS FEEDBACK
-- ────────────────────────────────────────────
-- Identity-stripped employee feedback captured from Slack.
-- The original Slack message is deleted after capture.
-- NO user_id, NO slack_user_id, NO name — completely anonymous.

CREATE TABLE IF NOT EXISTS anonymous_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Content (identity-free)
  feedback_text TEXT NOT NULL,

  -- AI classification
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  themes TEXT[],
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high')) DEFAULT 'medium',
  ai_summary TEXT,

  -- Metadata (no identity info)
  source_channel TEXT DEFAULT 'slack', -- slack, web_form
  has_attachments BOOLEAN DEFAULT false,

  -- Admin review
  is_reviewed BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,

  -- For report generation
  report_id UUID, -- Links to generated coaching report

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_anon_feedback_business ON anonymous_feedback(business_id);
CREATE INDEX idx_anon_feedback_sentiment ON anonymous_feedback(business_id, sentiment);
CREATE INDEX idx_anon_feedback_unreviewed ON anonymous_feedback(business_id, is_reviewed) WHERE NOT is_reviewed;
CREATE INDEX idx_anon_feedback_created ON anonymous_feedback(business_id, created_at DESC);

-- RLS: Only business owners/admins can view feedback
ALTER TABLE anonymous_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business admins can view feedback" ON anonymous_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = anonymous_feedback.business_id
      AND user_businesses.user_id = auth.uid()
      AND user_businesses.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Business admins can update feedback" ON anonymous_feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = anonymous_feedback.business_id
      AND user_businesses.user_id = auth.uid()
      AND user_businesses.role IN ('owner', 'admin')
    )
  );

-- Service role can insert (from Slack bot) and manage
CREATE POLICY "Service role full access to feedback" ON anonymous_feedback
  FOR ALL TO service_role USING (true);

-- Authenticated users CANNOT insert directly — only service role (Slack bot)
-- This prevents someone from gaming the system by posting fake feedback
GRANT SELECT, UPDATE ON anonymous_feedback TO authenticated;
GRANT ALL ON anonymous_feedback TO service_role;


-- ────────────────────────────────────────────
-- 3. NOTIFICATIONS
-- ────────────────────────────────────────────
-- Unified notification system for the Command Center dashboard.
-- All system events route here. Email fallback if not read within 2 hours.

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT, -- emoji or icon name for dashboard display

  -- Categorization
  category TEXT NOT NULL DEFAULT 'system',
    -- system, brain, incident, lead, booking, feedback, badge, pto, alert
  severity TEXT NOT NULL DEFAULT 'info',
    -- info, success, warning, critical

  -- Source tracking
  source_type TEXT, -- incident, brain_thought, lead, booking, feedback, etc.
  source_id UUID,   -- ID of the source entity

  -- Action
  action_url TEXT,   -- Deep link into Command Center
  action_label TEXT, -- e.g. "View Incident", "Approve PTO"

  -- State
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  -- Delivery
  channels TEXT[] DEFAULT ARRAY['dashboard'], -- dashboard, email, slack, sms

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Auto-cleanup old notifications
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_business ON notifications(business_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE NOT is_read;
CREATE INDEX idx_notifications_category ON notifications(business_id, category);
CREATE INDEX idx_notifications_created ON notifications(business_id, created_at DESC);
CREATE INDEX idx_notifications_email_pending ON notifications(is_read, is_email_sent, created_at)
  WHERE NOT is_read AND NOT is_email_sent;

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role full access to notifications" ON notifications
  FOR ALL TO service_role USING (true);

GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- ── Helper: Get unread count ──
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INT LANGUAGE SQL STABLE AS $$
  SELECT COUNT(*)::INT
  FROM notifications
  WHERE user_id = p_user_id AND NOT is_read;
$$;

-- ── Helper: Create a notification ──
CREATE OR REPLACE FUNCTION create_notification(
  p_business_id UUID,
  p_user_id UUID,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'system',
  p_severity TEXT DEFAULT 'info',
  p_source_type TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL,
  p_icon TEXT DEFAULT NULL,
  p_channels TEXT[] DEFAULT ARRAY['dashboard']
)
RETURNS UUID LANGUAGE plpgsql AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO notifications (
    business_id, user_id, title, body, category, severity,
    source_type, source_id, action_url, action_label, icon, channels
  ) VALUES (
    p_business_id, p_user_id, p_title, p_body, p_category, p_severity,
    p_source_type, p_source_id, p_action_url, p_action_label, p_icon, p_channels
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- ============================================
-- MIGRATION 032 COMPLETE
-- ============================================
