/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090d16',
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        mc: {
          green: '#22c55e',
          red: '#ef4444',
          gold: '#f59e0b',
          cyan: '#06b6d4',
          purple: '#a855f7',
        },
        discord: {
          blurple: '#5865F2',
          dark: '#313338',
          darker: '#2b2d31',
          darkest: '#1e1f22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
