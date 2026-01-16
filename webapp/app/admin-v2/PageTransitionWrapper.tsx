'use client';

/**
 * PageTransitionWrapper Component
 * 
 * Client-side wrapper for page transitions.
 * This is separate from layout.tsx to keep the layout as a Server Component.
 */

import { ReactNode } from 'react';
import { PageTransition } from './components/PageTransition';
import { NavigationProgress } from './components/NavigationProgress';

interface PageTransitionWrapperProps {
  children: ReactNode;
}

export default function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  return (
    <>
      <NavigationProgress />
      <PageTransition>{children}</PageTransition>
    </>
  );
}
