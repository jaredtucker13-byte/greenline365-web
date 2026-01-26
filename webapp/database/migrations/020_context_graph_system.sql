-- ============================================
-- CONTEXT GRAPH SYSTEM - Vector + Relational
-- ============================================
-- This enables intelligent AI memory with semantic search
-- and relationship tracking between entities

-- ============================================
-- STEP 1: ENABLE VECTOR EXTENSION
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- STEP 2: CREATE NODES TABLE
-- ============================================
-- Stores content with vector embeddings for semantic search

CREATE TABLE IF NOT EXISTS context_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Content and metadata
  content TEXT NOT NULL,
  node_type TEXT NOT NULL, -- 'customer', 'call', 'preference', 'issue', 'solution'
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Vector embedding (1536 dimensions for OpenAI text-embedding-3-small)
  embedding vector(1536),
  
  -- References to original data
  customer_phone TEXT,
  call_log_id UUID REFERENCES call_logs(id),
  agent_memory_id UUID REFERENCES agent_memory(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- ============================================
-- STEP 3: CREATE EDGES TABLE (RELATIONSHIPS)
-- ============================================
-- Defines how nodes are connected

CREATE TABLE IF NOT EXISTS context_edges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- The relationship
  source_node_id UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES context_nodes(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL, -- 'related_to', 'caused_by', 'solved_by', 'mentioned_in', 'customer_of'
  
  -- Relationship strength (for weighting in search)
  strength FLOAT DEFAULT 1.0,
  
  -- Optional metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate edges
  UNIQUE(source_node_id, target_node_id, relationship_type)
);

-- ============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Vector similarity search index (IVFFlat for speed)
CREATE INDEX IF NOT EXISTS idx_nodes_embedding ON context_nodes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_nodes_business ON context_nodes(business_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON context_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_nodes_phone ON context_nodes(customer_phone);
CREATE INDEX IF NOT EXISTS idx_nodes_created ON context_nodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_accessed ON context_nodes(last_accessed_at DESC);

CREATE INDEX IF NOT EXISTS idx_edges_source ON context_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_target ON context_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_edges_type ON context_edges(relationship_type);
CREATE INDEX IF NOT EXISTS idx_edges_business ON context_edges(business_id);

-- ============================================
-- STEP 5: ENABLE RLS
-- ============================================

ALTER TABLE context_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_edges ENABLE ROW LEVEL SECURITY;

-- Policies for context_nodes
DROP POLICY IF EXISTS "context_nodes_service_role" ON context_nodes;
CREATE POLICY "context_nodes_service_role" ON context_nodes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Policies for context_edges
DROP POLICY IF EXISTS "context_edges_service_role" ON context_edges;
CREATE POLICY "context_edges_service_role" ON context_edges
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================

GRANT ALL ON context_nodes TO service_role;
GRANT ALL ON context_edges TO service_role;
GRANT SELECT ON context_nodes TO authenticated;
GRANT SELECT ON context_edges TO authenticated;

-- ============================================
-- STEP 7: CREATE HELPER FUNCTION FOR SIMILARITY SEARCH
-- ============================================

CREATE OR REPLACE FUNCTION match_context_nodes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_business_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  node_type text,
  metadata jsonb,
  customer_phone text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    context_nodes.id,
    context_nodes.content,
    context_nodes.node_type,
    context_nodes.metadata,
    context_nodes.customer_phone,
    1 - (context_nodes.embedding <=> query_embedding) as similarity
  FROM context_nodes
  WHERE (filter_business_id IS NULL OR context_nodes.business_id = filter_business_id)
    AND 1 - (context_nodes.embedding <=> query_embedding) > match_threshold
  ORDER BY context_nodes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Context Graph System Installed!';
  RAISE NOTICE '✅ pgvector extension enabled';
  RAISE NOTICE '✅ context_nodes table created';
  RAISE NOTICE '✅ context_edges table created';
  RAISE NOTICE '✅ Indexes optimized for vector search';
  RAISE NOTICE '✅ Helper function match_context_nodes() ready';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Deploy embedding generation API endpoint';
END $$;
