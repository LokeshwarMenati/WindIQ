/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        windiq: {
          bg: '#091322',
          panel: '#122337',
          panelHover: '#172c45',
          card: '#0f1d2e',
          border: '#1e334d',
          borderLight: '#284566',
          mint: '#42DDB2',
          'mint-dark': '#2ebd94',
          'mint-light': '#66e4c1',
          electric: '#78A8FF',
          'electric-dark': '#558df5',
          textMuted: '#8FA5BE',
          danger: '#FF6B6B',
          warning: '#FFB84D',
          amber: '#F59E0B',
          purple: '#A78BFA'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'glow-mint': '0 0 20px -5px rgba(66, 221, 178, 0.3)',
        'glow-electric': '0 0 20px -5px rgba(120, 168, 255, 0.3)',
        'panel': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
