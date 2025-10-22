/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/templates/emails/**/*.hbs",
    "./src/templates/emails/**/*.html"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Desabilitar reset CSS para emails
  },
}