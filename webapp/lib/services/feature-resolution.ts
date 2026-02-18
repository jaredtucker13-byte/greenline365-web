/**
 * Feature Resolution Service
 *
 * Resolves the effective feature set for a given account (and optionally listing)
 * by merging feature flag defaults with plan-specific overrides from all active
 * subscriptions using a "most permissive wins" strategy.
 *
 * - Booleans: true wins over false
 * - Numbers: max value wins
 * - Strings: latest subscription's value wins
 */

import { createClient } from '@/lib/supabase/server';

export type ResolvedFeatures = Record<string, string | boolean | number>;

// Module-level cache with 5-minute TTL
const featureCache = new Map<string, { features: ResolvedFeatures; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(accountId: string, listingId?: string): string {
  return listingId ? `${accountId}:${listingId}` : accountId;
}

/**
 * Bust the feature cache for a given account/listing.
 * Call this when a subscription changes (upgrade, cancel, etc.)
 */
export function bustFeatureCache(accountId: string, listingId?: string): void {
  const key = cacheKey(accountId, listingId);
  featureCache.delete(key);
  // Also bust the account-level cache if a listing-level cache was busted
  if (listingId) {
    featureCache.delete(accountId);
  }
}

function castValue(raw: string, valueType: string): string | boolean | number {
  switch (valueType) {
    case 'boolean':
      return raw === 'true';
    case 'integer':
      return parseInt(raw, 10);
    default:
      return raw;
  }
}

function mergeValue(
  existing: string | boolean | number | undefined,
  incoming: string | boolean | number,
  valueType: string
): string | boolean | number {
  if (existing === undefined) return incoming;

  switch (valueType) {
    case 'boolean':
      // true wins
      return (existing as boolean) || (incoming as boolean);
    case 'integer':
      // max wins
      return Math.max(existing as number, incoming as number);
    default:
      // string: latest wins (incoming overwrites)
      return incoming;
  }
}

/**
 * Resolve the effective features for an account, optionally scoped to a listing.
 *
 * 1. Load all feature flag defaults
 * 2. Find active subscriptions for the account (and optionally listing)
 * 3. Load plan_feature_overrides for each subscription's plan
 * 4. Merge using "most permissive wins"
 * 5. Return resolved feature map (cached for 5 minutes)
 */
export async function resolveFeatures(
  accountId: string,
  listingId?: string
): Promise<ResolvedFeatures> {
  const key = cacheKey(accountId, listingId);
  const cached = featureCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.features;
  }

  const supabase = await createClient();

  // 1. Get all feature flag defaults
  const { data: flags, error: flagsError } = await supabase
    .from('feature_flags')
    .select('id, slug, value_type, default_value');

  if (flagsError || !flags) {
    throw new Error(`Failed to load feature flags: ${flagsError?.message}`);
  }

  // Build default feature map and a lookup for value types
  const resolved: ResolvedFeatures = {};
  const valueTypes: Record<string, string> = {};
  const flagIdToSlug: Record<string, string> = {};

  for (const flag of flags) {
    resolved[flag.slug] = castValue(flag.default_value, flag.value_type);
    valueTypes[flag.slug] = flag.value_type;
    flagIdToSlug[flag.id] = flag.slug;
  }

  // 2. Get active subscriptions for account (and optionally listing)
  let query = supabase
    .from('subscriptions')
    .select('id, plan_id')
    .eq('account_id', accountId)
    .in('status', ['active', 'trialing']);

  if (listingId) {
    // For listing-scoped resolution: include both listing-specific and account-level subs
    query = supabase
      .from('subscriptions')
      .select('id, plan_id')
      .eq('account_id', accountId)
      .in('status', ['active', 'trialing'])
      .or(`listing_id.eq.${listingId},listing_id.is.null`);
  }

  const { data: subs, error: subsError } = await query;

  if (subsError) {
    throw new Error(`Failed to load subscriptions: ${subsError.message}`);
  }

  if (!subs || subs.length === 0) {
    // No active subscriptions — return defaults (free tier)
    featureCache.set(key, { features: resolved, expiresAt: Date.now() + CACHE_TTL_MS });
    return resolved;
  }

  // 3. Get plan_feature_overrides for each subscription's plan
  const planIds = [...new Set(subs.map((s: { id: string; plan_id: string }) => s.plan_id))];

  const { data: overrides, error: overridesError } = await supabase
    .from('plan_feature_overrides')
    .select('plan_id, feature_flag_id, value')
    .in('plan_id', planIds);

  if (overridesError) {
    throw new Error(`Failed to load plan feature overrides: ${overridesError.message}`);
  }

  // 4. Merge with "most permissive wins"
  if (overrides) {
    for (const override of overrides) {
      const slug = flagIdToSlug[override.feature_flag_id];
      if (!slug) continue;

      const valueType = valueTypes[slug];
      const incoming = castValue(override.value, valueType);
      resolved[slug] = mergeValue(resolved[slug], incoming, valueType);
    }
  }

  // 5. Cache and return
  featureCache.set(key, { features: resolved, expiresAt: Date.now() + CACHE_TTL_MS });
  return resolved;
}

/**
 * Check if a boolean feature is enabled.
 * Returns false for non-boolean or missing features.
 */
export function hasFeature(features: ResolvedFeatures, slug: string): boolean {
  const value = features[slug];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return false;
}

/**
 * Get the resolved value of a feature flag.
 * Returns the value cast to its proper type, or the provided default.
 */
export function getFeatureValue(
  features: ResolvedFeatures,
  slug: string
): string | number | boolean {
  const value = features[slug];
  if (value === undefined) return false;
  return value;
}
