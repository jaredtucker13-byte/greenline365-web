'use client';

import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    // TEMPORARILY DISABLED - Service worker was causing redirect loops
    // Will re-enable after proper fix is deployed
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister any existing service workers to fix the site
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
          console.log('[SW] Unregistered problematic service worker');
        });
      });
    }
  }, []);
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  return children;
}
