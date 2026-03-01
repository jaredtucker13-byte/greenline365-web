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
        // Obsidian Black — the base
        'obsidian': {
          DEFAULT: '#0A0A0A',
          950: '#000000',
          900: '#050505',
          800: '#0A0A0A',
          700: '#111111',
          600: '#1A1A1A',
          500: '#2A2A2A',
          400: '#3A3A3A',
        },
        // Legacy aliases (backward compat)
        'midnight': {
          DEFAULT: '#0A0A0A',
          950: '#000000',
          900: '#0A0A0A',
          800: '#111111',
          700: '#1A1A1A',
          600: '#2A2A2A',
          500: '#3A3A3A',
        },
        'charcoal': {
          DEFAULT: '#111111',
          950: '#050505',
          900: '#0A0A0A',
          800: '#141414',
          700: '#1E1E1E',
          600: '#282828',
          500: '#363636',
        },
        // Gold — the primary and ONLY accent
        'gold': {
          DEFAULT: '#C9A84C',
          50: '#FDF8ED',
          100: '#F9EDCF',
          200: '#F0DFA0',
          300: '#E8C97A',
          400: '#C9A84C',
          500: '#B08F3A',
          600: '#8A6A1C',
          700: '#6B5218',
          800: '#4D3B12',
          900: '#2E230B',
        },
        // Brushed Silver (Secondary — muted)
        'silver': {
          DEFAULT: '#A8A9AD',
          light: '#C0C0C0',
          dark: '#808080',
        },
        // GreenLine Brand (gold — logo only uses green accent)
        'greenline': {
          DEFAULT: '#C9A84C',
          light: '#E8C97A',
          dark: '#8A6A1C',
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
        // DEPRECATED: 'neon-green' removed — use 'gold' instead
        'neon-teal': { DEFAULT: '#E6D8B5' },
        'neon-amber': { DEFAULT: '#FF9500' },
      },
      fontFamily: {
        'heading': ['Playfair Display', 'Georgia', 'serif'],
        'body': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        'display': ['Playfair Display', 'Georgia', 'serif'],
        'sans': ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'radial-gold': 'radial-gradient(circle, rgba(201, 169, 110, 0.15) 0%, transparent 70%)',
        'radial-teal': 'radial-gradient(circle, rgba(201, 169, 110, 0.12) 0%, transparent 70%)',
        'gold-shine': 'linear-gradient(135deg, #C9A96E 0%, #E6D8B5 100%)',
        'gold-shine-reverse': 'linear-gradient(135deg, #E6D8B5 0%, #C9A96E 100%)',
        'gold-gradient': 'linear-gradient(135deg, #C9A96E, #E6D8B5, #C9A96E)',
        'bentley-gradient': 'linear-gradient(180deg, #0D1B2A 0%, #1C1C1E 100%)',
      },
      boxShadow: {
        'gold': '0 0 20px rgba(201, 169, 110, 0.3), 0 0 40px rgba(201, 169, 110, 0.15)',
        'neon-teal': '0 0 20px rgba(201, 169, 110, 0.25), 0 0 40px rgba(201, 169, 110, 0.12)',
        'neon-amber': '0 0 20px rgba(255, 149, 0, 0.3), 0 0 40px rgba(255, 149, 0, 0.15)',
      },
      backdropBlur: { 'xs': '2px' },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'shimmer': 'shimmer 3s linear infinite',
        'gold-pulse': 'goldPulse 4s ease-in-out infinite',
        'particle-drift': 'particleDrift 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(201, 168, 76, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.4)' },
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
        goldPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        particleDrift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(15px, -20px) scale(1.1)' },
          '66%': { transform: 'translate(-10px, 10px) scale(0.9)' },
        },
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities, addComponents }) {
      addUtilities({
        '.glass': {
          'background': 'rgba(255, 255, 255, 0.04)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(255, 255, 255, 0.08)',
        },
        '.glass-strong': {
          'background': 'rgba(255, 255, 255, 0.08)',
          'backdrop-filter': 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.12)',
        },
        '.glass-gold': {
          'background': 'rgba(201, 168, 76, 0.06)',
          'backdrop-filter': 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          'border': '1px solid rgba(201, 168, 76, 0.2)',
        },
        // .glass-green removed — use .glass-gold instead
        '.text-gradient-gold': {
          'background': 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 50%, #C9A84C 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        // .text-gradient-green removed — use .text-gradient-gold instead
        '.badge-shimmer': {
          'background-size': '200% auto',
          'animation': 'shimmer 3s linear infinite',
        },
        '.depth-layer': {
          'box-shadow': '0 24px 64px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
        },
      });
      addComponents({
        // Primary: Solid champagne gold, dark text, editorial refinement
        '.btn-primary': {
          'padding': '0.75rem 1.5rem',
          'background': 'linear-gradient(135deg, #C9A84C 0%, #E8C97A 100%)',
          'color': '#0A0A0A',
          'font-weight': '600',
          'border-radius': '9999px',
          'box-shadow': '0 0 20px rgba(201, 168, 76, 0.3)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 0 30px rgba(201, 168, 76, 0.5)',
          },
        },
        // Secondary: Outlined, thin gold border, restrained elegance
        '.btn-secondary': {
          'padding': '0.75rem 2rem',
          'background': 'transparent',
          'color': '#C9A84C',
          'font-weight': '500',
          'border-radius': '9999px',
          'border': '1px solid rgba(201, 168, 76, 0.4)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'background': 'rgba(201, 168, 76, 0.1)',
            'border-color': 'rgba(201, 168, 76, 0.7)',
            'box-shadow': '0 0 16px rgba(201, 168, 76, 0.2)',
          },
        },
      });
    }),
  ],
};
