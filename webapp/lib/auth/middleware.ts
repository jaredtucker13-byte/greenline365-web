/**
 * Centralized Auth Middleware
 *
 * Reusable middleware functions for API route protection.
 * Each function returns either the authenticated context or an error Response.
 *
 * Usage in API routes:
 *   const result = await requireAuth(request);
 *   if (result instanceof Response) return result;
 *   const { user, supabase } = result;
 */

import { createClient } from '@/lib/supabase/server';
import { resolveFeatures, hasFeature } from '@/lib/services/feature-resolution';
import type { ResolvedFeatures } from '@/lib/services/feature-resolution';
import type { User, SupabaseClient } from '@supabase/supabase-js';

export interface Subscription {
  id: string;
  account_id: string;
  listing_id: string | null;
  plan_id: string;
  status: string;
  billing_cycle: string;
  plan: {
    slug: string;
    product_type: string;
    name: string;
  };
}

/**
 * Require an authenticated user. Returns 401 if not authenticated.
 */
export async function requireAuth(
  request: Request
): Promise<{ user: User; supabase: SupabaseClient } | Response> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  return { user, supabase };
}

/**
 * Require an admin user. Returns 401 if not authenticated, 403 if not admin.
 */
export async function requireAdmin(
  request: Request
): Promise<{ user: User; supabase: SupabaseClient } | Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { user, supabase } = authResult;

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) {
    return Response.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }

  return { user, supabase };
}

/**
 * Require an active subscription of a given product type.
 * Returns 401 if not authenticated, 403 if no active subscription found.
 *
 * For 'directory' subscriptions, checks listing_id from query param or body.
 * For 'command_center' subscriptions, checks account-level subs (listing_id IS NULL).
 * 'bundle' subscriptions satisfy both product types.
 */
export async function requireSubscription(
  request: Request,
  productType: 'directory' | 'command_center'
): Promise<{ user: User; supabase: SupabaseClient; subscription: Subscription } | Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { user, supabase } = authResult;

  // Find active subscriptions that match the product type (or bundle)
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select(`
      id, account_id, listing_id, plan_id, status, billing_cycle,
      plan:plans!inner(slug, product_type, name)
    `)
    .eq('account_id', user.id)
    .in('status', ['active', 'trialing']);

  if (error || !subs || subs.length === 0) {
    return Response.json(
      { error: `Active ${productType} subscription required` },
      { status: 403 }
    );
  }

  // Filter to matching product type or bundle
  const matching = subs.find((s: Record<string, unknown>) => {
    const plan = s.plan as unknown as { slug: string; product_type: string; name: string };
    return plan.product_type === productType || plan.product_type === 'bundle';
  });

  if (!matching) {
    return Response.json(
      { error: `Active ${productType} subscription required` },
      { status: 403 }
    );
  }

  return {
    user,
    supabase,
    subscription: matching as unknown as Subscription,
  };
}

/**
 * Require the authenticated user to have a specific permission (via their role).
 * Checks account_members for the user's role, then role_permissions for the permission.
 * Returns 401 if not authenticated, 403 if permission not granted.
 *
 * Account owners (the account_id holder) always have all permissions.
 */
export async function requirePermission(
  request: Request,
  permissionSlug: string
): Promise<{ user: User; supabase: SupabaseClient } | Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { user, supabase } = authResult;

  // Check if user is the account owner — extract accountId from query params or body
  const url = new URL(request.url);
  const accountId = url.searchParams.get('accountId');

  // If user IS the account owner, they have all permissions
  if (accountId && accountId === user.id) {
    return { user, supabase };
  }

  // Look up the user's role via account_members
  const { data: membership } = await supabase
    .from('account_members')
    .select(`
      role_id,
      account_id,
      status,
      role:roles!inner(
        slug,
        role_permissions:role_permissions!inner(
          permission:permissions!inner(slug)
        )
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!membership) {
    // User might be the account owner themselves (no account_members entry needed)
    // Check if they own any subscriptions
    const { data: ownedSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('account_id', user.id)
      .in('status', ['active', 'trialing'])
      .limit(1);

    if (ownedSubs && ownedSubs.length > 0) {
      // Account owner — full access
      return { user, supabase };
    }

    return Response.json(
      { error: `Permission '${permissionSlug}' required` },
      { status: 403 }
    );
  }

  // Check if the role has the required permission
  const role = membership.role as unknown as {
    slug: string;
    role_permissions: Array<{ permission: { slug: string } }>;
  };

  const hasPermission = role.role_permissions.some(
    (rp) => rp.permission.slug === permissionSlug
  );

  if (!hasPermission) {
    return Response.json(
      { error: `Permission '${permissionSlug}' required` },
      { status: 403 }
    );
  }

  return { user, supabase };
}

/**
 * Require a specific account type. Returns 401 if not authenticated, 403 if wrong type.
 */
export async function requireAccountType(
  request: Request,
  accountType: 'consumer' | 'business'
): Promise<{ user: User; supabase: SupabaseClient } | Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { user, supabase } = authResult;

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single();

  if (!profile || profile.account_type !== accountType) {
    return Response.json(
      { error: `${accountType} account required` },
      { status: 403 }
    );
  }

  return { user, supabase };
}

/**
 * Require email to be verified. Returns 401 if not authenticated, 403 if not verified.
 */
export async function requireVerifiedEmail(
  request: Request
): Promise<{ user: User; supabase: SupabaseClient } | Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { user, supabase } = authResult;

  const { data: profile } = await supabase
    .from('profiles')
    .select('email_verified')
    .eq('id', user.id)
    .single();

  if (!profile?.email_verified) {
    return Response.json(
      { error: 'Email verification required' },
      { status: 403 }
    );
  }

  return { user, supabase };
}

/**
 * Require a specific feature to be enabled for the authenticated user.
 * Returns 401 if not authenticated, 403 if the feature is not available.
 *
 * Optionally reads `listingId` from query params for listing-scoped resolution.
 */
export async function requireFeature(
  request: Request,
  featureSlug: string
): Promise<{ user: User; supabase: SupabaseClient; features: ResolvedFeatures } | Response> {
  const authResult = await requireAuth(request);
  if (authResult instanceof Response) return authResult;

  const { user, supabase } = authResult;

  // Extract listingId from query params if present
  const url = new URL(request.url);
  const listingId = url.searchParams.get('listingId') ?? undefined;

  const features = await resolveFeatures(user.id, listingId);

  if (!hasFeature(features, featureSlug)) {
    return Response.json(
      { error: `Feature '${featureSlug}' requires a plan upgrade` },
      { status: 403 }
    );
  }

  return { user, supabase, features };
}
