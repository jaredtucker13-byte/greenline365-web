/**
 * White-Label Theme Context
 * 
 * Provides theme configuration for both:
 * 1. Standard GreenLine365 branding
 * 2. White-label tenants with custom branding
 * 
 * Features:
 * - CSS variable injection
 * - Logo/branding override
 * - "Powered by" suppression
 * - Custom domain detection
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

// ============================================
// TYPES
// ============================================

export interface BusinessTheme {
  id: string;
  business_id: string;
  
  // Branding
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  company_name: string | null;
  tagline: string | null;
  support_email: string | null;
  
  // Colors
  primary_color: string;
  secondary_color: string;
  background_color: string;
  surface_color: string;
  text_primary: string;
  text_secondary: string;
  text_muted: string;
  border_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  
  // Typography
  font_heading: string;
  font_body: string;
  
  // Footer
  footer_text: string | null;
  hide_powered_by: boolean;
  
  // Custom CSS
  custom_css: string | null;
}

export interface ThemeContextType {
  // Theme State
  theme: BusinessTheme | null;
  isWhiteLabel: boolean;
  isLoading: boolean;
  
  // Branding Helpers
  getCompanyName: () => string;
  getLogoUrl: () => string | null;
  shouldShowPoweredBy: () => boolean;
  
  // Theme Management
  updateTheme: (updates: Partial<BusinessTheme>) => Promise<void>;
  refreshTheme: () => Promise<void>;
  
  // CSS Variables
  getCSSVariables: () => Record<string, string>;
}

// Default GreenLine365 theme
const defaultTheme: BusinessTheme = {
  id: 'default',
  business_id: 'default',
  logo_url: null,
  logo_dark_url: null,
  favicon_url: null,
  company_name: 'GreenLine365',
  tagline: 'Business OS',
  support_email: 'support@greenline365.com',
  primary_color: '#39FF14',
  secondary_color: '#0CE293',
  background_color: '#121212',
  surface_color: '#1A1A1A',
  text_primary: '#FFFFFF',
  text_secondary: '#A0AEC0',
  text_muted: '#718096',
  border_color: '#2D3748',
  success_color: '#10B981',
  warning_color: '#FFC800',
  error_color: '#FF3B3B',
  font_heading: 'Inter',
  font_body: 'Inter',
  footer_text: null,
  hide_powered_by: false,
  custom_css: null,
};

// ============================================
// CONTEXT
// ============================================

const WhiteLabelThemeContext = createContext<ThemeContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface WhiteLabelThemeProviderProps {
  children: ReactNode;
  businessId?: string; // Optional: Force a specific business theme
}

export function WhiteLabelThemeProvider({ children, businessId }: WhiteLabelThemeProviderProps) {
  const [theme, setTheme] = useState<BusinessTheme | null>(null);
  const [isWhiteLabel, setIsWhiteLabel] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Load theme on mount
  useEffect(() => {
    loadTheme();
  }, [businessId]);

  const loadTheme = async () => {
    try {
      setIsLoading(true);

      // If businessId is provided, load that theme
      if (businessId) {
        const { data: themeData, error } = await supabase
          .from('business_themes')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (!error && themeData) {
          setTheme(themeData as BusinessTheme);
          
          // Check if business is white-label
          const { data: businessData } = await supabase
            .from('businesses')
            .select('is_white_label')
            .eq('id', businessId)
            .single();
          
          setIsWhiteLabel(businessData?.is_white_label || false);
        } else {
          setTheme(defaultTheme);
          setIsWhiteLabel(false);
        }
      } else {
        // Try to detect theme from domain or active business
        await detectThemeFromContext();
      }
    } catch (error) {
      console.warn('[WhiteLabelTheme] Error loading theme:', error);
      setTheme(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  };

  const detectThemeFromContext = async () => {
    // 1. Check if we're on a custom domain
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Skip for localhost/preview environments
      if (!hostname.includes('localhost') && !hostname.includes('emergent')) {
        const { data: domainData } = await supabase
          .from('custom_domains')
          .select('business_id')
          .eq('domain', hostname)
          .eq('is_active', true)
          .single();

        if (domainData?.business_id) {
          const { data: themeData } = await supabase
            .from('business_themes')
            .select('*')
            .eq('business_id', domainData.business_id)
            .single();

          if (themeData) {
            setTheme(themeData as BusinessTheme);
            setIsWhiteLabel(true);
            return;
          }
        }
      }
    }

    // 2. Check localStorage for active business
    const storedBusinessId = typeof window !== 'undefined' 
      ? localStorage.getItem('greenline365_active_business')
      : null;

    if (storedBusinessId) {
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id, is_white_label')
        .eq('id', storedBusinessId)
        .single();

      if (businessData?.is_white_label) {
        const { data: themeData } = await supabase
          .from('business_themes')
          .select('*')
          .eq('business_id', storedBusinessId)
          .single();

        if (themeData) {
          setTheme(themeData as BusinessTheme);
          setIsWhiteLabel(true);
          return;
        }
      }
    }

    // 3. Default to GreenLine365 theme
    setTheme(defaultTheme);
    setIsWhiteLabel(false);
  };

  const updateTheme = async (updates: Partial<BusinessTheme>) => {
    if (!theme || theme.id === 'default') return;

    const { error } = await supabase
      .from('business_themes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', theme.id);

    if (!error) {
      setTheme(prev => prev ? { ...prev, ...updates } : prev);
    }
  };

  const refreshTheme = async () => {
    await loadTheme();
  };

  const getCompanyName = useCallback(() => {
    if (isWhiteLabel && theme?.company_name) {
      return theme.company_name;
    }
    return 'GreenLine365';
  }, [isWhiteLabel, theme]);

  const getLogoUrl = useCallback(() => {
    if (isWhiteLabel && theme?.logo_url) {
      return theme.logo_url;
    }
    return null; // Use default logo component
  }, [isWhiteLabel, theme]);

  const shouldShowPoweredBy = useCallback(() => {
    if (isWhiteLabel && theme?.hide_powered_by) {
      return false;
    }
    return true;
  }, [isWhiteLabel, theme]);

  const getCSSVariables = useCallback((): Record<string, string> => {
    const t = theme || defaultTheme;
    return {
      '--theme-primary': t.primary_color,
      '--theme-secondary': t.secondary_color,
      '--theme-bg-primary': t.background_color,
      '--theme-bg-secondary': t.surface_color,
      '--theme-bg-glass': `${t.surface_color}CC`,
      '--theme-text-primary': t.text_primary,
      '--theme-text-secondary': t.text_secondary,
      '--theme-text-muted': t.text_muted,
      '--theme-border': t.border_color,
      '--theme-glass-border': `${t.border_color}80`,
      '--theme-success': t.success_color,
      '--theme-warning': t.warning_color,
      '--theme-error': t.error_color,
      '--theme-accent': t.primary_color,
      '--theme-glow': `${t.primary_color}50`,
      '--theme-shadow': `${t.primary_color}20`,
      '--theme-info': '#3B82F6',
      '--theme-font-heading': t.font_heading,
      '--theme-font-body': t.font_body,
    };
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    isWhiteLabel,
    isLoading,
    getCompanyName,
    getLogoUrl,
    shouldShowPoweredBy,
    updateTheme,
    refreshTheme,
    getCSSVariables,
  };

  // Inject CSS variables
  const cssVars = getCSSVariables();
  const cssVarString = Object.entries(cssVars)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n');

  return (
    <WhiteLabelThemeContext.Provider value={value}>
      <style jsx global>{`
        :root {
          ${cssVarString}
        }
      `}</style>
      {theme?.custom_css && (
        <style jsx global>{theme.custom_css}</style>
      )}
      {children}
    </WhiteLabelThemeContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useWhiteLabelTheme() {
  const context = useContext(WhiteLabelThemeContext);
  
  if (!context) {
    // Return defaults if not in provider
    return {
      theme: defaultTheme,
      isWhiteLabel: false,
      isLoading: false,
      getCompanyName: () => 'GreenLine365',
      getLogoUrl: () => null,
      shouldShowPoweredBy: () => true,
      updateTheme: async () => {},
      refreshTheme: async () => {},
      getCSSVariables: () => ({}),
    };
  }
  
  return context;
}

export default WhiteLabelThemeProvider;
