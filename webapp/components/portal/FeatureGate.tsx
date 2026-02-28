'use client';

import { type ReactNode } from 'react';
import { useFeatureGate } from '@/lib/hooks/useFeatureGate';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Wrapper component that shows children if feature is available,
 * or shows fallback (upgrade CTA) if not.
 *
 * Usage:
 *   <FeatureGate feature="menu_editor" fallback={<UpgradeCTA feature="Menu Editor" />}>
 *     <MenuEditor />
 *   </FeatureGate>
 */
export default function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { isAvailable, isLoading } = useFeatureGate(feature);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAvailable) {
    return <>{fallback ?? null}</>;
  }

  return <>{children}</>;
}
