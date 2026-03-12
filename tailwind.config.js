/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#e0feff',
          100: '#b3fbff',
          200: '#7ff5ff',
          300: '#40edff',
          400: '#0ee4ff',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        dark: {
          950: '#030303',
          900: '#0a0a0a',
          800: '#111111',
          700: '#161616',
          600: '#1a1a1a',
          500: '#222222',
          400: '#2a2a2a',
          300: '#333333',
          200: '#444444',
          100: '#666666',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':       '0 1px 3px 0 rgba(0,0,0,.5), 0 1px 2px -1px rgba(0,0,0,.4)',
        'card-hover': '0 4px 24px 0 rgba(6,182,212,0.15)',
        'elevated':   '0 8px 32px rgba(0,0,0,.6)',
        'glow':       '0 0 20px rgba(6,182,212,0.3)',
        'glow-lg':    '0 0 40px rgba(6,182,212,0.2)',
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-in-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',      opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(6,182,212,0.2)' },
          '50%':       { boxShadow: '0 0 30px rgba(6,182,212,0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-6px)' },
        },
      },
      backgroundImage: {
        'gradient-brand':   'linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%)',
        'gradient-dark':    'linear-gradient(135deg, #111111 0%, #1a1a1a 100%)',
        'gradient-glow':    'radial-gradient(ellipse at center, rgba(6,182,212,0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
}
