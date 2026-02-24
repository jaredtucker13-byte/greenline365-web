-- ============================================
-- AGENT CHAT SESSIONS
-- ============================================
-- Stores all conversations across all agents (Aiden, Ada, Susan, Concierge).
-- Brain-connected: agents read from past sessions before responding.
-- Auto-journaling: every session gets logged to the brain's event journal.

-- Sessions table — one per conversation
CREATE TABLE IF NOT EXISTS agent_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,

  -- Who's in this conversation
  visitor_id TEXT,            -- Anonymous visitor fingerprint (public chats)
  user_id UUID,               -- Authenticated user (admin dashboard chats)

  -- Contact info (extracted during conversation)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_business_type TEXT,

  -- Agent config
  agent_id TEXT NOT NULL DEFAULT 'concierge',  -- aiden, ada, susan, concierge
  agent_mode TEXT NOT NULL DEFAULT 'concierge', -- sales, concierge

  -- Session state
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'transferred', 'escalated')),

  -- Transfer chain — tracks department handoffs
  transfer_chain JSONB DEFAULT '[]'::jsonb,
  -- e.g. [{"from":"concierge","to":"aiden","reason":"interested in marketing help","at":"..."}]

  -- Lead tracking
  lead_created BOOLEAN DEFAULT false,
  lead_id UUID,

  -- Brain integration
  intent_score INTEGER DEFAULT 0 CHECK (intent_score >= 0 AND intent_score <= 100),
  pain_points TEXT[],
  conversation_summary TEXT,  -- AI-generated after session ends

  -- Metadata
  source TEXT DEFAULT 'widget', -- widget, voice, slack, api
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX idx_agent_sessions_business ON agent_chat_sessions(business_id);
CREATE INDEX idx_agent_sessions_user ON agent_chat_sessions(user_id);
CREATE INDEX idx_agent_sessions_visitor ON agent_chat_sessions(visitor_id);
CREATE INDEX idx_agent_sessions_agent ON agent_chat_sessions(agent_id, agent_mode);
CREATE INDEX idx_agent_sessions_status ON agent_chat_sessions(status);
CREATE INDEX idx_agent_sessions_contact ON agent_chat_sessions(contact_email, contact_phone);
CREATE INDEX idx_agent_sessions_created ON agent_chat_sessions(created_at DESC);

-- Messages table — individual messages within a session
CREATE TABLE IF NOT EXISTS agent_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES agent_chat_sessions(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,

  -- Agent context (which agent/mode sent this)
  agent_id TEXT,
  agent_mode TEXT,

  -- Tool calls — if the agent called a tool
  tool_calls JSONB,       -- [{name, arguments, result}]
  tool_name TEXT,          -- For role='tool' messages
  tool_result JSONB,       -- For role='tool' messages

  -- Brain context used for this response
  brain_context_used JSONB,  -- What memories/knowledge the agent referenced

  -- Metadata
  tokens_used INTEGER DEFAULT 0,
  model_used TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_messages_session ON agent_chat_messages(session_id);
CREATE INDEX idx_agent_messages_role ON agent_chat_messages(session_id, role);
CREATE INDEX idx_agent_messages_created ON agent_chat_messages(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE agent_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_chat_messages ENABLE ROW LEVEL SECURITY;

-- Sessions: Users can see their own sessions + business sessions they belong to
CREATE POLICY "Users can view own sessions" ON agent_chat_sessions
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = agent_chat_sessions.business_id
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can create sessions" ON agent_chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own sessions" ON agent_chat_sessions
  FOR UPDATE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_businesses
      WHERE user_businesses.business_id = agent_chat_sessions.business_id
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Messages: Inherit access from session
CREATE POLICY "Users can view session messages" ON agent_chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_chat_sessions s
      WHERE s.id = agent_chat_messages.session_id
      AND (
        s.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_businesses
          WHERE user_businesses.business_id = s.business_id
          AND user_businesses.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Anyone can insert messages" ON agent_chat_messages
  FOR INSERT WITH CHECK (true);

-- Service role bypass for cron/internal
CREATE POLICY "Service role full access sessions" ON agent_chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access messages" ON agent_chat_messages
  FOR ALL USING (auth.role() = 'service_role');

GRANT ALL ON agent_chat_sessions TO authenticated, service_role;
GRANT ALL ON agent_chat_messages TO authenticated, service_role;

-- ============================================
-- HELPER: Get past conversations with a contact
-- ============================================
-- Used by agents to recall what they've said before to this person

CREATE OR REPLACE FUNCTION get_contact_history(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_visitor_id TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  session_id UUID,
  agent_id TEXT,
  agent_mode TEXT,
  contact_name TEXT,
  conversation_summary TEXT,
  pain_points TEXT[],
  intent_score INTEGER,
  lead_created BOOLEAN,
  message_count BIGINT,
  created_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS session_id,
    s.agent_id,
    s.agent_mode,
    s.contact_name,
    s.conversation_summary,
    s.pain_points,
    s.intent_score,
    s.lead_created,
    (SELECT COUNT(*) FROM agent_chat_messages m WHERE m.session_id = s.id) AS message_count,
    s.created_at,
    s.ended_at
  FROM agent_chat_sessions s
  WHERE
    (p_email IS NOT NULL AND s.contact_email = p_email)
    OR (p_phone IS NOT NULL AND s.contact_phone = p_phone)
    OR (p_visitor_id IS NOT NULL AND s.visitor_id = p_visitor_id)
  ORDER BY s.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER: Auto-summarize completed sessions
-- ============================================
-- Trigger that fires when a session status changes to 'completed'
-- The actual summarization happens in the API layer (needs AI)

CREATE OR REPLACE FUNCTION on_session_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'transferred', 'escalated') AND OLD.status = 'active' THEN
    NEW.ended_at = NOW();
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_session_complete
  BEFORE UPDATE ON agent_chat_sessions
  FOR EACH ROW
  WHEN (NEW.status IS DISTINCT FROM OLD.status)
  EXECUTE FUNCTION on_session_complete();
