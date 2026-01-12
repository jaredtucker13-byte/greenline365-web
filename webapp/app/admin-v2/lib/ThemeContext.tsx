'use client';

/**
 * Global Theme System for GreenLine365
 * Provides CSS variables that control ALL components across the dashboard
 * 
 * Theme 1: Glassmorphism (Default - the beautiful one)
 * Future themes can be added here
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Theme definitions
export interface ThemeColors {
  // Core
  primary: string;        // Main accent color
  secondary: string;      // Secondary accent
  accent: string;         // Highlight/glow color
  
  // Backgrounds
  bgPrimary: string;      // Main background
  bgSecondary: string;    // Panel/card backgrounds
  bgElevated: string;     // Elevated surfaces
  bgGlass: string;        // Glass effect background
  
  // Glass effects
  glassBlur: string;      // Backdrop blur amount
  glassBorder: string;    // Glass border color
  glassOpacity: string;   // Glass background opacity
  
  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textAccent: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Shadows & Glows
  shadowColor: string;
  glowColor: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  preview: string;        // Preview image or gradient
  colors: ThemeColors;
}

// Glassmorphism Theme (The Beautiful Default)
const glassmorphismTheme: Theme = {
  id: 'glassmorphism',
  name: 'Glassmorphism',
  description: 'Premium frosted glass aesthetic with nature backdrop',
  preview: 'linear-gradient(135deg, rgba(132,169,140,0.3), rgba(82,121,111,0.3))',
  colors: {
    primary: '#84A98C',
    secondary: '#52796F',
    accent: '#A7C957',
    
    bgPrimary: 'rgba(0,0,0,0.5)',
    bgSecondary: 'rgba(255,255,255,0.08)',
    bgElevated: 'rgba(255,255,255,0.12)',
    bgGlass: 'rgba(255,255,255,0.08)',
    
    glassBlur: '24px',
    glassBorder: 'rgba(255,255,255,0.15)',
    glassOpacity: '0.08',
    
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.5)',
    textAccent: '#A7C957',
    
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    shadowColor: 'rgba(0,0,0,0.36)',
    glowColor: 'rgba(132,169,140,0.4)',
  }
};

// Midnight Purple Theme
const midnightPurpleTheme: Theme = {
  id: 'midnight-purple',
  name: 'Midnight Purple',
  description: 'Deep purple tones with electric accents',
  preview: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(88,28,135,0.3))',
  colors: {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#C4B5FD',
    
    bgPrimary: 'rgba(15,10,25,0.9)',
    bgSecondary: 'rgba(139,92,246,0.1)',
    bgElevated: 'rgba(139,92,246,0.15)',
    bgGlass: 'rgba(139,92,246,0.08)',
    
    glassBlur: '24px',
    glassBorder: 'rgba(139,92,246,0.25)',
    glassOpacity: '0.1',
    
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.5)',
    textAccent: '#C4B5FD',
    
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    
    shadowColor: 'rgba(88,28,135,0.4)',
    glowColor: 'rgba(139,92,246,0.5)',
  }
};

// Ocean Blue Theme
const oceanBlueTheme: Theme = {
  id: 'ocean-blue',
  name: 'Ocean Blue',
  description: 'Calm ocean depths with cyan highlights',
  preview: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(14,116,144,0.3))',
  colors: {
    primary: '#06B6D4',
    secondary: '#0E7490',
    accent: '#67E8F9',
    
    bgPrimary: 'rgba(8,20,30,0.9)',
    bgSecondary: 'rgba(6,182,212,0.1)',
    bgElevated: 'rgba(6,182,212,0.15)',
    bgGlass: 'rgba(6,182,212,0.08)',
    
    glassBlur: '24px',
    glassBorder: 'rgba(6,182,212,0.25)',
    glassOpacity: '0.1',
    
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.5)',
    textAccent: '#67E8F9',
    
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#38BDF8',
    
    shadowColor: 'rgba(14,116,144,0.4)',
    glowColor: 'rgba(6,182,212,0.5)',
  }
};

// Sunset Orange Theme
const sunsetOrangeTheme: Theme = {
  id: 'sunset-orange',
  name: 'Sunset Orange',
  description: 'Warm sunset vibes with golden accents',
  preview: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,88,12,0.3))',
  colors: {
    primary: '#F97316',
    secondary: '#EA580C',
    accent: '#FDBA74',
    
    bgPrimary: 'rgba(25,15,10,0.9)',
    bgSecondary: 'rgba(249,115,22,0.1)',
    bgElevated: 'rgba(249,115,22,0.15)',
    bgGlass: 'rgba(249,115,22,0.08)',
    
    glassBlur: '24px',
    glassBorder: 'rgba(249,115,22,0.25)',
    glassOpacity: '0.1',
    
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.7)',
    textMuted: 'rgba(255,255,255,0.5)',
    textAccent: '#FDBA74',
    
    success: '#34D399',
    warning: '#FCD34D',
    error: '#F87171',
    info: '#60A5FA',
    
    shadowColor: 'rgba(234,88,12,0.4)',
    glowColor: 'rgba(249,115,22,0.5)',
  }
};

// Neon Green Theme (Original tactical)
const neonGreenTheme: Theme = {
  id: 'neon-green',
  name: 'Neon Tactical',
  description: 'High-tech tactical command center aesthetic',
  preview: 'linear-gradient(135deg, rgba(57,255,20,0.3), rgba(12,226,147,0.3))',
  colors: {
    primary: '#39FF14',
    secondary: '#0CE293',
    accent: '#39FF14',
    
    bgPrimary: 'rgba(10,10,10,0.95)',
    bgSecondary: 'rgba(57,255,20,0.05)',
    bgElevated: 'rgba(57,255,20,0.1)',
    bgGlass: 'rgba(57,255,20,0.05)',
    
    glassBlur: '20px',
    glassBorder: 'rgba(57,255,20,0.2)',
    glassOpacity: '0.05',
    
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    textMuted: 'rgba(255,255,255,0.4)',
    textAccent: '#39FF14',
    
    success: '#39FF14',
    warning: '#FFC800',
    error: '#FF3B3B',
    info: '#3B82F6',
    
    shadowColor: 'rgba(0,0,0,0.5)',
    glowColor: 'rgba(57,255,20,0.4)',
  }
};

// All available themes
export const themes: Theme[] = [
  glassmorphismTheme,
  midnightPurpleTheme,
  oceanBlueTheme,
  sunsetOrangeTheme,
  neonGreenTheme,
];

// Context
interface ThemeContextType {
  currentTheme: Theme;
  setTheme: (themeId: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(glassmorphismTheme);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedThemeId = localStorage.getItem('gl365-theme');
    if (savedThemeId) {
      const savedTheme = themes.find(t => t.id === savedThemeId);
      if (savedTheme) {
        setCurrentTheme(savedTheme);
      }
    }
  }, []);

  // Apply CSS variables whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const { colors } = currentTheme;

    // Set all CSS variables
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-secondary', colors.secondary);
    root.style.setProperty('--theme-accent', colors.accent);
    
    root.style.setProperty('--theme-bg-primary', colors.bgPrimary);
    root.style.setProperty('--theme-bg-secondary', colors.bgSecondary);
    root.style.setProperty('--theme-bg-elevated', colors.bgElevated);
    root.style.setProperty('--theme-bg-glass', colors.bgGlass);
    
    root.style.setProperty('--theme-glass-blur', colors.glassBlur);
    root.style.setProperty('--theme-glass-border', colors.glassBorder);
    root.style.setProperty('--theme-glass-opacity', colors.glassOpacity);
    
    root.style.setProperty('--theme-text-primary', colors.textPrimary);
    root.style.setProperty('--theme-text-secondary', colors.textSecondary);
    root.style.setProperty('--theme-text-muted', colors.textMuted);
    root.style.setProperty('--theme-text-accent', colors.textAccent);
    
    root.style.setProperty('--theme-success', colors.success);
    root.style.setProperty('--theme-warning', colors.warning);
    root.style.setProperty('--theme-error', colors.error);
    root.style.setProperty('--theme-info', colors.info);
    
    root.style.setProperty('--theme-shadow', colors.shadowColor);
    root.style.setProperty('--theme-glow', colors.glowColor);

    // Save to localStorage
    localStorage.setItem('gl365-theme', currentTheme.id);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;
