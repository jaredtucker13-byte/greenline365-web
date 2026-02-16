---
name: saas-biller
description: "Implement Stripe subscription logic, credit metering, tier enforcement, and invoice generation for GreenLine365"
version: 1.0.0
triggers:
  - "add a billing feature"
  - "implement subscription tiers"
  - "add credit metering"
  - "generate invoices"
  - "manage Stripe subscriptions"
  - "enforce tier limits"
inputs:
  - billing_action: string (checkout | webhook | metering | invoice | tier-enforcement)
  - tier: string (free | pro | premium | tier1 | tier2 | tier3 | white_label)
  - resource: string (property-passports | storage | ai-agents | phone-numbers | seats)
outputs:
  - implementation: code (API routes, webhook handlers, metering logic)
  - migration: sql (if new tables/columns needed)
  - test: spec.ts (Playwright coverage for billing flows)
---

# SaaS Biller — Stripe Subscription and Credit Metering Skill

## Purpose

The SaaS Biller skill encodes all billing logic for GreenLine365: Stripe checkout sessions, webhook handling, subscription lifecycle management, credit/usage metering (e.g., how many Property Passports per tier), storage overage billing, and entitlement enforcement. It ensures billing code follows the existing patterns established in the codebase.

## When to Use

- Adding a new billable feature or resource limit
- Modifying subscription tier pricing or features
- Implementing usage metering for a new resource type
- Handling new Stripe webhook events
- Building tier-gated access control
- Adding add-on/a-la-carte billing

## Existing Infrastructure Reference

Before writing any billing code, read these files to understand established patterns:

| File | Purpose |
|------|---------|
| `webapp/app/api/stripe/checkout/route.ts` | Checkout session creation (two-tier directory pricing) |
| `webapp/app/api/stripe/status/route.ts` | Payment status verification and record updates |
| `webapp/app/api/stripe/webhook/route.ts` | Webhook event handler (checkout.completed, invoice.paid, subscription.deleted) |
| `webapp/app/api/directory/addons/route.ts` | Add-on catalog with subscription + one-time payment modes |
| `webapp/app/api/storage/track/route.ts` | Storage usage event recording with alert thresholds |
| `webapp/app/api/storage/platform/route.ts` | Platform-wide storage dashboard |
| `webapp/app/api/pricing-tiers/route.ts` | Pricing tier CRUD |
| `webapp/app/api/admin/entitlements/route.ts` | Manual entitlement grants and overrides |
| `memory/PRICING_STACK.md` | Complete pricing specification |

### Database Tables

| Table | Migration | Purpose |
|-------|-----------|---------|
| `pricing_tiers` | `010_white_label_foundation.sql` | Tier definitions with feature limits |
| `payment_transactions` | `020_payment_transactions.sql` | Stripe session/payment records |
| `storage_usage_events` | `012_storage_tracking_billing.sql` | Raw storage metering events |
| `tenant_storage_summary` | `012_storage_tracking_billing.sql` | Aggregated usage per period |
| `storage_alerts` | `012_storage_tracking_billing.sql` | Usage threshold alerts |
| `access_codes` | `008_entitlement_access_system.sql` | Promo/partner codes |
| `entitlement_overrides` | `008_entitlement_access_system.sql` | Manual tier grants |

## Procedure

### 1. Adding a New Billable Resource (e.g., Property Passports per Tier)

#### Step 1: Define Limits in `pricing_tiers.feature_limits`

The `pricing_tiers` table has a `feature_limits JSONB` column. Add the new resource limit:

```sql
UPDATE pricing_tiers SET feature_limits = feature_limits || '{
  "property_passports_monthly": 10
}'::jsonb WHERE tier_key = 'tier1';

UPDATE pricing_tiers SET feature_limits = feature_limits || '{
  "property_passports_monthly": 50
}'::jsonb WHERE tier_key = 'tier2';

UPDATE pricing_tiers SET feature_limits = feature_limits || '{
  "property_passports_monthly": -1
}'::jsonb WHERE tier_key = 'tier3';  -- -1 = unlimited
```

#### Step 2: Create Usage Tracking

Follow the pattern in `012_storage_tracking_billing.sql`:

```sql
CREATE TABLE IF NOT EXISTS resource_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES businesses(id),
  resource_type TEXT NOT NULL,  -- 'property_passport', 'ai_call', etc.
  event_type TEXT NOT NULL CHECK (event_type IN ('consume', 'refund')),
  quantity INTEGER NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE resource_usage_events ENABLE ROW LEVEL SECURITY;
```

#### Step 3: Create Enforcement API

```typescript
// Pattern: Check usage against tier limit before allowing action
const { data: business } = await supabase
  .from('businesses')
  .select('id, subscription_status, pricing_tiers!inner(feature_limits)')
  .eq('id', businessId)
  .single();

const limit = business.pricing_tiers.feature_limits?.property_passports_monthly ?? 0;
if (limit !== -1) {
  const { count } = await supabase
    .from('resource_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', businessId)
    .eq('resource_type', 'property_passport')
    .gte('created_at', startOfMonth);

  if (count >= limit) {
    return NextResponse.json({ error: 'Monthly limit reached. Upgrade your plan.' }, { status: 429 });
  }
}
```

### 2. Adding a New Stripe Checkout Flow

Follow the pattern in `webapp/app/api/stripe/checkout/route.ts`:

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// CRITICAL: Define prices server-side, never trust frontend
const PRICES: Record<string, { amount: number; name: string }> = {
  pro: { amount: 4500, name: 'GL365 Pro' },       // $45/mo
  premium: { amount: 8900, name: 'GL365 Premium' }, // $89/mo
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { tier } = CheckoutSchema.parse(body);  // Zod validation

  const price = PRICES[tier];
  if (!price) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price_data: {
        currency: 'usd',
        recurring: { interval: 'month' },
        unit_amount: price.amount,
        product_data: { name: price.name },
      },
      quantity: 1,
    }],
    customer_email: user.email,
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing/cancel`,
    metadata: { user_id: user.id, tier },
  });

  // Record pending transaction
  await supabase.from('payment_transactions').insert({
    session_id: session.id,
    tier,
    amount: price.amount / 100,
    status: 'pending',
    customer_email: user.email,
  });

  return NextResponse.json({ url: session.url, sessionId: session.id });
}
```

### 3. Handling Stripe Webhooks

Follow the pattern in `webapp/app/api/stripe/webhook/route.ts`:

```typescript
// CRITICAL: Verify webhook signature
const sig = request.headers.get('stripe-signature')!;
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);

switch (event.type) {
  case 'checkout.session.completed':
    // Activate subscription, update tier
    break;
  case 'invoice.payment_succeeded':
    // Log payment, update billing_status
    break;
  case 'customer.subscription.deleted':
    // Downgrade to free tier
    break;
  case 'invoice.payment_failed':
    // Mark billing_status as 'past_due', send alert
    break;
}
```

### 4. Implementing Add-On Billing

Follow the pattern in `webapp/app/api/directory/addons/route.ts`:

```typescript
const ADDON_CATALOG = {
  'coupon-engine': { price: 1900, name: 'Coupon Engine', mode: 'subscription' as const },
  'featured-boost': { price: 2900, name: 'Featured Boost', mode: 'payment' as const },
};
```

## GreenLine365 Pricing Reference

### Platform Tiers (from memory/PRICING_STACK.md)

| Tier | Monthly | Setup Fee | Key Features |
|------|---------|-----------|-------------|
| Free (Tier 0) | $0 | $0 | Directory listing, grayed badges |
| Booking Foundation (Tier 1) | $1,500 | $2,500 | AI Booking Agent, dedicated phone |
| Marketing Engine (Tier 2) | $2,000 | $3,500 | Polls, email/SMS, review responder |
| Intelligence Command (Tier 3) | $2,500 | $5,500 | Property Passport, incident clearance |

### Directory Tiers (simpler pricing)

| Tier | Monthly |
|------|---------|
| Pro | $45 |
| Premium | $89 |

### Storage Limits by Tier

| Tier | Storage | Overage Rate |
|------|---------|-------------|
| Starter | 5 GB | $0.25/GB |
| Professional | 25 GB | $0.15/GB |
| Enterprise | 100 GB | $0.10/GB |
| Elite | 500 GB | $0.05/GB |

### Transaction Fee Model

- $0.60 per customer interaction (call, booking, coupon, lead form)
- Backend subscribers (Tier 1-3) have fees waived

## Security Checklist for Billing Code

- [ ] Prices defined server-side, never from client input
- [ ] Webhook signature verified with `stripe.webhooks.constructEvent()`
- [ ] All Supabase queries scoped by `business_id`
- [ ] `payment_transactions` table has RLS enabled
- [ ] Stripe secret key only in server-side code (`process.env.STRIPE_SECRET_KEY`)
- [ ] No service_role key used in billing routes
- [ ] Rate limiting on checkout session creation
- [ ] Idempotent webhook processing (handle duplicate events)

## Validation

- [ ] Checkout session creates correctly for each tier
- [ ] Webhook handler processes all expected event types
- [ ] Usage metering records and enforces limits
- [ ] Tier downgrade on subscription cancellation works
- [ ] Overage billing calculates correctly
- [ ] RLS policies prevent cross-tenant billing data access
