-- ============================================
-- THE BRAIN SYSTEM - Memory Buckets
-- ============================================
-- Tenant-specific thought capture and organization system
-- Integrated with Slack for frictionless capture

-- Create brain_thoughts table (inbox/capture layer)
CREATE TABLE IF NOT EXISTS brain_thoughts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Capture data
  raw_text TEXT NOT NULL,
  source TEXT DEFAULT 'slack', -- slack, web, mobile
  
  -- AI routing
  classified_bucket TEXT CHECK (classified_bucket IN ('people', 'projects', 'ideas', 'admin', 'unprocessed')),
  confidence FLOAT DEFAULT 0.0,
  
  -- Metadata
  slack_message_id TEXT,
  slack_thread_ts TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  
  -- Status
  is_processed BOOLEAN DEFAULT false
);

CREATE INDEX idx_brain_thoughts_business ON brain_thoughts(business_id);
CREATE INDEX idx_brain_thoughts_bucket ON brain_thoughts(business_id, classified_bucket);
CREATE INDEX idx_brain_thoughts_processed ON brain_thoughts(is_processed);

-- People bucket
CREATE TABLE IF NOT EXISTS brain_people (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  relationship TEXT, -- "client", "partner", "vendor", "friend"
  contact_info JSONB DEFAULT '{}'::jsonb, -- phone, email, etc.
  
  last_contact TIMESTAMPTZ,
  next_followup TIMESTAMPTZ,
  
  notes TEXT,
  context TEXT, -- Why they matter
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brain_people_business ON brain_people(business_id);
CREATE INDEX idx_brain_people_followup ON brain_people(business_id, next_followup);

-- Projects bucket
CREATE TABLE IF NOT EXISTS brain_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'waiting', 'blocked', 'completed', 'archived')),
  
  next_action TEXT, -- Most important: what's the next step?
  notes TEXT,
  
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brain_projects_business ON brain_projects(business_id);
CREATE INDEX idx_brain_projects_status ON brain_projects(business_id, status);

-- Ideas bucket
CREATE TABLE IF NOT EXISTS brain_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  tags TEXT[],
  potential_impact TEXT CHECK (potential_impact IN ('high', 'medium', 'low')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brain_ideas_business ON brain_ideas(business_id);

-- Admin bucket
CREATE TABLE IF NOT EXISTS brain_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  task TEXT NOT NULL,
  due_date TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_brain_admin_business ON brain_admin(business_id);
CREATE INDEX idx_brain_admin_due ON brain_admin(business_id, due_date);

-- Brain reminders config
CREATE TABLE IF NOT EXISTS brain_reminder_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  morning_reminder_time TIME DEFAULT '08:00:00',
  sunday_recap_time TIME DEFAULT '14:00:00',
  
  slack_webhook_url TEXT,
  slack_channel_id TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(business_id)
);

-- Enable RLS
ALTER TABLE brain_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE brain_reminder_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their business's brain)
CREATE POLICY "Users can view business brain_thoughts" ON brain_thoughts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = brain_thoughts.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage business brain_thoughts" ON brain_thoughts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_businesses 
      WHERE user_businesses.business_id = brain_thoughts.business_id 
      AND user_businesses.user_id = auth.uid()
    )
  );

-- Similar policies for other brain tables
CREATE POLICY "Users can view business people" ON brain_people
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_businesses WHERE user_businesses.business_id = brain_people.business_id AND user_businesses.user_id = auth.uid())
  );

CREATE POLICY "Users can view business projects" ON brain_projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_businesses WHERE user_businesses.business_id = brain_projects.business_id AND user_businesses.user_id = auth.uid())
  );

CREATE POLICY "Users can view business ideas" ON brain_ideas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_businesses WHERE user_businesses.business_id = brain_ideas.business_id AND user_businesses.user_id = auth.uid())
  );

CREATE POLICY "Users can view business admin" ON brain_admin
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_businesses WHERE user_businesses.business_id = brain_admin.business_id AND user_businesses.user_id = auth.uid())
  );

GRANT ALL ON brain_thoughts TO authenticated, service_role;
GRANT ALL ON brain_people TO authenticated, service_role;
GRANT ALL ON brain_projects TO authenticated, service_role;
GRANT ALL ON brain_ideas TO authenticated, service_role;
GRANT ALL ON brain_admin TO authenticated, service_role;
GRANT ALL ON brain_reminder_config TO authenticated, service_role;

-- ============================================
-- BRAIN SYSTEM READY
-- ============================================
