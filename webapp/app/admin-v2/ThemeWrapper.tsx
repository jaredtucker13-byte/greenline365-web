'use client';

import { ThemeProvider } from './lib/ThemeContext';
import { NavigationProvider } from '@/lib/navigation';
import { BusinessProvider } from '@/lib/business';
import { ReactNode, Suspense } from 'react';

function NavigationWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]">{children}</div>}>
      <NavigationProvider>
        <BusinessProvider>
          {children}
        </BusinessProvider>
      </NavigationProvider>
    </Suspense>
  );
}

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <NavigationWrapper>{children}</NavigationWrapper>
    </ThemeProvider>
  );
}
