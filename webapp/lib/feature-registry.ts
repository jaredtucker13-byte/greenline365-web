// ============================================================
// Feature Registry — Runtime Feature Checks
// ============================================================
// Checks the feature_registry table to determine what features
// a business has access to based on their pricing tier and type.
//
// Usage:
//   const features = new FeatureRegistry(supabase);
//   const can = await features.check('blast_deals', 'operator', 'food');
//   if (can) { /* show blast deals UI */ }
//
//   const allFeatures = await features.getForTier('commander');
//   const enabled = await features.getForBusiness('operator', 'beauty');
// ============================================================

import { SupabaseClient } from '@supabase/supabase-js';

export type PricingTier = 'operator' | 'commander' | 'sovereign';
export type BusinessType = 'retail' | 'food' | 'beauty' | 'fitness' | 'entertainment' | 'other';

export interface Feature {
  feature_key: string;
  feature_name: string;
  description: string;
  pricing_tiers: string[];
  business_types: string[];
  enabled: boolean;
  rollout_percent: number;
  category: string;
  requires_setup: boolean;
  setup_route: string | null;
}

// In-memory cache with TTL (avoids hammering DB on every page load)
let featureCache: Feature[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class FeatureRegistry {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ── Load features (cached) ─────────────────────────────────

  private async loadFeatures(): Promise<Feature[]> {
    if (featureCache && Date.now() < cacheExpiry) {
      return featureCache;
    }

    const { data, error } = await this.supabase
      .from('feature_registry')
      .select('*')
      .eq('enabled', true);

    if (error) {
      console.error('[FeatureRegistry] Failed to load features:', error.message);
      // Return cached data if available, even if stale
      return featureCache || [];
    }

    featureCache = data || [];
    cacheExpiry = Date.now() + CACHE_TTL_MS;
    return featureCache;
  }

  // ── Check if a specific feature is available ───────────────

  async check(
    featureKey: string,
    tier: PricingTier,
    businessType?: BusinessType
  ): Promise<boolean> {
    const features = await this.loadFeatures();
    const feature = features.find(f => f.feature_key === featureKey);

    if (!feature) return false;
    if (!feature.enabled) return false;

    // Check pricing tier
    if (feature.pricing_tiers.length > 0 && !feature.pricing_tiers.includes(tier)) {
      return false;
    }

    // Check business type (empty array = all types allowed)
    if (
      businessType &&
      feature.business_types.length > 0 &&
      !feature.business_types.includes(businessType)
    ) {
      return false;
    }

    // Check rollout percentage (deterministic based on feature key)
    if (feature.rollout_percent < 100) {
      const hash = simpleHash(featureKey + tier + (businessType || ''));
      if (hash % 100 >= feature.rollout_percent) return false;
    }

    return true;
  }

  // ── Get all features for a pricing tier ────────────────────

  async getForTier(tier: PricingTier): Promise<Feature[]> {
    const features = await this.loadFeatures();
    return features.filter(f =>
      f.enabled &&
      (f.pricing_tiers.length === 0 || f.pricing_tiers.includes(tier))
    );
  }

  // ── Get features for a specific business ───────────────────

  async getForBusiness(tier: PricingTier, businessType: BusinessType): Promise<Feature[]> {
    const features = await this.loadFeatures();
    return features.filter(f =>
      f.enabled &&
      (f.pricing_tiers.length === 0 || f.pricing_tiers.includes(tier)) &&
      (f.business_types.length === 0 || f.business_types.includes(businessType))
    );
  }

  // ── Get features grouped by category ───────────────────────

  async getGrouped(tier: PricingTier, businessType?: BusinessType): Promise<Record<string, Feature[]>> {
    const features = businessType
      ? await this.getForBusiness(tier, businessType)
      : await this.getForTier(tier);

    const grouped: Record<string, Feature[]> = {};
    for (const f of features) {
      const cat = f.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(f);
    }
    return grouped;
  }

  // ── Bust the cache (call after feature updates) ────────────

  static bustCache() {
    featureCache = null;
    cacheExpiry = 0;
  }
}

// Simple deterministic hash for rollout bucketing
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit int
  }
  return Math.abs(hash);
}
