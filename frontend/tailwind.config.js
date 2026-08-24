/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          50: '#f0f5ff',
          100: '#e0ecff',
          200: '#b9d5ff',
          300: '#7cb2ff',
          400: '#3888ff',
          500: '#0c5eed',
          600: '#0049cb',
          700: '#003ba4',
          800: '#043486',
          900: '#0a2d6f',
          950: '#061c47',
        },
        navy: {
          800: '#0b132b',
          900: '#060a17',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'premium': '0 10px 25px -5px rgba(0, 73, 203, 0.08), 0 8px 10px -6px rgba(0, 73, 203, 0.04)',
      }
    },
  },
  plugins: [],
}
