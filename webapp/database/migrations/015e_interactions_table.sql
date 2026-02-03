-- ============================================
-- PROPERTY-FIRST ENGINE - STEP 5: Interactions Table
-- Run this FIFTH (after 015d)
-- ============================================

CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  
  -- Interaction type
  interaction_type TEXT NOT NULL,
  
  -- Call-specific fields
  call_id TEXT,
  call_direction TEXT,
  call_duration_seconds INTEGER,
  call_recording_url TEXT,
  
  -- Content
  summary TEXT,
  transcript TEXT,
  
  -- AI Analysis
  sentiment TEXT,
  sentiment_score DECIMAL(3, 2),
  intent_detected TEXT,
  
  -- Witty Hooks Tracking
  greeting_style TEXT,
  joke_id INTEGER,
  
  -- Agent info
  agent_type TEXT,
  agent_name TEXT,
  
  -- Outcome
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interactions_tenant ON interactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_interactions_property ON interactions(property_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact ON interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(tenant_id, interaction_type);
CREATE INDEX IF NOT EXISTS idx_interactions_date ON interactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interactions_call_id ON interactions(call_id);

-- RLS
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation for interactions" ON interactions;
CREATE POLICY "Tenant isolation for interactions" ON interactions
  FOR ALL USING (tenant_id IN (
    SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Service role full access to interactions" ON interactions;
CREATE POLICY "Service role full access to interactions" ON interactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON interactions TO authenticated;
GRANT ALL ON interactions TO service_role;
