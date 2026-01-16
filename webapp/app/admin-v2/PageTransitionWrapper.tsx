'use client';

/**
 * PageTransitionWrapper Component
 * 
 * Client-side wrapper for page transitions.
 * This is separate from layout.tsx to keep the layout as a Server Component.
 */

import { ReactNode } from 'react';
import { PageTransition } from './components/PageTransition';

interface PageTransitionWrapperProps {
  children: ReactNode;
}

export default function PageTransitionWrapper({ children }: PageTransitionWrapperProps) {
  return <PageTransition>{children}</PageTransition>;
}
