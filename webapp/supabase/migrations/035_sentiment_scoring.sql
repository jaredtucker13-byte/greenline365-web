-- 035: Add sentiment scoring columns for real-time emotion tracking
-- Supports the warm-up message system and dynamic agent tone adjustment

-- Add sentiment_score to individual messages
ALTER TABLE agent_chat_messages
ADD COLUMN IF NOT EXISTS sentiment_score REAL DEFAULT NULL;

-- Add rolling sentiment to sessions
ALTER TABLE agent_chat_sessions
ADD COLUMN IF NOT EXISTS sentiment_score REAL DEFAULT NULL;

-- Add transfer_chain to sessions for cross-agent context
ALTER TABLE agent_chat_sessions
ADD COLUMN IF NOT EXISTS transfer_chain JSONB DEFAULT NULL;

-- Add business type tracking to sessions
ALTER TABLE agent_chat_sessions
ADD COLUMN IF NOT EXISTS contact_business_type TEXT DEFAULT NULL;

-- Add intent_score to sessions
ALTER TABLE agent_chat_sessions
ADD COLUMN IF NOT EXISTS intent_score INTEGER DEFAULT NULL;

-- Add pain_points array to sessions
ALTER TABLE agent_chat_sessions
ADD COLUMN IF NOT EXISTS pain_points TEXT[] DEFAULT NULL;

-- Add lead_created flag to sessions
ALTER TABLE agent_chat_sessions
ADD COLUMN IF NOT EXISTS lead_created BOOLEAN DEFAULT FALSE;

-- Index for fast customer lookup by phone (used by voice agent warm-up)
CREATE INDEX IF NOT EXISTS idx_agent_sessions_phone ON agent_chat_sessions(contact_phone)
WHERE contact_phone IS NOT NULL;

-- Index for fast customer lookup by email
CREATE INDEX IF NOT EXISTS idx_agent_sessions_email ON agent_chat_sessions(contact_email)
WHERE contact_email IS NOT NULL;

-- Index for call_logs phone lookup (voice agent context)
CREATE INDEX IF NOT EXISTS idx_call_logs_phone ON call_logs(caller_phone)
WHERE caller_phone IS NOT NULL;
