'use client';

/**
 * PageTransition Component
 * 
 * Provides smooth fade/slide transitions when navigating between admin pages.
 * Uses framer-motion for animations with minimal performance overhead.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

// Animation variants for page transitions
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1], // cubic-bezier for smooth feel
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // When pathname changes, trigger transition
    setIsNavigating(true);
    
    // Small delay to allow exit animation
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsNavigating(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [pathname, children]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="w-full"
      >
        {displayChildren}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
