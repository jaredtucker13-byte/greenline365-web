/**
 * GreenLine HQ Layout
 * Reuses Admin V2 wrappers for consistent theming and tracking
 */

import type { Metadata } from 'next';
import ThemeWrapper from '../admin-v2/ThemeWrapper';
import PageTransitionWrapper from '../admin-v2/PageTransitionWrapper';
import CostTrackingWrapper from '../admin-v2/CostTrackingWrapper';

export const metadata: Metadata = {
  title: 'GreenLine HQ - GreenLine365',
  description: 'GreenLine Headquarters — command center for compliance, audit, and operations.',
};

export const dynamic = 'force-dynamic';

export default function GreenLineHQLayout({ children }: { children: React.ReactNode }) {
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
