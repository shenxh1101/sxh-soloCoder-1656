/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        brand: {
          50:  '#ECF5F2',
          100: '#CFE6DF',
          200: '#9FD2C1',
          300: '#6FB8A5',
          400: '#3F9981',
          500: '#0F3D33',
          600: '#0B2E27',
          700: '#08221D',
        },
        accent: {
          400: '#FF9A6B',
          500: '#FF7A3D',
          600: '#E8652A',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
        ink: {
          900: '#0F172A',
          700: '#334155',
          500: '#64748B',
          300: '#CBD5E1',
          100: '#F1F5F9',
          50:  '#F8FAFC',
        }
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 24px -4px rgba(15, 61, 51, 0.08)',
        card: '0 2px 12px -2px rgba(15, 23, 42, 0.06)',
        lift: '0 12px 32px -8px rgba(15, 61, 51, 0.15)',
        glow: '0 0 0 4px rgba(15, 183, 129, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up':    'fadeUp 420ms ease-out both',
        'fade-in':    'fadeIn 300ms ease-out both',
        'slide-in':   'slideIn 300ms ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #0F3D33 0%, #0B2E27 100%)',
        'card-gradient': 'linear-gradient(135deg, #0F3D33 0%, #3F9981 100%)',
        'accent-gradient': 'linear-gradient(135deg, #FF7A3D 0%, #FF9A6B 100%)',
      },
    },
  },
  plugins: [],
};
