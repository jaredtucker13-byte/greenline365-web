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
        // OS Dark Theme
        'os-dark': {
          DEFAULT: '#0A0A0A',
          950: '#000000',
          900: '#050505',
          800: '#0F0F0F',
          700: '#1A1A1A',
          600: '#252525',
        },
        // Neon Green (Primary)
        'neon-green': {
          DEFAULT: '#00FF00',
          50: '#E6FFE6',
          100: '#CCFFCC',
          200: '#99FF99',
          300: '#66FF66',
          400: '#33FF33',
          500: '#00FF00',
          600: '#00E600',
          700: '#00CC00',
          800: '#00B300',
          900: '#009900',
        },
        // Teal/Cyan (Secondary)
        'neon-teal': {
          DEFAULT: '#00FFFF',
          50: '#E6FFFF',
          100: '#CCFFFF',
          200: '#99FFFF',
          300: '#66FFFF',
          400: '#33FFFF',
          500: '#00FFFF',
          600: '#00E6E6',
          700: '#00CCCC',
          800: '#00B3B3',
          900: '#009999',
        },
        // Amber/Orange (Accent/Warning)
        'neon-amber': {
          DEFAULT: '#FF9500',
          50: '#FFF4E6',
          100: '#FFE9CC',
          200: '#FFD399',
          300: '#FFBD66',
          400: '#FFA733',
          500: '#FF9500',
          600: '#E68600',
          700: '#CC7700',
          800: '#B36800',
          900: '#995900',
        },
      },
      fontFamily: {
        'display': ['Poppins', 'system-ui', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'radial-green': 'radial-gradient(circle, rgba(0, 255, 0, 0.15) 0%, transparent 70%)',
        'radial-teal': 'radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
        'neon-gradient': 'linear-gradient(135deg, #00FF00 0%, #00FFFF 100%)',
        'neon-gradient-reverse': 'linear-gradient(135deg, #00FFFF 0%, #00FF00 100%)',
      },
      boxShadow: {
        'neon-green': '0 0 20px rgba(0, 255, 0, 0.3), 0 0 40px rgba(0, 255, 0, 0.15)',
        'neon-teal': '0 0 20px rgba(0, 255, 255, 0.3), 0 0 40px rgba(0, 255, 255, 0.15)',
        'neon-amber': '0 0 20px rgba(255, 149, 0, 0.3), 0 0 40px rgba(255, 149, 0, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-sm': '0 4px 16px 0 rgba(0, 0, 0, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 255, 0, 0.2), 0 0 10px rgba(0, 255, 0, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 255, 0, 0.4), 0 0 40px rgba(0, 255, 0, 0.2)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities, addComponents, theme }) {
      // Glassmorphism utilities
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
        '.glass-green': {
          'background': 'rgba(0, 255, 0, 0.05)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(0, 255, 0, 0.2)',
        },
        '.glass-teal': {
          'background': 'rgba(0, 255, 255, 0.05)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(0, 255, 255, 0.2)',
        },
      });

      // Button components
      addComponents({
        '.btn-primary': {
          'padding': '0.75rem 1.5rem',
          'background': 'linear-gradient(135deg, #00FF00 0%, #00E600 100%)',
          'color': '#000000',
          'font-weight': '600',
          'border-radius': '9999px',
          'box-shadow': '0 0 20px rgba(0, 255, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'transform': 'translateY(-2px)',
            'box-shadow': '0 0 30px rgba(0, 255, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          },
          '&:active': {
            'transform': 'translateY(0)',
          },
        },
        '.btn-secondary': {
          'padding': '0.75rem 1.5rem',
          'background': 'transparent',
          'color': '#00FF00',
          'font-weight': '600',
          'border-radius': '9999px',
          'border': '2px solid rgba(0, 255, 0, 0.5)',
          'backdrop-filter': 'blur(4px)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'background': 'rgba(0, 255, 0, 0.1)',
            'border-color': 'rgba(0, 255, 0, 0.8)',
            'box-shadow': '0 0 20px rgba(0, 255, 0, 0.3)',
          },
        },
        '.btn-ghost': {
          'padding': '0.75rem 1.5rem',
          'background': 'rgba(255, 255, 255, 0.05)',
          'color': '#FFFFFF',
          'font-weight': '500',
          'border-radius': '0.75rem',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(4px)',
          'transition': 'all 0.3s ease',
          '&:hover': {
            'background': 'rgba(255, 255, 255, 0.1)',
            'border-color': 'rgba(255, 255, 255, 0.2)',
          },
        },
      });

      // Text gradient utilities
      addUtilities({
        '.text-gradient-green': {
          'background': 'linear-gradient(135deg, #00FF00 0%, #00CC00 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-gradient-neon': {
          'background': 'linear-gradient(135deg, #00FF00 0%, #00FFFF 100%)',
          '-webkit-background-clip': 'text',
          'background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
      });
    }),
  ],
};
