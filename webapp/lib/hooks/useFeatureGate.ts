'use client';

import { usePortalContext } from './usePortalContext';

interface FeatureGateResult {
  isAvailable: boolean;
  isLoading: boolean;
  value: string | number | boolean;
}

/**
 * Hook that checks if a feature is available based on resolved features.
 * Returns { isAvailable, isLoading, value } for a given feature slug.
 */
export function useFeatureGate(featureSlug: string): FeatureGateResult {
  const { features, isLoading } = usePortalContext();

  const value = features[featureSlug];
  let isAvailable = false;

  if (typeof value === 'boolean') {
    isAvailable = value;
  } else if (typeof value === 'number') {
    isAvailable = value > 0;
  } else if (typeof value === 'string') {
    isAvailable = value !== '' && value !== 'false' && value !== '0';
  }

  return {
    isAvailable,
    isLoading,
    value: value ?? false,
  };
}
