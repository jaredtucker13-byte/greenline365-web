-- ============================================
-- MIGRATION 020: Payment Transactions (FIXED)
-- ============================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT,
  listing_id UUID,
  tier TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  platform_fee DECIMAL(10,2) DEFAULT 0.60,
  status TEXT DEFAULT 'pending',
  customer_email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_session ON payment_transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_listing ON payment_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment_transactions(status);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_service_role" ON payment_transactions;
CREATE POLICY "payment_service_role" ON payment_transactions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT ALL ON payment_transactions TO service_role;
GRANT SELECT ON payment_transactions TO authenticated;
