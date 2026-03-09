/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Page & layout backgrounds
        cream: '#FAF8F5',
        // Warm border colour used on cards, inputs, dividers
        parchment: '#E8E2D9',
        // Primary brand — warm gold
        brand: {
          50:  '#FDF8F0',
          100: '#F5EDD8',
          200: '#EDD9B0',
          500: '#C9A87C',
          600: '#C9A87C',
          700: '#B8924A',
        },
        // Success green (for resolved status)
        success: {
          DEFAULT: '#4CAF82',
          light:   '#E8F7F0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
