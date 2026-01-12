-- Living Canvas Templates Migration
-- Stores reusable layout templates for the Living Canvas publishing system

-- Template definitions table
CREATE TABLE IF NOT EXISTS living_canvas_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general', -- 'general', 'magazine', 'gallery', 'organic', 'framed'
  
  -- Template structure (JSON schema)
  structure JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "type": "s-flow" | "gallery-grid" | "drop-cap" | "winding-path" | "feature-block",
  --   "slots": [
  --     { "id": "slot-1", "type": "image", "shape": "l-shape" | "circle" | "hexagon" | "organic", "position": {...} },
  --     { "id": "slot-2", "type": "text", "wrapAround": "slot-1", "position": {...} }
  --   ],
  --   "gridConfig": { "columns": 3, "rows": 2, "gap": "20px" },
  --   "flowDirection": "s-pattern" | "linear" | "radial"
  -- }
  
  -- Visual settings
  visual_mode TEXT NOT NULL DEFAULT 'organic', -- 'organic' (borderless) or 'framed' (realistic frames)
  frame_asset_id UUID REFERENCES living_canvas_frames(id),
  
  -- CSS Shape definitions for text wrapping
  css_shapes JSONB DEFAULT '{}',
  -- {
  --   "slot-1": {
  --     "shapeOutside": "polygon(0 0, 100% 0, 100% 50%, 50% 100%, 0 100%)",
  --     "clipPath": "polygon(...)",
  --     "float": "left"
  --   }
  -- }
  
  -- Color extraction settings
  color_settings JSONB DEFAULT '{}',
  -- {
  --   "extractFrom": "primary-image",
  --   "applyTo": ["background", "typography-accent", "ui-elements"],
  --   "fallbackPalette": ["#1a1a2e", "#16213e", "#0f3460", "#e94560"]
  -- }
  
  -- Thumbnail preview
  thumbnail_url TEXT,
  
  -- Metadata
  is_system BOOLEAN DEFAULT false, -- System templates can't be deleted
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Frame assets for "Mode B" realistic framing
CREATE TABLE IF NOT EXISTS living_canvas_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  style TEXT NOT NULL, -- 'wood', 'metal', 'ornate', 'minimal', 'museum', 'shadow-box'
  
  -- Frame asset URLs (different sizes/orientations)
  assets JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "landscape": { "url": "...", "innerBounds": { "top": 20, "right": 20, "bottom": 20, "left": 20 } },
  --   "portrait": { "url": "...", "innerBounds": {...} },
  --   "square": { "url": "...", "innerBounds": {...} }
  -- }
  
  -- Shadow settings for depth effect
  shadow_settings JSONB DEFAULT '{}',
  -- {
  --   "offsetX": 10,
  --   "offsetY": 15,
  --   "blur": 30,
  --   "spread": 0,
  --   "color": "rgba(0,0,0,0.4)"
  -- }
  
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's saved canvas compositions
CREATE TABLE IF NOT EXISTS living_canvas_compositions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES living_canvas_templates(id),
  
  title TEXT NOT NULL,
  slug TEXT,
  
  -- Content slots filled with actual content
  content JSONB NOT NULL DEFAULT '{}',
  -- {
  --   "slot-1": { "type": "image", "url": "...", "alt": "..." },
  --   "slot-2": { "type": "text", "content": "..." },
  --   "extractedColors": { "primary": "#...", "secondary": "#...", "accent": "#..." }
  -- }
  
  -- Override settings
  custom_css JSONB DEFAULT '{}',
  visual_mode_override TEXT, -- Override template's visual mode
  
  -- Publishing
  status TEXT DEFAULT 'draft', -- 'draft', 'published', 'archived'
  published_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_templates_category ON living_canvas_templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_slug ON living_canvas_templates(slug);
CREATE INDEX IF NOT EXISTS idx_compositions_user ON living_canvas_compositions(user_id);
CREATE INDEX IF NOT EXISTS idx_compositions_status ON living_canvas_compositions(status);

-- Enable RLS
ALTER TABLE living_canvas_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE living_canvas_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE living_canvas_compositions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates (public read, admin write)
CREATE POLICY "Templates are viewable by everyone" 
  ON living_canvas_templates FOR SELECT 
  USING (is_public = true);

CREATE POLICY "Authenticated users can create templates" 
  ON living_canvas_templates FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can update own templates" 
  ON living_canvas_templates FOR UPDATE 
  TO authenticated 
  USING (created_by = auth.uid() OR is_system = false);

-- RLS Policies for frames (public read)
CREATE POLICY "Frames are viewable by everyone" 
  ON living_canvas_frames FOR SELECT 
  USING (true);

-- RLS Policies for compositions (user-owned)
CREATE POLICY "Users can view own compositions" 
  ON living_canvas_compositions FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own compositions" 
  ON living_canvas_compositions FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own compositions" 
  ON living_canvas_compositions FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own compositions" 
  ON living_canvas_compositions FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Insert system templates
INSERT INTO living_canvas_templates (name, slug, description, category, structure, visual_mode, css_shapes, is_system) VALUES
(
  'Winding Path (S-Flow)',
  'winding-path',
  'Three interlocked L-shaped image containers forming a downward zig-zag pattern. Text flows around each image.',
  'magazine',
  '{
    "type": "s-flow",
    "slots": [
      {"id": "image-1", "type": "image", "shape": "l-shape-right", "gridArea": "1 / 1 / 3 / 2"},
      {"id": "text-1", "type": "text", "wrapAround": "image-1", "gridArea": "1 / 2 / 2 / 3"},
      {"id": "image-2", "type": "image", "shape": "l-shape-left", "gridArea": "2 / 2 / 4 / 3"},
      {"id": "text-2", "type": "text", "wrapAround": "image-2", "gridArea": "3 / 1 / 4 / 2"},
      {"id": "image-3", "type": "image", "shape": "l-shape-right", "gridArea": "4 / 1 / 6 / 2"},
      {"id": "text-3", "type": "text", "wrapAround": "image-3", "gridArea": "5 / 2 / 6 / 3"}
    ],
    "gridConfig": {"columns": 2, "rows": 6, "gap": "2rem"}
  }',
  'organic',
  '{
    "image-1": {"shapeOutside": "polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)", "float": "left"},
    "image-2": {"shapeOutside": "polygon(0 0, 100% 0, 100% 100%, 40% 100%, 0 60%)", "float": "right"},
    "image-3": {"shapeOutside": "polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)", "float": "left"}
  }',
  true
),
(
  'Gallery Grid',
  'gallery-grid',
  'A 3x2 grid of uniform containers. Each cell can be toggled between organic and framed modes.',
  'gallery',
  '{
    "type": "gallery-grid",
    "slots": [
      {"id": "cell-1", "type": "image", "shape": "rectangle", "gridArea": "1 / 1"},
      {"id": "cell-2", "type": "image", "shape": "rectangle", "gridArea": "1 / 2"},
      {"id": "cell-3", "type": "image", "shape": "rectangle", "gridArea": "1 / 3"},
      {"id": "cell-4", "type": "image", "shape": "rectangle", "gridArea": "2 / 1"},
      {"id": "cell-5", "type": "image", "shape": "rectangle", "gridArea": "2 / 2"},
      {"id": "cell-6", "type": "image", "shape": "rectangle", "gridArea": "2 / 3"}
    ],
    "gridConfig": {"columns": 3, "rows": 2, "gap": "1.5rem"}
  }',
  'framed',
  '{}',
  true
),
(
  'Drop-Cap Feature',
  'drop-cap',
  'A text block where the first letter is replaced by a small polygon-shaped image. Text wraps tightly around it.',
  'general',
  '{
    "type": "drop-cap",
    "slots": [
      {"id": "drop-image", "type": "image", "shape": "polygon", "size": "small"},
      {"id": "body-text", "type": "text", "wrapAround": "drop-image"}
    ]
  }',
  'organic',
  '{
    "drop-image": {"shapeOutside": "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", "float": "left", "shapeMargin": "1rem"}
  }',
  true
),
(
  'Hero Feature Block',
  'hero-feature',
  'Full-width hero image with overlaid title and flowing text below.',
  'magazine',
  '{
    "type": "feature-block",
    "slots": [
      {"id": "hero-image", "type": "image", "shape": "full-width", "gridArea": "1 / 1 / 2 / 3"},
      {"id": "hero-title", "type": "text", "overlay": true, "gridArea": "1 / 1 / 2 / 3"},
      {"id": "body-text", "type": "text", "gridArea": "2 / 1 / 3 / 3"}
    ],
    "gridConfig": {"columns": 2, "rows": 2, "gap": "0"}
  }',
  'organic',
  '{}',
  true
),
(
  'Circular Focus',
  'circular-focus',
  'A central circular image with text flowing around it from all sides.',
  'organic',
  '{
    "type": "circular-focus",
    "slots": [
      {"id": "center-image", "type": "image", "shape": "circle"},
      {"id": "surrounding-text", "type": "text", "wrapAround": "center-image"}
    ]
  }',
  'organic',
  '{
    "center-image": {"shapeOutside": "circle(50%)", "float": "left", "shapeMargin": "2rem"}
  }',
  true
),
(
  'Hexagonal Grid',
  'hexagonal-grid',
  'Honeycomb-style layout with hexagonal image containers.',
  'gallery',
  '{
    "type": "hexagonal-grid",
    "slots": [
      {"id": "hex-1", "type": "image", "shape": "hexagon"},
      {"id": "hex-2", "type": "image", "shape": "hexagon"},
      {"id": "hex-3", "type": "image", "shape": "hexagon"},
      {"id": "hex-4", "type": "image", "shape": "hexagon"},
      {"id": "hex-5", "type": "image", "shape": "hexagon"},
      {"id": "hex-6", "type": "image", "shape": "hexagon"},
      {"id": "hex-7", "type": "image", "shape": "hexagon"}
    ],
    "gridConfig": {"type": "honeycomb", "cellSize": "200px"}
  }',
  'framed',
  '{
    "hex-*": {"clipPath": "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"}
  }',
  true
);

-- Insert frame assets
INSERT INTO living_canvas_frames (name, style, assets, shadow_settings) VALUES
(
  'Classic Wood',
  'wood',
  '{
    "landscape": {"url": "/frames/wood-landscape.png", "innerBounds": {"top": 24, "right": 24, "bottom": 24, "left": 24}},
    "portrait": {"url": "/frames/wood-portrait.png", "innerBounds": {"top": 24, "right": 24, "bottom": 24, "left": 24}},
    "square": {"url": "/frames/wood-square.png", "innerBounds": {"top": 24, "right": 24, "bottom": 24, "left": 24}}
  }',
  '{"offsetX": 8, "offsetY": 12, "blur": 24, "spread": 0, "color": "rgba(0,0,0,0.35)"}'
),
(
  'Brushed Metal',
  'metal',
  '{
    "landscape": {"url": "/frames/metal-landscape.png", "innerBounds": {"top": 16, "right": 16, "bottom": 16, "left": 16}},
    "portrait": {"url": "/frames/metal-portrait.png", "innerBounds": {"top": 16, "right": 16, "bottom": 16, "left": 16}},
    "square": {"url": "/frames/metal-square.png", "innerBounds": {"top": 16, "right": 16, "bottom": 16, "left": 16}}
  }',
  '{"offsetX": 4, "offsetY": 8, "blur": 16, "spread": 0, "color": "rgba(0,0,0,0.25)"}'
),
(
  'Museum Glass',
  'museum',
  '{
    "landscape": {"url": "/frames/museum-landscape.png", "innerBounds": {"top": 40, "right": 40, "bottom": 40, "left": 40}},
    "portrait": {"url": "/frames/museum-portrait.png", "innerBounds": {"top": 40, "right": 40, "bottom": 40, "left": 40}},
    "square": {"url": "/frames/museum-square.png", "innerBounds": {"top": 40, "right": 40, "bottom": 40, "left": 40}}
  }',
  '{"offsetX": 12, "offsetY": 18, "blur": 36, "spread": 4, "color": "rgba(0,0,0,0.4)"}'
),
(
  'Shadow Box',
  'shadow-box',
  '{
    "landscape": {"url": "/frames/shadowbox-landscape.png", "innerBounds": {"top": 32, "right": 32, "bottom": 32, "left": 32}},
    "portrait": {"url": "/frames/shadowbox-portrait.png", "innerBounds": {"top": 32, "right": 32, "bottom": 32, "left": 32}},
    "square": {"url": "/frames/shadowbox-square.png", "innerBounds": {"top": 32, "right": 32, "bottom": 32, "left": 32}}
  }',
  '{"offsetX": 0, "offsetY": 20, "blur": 40, "spread": -8, "color": "rgba(0,0,0,0.5)"}'
),
(
  'Minimal White',
  'minimal',
  '{
    "landscape": {"url": "/frames/minimal-landscape.png", "innerBounds": {"top": 8, "right": 8, "bottom": 8, "left": 8}},
    "portrait": {"url": "/frames/minimal-portrait.png", "innerBounds": {"top": 8, "right": 8, "bottom": 8, "left": 8}},
    "square": {"url": "/frames/minimal-square.png", "innerBounds": {"top": 8, "right": 8, "bottom": 8, "left": 8}}
  }',
  '{"offsetX": 2, "offsetY": 4, "blur": 12, "spread": 0, "color": "rgba(0,0,0,0.15)"}'
);
