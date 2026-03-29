/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'azul-escuro': '#132638',
        'azul-claro': '#4AB3FC',
        'amarelo-canaa': '#E5DD28',
        'cinza-fundo': '#F4F7F9',
        'cinza-texto': '#505962',
        'verde': '#28a745',
        'vermelho': '#E53E3E',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
