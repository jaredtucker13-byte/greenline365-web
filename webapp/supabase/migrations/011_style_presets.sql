-- Style Presets / Favorites Library
-- Allows users to save, organize, and reuse their best style configurations

CREATE TABLE IF NOT EXISTS style_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID,
  
  -- Style identity
  name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- The actual style configuration (same structure as blog_posts.style_guide)
  style_guide JSONB NOT NULL,
  
  -- Organization
  tags TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false, -- Future: community sharing
  
  -- Usage tracking
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_style_presets_tenant ON style_presets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_style_presets_user ON style_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_style_presets_default ON style_presets(tenant_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_style_presets_tags ON style_presets USING GIN(tags);

-- Enable RLS
ALTER TABLE style_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own presets" ON style_presets
  FOR SELECT USING (auth.uid() = user_id OR tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create presets" ON style_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets" ON style_presets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" ON style_presets
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_style_presets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER style_presets_updated_at
  BEFORE UPDATE ON style_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_style_presets_updated_at();

-- Function to ensure only one default per tenant
CREATE OR REPLACE FUNCTION ensure_single_default_style()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE style_presets 
    SET is_default = false 
    WHERE tenant_id = NEW.tenant_id 
      AND id != NEW.id 
      AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_style_trigger
  BEFORE INSERT OR UPDATE ON style_presets
  FOR EACH ROW
  WHEN (NEW.is_default = true)
  EXECUTE FUNCTION ensure_single_default_style();
