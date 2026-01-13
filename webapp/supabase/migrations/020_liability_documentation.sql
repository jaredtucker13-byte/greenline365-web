-- ============================================================
-- LIABILITY DOCUMENTATION SYSTEM
-- Incident reports with AI analysis and e-signatures
-- ============================================================

-- INCIDENTS TABLE (main record)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- Tenant who owns this
  
  -- Basic Info
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft', -- draft, pending_review, pending_signature, signed, refused, archived
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  
  -- Location & Customer
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  property_address TEXT,
  
  -- AI Analysis Results
  ai_analysis JSONB DEFAULT '{}',
  -- {
  --   "findings": [...],
  --   "risk_level": "high",
  --   "recommended_actions": [...],
  --   "detected_issues": ["mold", "water_damage", "corrosion"],
  --   "summary": "..."
  -- }
  
  -- Report Content
  report_sections JSONB DEFAULT '{}',
  -- {
  --   "summary": "...",
  --   "timeline": [...],
  --   "findings": [...],
  --   "recommendations": [...],
  --   "liability_clause": "..."
  -- }
  
  -- PDF & Documents
  pdf_url TEXT,
  pdf_hash TEXT,  -- SHA-256 for tamper evidence
  
  -- Signature Info
  signature_token TEXT UNIQUE,  -- Secure link token
  signature_expires_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  signer_name TEXT,
  signer_ip TEXT,
  signer_user_agent TEXT,
  signature_type TEXT, -- 'acknowledged', 'refused'
  refusal_reason TEXT,
  
  -- Email Tracking
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_link_clicked_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  finalized_at TIMESTAMPTZ
);

-- INCIDENT IMAGES TABLE
CREATE TABLE IF NOT EXISTS incident_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Image Info
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,  -- Supabase storage path
  url TEXT,
  mime_type TEXT,
  file_size INT,
  
  -- EXIF & Metadata
  exif_data JSONB DEFAULT '{}',
  -- {
  --   "taken_at": "...",
  --   "gps_lat": ...,
  --   "gps_lng": ...,
  --   "device": "...",
  --   "camera_make": "...",
  --   "original_filename": "..."
  -- }
  
  -- AI Analysis for this specific image
  ai_analysis JSONB DEFAULT '{}',
  -- {
  --   "detected_issues": ["mold_growth", "water_staining"],
  --   "severity": "high",
  --   "description": "...",
  --   "suggested_caption": "...",
  --   "confidence": 0.92
  -- }
  
  -- Annotations (user-added)
  annotations JSONB DEFAULT '[]',
  -- [
  --   { "type": "highlight", "x": 100, "y": 200, "width": 50, "note": "..." },
  --   { "type": "arrow", "from": {...}, "to": {...}, "label": "..." }
  -- ]
  
  caption TEXT,
  display_order INT DEFAULT 0,
  
  -- Timestamps
  taken_at TIMESTAMPTZ,  -- From EXIF or manual
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- SIGNATURE EVENTS TABLE (audit trail)
CREATE TABLE IF NOT EXISTS signature_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  
  -- Event Info
  event_type TEXT NOT NULL, -- 'link_generated', 'email_sent', 'link_opened', 'viewed', 'signed', 'refused'
  
  -- Tracking
  ip_address TEXT,
  user_agent TEXT,
  geo_location JSONB,
  
  -- Additional Data
  metadata JSONB DEFAULT '{}',
  
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_incidents_user ON incidents(user_id, status);
CREATE INDEX IF NOT EXISTS idx_incidents_customer ON incidents(customer_email);
CREATE INDEX IF NOT EXISTS idx_incidents_token ON incidents(signature_token);
CREATE INDEX IF NOT EXISTS idx_incident_images_incident ON incident_images(incident_id);
CREATE INDEX IF NOT EXISTS idx_signature_events_incident ON signature_events(incident_id);

-- RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own incidents" ON incidents;
CREATE POLICY "Users manage own incidents" ON incidents 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own incident images" ON incident_images;
CREATE POLICY "Users manage own incident images" ON incident_images 
  FOR ALL TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view own signature events" ON signature_events;
CREATE POLICY "Users view own signature events" ON signature_events 
  FOR SELECT TO authenticated 
  USING (incident_id IN (SELECT id FROM incidents WHERE user_id = auth.uid()));

-- Allow anonymous signature event inserts (for tracking customer views)
DROP POLICY IF EXISTS "Allow signature event inserts" ON signature_events;
CREATE POLICY "Allow signature event inserts" ON signature_events 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

-- Public access to incidents via signature token (for customer viewing)
DROP POLICY IF EXISTS "Public view via token" ON incidents;
CREATE POLICY "Public view via token" ON incidents 
  FOR SELECT TO anon 
  USING (signature_token IS NOT NULL AND signature_expires_at > NOW());

SELECT 'Liability Documentation System tables created!' as result;
