/**
 * Hub-and-Spoke Subscription System Types
 * Sprint 1 Foundation Layer
 */

// ============================================
// Plans
// ============================================

export type ProductType = 'directory' | 'command_center' | 'bundle';

export interface Plan {
  id: string;
  slug: string;
  product_type: ProductType;
  name: string;
  description: string | null;
  price_monthly_cents: number;
  price_annual_cents: number;
  trial_days: number;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  features: Record<string, unknown>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// Subscriptions
// ============================================

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
export type BillingCycle = 'monthly' | 'annual';

export interface Subscription {
  id: string;
  account_id: string;
  listing_id: string | null;
  plan_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  plan?: Plan;
}

// ============================================
// Feature Flags
// ============================================

export type FeatureValueType = 'boolean' | 'integer' | 'string';
export type FeatureCategory = 'portal' | 'command_center' | 'shared';

export interface FeatureFlag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  value_type: FeatureValueType;
  default_value: string;
  category: FeatureCategory;
  created_at: string;
  updated_at: string;
}

export interface PlanFeatureOverride {
  plan_id: string;
  feature_flag_id: string;
  value: string;
  // Joined
  feature_flag?: FeatureFlag;
}

export type ResolvedFeatures = Record<string, string | boolean | number>;

// ============================================
// Roles & Permissions
// ============================================

export type RoleSlug = 'owner' | 'manager' | 'staff' | 'viewer';
export type PermissionScope = 'portal' | 'command_center' | 'both';

export interface Role {
  id: string;
  slug: RoleSlug;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  role_permissions?: Array<{ permission: Permission }>;
}

export interface Permission {
  id: string;
  slug: string;
  product_scope: PermissionScope;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Account Members (Team)
// ============================================

export type MemberStatus = 'invited' | 'active' | 'revoked';

export interface AccountMember {
  id: string;
  account_id: string;
  user_id: string;
  role_id: string;
  listing_ids: string[] | null;
  status: MemberStatus;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  role?: Role;
  member?: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

// ============================================
// Payment Events
// ============================================

export type PaymentStatus = 'succeeded' | 'failed' | 'refunded';
export type PaymentEventType = 'charge' | 'refund' | 'proration_credit';

export interface PaymentEvent {
  id: string;
  subscription_id: string;
  stripe_invoice_id: string | null;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  event_type: PaymentEventType;
  created_at: string;
}
