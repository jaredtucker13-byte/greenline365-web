/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Bentley Standard: Deep Charcoal + Midnight Blue
        'midnight': {
          DEFAULT: '#0D1B2A',
          950: '#060E17',
          900: '#0D1B2A',
          800: '#1B2838',
          700: '#1B3A4B',
          600: '#274C63',
          500: '#3A6B8C',
        },
        'charcoal': {
          DEFAULT: '#1C1C1E',
          950: '#0E0E0F',
          900: '#1C1C1E',
          800: '#2C2C2E',
          700: '#3A3A3C',
          600: '#48484A',
          500: '#636366',
        },
        // Champagne Gold (Primary Accent)
        'gold': {
          DEFAULT: '#C9A96E',
          50: '#FAF6ED',
          100: '#F3ECDA',
          200: '#E6D8B5',
          300: '#D9C48F',
          400: '#C9A96E',
          500: '#B8944F',
          600: '#9A7A3E',
          700: '#7C6232',
          800: '#5E4A26',
          900: '#40321A',
        },
        // Brushed Silver (Secondary Accent)
        'silver': {
          DEFAULT: '#A8A9AD',
          light: '#C0C0C0',
          dark: '#808080',
        },
        // GreenLine Brand (champagne gold)
        'greenline': {
          DEFAULT: '#C9A96E',
          light: '#E6D8B5',
          dark: '#9A7A3E',
        },
        // Legacy compatibility
        'os-dark': {
          DEFAULT: '#0A0A0A',
          950: '#000000',
          900: '#050505',
          800: '#0F0F0F',
          700: '#1A1A1A',
          600: '#252525',
        },
        'neon-green': {
          DEFAULT: '#C9A96E',
          50: '#FAF6ED',
          100: '#F3ECDA',
          200: '#E6D8B5',
          300: '#D9C48F',
          400: '#C9A96E',
          500: '#C9A96E',
          600: '#B8944F',
          700: '#9A7A3E',
          800: '#7C6232',
          900: '#5E4A26',
        },
        'neon-teal': { DEFAULT: '#E6D8B5' },
        'neon-amber': { DEFAULT: '#FF9500' },
      },
      fontFamily: {
        'heading': ['Montserrat', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'display': ['Montserrat', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'radial-green': 'radial-gradient(circle, rgba(201, 169, 110, 0.15) 0%, transparent 70%)',
        'radial-teal': 'radial-gradient(circle, rgba(201, 169, 110, 0.12) 0%, transparent 70%)',
        'neon-gradient': 'linear-gradient(135deg, #C9A96E 0%, #E6D8B5 100%)',
        'neon-gradient-reverse': 'linear-gradient(135deg, #E6D8B5 0%, #C9A96E 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C9A96E, #E6D8B5, #C9A96E)',
        'bentley-gradient': 'linear-gradient(180deg, #0D1B2A 0%, #1C1C1E 100%)',
      },
      boxShadow: {
        // Restrained luxury - subtle glows, not neon
        'neon-green': '0 2px 12px rgba(201, 169, 110, 0.15)',
        'neon-teal': '0 2px 12px rgba(201, 169, 110, 0.12)',
        'neon-amber': '0 2px 12px rgba(201, 169, 110, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
        'gold-glow': '0 2px 16px rgba(201, 169, 110, 0.15), 0 0 40px rgba(201, 169, 110, 0.06)',
        'gold-glow-strong': '0 0 20px rgba(201, 169, 110, 0.25), 0 0 60px rgba(201, 169, 110, 0.1)',
        'intel-glow': '0 4px 20px rgba(201, 169, 110, 0.2)',
      },
      backdropBlur: { 'xs': '2px' },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'shimmer': 'shimmer 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(201, 169, 110, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(201, 169, 110, 0.4)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities, addComponents }) {
      addUtilities({
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.05)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-strong': {
          'background': 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          'border': '1px solid rgba(255, 255, 255, 0.15)',
        },
        '.glass-gold': {
          'background': 'rgba(201, 169, 110, 0.06)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(201, 169, 110, 0.2)',
        },
        '.glass-green': {
          'background': 'rgba(201, 169, 110, 0.06)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(201, 169, 110, 0.2)',
        },
        '.glass-teal': {
          'background': 'rgba(230, 216, 181, 0.05)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(230, 216, 181, 0.15)',
        },
        '.text-gradient-gold': {
          'background': 'linear-gradient(135deg, #C9A96E 0%, #E6D8B5 50%, #C9A96E 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-gradient-green': {
          'background': 'linear-gradient(135deg, #C9A96E 0%, #E6D8B5 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.badge-shimmer': {
          'background-size': '200% auto',
          'animation': 'shimmer 3s linear infinite',
        },
        // Luxury editorial typography utilities
        '.text-editorial': {
          'font-family': 'Montserrat, system-ui, sans-serif',
          'text-transform': 'uppercase',
          'letter-spacing': '0.15em',
        },
        '.text-editorial-wide': {
          'font-family': 'Montserrat, system-ui, sans-serif',
          'text-transform': 'uppercase',
          'letter-spacing': '0.25em',
        },
        '.text-cream': {
          'color': '#F0ECE4',
        },
        '.text-cream-muted': {
          'color': 'rgba(240, 236, 228, 0.6)',
        },
      });
      addComponents({
        // Primary: Solid champagne gold, dark text, editorial refinement
        '.btn-primary': {
          'padding': '0.75rem 2rem',
          'background': 'linear-gradient(135deg, #C9A96E 0%, #D9C48F 100%)',
          'color': '#0D1B2A',
          'font-weight': '600',
          'font-size': '0.8125rem',
          'letter-spacing': '0.1em',
          'text-transform': 'uppercase',
          'border-radius': '6px',
          'border': '1px solid rgba(201, 169, 110, 0.6)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-1px)',
            'box-shadow': '0 4px 20px rgba(201, 169, 110, 0.25)',
          },
        },
        // Secondary: Outlined, thin gold border, restrained elegance
        '.btn-secondary': {
          'padding': '0.75rem 2rem',
          'background': 'transparent',
          'color': '#C9A96E',
          'font-weight': '500',
          'font-size': '0.8125rem',
          'letter-spacing': '0.1em',
          'text-transform': 'uppercase',
          'border-radius': '6px',
          'border': '1px solid rgba(201, 169, 110, 0.35)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'background': 'rgba(201, 169, 110, 0.08)',
            'border-color': 'rgba(201, 169, 110, 0.6)',
          },
        },
        // Ghost: Minimal, text-only with subtle border on hover
        '.btn-ghost': {
          'padding': '0.625rem 1.5rem',
          'background': 'transparent',
          'color': 'rgba(201, 169, 110, 0.8)',
          'font-weight': '500',
          'font-size': '0.8125rem',
          'letter-spacing': '0.08em',
          'text-transform': 'uppercase',
          'border-radius': '6px',
          'border': '1px solid transparent',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'color': '#C9A96E',
            'border-color': 'rgba(201, 169, 110, 0.3)',
          },
        },
      });
    }),
  ],
};
