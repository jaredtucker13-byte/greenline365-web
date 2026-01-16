/**
 * Admin V2 Layout
 * Tactical Multi-Command Center
 */

import type { Metadata } from 'next';
import ThemeWrapper from './ThemeWrapper';
import PageTransitionWrapper from './PageTransitionWrapper';
import CostTrackingWrapper from './CostTrackingWrapper';

export const metadata: Metadata = {
  title: 'Tactical Command Center - GreenLine365',
  description: 'Multi-Command Center for bookings, content scheduling, and business intelligence.',
};

// Force dynamic rendering for all admin pages (uses NavigationProvider)
export const dynamic = 'force-dynamic';

export default function AdminV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeWrapper>
      <CostTrackingWrapper>
        <div className="min-h-screen bg-[#121212]">
          <PageTransitionWrapper>
            {children}
          </PageTransitionWrapper>
        </div>
      </CostTrackingWrapper>
    </ThemeWrapper>
  );
}
