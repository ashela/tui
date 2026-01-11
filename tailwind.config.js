/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'kereru-dark': '#0a0e1a',
        'kereru-panel': '#1a1f2e',
        'kereru-green': '#2d5f3f',
        'kereru-teal': '#1e4d4d',
        'kereru-blue': '#1e3a5f',
        'kereru-neon': '#00ff9d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
