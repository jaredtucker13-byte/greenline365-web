-- ============================================
-- Migration 028: Hub-and-Spoke Subscription Tier System
-- Sprint 1 Foundation Layer
--
-- Tables: plans, subscriptions, feature_flags, plan_feature_overrides,
--         roles, permissions, role_permissions, account_members, payment_events
-- ============================================

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Reusable updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. PLANS — defines available subscription plans
-- ============================================
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('directory', 'command_center', 'bundle')),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly_cents INTEGER NOT NULL DEFAULT 0,
  price_annual_cents INTEGER NOT NULL DEFAULT 0,
  trial_days INTEGER NOT NULL DEFAULT 14,
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. SUBSCRIPTIONS — links accounts to plans
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_account_id ON subscriptions(account_id);
CREATE INDEX idx_subscriptions_listing_id ON subscriptions(listing_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. FEATURE_FLAGS — defines all gatable features
-- ============================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value_type TEXT NOT NULL CHECK (value_type IN ('boolean', 'integer', 'string')),
  default_value TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('portal', 'command_center', 'shared')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. PLAN_FEATURE_OVERRIDES — per-plan feature values
-- ============================================
CREATE TABLE IF NOT EXISTS plan_feature_overrides (
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  feature_flag_id UUID NOT NULL REFERENCES feature_flags(id) ON DELETE CASCADE,
  value TEXT NOT NULL,
  PRIMARY KEY (plan_id, feature_flag_id)
);

-- ============================================
-- 5. ROLES — system roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. PERMISSIONS — granular permissions
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  product_scope TEXT NOT NULL CHECK (product_scope IN ('portal', 'command_center', 'both')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ROLE_PERMISSIONS — many-to-many
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================
-- 8. ACCOUNT_MEMBERS — team members with roles
-- ============================================
CREATE TABLE IF NOT EXISTS account_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  listing_ids UUID[],
  status TEXT NOT NULL CHECK (status IN ('invited', 'active', 'revoked')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_account_members_account_id ON account_members(account_id);
CREATE INDEX idx_account_members_user_id ON account_members(user_id);

CREATE TRIGGER update_account_members_updated_at
  BEFORE UPDATE ON account_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. PAYMENT_EVENTS — payment history
-- ============================================
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'refunded')),
  event_type TEXT NOT NULL CHECK (event_type IN ('charge', 'refund', 'proration_credit')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_events_subscription_id ON payment_events(subscription_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- PLANS: anyone can SELECT active plans; only service role can INSERT/UPDATE/DELETE
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON plans FOR SELECT
  USING (is_active = true);

-- Service role bypasses RLS automatically, no explicit policy needed for admin writes

-- SUBSCRIPTIONS: users can SELECT their own; service role manages all
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = account_id);

-- FEATURE_FLAGS: anyone can SELECT; service role manages
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- PLAN_FEATURE_OVERRIDES: anyone can SELECT; service role manages
ALTER TABLE plan_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plan feature overrides"
  ON plan_feature_overrides FOR SELECT
  USING (true);

-- ROLES: anyone can SELECT; service role manages
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  USING (true);

-- PERMISSIONS: anyone can SELECT; service role manages
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- ROLE_PERMISSIONS: anyone can SELECT; service role manages
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view role permissions"
  ON role_permissions FOR SELECT
  USING (true);

-- ACCOUNT_MEMBERS: users can SELECT where account_id or user_id matches;
-- owner can INSERT/UPDATE for their account
ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their account memberships"
  ON account_members FOR SELECT
  USING (auth.uid() = account_id OR auth.uid() = user_id);

CREATE POLICY "Account owners can manage members"
  ON account_members FOR INSERT
  WITH CHECK (auth.uid() = account_id);

CREATE POLICY "Account owners can update members"
  ON account_members FOR UPDATE
  USING (auth.uid() = account_id);

-- PAYMENT_EVENTS: users can SELECT their own subscription's events; service role manages
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment events"
  ON payment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.id = payment_events.subscription_id
        AND s.account_id = auth.uid()
    )
  );

-- ============================================
-- GRANTS
-- ============================================

-- Plans: read for all, service role manages
GRANT SELECT ON plans TO anon;
GRANT SELECT ON plans TO authenticated;
GRANT ALL ON plans TO service_role;

-- Subscriptions: authenticated users can read their own
GRANT SELECT ON subscriptions TO authenticated;
GRANT ALL ON subscriptions TO service_role;

-- Feature flags & overrides: read for all
GRANT SELECT ON feature_flags TO anon;
GRANT SELECT ON feature_flags TO authenticated;
GRANT ALL ON feature_flags TO service_role;

GRANT SELECT ON plan_feature_overrides TO anon;
GRANT SELECT ON plan_feature_overrides TO authenticated;
GRANT ALL ON plan_feature_overrides TO service_role;

-- Roles, permissions, role_permissions: read for all
GRANT SELECT ON roles TO anon;
GRANT SELECT ON roles TO authenticated;
GRANT ALL ON roles TO service_role;

GRANT SELECT ON permissions TO anon;
GRANT SELECT ON permissions TO authenticated;
GRANT ALL ON permissions TO service_role;

GRANT SELECT ON role_permissions TO anon;
GRANT SELECT ON role_permissions TO authenticated;
GRANT ALL ON role_permissions TO service_role;

-- Account members: authenticated users can interact
GRANT SELECT, INSERT, UPDATE ON account_members TO authenticated;
GRANT ALL ON account_members TO service_role;

-- Payment events: authenticated can read
GRANT SELECT ON payment_events TO authenticated;
GRANT ALL ON payment_events TO service_role;
