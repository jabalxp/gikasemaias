/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#030303',
          card: '#09090b',
          border: '#18181b',
          cyan: '#00f0ff',
          purple: '#8a2be2',
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 10px rgba(0, 240, 255, 0.3)',
        'neon-purple': '0 0 10px rgba(138, 43, 226, 0.3)',
      }
    },
  },
  plugins: [],
}
