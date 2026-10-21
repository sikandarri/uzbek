export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#153c36',
        teal: { 50: '#edf8f4', 100: '#d9eee5', 500: '#157c6c', 700: '#126454' },
        amber: { 100: '#f8edca', 500: '#ecbd53' },
        paper: '#f8f7f2',
      },
      fontFamily: { sans: ['DM Sans', 'Segoe UI', 'ui-sans-serif', 'system-ui', 'sans-serif'], display: ['Manrope', 'DM Sans', 'Segoe UI', 'sans-serif'] },
    },
  },
  plugins: [],
};
