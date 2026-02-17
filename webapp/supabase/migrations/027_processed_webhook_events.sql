-- Idempotency table for webhook event deduplication
-- Stores processed webhook event IDs to prevent duplicate processing

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,  -- 'stripe', 'retell', etc.
  event_type TEXT,
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups by event_id
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_event_id
  ON processed_webhook_events (event_id);

-- Index for cleanup queries (prune old events)
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at
  ON processed_webhook_events (processed_at);

-- Auto-cleanup: remove events older than 30 days to keep table lean
-- This can be run via a cron job or Supabase scheduled function
COMMENT ON TABLE processed_webhook_events IS
  'Stores processed webhook event IDs for idempotency. Prune entries older than 30 days.';
