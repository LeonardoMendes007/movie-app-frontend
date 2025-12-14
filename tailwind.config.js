/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Nossa paleta definida
        primary: '#00E0FF',
        secondary: '#7C4DFF',
        dark: {
          900: '#0F0F0F', // Background principal
          800: '#1A1A1A', // Cards
          700: '#242424',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}