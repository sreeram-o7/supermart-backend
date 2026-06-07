/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#e8f4fd',
          100: '#b5d4f4',
          200: '#85b7eb',
          300: '#378add',
          400: '#185fa5',
          500: '#1e3a5f',
          600: '#0c447c',
          700: '#042c53',
        },
        success: '#27ae60',
        warning: '#e67e22',
        danger:  '#e74c3c',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}