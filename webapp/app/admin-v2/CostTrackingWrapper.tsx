'use client';

/**
 * CostTrackingWrapper Component
 * 
 * Client-side wrapper for cost tracking functionality.
 * Includes the provider and the floating cost log button.
 */

import { ReactNode } from 'react';
import { CostTrackingProvider, CostLogViewer } from '@/lib/cost-tracking';

interface CostTrackingWrapperProps {
  children: ReactNode;
}

export default function CostTrackingWrapper({ children }: CostTrackingWrapperProps) {
  return (
    <CostTrackingProvider>
      {children}
      <CostLogViewer />
    </CostTrackingProvider>
  );
}
