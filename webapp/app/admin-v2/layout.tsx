/**
 * Admin V2 Layout
 * Tactical Multi-Command Center
 */

import type { Metadata } from 'next';
import ThemeWrapper from './ThemeWrapper';

export const metadata: Metadata = {
  title: 'Tactical Command Center - GreenLine365',
  description: 'Multi-Command Center for bookings, content scheduling, and business intelligence.',
};

export default function AdminV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeWrapper>
      <div className="min-h-screen bg-[#121212]">
        {children}
      </div>
    </ThemeWrapper>
  );
}
