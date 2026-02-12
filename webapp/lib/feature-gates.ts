/**
 * Feature Gating — Directory Tier Permissions
 * 
 * Tiers: free, pro, premium
 * This module defines what each tier can access.
 * Used by both API routes (server) and components (client).
 */

export type DirectoryTier = 'free' | 'pro' | 'premium';

export interface TierLimits {
  photos: number;
  hasVerifiedBadge: boolean;
  hasCtaButtons: boolean;
  hasFeaturedPlacement: boolean;
  hasAnalytics: boolean;
  hasBadgeEarning: boolean;
  hasQrFeedback: boolean;
  hasMarketplaceAccess: boolean;
  hasPrioritySearch: boolean;
  hasPrioritySupport: boolean;
  hasPropertyIntelligence: boolean;
  searchWeight: number;
  transactionFee: number;
}

const TIER_LIMITS: Record<DirectoryTier, TierLimits> = {
  free: {
    photos: 0,
    hasVerifiedBadge: false,
    hasCtaButtons: false,
    hasFeaturedPlacement: false,
    hasAnalytics: false,
    hasBadgeEarning: false,
    hasQrFeedback: false,
    hasMarketplaceAccess: false,
    hasPrioritySearch: false,
    hasPrioritySupport: false,
    hasPropertyIntelligence: false,
    searchWeight: 1,
    transactionFee: 0.60,
  },
  pro: {
    photos: 2,
    hasVerifiedBadge: true,
    hasCtaButtons: true,
    hasFeaturedPlacement: false,
    hasAnalytics: false,
    hasBadgeEarning: false,
    hasQrFeedback: false,
    hasMarketplaceAccess: true,
    hasPrioritySearch: true,
    hasPrioritySupport: false,
    hasPropertyIntelligence: true,
    searchWeight: 3,
    transactionFee: 0.60,
  },
  premium: {
    photos: 10,
    hasVerifiedBadge: true,
    hasCtaButtons: true,
    hasFeaturedPlacement: true,
    hasAnalytics: true,
    hasBadgeEarning: true,
    hasQrFeedback: true,
    hasMarketplaceAccess: true,
    hasPrioritySearch: true,
    hasPrioritySupport: true,
    hasPropertyIntelligence: true,
    searchWeight: 5,
    transactionFee: 0.60,
  },
};

export function getTierLimits(tier: string): TierLimits {
  return TIER_LIMITS[(tier as DirectoryTier)] || TIER_LIMITS.free;
}

export function canAccess(tier: string, feature: keyof TierLimits): boolean {
  const limits = getTierLimits(tier);
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  return false;
}

export function getTransactionFee(tier: string, isBackendServiceSubscriber: boolean): number {
  if (isBackendServiceSubscriber) return 0; // Waived for high-ticket subscribers
  return getTierLimits(tier).transactionFee;
}

export const TIER_NAMES: Record<DirectoryTier, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
};

export const TIER_PRICES: Record<DirectoryTier, number> = {
  free: 0,
  pro: 39,
  premium: 59,
};
