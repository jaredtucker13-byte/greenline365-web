'use client';

/**
 * Navigation Context & Utilities
 * 
 * Implements the hub-and-spoke navigation pattern:
 * - Tracks "starting point" (Command Center by default, or origin page)
 * - Uses returnTo query param for cross-page navigation
 * - Provides consistent Back behavior across the app
 * 
 * Usage:
 * - Wrap app with <NavigationProvider>
 * - Use useNavigation() hook in components
 * - Use <NavLink> instead of <Link> for tracked navigation
 */

import React, { createContext, useContext, useCallback, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// ============================================
// TYPES
// ============================================

interface NavigationEntry {
  path: string;
  title?: string;
  timestamp: number;
}

interface NavigationContextType {
  // Current navigation state
  currentPath: string;
  returnTo: string | null;
  breadcrumbs: NavigationEntry[];
  
  // Navigation actions
  navigateBack: () => void;
  navigateTo: (path: string, options?: NavigateOptions) => void;
  getReturnTarget: () => string;
  
  // Link generation
  createLink: (path: string, preserveReturn?: boolean) => string;
  
  // Telemetry
  trackNavigation: (from: string, to: string, trigger: string) => void;
}

interface NavigateOptions {
  returnTo?: string;
  replace?: boolean;
  preserveParams?: boolean;
}

// ============================================
// CONSTANTS
// ============================================

const COMMAND_CENTER = '/admin-v2';
const RETURN_TO_PARAM = 'returnTo';

// Page hierarchy for breadcrumb generation
const PAGE_HIERARCHY: Record<string, { parent: string | null; title: string }> = {
  '/admin-v2': { parent: null, title: 'Command Center' },
  '/admin-v2/crm-dashboard': { parent: '/admin-v2', title: 'CRM Dashboard' },
  '/admin-v2/analytics': { parent: '/admin-v2', title: 'Analytics' },
  '/admin-v2/calendar': { parent: '/admin-v2', title: 'Calendar' },
  '/admin-v2/blog-polish': { parent: '/admin-v2', title: 'Blog' },
  '/admin-v2/content-forge': { parent: '/admin-v2', title: 'Content Forge' },
  '/admin-v2/website-analyzer': { parent: '/admin-v2', title: 'Website Builder' },
  '/admin-v2/code-studio': { parent: '/admin-v2', title: 'Code Studio' },
  '/admin-v2/email': { parent: '/admin-v2', title: 'Email' },
  '/admin-v2/sms': { parent: '/admin-v2', title: 'SMS' },
  '/admin-v2/brand-voice': { parent: '/admin-v2', title: 'Brand Voice' },
  '/admin-v2/knowledge': { parent: '/admin-v2', title: 'Knowledge Base' },
  '/admin-v2/incidents': { parent: '/admin-v2', title: 'Incidents' },
  '/admin-v2/audit': { parent: '/admin-v2', title: 'Audit Logs' },
  '/admin-v2/settings': { parent: '/admin-v2', title: 'Settings' },
  '/admin-v2/living-canvas': { parent: '/admin-v2', title: 'Living Canvas' },
};

// ============================================
// CONTEXT
// ============================================

const NavigationContext = createContext<NavigationContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [navigationStack, setNavigationStack] = useState<NavigationEntry[]>([]);
  
  // Get returnTo from URL
  const returnTo = searchParams.get(RETURN_TO_PARAM);
  
  // Build breadcrumbs from current path
  const breadcrumbs = React.useMemo(() => {
    const crumbs: NavigationEntry[] = [];
    let currentPath = pathname;
    
    // Walk up the hierarchy
    while (currentPath) {
      const pageInfo = PAGE_HIERARCHY[currentPath];
      if (pageInfo) {
        crumbs.unshift({
          path: currentPath,
          title: pageInfo.title,
          timestamp: Date.now(),
        });
        currentPath = pageInfo.parent || '';
      } else {
        // Unknown page, try to find parent by path segments
        const segments = currentPath.split('/').filter(Boolean);
        if (segments.length > 1) {
          segments.pop();
          currentPath = '/' + segments.join('/');
        } else {
          break;
        }
      }
    }
    
    return crumbs;
  }, [pathname]);
  
  // Track navigation on path change
  useEffect(() => {
    const entry: NavigationEntry = {
      path: pathname,
      title: PAGE_HIERARCHY[pathname]?.title || pathname.split('/').pop() || '',
      timestamp: Date.now(),
    };
    
    setNavigationStack(prev => {
      // Don't add duplicate consecutive entries
      if (prev.length > 0 && prev[prev.length - 1].path === pathname) {
        return prev;
      }
      // Keep stack manageable (last 20 entries)
      const newStack = [...prev, entry].slice(-20);
      return newStack;
    });
  }, [pathname]);
  
  // Get the target for Back navigation
  const getReturnTarget = useCallback((): string => {
    // Priority 1: returnTo param
    if (returnTo) {
      try {
        const decoded = decodeURIComponent(returnTo);
        // Validate it's an internal path
        if (decoded.startsWith('/')) {
          return decoded;
        }
      } catch {
        // Invalid returnTo, fall through
      }
    }
    
    // Priority 2: Navigation stack (previous entry)
    if (navigationStack.length > 1) {
      return navigationStack[navigationStack.length - 2].path;
    }
    
    // Priority 3: Page hierarchy parent
    const pageInfo = PAGE_HIERARCHY[pathname];
    if (pageInfo?.parent) {
      return pageInfo.parent;
    }
    
    // Priority 4: Command Center (default)
    return COMMAND_CENTER;
  }, [returnTo, navigationStack, pathname]);
  
  // Navigate back
  const navigateBack = useCallback(() => {
    const target = getReturnTarget();
    
    // Try browser history first if we have entries
    if (navigationStack.length > 1 && typeof window !== 'undefined' && window.history.length > 1) {
      // Check if the previous history entry matches our expected target
      window.history.back();
      return;
    }
    
    // Otherwise, navigate directly
    router.push(target);
  }, [getReturnTarget, navigationStack, router]);
  
  // Navigate to a path with tracking
  const navigateTo = useCallback((path: string, options?: NavigateOptions) => {
    let finalPath = path;
    
    // Add returnTo if specified or preserve current one
    if (options?.returnTo) {
      const url = new URL(path, window.location.origin);
      url.searchParams.set(RETURN_TO_PARAM, encodeURIComponent(options.returnTo));
      finalPath = url.pathname + url.search;
    } else if (options?.preserveParams && returnTo) {
      const url = new URL(path, window.location.origin);
      url.searchParams.set(RETURN_TO_PARAM, returnTo);
      finalPath = url.pathname + url.search;
    }
    
    if (options?.replace) {
      router.replace(finalPath);
    } else {
      router.push(finalPath);
    }
  }, [router, returnTo]);
  
  // Create a link with optional returnTo
  const createLink = useCallback((path: string, preserveReturn: boolean = true): string => {
    if (preserveReturn && returnTo) {
      const url = new URL(path, 'http://localhost');
      url.searchParams.set(RETURN_TO_PARAM, returnTo);
      return url.pathname + url.search;
    }
    return path;
  }, [returnTo]);
  
  // Track navigation events (for analytics)
  const trackNavigation = useCallback((from: string, to: string, trigger: string) => {
    // Log for debugging / future analytics
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.log('[Navigation]', { from, to, trigger, timestamp: new Date().toISOString() });
    }
  }, []);
  
  const value: NavigationContextType = {
    currentPath: pathname,
    returnTo,
    breadcrumbs,
    navigateBack,
    navigateTo,
    getReturnTarget,
    createLink,
    trackNavigation,
  };
  
  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// ============================================
// HELPER FUNCTIONS (for use outside React)
// ============================================

/**
 * Create a link to a page with returnTo tracking
 */
export function createReturnLink(targetPath: string, originPath: string): string {
  const url = new URL(targetPath, 'http://localhost');
  url.searchParams.set(RETURN_TO_PARAM, encodeURIComponent(originPath));
  return url.pathname + url.search;
}

/**
 * Get the returnTo value from a URL
 */
export function getReturnToFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url, 'http://localhost');
    const returnTo = urlObj.searchParams.get(RETURN_TO_PARAM);
    return returnTo ? decodeURIComponent(returnTo) : null;
  } catch {
    return null;
  }
}

/**
 * Get page info from hierarchy
 */
export function getPageInfo(path: string): { parent: string | null; title: string } | null {
  return PAGE_HIERARCHY[path] || null;
}

export default NavigationProvider;
