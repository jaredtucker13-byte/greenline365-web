-- ============================================================
-- Migration 032: payment_events table
-- GL365 Trust & Badge Network Infrastructure
-- Adapted to live DB schema: references businesses(id)
-- stripe_subscription_id stored as TEXT (matches payment_transactions pattern)
-- RLS uses user_businesses join pattern (matches existing GL365 policies)
-- Run date: 2026-02-21 | Status: APPLIED to production
-- ============================================================

CREATE TABLE IF NOT EXISTS payment_events (
  id                     UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id            UUID        REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT,
  stripe_invoice_id      TEXT,
  stripe_event_id        TEXT        UNIQUE,
  amount_cents           INTEGER     NOT NULL DEFAULT 0,
  currency               TEXT        NOT NULL DEFAULT 'usd',
  status                 TEXT        NOT NULL CHECK (status IN (
    'succeeded', 'failed', 'refunded', 'processed', 'skipped'
  )),
  event_type             TEXT        NOT NULL CHECK (event_type IN (
    'charge', 'refund', 'proration_credit',
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.paused',
    'customer.subscription.resumed',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  )),
  raw_payload            JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_events_business_id
  ON payment_events(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_stripe_event_id
  ON payment_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at
  ON payment_events(created_at DESC);

-- RLS
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_events'
    AND policyname = 'payment_events_service_write'
  ) THEN
    CREATE POLICY payment_events_service_write
    ON payment_events FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_events'
    AND policyname = 'payment_events_owner_read'
  ) THEN
    CREATE POLICY payment_events_owner_read
    ON payment_events FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_businesses ub
        WHERE ub.business_id = payment_events.business_id
        AND ub.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Grants
GRANT SELECT ON payment_events TO authenticated;
GRANT ALL    ON payment_events TO service_role;
