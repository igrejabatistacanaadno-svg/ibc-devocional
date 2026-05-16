import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8f0fb',
          100: '#c5d5f4',
          200: '#9db6ec',
          300: '#7097e4',
          400: '#4d7dde',
          500: '#2a63d8',
          600: '#1e4eac',
          700: '#163a80',
          800: '#0d2655',
          900: '#07122a',
          950: '#030912',
        },
        gold: {
          400: '#f7c94b',
          500: '#f0b429',
          600: '#d99a0d',
        },
        mint: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(13,38,85,0.08)',
        'card-hover': '0 4px 24px 0 rgba(13,38,85,0.14)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}

export default config
