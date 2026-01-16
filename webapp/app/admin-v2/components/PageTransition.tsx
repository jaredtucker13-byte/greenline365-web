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

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setDisplayChildren(children);
  }, [pathname, children]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            duration: 0.2,
            ease: 'easeOut',
          }
        }}
        exit={{ 
          opacity: 0, 
          y: -8,
          transition: {
            duration: 0.15,
            ease: 'easeIn',
          }
        }}
        className="w-full"
      >
        {displayChildren}
      </motion.div>
    </AnimatePresence>
  );
}

export default PageTransition;
