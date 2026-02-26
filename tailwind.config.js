/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
  display: ['"Playfair Display"', 'Georgia', 'serif'],
  gothic: ['"UnifrakturMaguntia"', 'serif'], 
  sans: ['"DM Sans"', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
},
      colors: {
        ink:      '#111010',
        paper:    '#faf8f4',
        warm:      '#f2ede4',
        accent:    '#c0392b',
        accent2:   '#96281b',
        muted:     '#7a7268',
        border:    '#e2ddd6',
      },
    },
  },
  plugins: [],
}