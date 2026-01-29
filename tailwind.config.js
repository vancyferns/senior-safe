/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We will force light mode, but keeping class strategy is good practice.
  theme: {
    extend: {
      colors: {
        'brand-blue': '#3B82F6',   // High visibility Blue
        'brand-green': '#10B981',  // Success Green
        'bg-surface': '#F8FAFC',   // Lightest Slate
      },
      fontSize: {
        'xxs': '0.65rem',
      },
    },
  },
  plugins: [],
}
