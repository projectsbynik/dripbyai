/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f0ff',
          100: '#e9e0ff',
          200: '#d4c6ff',
          300: '#b59dff',
          400: '#9571ff',
          500: '#8047ff',
          600: '#6b28f0',
          700: '#5b1dd7',
          800: '#4c1aae',
          900: '#40188c',
          950: '#250d52',
        },
        accent: {
          50: '#fef1fa',
          100: '#fee5f7',
          200: '#fecbf1',
          300: '#ffa1e4',
          400: '#ff6dd0',
          500: '#fc41b6',
          600: '#eb1897',
          700: '#c70d78',
          800: '#a40e62',
          900: '#831155',
          950: '#500530',
        },
        dark: {
          50: '#f6f7f9',
          100: '#eceef2',
          200: '#d5dae3',
          300: '#b0bbcc',
          400: '#8696b0',
          500: '#667995',
          600: '#52627c',
          700: '#445066',
          800: '#3a4356',
          900: '#1e2231',
          950: '#111318',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(129, 71, 255, 0.25)',
        'glow-md': '0 0 25px -5px rgba(129, 71, 255, 0.25)',
        'glow-lg': '0 0 35px -5px rgba(129, 71, 255, 0.3)',
        'glow-accent': '0 5px 20px -5px rgba(236, 24, 151, 0.4)',
      },
      animation: {
        'float': 'float 5s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};