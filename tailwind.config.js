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
        backgroundLight: '#F8FAFC',
        backgroundDark: '#090D16',
        primary: '#3B82F6',
        urgent: '#EF4444',
        task: '#10B981',
      }
    },
  },
  plugins: [],
}
