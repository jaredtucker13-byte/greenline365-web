-- ============================================
-- CREATIVE STUDIO SCHEMA
-- Character Vault + Product Library
-- ============================================

-- STEP 1: Character Vault (Signature Models)
-- ============================================
CREATE TABLE IF NOT EXISTS signature_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Model Identity
  name TEXT NOT NULL,
  description TEXT,
  
  -- Model Type
  model_type TEXT NOT NULL CHECK (model_type IN ('photo_seed', 'virtual')),
  
  -- Photo Seed Data (for real model references)
  reference_images JSONB DEFAULT '[]'::jsonb,  -- Array of image URLs
  identity_seed TEXT,  -- Generated identity embedding/hash
  
  -- Virtual Model Parameters
  ethnicity TEXT,
  age_range TEXT,  -- e.g., "25-35"
  gender TEXT,
  style_tags JSONB DEFAULT '[]'::jsonb,  -- e.g., ["professional", "casual", "athletic"]
  
  -- Generated Preview
  preview_url TEXT,
  
  -- Usage Stats
  times_used INTEGER DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_signature_models_business ON signature_models(business_id);

SELECT '✅ Created signature_models table' as status;

-- STEP 2: Product Library
-- ============================================
CREATE TABLE IF NOT EXISTS studio_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Product Identity
  name TEXT NOT NULL,
  description TEXT,
  
  -- Product Classification
  product_type TEXT NOT NULL,  -- apparel, wall_art, jewelry, etc.
  
  -- Original Assets
  original_images JSONB DEFAULT '[]'::jsonb,  -- Array of uploaded image URLs
  
  -- AI Analysis Results (from Gemini 3 Pro)
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  /*
    {
      "detected_type": "apparel",
      "materials": ["cotton", "polyester"],
      "colors": ["#FF0000", "#000000"],
      "style": "casual streetwear",
      "suggested_price": { "min": 29, "max": 49 },
      "marketing_angles": ["comfort", "versatility"],
      "description": "A stylish red hoodie..."
    }
  */
  
  -- User Edits (after AI review)
  user_overrides JSONB DEFAULT '{}'::jsonb,
  
  -- Pricing
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzed', 'ready', 'archived')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_studio_products_business ON studio_products(business_id);
CREATE INDEX idx_studio_products_type ON studio_products(product_type);
CREATE INDEX idx_studio_products_status ON studio_products(status);

SELECT '✅ Created studio_products table' as status;

-- STEP 3: Generated Mockups
-- ============================================
CREATE TABLE IF NOT EXISTS studio_mockups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES studio_products(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Generation Config
  signature_model_id UUID REFERENCES signature_models(id) ON DELETE SET NULL,
  scene_type TEXT NOT NULL,  -- 'lifestyle', 'studio', 'golden_hour', etc.
  scene_config JSONB DEFAULT '{}'::jsonb,  -- Scene-specific settings
  
  -- Generated Asset
  image_url TEXT,
  thumbnail_url TEXT,
  
  -- Resolution Variants
  variants JSONB DEFAULT '{}'::jsonb,
  /*
    {
      "high_res": "url",
      "pinterest": "url",  // 1000x1500
      "tiktok": "url",     // 1080x1920
      "instagram": "url"   // 1080x1080
    }
  */
  
  -- Generation Details
  prompt_used TEXT,
  model_used TEXT DEFAULT 'nano-banana-pro',
  generation_time_ms INTEGER,
  
  -- Quality/Favorites
  is_favorite BOOLEAN DEFAULT false,
  quality_score DECIMAL(3,2),  -- 0-1 scale
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_studio_mockups_product ON studio_mockups(product_id);
CREATE INDEX idx_studio_mockups_business ON studio_mockups(business_id);

SELECT '✅ Created studio_mockups table' as status;

-- STEP 4: Scene Library (predefined scenes)
-- ============================================
CREATE TABLE IF NOT EXISTS mockup_scenes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Scene Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Categorization
  category TEXT NOT NULL,  -- 'lifestyle', 'studio', 'outdoor', 'abstract'
  product_types JSONB DEFAULT '[]'::jsonb,  -- Which product types this scene works for
  
  -- Scene Config
  prompt_template TEXT NOT NULL,  -- Base prompt for this scene
  style_modifiers JSONB DEFAULT '[]'::jsonb,
  
  -- Preview
  preview_url TEXT,
  
  -- Ordering
  display_order INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default scenes
INSERT INTO mockup_scenes (name, slug, description, category, product_types, prompt_template, display_order)
VALUES
  ('Minimalist Studio', 'minimalist-studio', 'Clean white background with soft shadows', 'studio', 
   '["apparel", "jewelry", "accessories", "packaging"]'::jsonb,
   'Product photography on clean white seamless background, soft diffused lighting, subtle shadow, professional studio setup, 8K quality',
   1),
  
  ('Lifestyle Living Room', 'lifestyle-living', 'Modern living room setting', 'lifestyle',
   '["wall_art", "home_decor", "accessories"]'::jsonb,
   'Product elegantly placed in modern minimalist living room, natural window light, cozy aesthetic, lifestyle photography',
   2),
  
  ('Golden Hour Outdoor', 'golden-hour', 'Warm sunset lighting outdoors', 'outdoor',
   '["apparel", "accessories", "footwear"]'::jsonb,
   'Product in golden hour sunlight, warm tones, bokeh background, cinematic outdoor photography, magic hour lighting',
   3),
  
  ('Urban Street', 'urban-street', 'Gritty urban environment', 'lifestyle',
   '["apparel", "footwear", "accessories"]'::jsonb,
   'Product in urban street setting, concrete and brick textures, street style photography, authentic city vibe',
   4),
  
  ('Flat Lay Styled', 'flat-lay', 'Top-down styled arrangement', 'studio',
   '["accessories", "jewelry", "packaging", "apparel"]'::jsonb,
   'Flat lay product photography, styled arrangement with complementary props, top-down angle, editorial aesthetic',
   5),
  
  ('Nature Macro', 'nature-macro', 'Close-up with natural elements', 'outdoor',
   '["jewelry", "accessories", "packaging"]'::jsonb,
   'Macro product shot with natural elements, leaves, flowers, water droplets, organic textures, nature-inspired',
   6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  prompt_template = EXCLUDED.prompt_template;

SELECT '✅ Created mockup_scenes table with defaults' as status;

-- STEP 5: Enable RLS
-- ============================================
ALTER TABLE signature_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE mockup_scenes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "auth_signature_models" ON signature_models FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_studio_products" ON studio_products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_studio_mockups" ON studio_mockups FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_mockup_scenes" ON mockup_scenes FOR SELECT TO anon, authenticated USING (true);

-- Grants
GRANT ALL ON signature_models TO authenticated, service_role;
GRANT ALL ON studio_products TO authenticated, service_role;
GRANT ALL ON studio_mockups TO authenticated, service_role;
GRANT SELECT ON mockup_scenes TO anon, authenticated;
GRANT ALL ON mockup_scenes TO service_role;

SELECT '✅ RLS and permissions configured' as status;

-- VERIFICATION
-- ============================================
SELECT '🎉 CREATIVE STUDIO SCHEMA COMPLETE!' as final_status;

SELECT name, slug, category FROM mockup_scenes ORDER BY display_order;
