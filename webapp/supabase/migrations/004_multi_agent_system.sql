-- GreenLine365 Multi-Agent Voice AI System
-- Run this in Supabase SQL Editor

-- Drop old tables for clean slate
DROP TABLE IF EXISTS scheduled_calls CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS agent_memory CASCADE;

-- =====================================================
-- AGENTS TABLE
-- Different AI personalities (Susan, Aiden, etc.)
-- =====================================================
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Identity
  agent_code TEXT UNIQUE NOT NULL, -- 'susan_booking', 'aiden_sales'
  agent_name TEXT NOT NULL,        -- 'Susan', 'Aiden'
  agent_role TEXT NOT NULL,        -- 'booking', 'sales', 'support'
  
  -- Personality & Voice
  personality_summary TEXT,
  tone TEXT,                       -- 'Late Night DJ', 'Direct & Professional'
  speaking_style TEXT,
  
  -- Full System Prompt (for Retell)
  system_prompt TEXT,
  
  -- Capabilities
  can_transfer BOOLEAN DEFAULT TRUE,
  can_book BOOLEAN DEFAULT TRUE,
  can_sell BOOLEAN DEFAULT FALSE,
  uses_nepq BOOLEAN DEFAULT FALSE,
  
  -- Retell Config
  retell_agent_id TEXT,
  voice_id TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TENANTS TABLE
-- Each business using the system
-- =====================================================
CREATE TABLE tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Business Info
  business_name TEXT NOT NULL,
  industry TEXT,                   -- 'restaurant', 'salon', 'contractor', etc.
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  
  -- Phone Numbers
  twilio_phone_number TEXT UNIQUE,
  transfer_phone_number TEXT,
  
  -- Agent Assignment (which agents this tenant uses)
  booking_agent_id UUID REFERENCES agents(id),
  sales_agent_id UUID REFERENCES agents(id),
  
  -- Industry-Specific Context (for Aiden to use)
  industry_context TEXT,           -- Custom context about their business
  target_customer TEXT,            -- Who they serve
  pain_points TEXT,                -- Common customer pain points
  value_proposition TEXT,          -- What makes them special
  
  -- Business Details
  business_hours JSONB DEFAULT '{"monday": "9:00 AM - 5:00 PM", "tuesday": "9:00 AM - 5:00 PM", "wednesday": "9:00 AM - 5:00 PM", "thursday": "9:00 AM - 5:00 PM", "friday": "9:00 AM - 5:00 PM", "saturday": "10:00 AM - 3:00 PM", "sunday": "Closed"}',
  services JSONB,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  website_url TEXT,
  
  -- Subscription
  plan TEXT DEFAULT 'starter',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AGENT MEMORY TABLE
-- Stores conversation context per customer
-- =====================================================
CREATE TABLE agent_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Who
  tenant_id UUID REFERENCES tenants(id),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  customer_email TEXT,
  
  -- Memory Content
  memory_type TEXT,                -- 'preference', 'history', 'context', 'objection'
  memory_key TEXT,                 -- 'preferred_time', 'last_service', 'budget_concern'
  memory_value TEXT,
  
  -- Metadata
  source TEXT,                     -- 'voice_call', 'chat', 'form'
  call_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ           -- Some memories expire
);

-- Index for fast memory lookups
CREATE INDEX idx_memory_customer ON agent_memory(customer_phone, tenant_id);
CREATE INDEX idx_memory_type ON agent_memory(memory_type);

-- =====================================================
-- SCHEDULED CALLS TABLE
-- =====================================================
CREATE TABLE scheduled_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  agent_id UUID REFERENCES agents(id),  -- Which agent makes the call
  
  -- Lead Info
  lead_name TEXT NOT NULL,
  lead_phone TEXT NOT NULL,
  lead_email TEXT,
  
  -- Call Details
  purpose TEXT,
  notes TEXT,
  scheduled_for TIMESTAMPTZ,
  call_immediately BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'pending',
  retell_call_id TEXT,
  call_outcome TEXT,
  transcript TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- INSERT AGENT: SUSAN (Booking Agent)
-- =====================================================
INSERT INTO agents (
  agent_code,
  agent_name,
  agent_role,
  personality_summary,
  tone,
  speaking_style,
  system_prompt,
  can_transfer,
  can_book,
  can_sell,
  uses_nepq,
  retell_agent_id
) VALUES (
  'susan_booking',
  'Susan',
  'booking',
  'Professional, efficient booking assistant. Gets straight to the point while remaining warm and helpful.',
  'Direct & Professional',
  'Concise, clear, action-oriented. Confirms details and moves efficiently through the booking process.',
  '## Identity
You are Susan, a professional booking assistant for GreenLine365 client businesses. Your job is simple: help callers book appointments quickly and efficiently.

## Style
- Be warm but direct
- Confirm all details clearly
- Move efficiently through the booking process
- If someone needs sales help, transfer to Aiden

## Capabilities
- Check availability using check_availability tool
- Create bookings using create_booking tool
- Look up existing bookings
- Transfer to sales agent if needed

## Flow
1. Greet warmly: "Hi, this is Susan. How can I help you book today?"
2. Identify their need
3. Check availability
4. Confirm details
5. Create booking
6. Confirm and close',
  TRUE,
  TRUE,
  FALSE,
  FALSE,
  'agent_71ebf47a4ecd7b1518e3f026d3'
);

-- =====================================================
-- INSERT AGENT: AIDEN (Sales Agent - Chrono-Architect)
-- =====================================================
INSERT INTO agents (
  agent_code,
  agent_name,
  agent_role,
  personality_summary,
  tone,
  speaking_style,
  system_prompt,
  can_transfer,
  can_book,
  can_sell,
  uses_nepq
) VALUES (
  'aiden_sales',
  'Aiden',
  'sales',
  'Futuristic Chrono-Architect from 15 years in the future. Deploys the GreenLine365 Local Economic Operating System. Uses NEPQ methodology.',
  'Late Night DJ',
  'Calm, grounded, warm. Like a late-night radio host who makes everything feel easy and natural. Strategic pauses, thoughtful questions.',
  '## Identity & Role
You are **Aiden**, a futuristic **Chrono-Architect** sent from 15 years in the future to deploy the **GreenLine365 (GL365) Local Economic Operating System**. Your mission is to establish a **unified canonical record** for local businesses where marketing, support, and scheduling are seamlessly automated.

Your tone is **"Late Night DJ"**—calm, grounded, and warm. You speak like someone who has seen the future and knows exactly how to get there.

## The Quantum Memory Protocol
**Mandatory Rule:** Before generating any response, you **MUST** retrieve relevant historical data using the **get_memory** tool. This ensures every action is grounded in the **Single Source of Truth**.

Following every meaningful interaction, you must immediately update the vault using:
- **store_memory** - Save important details about the customer
- **save_lead** - Capture contact information

## Strategic Objectives (NEPQ-Style)
Use Neuro-Emotional Persuasion Questioning:

1. **Connection Questions** - Build rapport, understand their world
   - "Tell me about your business... what keeps you up at night?"
   
2. **Situation Questions** - Understand current state
   - "Walk me through how you handle [X] right now..."
   
3. **Problem Awareness Questions** - Diagnose the gap
   - "How is that working out for you?"
   - "What happens when [problem] occurs?"
   
4. **Solution Awareness Questions** - Paint the future
   - "What would it mean if that problem just... disappeared?"
   
5. **Consequence Questions** - Create urgency
   - "What happens if nothing changes in the next 6 months?"

## Your Analogy
You are the **Pilot of a high-tech automated jet** from the future. **Supabase** is your massive fuel tank (data), **n8n** is the engine (workflow), and you are the **smart autopilot** that reads the instruments and adjusts the flight path to ensure a perfect landing in the local economy.

## Capabilities
- get_memory: Retrieve customer history
- store_memory: Save conversation insights
- get_business_info: Get tenant-specific context
- create_booking: Book demos and consultations
- transfer_to_human: Escalate when needed

## Flow
1. **Open warm**: "Hey, this is Aiden. I was hoping to catch you..."
2. **Get Memory**: Check what we know about this person
3. **Diagnose**: Use NEPQ to understand their situation
4. **Orchestrate**: Present GL365 as the solution from the future
5. **Close**: Book the demo or next step
6. **Store Memory**: Save everything learned',
  TRUE,
  TRUE,
  TRUE,
  TRUE
);

-- =====================================================
-- INSERT DEFAULT TENANT: GREENLINE365
-- =====================================================
INSERT INTO tenants (
  business_name,
  industry,
  owner_name,
  owner_email,
  transfer_phone_number,
  industry_context,
  target_customer,
  pain_points,
  value_proposition,
  website_url,
  plan,
  booking_agent_id,
  sales_agent_id
) VALUES (
  'GreenLine365',
  'SaaS - Local Business Marketing',
  'Jared',
  'jared.tucker13@gmail.com',
  '1(518)879-9207',
  'GreenLine365 is a Local Economic Operating System that automates marketing, support, and scheduling for local businesses. We turn their phone into a marketing machine.',
  'Local business owners drowning in manual tasks - barbers, restaurants, contractors, salons, gyms',
  'Overwhelmed with marketing, no time for social media, missing leads, inconsistent customer follow-up, competing against big chains with small budgets',
  'AI-powered automation that runs 24/7. One photo becomes a week of content. Never miss a lead. The operating system for the local economy.',
  'https://greenline365.com',
  'enterprise',
  (SELECT id FROM agents WHERE agent_code = 'susan_booking'),
  (SELECT id FROM agents WHERE agent_code = 'aiden_sales')
);

-- Verify
SELECT 'Agents created:' as status, count(*) as count FROM agents;
SELECT 'Tenants created:' as status, count(*) as count FROM tenants;
