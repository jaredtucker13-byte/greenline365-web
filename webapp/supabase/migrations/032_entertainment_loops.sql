-- Entertainment Loops System (Dimension 3)
-- Curated itineraries linking directory listings into themed experiences

CREATE TABLE IF NOT EXISTS loops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  loop_type TEXT NOT NULL CHECK (loop_type IN ('date-night', 'entertainment', 'family', 'foodie', 'adventure', 'nightlife', 'wellness')),
  destination_slug TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  cover_image_url TEXT,
  duration_estimate TEXT,
  vibe TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'active')),
  is_sponsored BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loops_slug ON loops(slug);
CREATE INDEX IF NOT EXISTS idx_loops_type ON loops(loop_type);
CREATE INDEX IF NOT EXISTS idx_loops_destination ON loops(destination_slug);
CREATE INDEX IF NOT EXISTS idx_loops_published ON loops(is_published);

CREATE TABLE IF NOT EXISTS loop_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  loop_id UUID NOT NULL REFERENCES loops(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES directory_listings(id) ON DELETE SET NULL,
  stop_order INTEGER NOT NULL,
  custom_name TEXT,
  custom_description TEXT,
  custom_image_url TEXT,
  duration_minutes INTEGER,
  transition_note TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loop_stops_loop ON loop_stops(loop_id);
CREATE INDEX IF NOT EXISTS idx_loop_stops_listing ON loop_stops(listing_id);

-- RLS
ALTER TABLE loops ENABLE ROW LEVEL SECURITY;
ALTER TABLE loop_stops ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loops_public_read') THEN
    CREATE POLICY loops_public_read ON loops FOR SELECT USING (is_published = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'loop_stops_public_read') THEN
    CREATE POLICY loop_stops_public_read ON loop_stops FOR SELECT USING (true);
  END IF;
END $$;

-- Auto-update timestamp
CREATE TRIGGER update_loops_updated_at
  BEFORE UPDATE ON loops
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
