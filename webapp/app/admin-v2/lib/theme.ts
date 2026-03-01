/**
 * Tactical Theme Configuration
 * GreenLine365 Admin V2
 * 
 * Color scheme inspired by high-end tactical/military command centers
 */

export const tacticalTheme = {
  // Core background colors
  background: {
    primary: '#121212',      // Main background
    secondary: '#1A1A1A',    // Panel backgrounds
    tertiary: '#1E262E',     // Card backgrounds
    elevated: '#2A3540',     // Elevated surfaces
  },
  
  // Accent colors with glow effects
  accent: {
    gold: '#C9A96E',         // Primary gold accent
    champagne: '#C9A96E',    // Softer gold for UI elements
    teal: '#0CE293',         // Content slots
    warning: '#FFC800',      // Review/Warning stage
    purple: '#8A2BE2',       // Launch stage
    red: '#FF3B3B',          // Error/Cancel
    blue: '#3B82F6',         // Info
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A0AEC0',
    muted: '#718096',
    accent: '#C9A96E',
  },
  
  // Border colors
  border: {
    default: '#2D3748',
    glow: '#C9A96E',
    subtle: '#1E262E',
  },
  
  // Status colors for calendar events
  status: {
    booking: {
      bg: 'rgba(16, 185, 129, 0.2)',
      border: '#C9A96E',
      glow: '0 0 20px rgba(16, 185, 129, 0.4)',
    },
    content: {
      bg: 'rgba(12, 226, 147, 0.2)',
      border: '#0CE293',
      glow: '0 0 20px rgba(12, 226, 147, 0.4)',
    },
    review: {
      bg: 'rgba(255, 200, 0, 0.2)',
      border: '#FFC800',
      glow: '0 0 20px rgba(255, 200, 0, 0.4)',
    },
    launch: {
      bg: 'rgba(138, 43, 226, 0.2)',
      border: '#8A2BE2',
      glow: '0 0 20px rgba(138, 43, 226, 0.4)',
    },
  },
  
  // Glow effects
  glow: {
    gold: '0 0 30px rgba(201, 169, 110, 0.3)',
    goldStrong: '0 0 50px rgba(201, 169, 110, 0.5)',
    teal: '0 0 30px rgba(12, 226, 147, 0.3)',
    warning: '0 0 30px rgba(255, 200, 0, 0.3)',
    purple: '0 0 30px rgba(138, 43, 226, 0.3)',
  },
};

export default tacticalTheme;
