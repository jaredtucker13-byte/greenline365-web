-- GreenLine365 Multi-Tenant Voice AI System
-- Run this in Supabase SQL Editor

-- =====================================================
-- TENANTS TABLE
-- Each tenant (business) has their own config
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Basic info
  business_name TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  
  -- Phone numbers (Twilio numbers assigned to this tenant)
  twilio_phone_number TEXT UNIQUE, -- The number customers call
  transfer_phone_number TEXT,       -- Number to transfer to human
  
  -- AI Configuration
  ai_agent_name TEXT DEFAULT 'Alex',
  ai_personality TEXT DEFAULT 'friendly and professional',
  greeting_message TEXT,
  
  -- Business details (returned by MCP)
  business_hours JSONB DEFAULT '{
    "monday": "9:00 AM - 5:00 PM",
    "tuesday": "9:00 AM - 5:00 PM", 
    "wednesday": "9:00 AM - 5:00 PM",
    "thursday": "9:00 AM - 5:00 PM",
    "friday": "9:00 AM - 5:00 PM",
    "saturday": "10:00 AM - 3:00 PM",
    "sunday": "Closed"
  }',
  
  services JSONB DEFAULT '[
    {"name": "Consultation", "duration": "30 min", "price": "Free"},
    {"name": "Strategy Session", "duration": "60 min", "price": "$99"},
    {"name": "Full Service", "duration": "2 hours", "price": "$299"}
  ]',
  
  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  
  -- Branding
  brand_color TEXT DEFAULT '#00FF00',
  logo_url TEXT,
  website_url TEXT,
  
  -- Subscription/billing
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Retell agent ID (if tenant has their own)
  retell_agent_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by phone number
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON tenants(twilio_phone_number);

-- =====================================================
-- SCHEDULED CALLS TABLE
-- Calls scheduled from chat widget to be made by AI
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Tenant
  tenant_id UUID REFERENCES tenants(id),
  
  -- Lead info
  lead_name TEXT NOT NULL,
  lead_phone TEXT NOT NULL,
  lead_email TEXT,
  
  -- Call details
  purpose TEXT, -- 'follow_up', 'demo', 'consultation', etc.
  notes TEXT,   -- Context for the AI
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  call_immediately BOOLEAN DEFAULT FALSE,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Call result
  retell_call_id TEXT,
  call_duration_seconds INTEGER,
  call_outcome TEXT, -- 'booked', 'callback_requested', 'not_interested', 'voicemail', 'no_answer'
  transcript TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Index for finding pending calls
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status ON scheduled_calls(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_tenant ON scheduled_calls(tenant_id);

-- =====================================================
-- INSERT DEFAULT TENANT (GreenLine365)
-- =====================================================
INSERT INTO tenants (
  business_name,
  owner_name,
  owner_email,
  ai_agent_name,
  ai_personality,
  greeting_message,
  website_url,
  plan
) VALUES (
  'GreenLine365',
  'Jared',
  'jared.tucker13@gmail.com',
  'Alex',
  'friendly, professional, and genuinely interested in helping local businesses grow. You speak naturally and conversationally.',
  'Hi there! Thanks for calling GreenLine365. This is Alex, your AI assistant. How can I help you today?',
  'https://greenline365.com',
  'enterprise'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated" ON tenants FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON scheduled_calls FOR ALL USING (true);

-- =====================================================
-- AUTO-UPDATE TIMESTAMPS
-- =====================================================
DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS scheduled_calls_updated_at ON scheduled_calls;
CREATE TRIGGER scheduled_calls_updated_at
  BEFORE UPDATE ON scheduled_calls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
