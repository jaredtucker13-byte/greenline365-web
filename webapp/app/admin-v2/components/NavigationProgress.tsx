'use client';

/**
 * NavigationProgress Component
 * 
 * Shows a slim progress bar at the top during page navigation.
 * Similar to YouTube/GitHub style loading indicator.
 */

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const previousPath = useRef(pathname);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if path actually changed (not just search params)
    const currentFullPath = pathname + searchParams.toString();
    const prevFullPath = previousPath.current;
    
    if (currentFullPath !== prevFullPath) {
      // Start loading
      setIsLoading(true);
      setProgress(0);

      // Simulate progress
      let currentProgress = 0;
      progressInterval.current = setInterval(() => {
        currentProgress += Math.random() * 15;
        if (currentProgress > 90) {
          currentProgress = 90;
          if (progressInterval.current) {
            clearInterval(progressInterval.current);
          }
        }
        setProgress(currentProgress);
      }, 100);

      // Complete after a short delay
      const completeTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          setProgress(0);
        }, 200);
      }, 300);

      previousPath.current = currentFullPath;

      return () => {
        if (progressInterval.current) {
          clearInterval(progressInterval.current);
        }
        clearTimeout(completeTimer);
      };
    }
  }, [pathname, searchParams]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] pointer-events-none">
      <div
        className="h-[3px] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #39FF14, #0CE293)',
          boxShadow: '0 0 10px rgba(57, 255, 20, 0.5), 0 0 20px rgba(57, 255, 20, 0.3)',
          opacity: isLoading || progress > 0 ? 1 : 0,
        }}
      />
    </div>
  );
}

export default NavigationProgress;
