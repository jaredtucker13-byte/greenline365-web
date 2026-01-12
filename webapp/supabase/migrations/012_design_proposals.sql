-- Design Proposals Table
-- Stores website redesign proposals with AI analysis and mockup images

CREATE TABLE IF NOT EXISTS design_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Input data
  mode TEXT NOT NULL CHECK (mode IN ('analyze', 'scratch')),
  screenshot_url TEXT,
  user_description TEXT,
  brand_colors JSONB,
  
  -- Analysis results
  vision_model_used TEXT,
  text_model_used TEXT,
  analysis_text TEXT,
  design_spec JSONB,
  
  -- Generated assets
  mockup_image_url TEXT,
  generated_code TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'implemented')),
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  implemented_at TIMESTAMPTZ,
  
  -- Metadata
  analysis_type TEXT,
  notes TEXT
);

-- Indexes for performance
CREATE INDEX idx_design_proposals_tenant ON design_proposals(tenant_id);
CREATE INDEX idx_design_proposals_status ON design_proposals(status);
CREATE INDEX idx_design_proposals_created ON design_proposals(created_at DESC);

-- RLS Policies
ALTER TABLE design_proposals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own proposals
CREATE POLICY "Users can view own proposals"
  ON design_proposals FOR SELECT
  USING (auth.uid() = tenant_id);

-- Users can create their own proposals
CREATE POLICY "Users can create own proposals"
  ON design_proposals FOR INSERT
  WITH CHECK (auth.uid() = tenant_id);

-- Users can update their own proposals
CREATE POLICY "Users can update own proposals"
  ON design_proposals FOR UPDATE
  USING (auth.uid() = tenant_id);

-- Users can delete their own proposals
CREATE POLICY "Users can delete own proposals"
  ON design_proposals FOR DELETE
  USING (auth.uid() = tenant_id);

-- Add comment
COMMENT ON TABLE design_proposals IS 'Stores AI-generated website redesign proposals with mockups and code';
