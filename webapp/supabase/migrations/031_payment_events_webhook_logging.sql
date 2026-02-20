-- 031: Extend payment_events for webhook idempotency and logging
--
-- Adds stripe_event_id (unique) for idempotency checks,
-- raw_payload for full event logging, and relaxes NOT NULL
-- constraints so webhook-only events can be stored without
-- a subscription reference.

-- 1. Add new columns
ALTER TABLE payment_events
  ADD COLUMN IF NOT EXISTS stripe_event_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB;

-- 2. Make subscription_id nullable (webhook events may not have one)
ALTER TABLE payment_events
  ALTER COLUMN subscription_id DROP NOT NULL;

-- 3. Allow zero-amount webhook log entries
ALTER TABLE payment_events
  ALTER COLUMN amount_cents SET DEFAULT 0;

-- 4. Expand status CHECK to include webhook processing states
ALTER TABLE payment_events DROP CONSTRAINT IF EXISTS payment_events_status_check;
ALTER TABLE payment_events
  ADD CONSTRAINT payment_events_status_check
  CHECK (status IN ('succeeded', 'failed', 'refunded', 'processed', 'skipped'));

-- 5. Expand event_type CHECK to include webhook event types
ALTER TABLE payment_events DROP CONSTRAINT IF EXISTS payment_events_event_type_check;
ALTER TABLE payment_events
  ADD CONSTRAINT payment_events_event_type_check
  CHECK (event_type IN (
    'charge', 'refund', 'proration_credit',
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.paused',
    'customer.subscription.resumed',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ));

-- 6. Index on stripe_event_id for fast idempotency lookups
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_event_id
  ON payment_events(stripe_event_id);
