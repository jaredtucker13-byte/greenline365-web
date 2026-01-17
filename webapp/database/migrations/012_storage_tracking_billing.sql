-- ================================================
-- Storage Tracking & Billing Schema
-- GreenLine365 Platform
-- ================================================

-- 1. Update pricing_tiers with storage limits
ALTER TABLE pricing_tiers 
ADD COLUMN IF NOT EXISTS storage_limit_gb INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS storage_overage_rate DECIMAL(10,4) DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_overage_price_id TEXT;

-- Update existing tiers with storage limits
UPDATE pricing_tiers SET 
  storage_limit_gb = 5,
  storage_overage_rate = 0.25
WHERE tier_key = 'starter';

UPDATE pricing_tiers SET 
  storage_limit_gb = 25,
  storage_overage_rate = 0.15
WHERE tier_key = 'professional';

UPDATE pricing_tiers SET 
  storage_limit_gb = 100,
  storage_overage_rate = 0.10
WHERE tier_key = 'enterprise';

UPDATE pricing_tiers SET 
  storage_limit_gb = 500,
  storage_overage_rate = 0.05
WHERE tier_key = 'elite';

-- 2. Storage Usage Events (raw events for every upload/delete)
CREATE TABLE IF NOT EXISTS storage_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('upload', 'delete', 'update')),
  object_id TEXT NOT NULL, -- Supabase storage object path
  object_name TEXT,
  storage_type TEXT DEFAULT 'file' CHECK (storage_type IN ('file', 'image', 'mockup', 'document', 'backup', 'other')),
  delta_bytes BIGINT NOT NULL, -- Positive for upload, negative for delete
  total_bytes BIGINT DEFAULT 0, -- Running total after this event
  bucket_name TEXT DEFAULT 'default',
  mime_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for fast tenant queries
CREATE INDEX IF NOT EXISTS idx_storage_events_tenant ON storage_usage_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_events_created ON storage_usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_storage_events_type ON storage_usage_events(storage_type);

-- 3. Tenant Storage Summary (aggregated daily/monthly)
CREATE TABLE IF NOT EXISTS tenant_storage_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Usage metrics
  bytes_used BIGINT DEFAULT 0,
  bytes_included BIGINT DEFAULT 0, -- From their plan
  billable_bytes BIGINT DEFAULT 0, -- bytes_used - bytes_included (if positive)
  
  -- Breakdown by type
  bytes_images BIGINT DEFAULT 0,
  bytes_mockups BIGINT DEFAULT 0,
  bytes_documents BIGINT DEFAULT 0,
  bytes_other BIGINT DEFAULT 0,
  
  -- Object counts
  object_count INTEGER DEFAULT 0,
  upload_count INTEGER DEFAULT 0,
  delete_count INTEGER DEFAULT 0,
  
  -- Billing
  overage_gb DECIMAL(10,4) DEFAULT 0,
  overage_rate DECIMAL(10,4) DEFAULT 0,
  overage_cost DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  billed_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, period_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_storage_summary_tenant ON tenant_storage_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_summary_period ON tenant_storage_summary(period_start);

-- 4. Storage Alerts (track when alerts were sent)
CREATE TABLE IF NOT EXISTS storage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('50_percent', '80_percent', '90_percent', '100_percent', 'blocked')),
  threshold_percent INTEGER NOT NULL,
  bytes_used BIGINT NOT NULL,
  bytes_limit BIGINT NOT NULL,
  usage_percent DECIMAL(5,2) NOT NULL,
  message TEXT,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_alerts_tenant ON storage_alerts(tenant_id);

-- 5. Add storage fields to businesses table
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS current_storage_bytes BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit_bytes BIGINT DEFAULT 5368709120, -- 5GB default
ADD COLUMN IF NOT EXISTS storage_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS storage_block_reason TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';

-- 6. Payment Transactions (for Stripe)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  
  -- Stripe fields
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Transaction details
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'overage', 'one_time', 'upgrade', 'refund')),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded')),
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_session ON payment_transactions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- 7. Function to update tenant storage after events
CREATE OR REPLACE FUNCTION update_tenant_storage()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the business's current storage
  UPDATE businesses
  SET current_storage_bytes = (
    SELECT COALESCE(SUM(delta_bytes), 0)
    FROM storage_usage_events
    WHERE tenant_id = NEW.tenant_id
  )
  WHERE id = NEW.tenant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_tenant_storage ON storage_usage_events;
CREATE TRIGGER trigger_update_tenant_storage
AFTER INSERT ON storage_usage_events
FOR EACH ROW
EXECUTE FUNCTION update_tenant_storage();

-- 8. Function to check storage limits and set blocked status
CREATE OR REPLACE FUNCTION check_storage_limit()
RETURNS TRIGGER AS $$
DECLARE
  limit_bytes BIGINT;
  usage_percent DECIMAL;
BEGIN
  -- Get the limit
  SELECT storage_limit_bytes INTO limit_bytes FROM businesses WHERE id = NEW.id;
  
  -- Calculate percentage
  IF limit_bytes > 0 THEN
    usage_percent := (NEW.current_storage_bytes::DECIMAL / limit_bytes::DECIMAL) * 100;
    
    -- Block at 110%
    IF usage_percent >= 110 THEN
      NEW.storage_blocked := TRUE;
      NEW.storage_block_reason := 'Storage limit exceeded by 10%. Please upgrade or delete files.';
    ELSE
      NEW.storage_blocked := FALSE;
      NEW.storage_block_reason := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_check_storage_limit ON businesses;
CREATE TRIGGER trigger_check_storage_limit
BEFORE UPDATE OF current_storage_bytes ON businesses
FOR EACH ROW
EXECUTE FUNCTION check_storage_limit();

-- 9. RLS Policies
ALTER TABLE storage_usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_storage_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Storage events: Tenant can see their own
CREATE POLICY "Tenants can view own storage events" ON storage_usage_events
  FOR SELECT USING (
    tenant_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Storage summary: Tenant can see their own
CREATE POLICY "Tenants can view own storage summary" ON tenant_storage_summary
  FOR SELECT USING (
    tenant_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Storage alerts: Tenant can see their own
CREATE POLICY "Tenants can view own storage alerts" ON storage_alerts
  FOR SELECT USING (
    tenant_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
  );

-- Payment transactions: Tenant can see their own
CREATE POLICY "Tenants can view own transactions" ON payment_transactions
  FOR SELECT USING (
    tenant_id IN (
      SELECT business_id FROM user_businesses WHERE user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Service role can do everything (for backend)
CREATE POLICY "Service role full access to storage_events" ON storage_usage_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to storage_summary" ON tenant_storage_summary
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to storage_alerts" ON storage_alerts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to transactions" ON payment_transactions
  FOR ALL USING (auth.role() = 'service_role');
