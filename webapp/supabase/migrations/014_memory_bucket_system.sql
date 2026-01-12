-- ============================================================
-- DYNAMIC MEMORY BUCKET SYSTEM
-- The "Brain" of GreenLine365
-- 4-Layer Hierarchy for AI Memory Management
-- ============================================================

-- ============================================================
-- LAYER 1: THE CORE (User Identity & Brand Voice)
-- Deepest, most permanent layer. Defines WHO is speaking and WHY.
-- ============================================================

CREATE TABLE IF NOT EXISTS memory_core_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  
  -- Identity
  display_name TEXT,
  location TEXT,
  industry TEXT,
  business_name TEXT,
  
  -- Voice & Personality (JSONB)
  personality JSONB DEFAULT '{
    "tone": "friendly-expert",
    "formality": "casual-professional", 
    "humor": "light",
    "energy": "balanced"
  }',
  -- {
  --   "tone": "friendly-expert",
  --   "formality": "casual-professional",
  --   "humor": "light",
  --   "energy": "enthusiastic",
  --   "quirks": ["uses local Tampa references", "cooking metaphors"]
  -- }
  
  -- Biography & Story (JSONB)
  biography JSONB DEFAULT '{}',
  -- {
  --   "background": "Former HVAC tech turned cook turned digital marketer",
  --   "why_story": "Struggled on Etsy, learned marketing the hard way",
  --   "expertise": ["local SEO", "service businesses", "handmade products"],
  --   "struggles": ["time management", "consistency"],
  --   "wins": ["first 1000 followers", "first paid client"]
  -- }
  
  -- Brand Guidelines
  brand_voice_examples TEXT[] DEFAULT '{}', -- Example sentences in your voice
  forbidden_phrases TEXT[] DEFAULT '{}',    -- Never say these
  preferred_phrases TEXT[] DEFAULT '{}',    -- Always use these
  
  -- Target Audience
  target_audience JSONB DEFAULT '{}',
  -- {
  --   "demographics": "Local business owners, 35-55",
  --   "pain_points": ["no time for marketing", "tech overwhelmed"],
  --   "desires": ["more customers", "less stress"]
  -- }
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LAYER 2: THE WAREHOUSE (RAG Knowledge Base)
-- Technical library of business facts. Uses pgvector for semantic search.
-- ============================================================

-- Enable pgvector extension (may already exist)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS memory_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Content
  category TEXT NOT NULL, -- 'services', 'pricing', 'faq', 'products', 'processes', 'policies'
  subcategory TEXT,
  title TEXT,
  content TEXT NOT NULL,
  
  -- Vector embedding for semantic search (OpenAI ada-002 = 1536 dimensions)
  embedding vector(1536),
  
  -- Metadata
  source TEXT, -- Where this info came from ('manual', 'imported', 'scraped')
  source_url TEXT,
  confidence FLOAT DEFAULT 1.0, -- 0-1, how reliable is this info
  priority INT DEFAULT 5, -- 1-10, importance for retrieval
  
  -- Versioning
  version INT DEFAULT 1,
  last_verified TIMESTAMPTZ,
  verified_by UUID,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding 
ON memory_knowledge_chunks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_knowledge_category 
ON memory_knowledge_chunks(user_id, category, is_active);

-- ============================================================
-- LAYER 3: THE JOURNAL (Episodic Event Memory)
-- Timeline of every significant event. The AI's "memory" of what happened.
-- ============================================================

CREATE TABLE IF NOT EXISTS memory_event_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  
  -- Event Classification
  event_type TEXT NOT NULL, 
  -- 'blog_published', 'blog_drafted', 'lead_captured', 'lead_contacted',
  -- 'sms_sent', 'email_sent', 'image_generated', 'social_posted',
  -- 'booking_made', 'review_received', 'campaign_started', 'campaign_ended'
  
  event_category TEXT, -- 'content', 'marketing', 'sales', 'system', 'social'
  
  -- Event Details
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  -- Examples:
  -- { "blog_id": "uuid", "topic": "HVAC tips", "word_count": 1200 }
  -- { "lead_name": "John", "source": "website", "service_interest": "AC repair" }
  -- { "image_prompt": "...", "style": "cinematic", "template": "s-flow" }
  
  -- Relationships
  related_entity_type TEXT, -- 'blog', 'lead', 'campaign', 'image', 'booking'
  related_entity_id UUID,
  
  -- Outcomes & Metrics
  outcome TEXT, -- 'success', 'partial', 'failed', 'pending'
  metrics JSONB DEFAULT '{}',
  -- { "views": 150, "clicks": 23, "conversions": 2 }
  
  -- Timing
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INT, -- How long did this take
  
  -- Searchability
  search_text TEXT, -- Concatenated searchable text
  tags TEXT[] DEFAULT '{}',
  
  -- AI Tracking
  ai_generated BOOLEAN DEFAULT false,
  ai_model_used TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_journal_user_time 
ON memory_event_journal(user_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_type 
ON memory_event_journal(user_id, event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_journal_category 
ON memory_event_journal(user_id, event_category, occurred_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_journal_search 
ON memory_event_journal USING gin(to_tsvector('english', coalesce(search_text, '')));

-- GIN index for tags
CREATE INDEX IF NOT EXISTS idx_journal_tags 
ON memory_event_journal USING gin(tags);

-- ============================================================
-- LAYER 4: THE BUFFER (Real-Time Context Window)
-- Short-term memory of current conversation/task. Expires after 24 hours.
-- ============================================================

CREATE TABLE IF NOT EXISTS memory_context_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id TEXT NOT NULL, -- Browser session or conversation ID
  
  -- Context Type
  context_type TEXT NOT NULL, 
  -- 'message' (chat message)
  -- 'document' (active document being edited)
  -- 'selection' (selected item - image, draft, etc.)
  -- 'action' (recent user action)
  -- 'preference' (temporary preference)
  
  -- Content
  content JSONB NOT NULL,
  -- For message: { "role": "user"|"assistant", "content": "...", "timestamp": "..." }
  -- For document: { "document_id": "uuid", "document_type": "blog", "current_content": "..." }
  -- For selection: { "selected_id": "uuid", "selected_type": "image", "details": {...} }
  -- For action: { "action": "clicked_generate", "target": "image-suggestion-3" }
  
  -- Ordering
  sequence_num SERIAL,
  
  -- TTL (Time To Live)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Importance (higher = kept longer in context window)
  importance INT DEFAULT 5, -- 1-10
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_buffer_session 
ON memory_context_buffer(user_id, session_id, created_at DESC);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_buffer_expires 
ON memory_context_buffer(expires_at);

-- Function to cleanup expired context entries
CREATE OR REPLACE FUNCTION cleanup_expired_context()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM memory_context_buffer WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- View: Recent events for a user (last 30 days)
CREATE OR REPLACE VIEW v_recent_events AS
SELECT 
  user_id,
  event_type,
  event_category,
  title,
  description,
  metadata,
  occurred_at,
  outcome
FROM memory_event_journal
WHERE occurred_at > NOW() - INTERVAL '30 days'
ORDER BY occurred_at DESC;

-- View: Active conversation context
CREATE OR REPLACE VIEW v_active_conversations AS
SELECT 
  user_id,
  session_id,
  COUNT(*) as message_count,
  MIN(created_at) as started_at,
  MAX(created_at) as last_activity
FROM memory_context_buffer
WHERE context_type = 'message'
  AND expires_at > NOW()
GROUP BY user_id, session_id;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE memory_core_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_event_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE memory_context_buffer ENABLE ROW LEVEL SECURITY;

-- Core Profiles: Users can only access their own profile
DROP POLICY IF EXISTS "Users can view own core profile" ON memory_core_profiles;
CREATE POLICY "Users can view own core profile" 
  ON memory_core_profiles FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own core profile" ON memory_core_profiles;
CREATE POLICY "Users can update own core profile" 
  ON memory_core_profiles FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own core profile" ON memory_core_profiles;
CREATE POLICY "Users can insert own core profile" 
  ON memory_core_profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Knowledge Chunks: Users can only access their own knowledge
DROP POLICY IF EXISTS "Users can manage own knowledge" ON memory_knowledge_chunks;
CREATE POLICY "Users can manage own knowledge" 
  ON memory_knowledge_chunks FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- Event Journal: Users can only access their own events
DROP POLICY IF EXISTS "Users can manage own events" ON memory_event_journal;
CREATE POLICY "Users can manage own events" 
  ON memory_event_journal FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- Context Buffer: Users can only access their own context
DROP POLICY IF EXISTS "Users can manage own context" ON memory_context_buffer;
CREATE POLICY "Users can manage own context" 
  ON memory_context_buffer FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ============================================================
-- FUNCTIONS FOR AI INTEGRATION
-- ============================================================

-- Function: Get user's brand voice for system prompt injection
CREATE OR REPLACE FUNCTION get_brand_voice(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'display_name', display_name,
    'location', location,
    'industry', industry,
    'business_name', business_name,
    'personality', personality,
    'biography', biography,
    'voice_examples', brand_voice_examples,
    'forbidden_phrases', forbidden_phrases,
    'preferred_phrases', preferred_phrases,
    'target_audience', target_audience
  ) INTO result
  FROM memory_core_profiles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Log an event to the journal
CREATE OR REPLACE FUNCTION log_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_category TEXT DEFAULT 'system',
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO memory_event_journal (
    user_id, event_type, event_category, title, description, metadata, tags,
    search_text
  ) VALUES (
    p_user_id, p_event_type, p_category, p_title, p_description, p_metadata, p_tags,
    COALESCE(p_title, '') || ' ' || COALESCE(p_description, '') || ' ' || COALESCE(p_event_type, '')
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add message to conversation buffer
CREATE OR REPLACE FUNCTION add_to_buffer(
  p_user_id UUID,
  p_session_id TEXT,
  p_context_type TEXT,
  p_content JSONB,
  p_importance INT DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO memory_context_buffer (
    user_id, session_id, context_type, content, importance
  ) VALUES (
    p_user_id, p_session_id, p_context_type, p_content, p_importance
  )
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get conversation history for a session
CREATE OR REPLACE FUNCTION get_conversation_history(
  p_user_id UUID,
  p_session_id TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (cb.content->>'role')::TEXT as role,
    (cb.content->>'content')::TEXT as content,
    cb.created_at
  FROM memory_context_buffer cb
  WHERE cb.user_id = p_user_id
    AND cb.session_id = p_session_id
    AND cb.context_type = 'message'
    AND cb.expires_at > NOW()
  ORDER BY cb.sequence_num DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get recent events for context
CREATE OR REPLACE FUNCTION get_recent_events(
  p_user_id UUID,
  p_event_types TEXT[] DEFAULT NULL,
  p_limit INT DEFAULT 10,
  p_days_back INT DEFAULT 30
)
RETURNS TABLE (
  event_type TEXT,
  title TEXT,
  description TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ej.event_type,
    ej.title,
    ej.description,
    ej.metadata,
    ej.occurred_at
  FROM memory_event_journal ej
  WHERE ej.user_id = p_user_id
    AND ej.occurred_at > NOW() - (p_days_back || ' days')::INTERVAL
    AND (p_event_types IS NULL OR ej.event_type = ANY(p_event_types))
  ORDER BY ej.occurred_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
