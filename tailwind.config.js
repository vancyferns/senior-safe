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
        // SeniorSafe "Trust & Clarity" Palette - Optimized for Accessibility
        'brand-blue': '#1E40AF',      // Royal Blue - Primary action buttons (high contrast)
        'brand-green': '#059669',     // Emerald Green - Success states
        'brand-red': '#DC2626',       // Signal Red - Error/Alert states
        'text-primary': '#0F172A',    // Deep Slate - Main text
        'text-secondary': '#475569',  // Graphite - Secondary text
        'surface': '#FFFFFF',         // Pure White - Main background
        'surface-alt': '#F1F5F9',     // Soft Gray - Card backgrounds
      },
      fontSize: {
        'xxs': '0.65rem',
      },
    },
  },
  plugins: [],
}
