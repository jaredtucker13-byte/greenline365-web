'use client';

/**
 * PageTransitionWrapper Component
 * 
 * Client-side wrapper for page transitions.
 * This is separate from layout.tsx to keep the layout as a Server Component.
 */

import { ReactNode, Suspense } from 'react';
import { PageTransition } from './components/PageTransition';
import { NavigationProgress } from './components/NavigationProgress';

interface PageTransitionWrapperProps {
  children: ReactNode;
}

export default function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <PageTransition>{children}</PageTransition>
    </>
  );
}
