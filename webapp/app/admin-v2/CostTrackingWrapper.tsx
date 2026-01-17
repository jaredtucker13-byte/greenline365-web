'use client';

/**
 * CostTrackingWrapper Component
 * 
 * Client-side wrapper for cost tracking and storage tracking functionality.
 * PLATFORM OWNER ONLY - Not visible to tenants.
 * 
 * The cost log viewer is accessed via Settings, not a floating button.
 */

import { ReactNode } from 'react';
import { CostTrackingProvider } from '@/lib/cost-tracking';
import { StorageProvider } from '@/lib/storage';

interface CostTrackingWrapperProps {
  children: ReactNode;
}

export default function CostTrackingWrapper({ children }: CostTrackingWrapperProps) {
  return (
    <CostTrackingProvider>
      <StorageProvider>
        {children}
      </StorageProvider>
    </CostTrackingProvider>
  );
}
