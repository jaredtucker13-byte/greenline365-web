/**
 * Business Context Provider & Hook
 * 
 * Manages active business (tenant) context throughout the app.
 * Stores active business in localStorage and React Context.
 * 
 * Usage:
 * - Wrap app with <BusinessProvider>
 * - Use useBusiness() hook to access/switch businesses
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

export interface Business {
  id: string;
  name: string;
  slug: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  industry: string | null;
  is_white_label?: boolean;
  can_edit_site?: boolean;
  monthly_price?: number;
  settings: {
    features: {
      content_forge: boolean;
      mockup_generator: boolean;
      social_posting: boolean;
      crm: boolean;
      analytics: boolean;
      knowledge_base: boolean;
      blog: boolean;
      email: boolean;
      sms: boolean;
      bookings: boolean;
      ai_receptionist: boolean;
      calendar: boolean;
    };
    limits?: {
      social_posts_per_month?: number;
      ai_generations_per_month?: number;
    };
    branding?: {
      primary_color?: string;
      logo_url?: string | null;
    };
  };
  brand_voice: {
    tone?: string[];
    values?: string[];
    mission?: string;
    target_audience?: string;
    unique_selling_points?: string[];
  };
  email: string | null;
  phone: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserBusiness {
  business: Business;
  role: 'owner' | 'admin' | 'member';
  is_primary: boolean;
}

interface BusinessContextType {
  // State
  activeBusiness: Business | null;
  userBusinesses: UserBusiness[];
  isLoading: boolean;
  
  // Actions
  switchBusiness: (businessId: string) => Promise<void>;
  refreshBusinesses: () => Promise<void>;
  
  // Helpers
  hasFeature: (feature: keyof Business['settings']['features']) => boolean;
  isOwner: () => boolean;
  isAdmin: () => boolean;
  isWhiteLabel: () => boolean;
  canEditSite: () => boolean;
  getTierName: () => string;
  getTierPrice: () => string;
}

// ============================================
// CONTEXT
// ============================================

const BusinessContext = createContext<BusinessContextType | null>(null);

const STORAGE_KEY = 'greenline365_active_business';

// ============================================
// PROVIDER
// ============================================

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [userBusinesses, setUserBusinesses] = useState<UserBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Load businesses on mount
  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      setIsLoading(true);
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Fetch user's businesses (gracefully handle if table doesn't exist)
      const { data: userBusinessData, error } = await supabase
        .from('user_businesses')
        .select(`
          role,
          is_primary,
          business:businesses (*)
        `)
        .eq('user_id', user.id)
        .order('is_primary', { ascending: false });

      if (error) {
        // Table doesn't exist yet or other error - gracefully continue
        console.warn('[BusinessProvider] Error loading businesses (tables may not exist yet):', error.message);
        setIsLoading(false);
        return;
      }

      if (!userBusinessData || userBusinessData.length === 0) {
        // No businesses yet - this is fine
        setIsLoading(false);
        return;
      }

      const businesses: UserBusiness[] = (userBusinessData || []).map((ub: any) => ({
        business: ub.business,
        role: ub.role,
        is_primary: ub.is_primary,
      }));

      setUserBusinesses(businesses);

      // Set active business
      const storedBusinessId = localStorage.getItem(STORAGE_KEY);
      let activeBusinessToSet: Business | null = null;

      if (storedBusinessId) {
        // Try to find stored business
        const storedBusiness = businesses.find(ub => ub.business.id === storedBusinessId);
        if (storedBusiness) {
          activeBusinessToSet = storedBusiness.business;
        }
      }

      // Fallback to primary business
      if (!activeBusinessToSet) {
        const primaryBusiness = businesses.find(ub => ub.is_primary);
        if (primaryBusiness) {
          activeBusinessToSet = primaryBusiness.business;
        }
      }

      // Fallback to first business
      if (!activeBusinessToSet && businesses.length > 0) {
        activeBusinessToSet = businesses[0].business;
      }

      if (activeBusinessToSet) {
        setActiveBusiness(activeBusinessToSet);
        localStorage.setItem(STORAGE_KEY, activeBusinessToSet.id);
      }

    } catch (error) {
      console.warn('[BusinessProvider] Error (tables may not exist yet):', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchBusiness = async (businessId: string) => {
    const targetBusiness = userBusinesses.find(ub => ub.business.id === businessId);
    if (!targetBusiness) {
      console.error('[BusinessProvider] Business not found:', businessId);
      return;
    }

    setActiveBusiness(targetBusiness.business);
    localStorage.setItem(STORAGE_KEY, businessId);

    // Trigger a page refresh to clear any cached data
    // In a production app, you might want to invalidate specific queries instead
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const refreshBusinesses = async () => {
    await loadBusinesses();
  };

  const hasFeature = useCallback((feature: keyof Business['settings']['features']): boolean => {
    if (!activeBusiness) return false;
    return activeBusiness.settings?.features?.[feature] || false;
  }, [activeBusiness]);

  const isOwner = useCallback((): boolean => {
    if (!activeBusiness) return false;
    const userBusiness = userBusinesses.find(ub => ub.business.id === activeBusiness.id);
    return userBusiness?.role === 'owner';
  }, [activeBusiness, userBusinesses]);

  const isAdmin = useCallback((): boolean => {
    if (!activeBusiness) return false;
    const userBusiness = userBusinesses.find(ub => ub.business.id === activeBusiness.id);
    return userBusiness?.role === 'owner' || userBusiness?.role === 'admin';
  }, [activeBusiness, userBusinesses]);

  const getTierName = useCallback((): string => {
    if (!activeBusiness) return 'Unknown';
    const tierMap = {
      tier1: 'Starter',
      tier2: 'Professional',
      tier3: 'Enterprise',
    };
    return tierMap[activeBusiness.tier] || 'Unknown';
  }, [activeBusiness]);

  const getTierPrice = useCallback((): string => {
    if (!activeBusiness) return '$0';
    if (activeBusiness.monthly_price) return `$${activeBusiness.monthly_price}`;
    const priceMap = {
      tier1: '$299',
      tier2: '$599',
      tier3: '$999',
    };
    return priceMap[activeBusiness.tier] || '$0';
  }, [activeBusiness]);

  const isWhiteLabel = useCallback((): boolean => {
    if (!activeBusiness) return false;
    return activeBusiness.is_white_label || false;
  }, [activeBusiness]);

  const canEditSite = useCallback((): boolean => {
    if (!activeBusiness) return false;
    return activeBusiness.can_edit_site || false;
  }, [activeBusiness]);

  const value: BusinessContextType = {
    activeBusiness,
    userBusinesses,
    isLoading,
    switchBusiness,
    refreshBusinesses,
    hasFeature,
    isOwner,
    isAdmin,
    isWhiteLabel,
    canEditSite,
    getTierName,
    getTierPrice,
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useBusiness() {
  const context = useContext(BusinessContext);
  
  // If context is not available (provider not mounted or failed), return safe defaults
  if (!context) {
    return {
      activeBusiness: null,
      userBusinesses: [],
      isLoading: false,
      switchBusiness: async () => {},
      refreshBusinesses: async () => {},
      hasFeature: () => true, // Allow all features if no business context (backward compatible)
      isOwner: () => false,
      isAdmin: () => false,
      getTierName: () => 'Unknown',
      getTierPrice: () => '$0',
    };
  }
  
  return context;
}

export default BusinessProvider;
