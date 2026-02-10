// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pine: {
          50: '#f2f9f5', // Más sutil, casi blanco
          100: '#e0f2e9',
          200: '#c2e5d3',
          300: '#95d1b3',
          400: '#60b68e',
          500: '#389a72',
          600: '#267c5b', // Nuevo color primario más serio
          700: '#1f634a',
          800: '#1a4f3d',
          900: '#164134', // Sidebar oscuro
          950: '#0c241d',
        },
        slate: {
          850: '#1e293b', // Un gris oscuro específico para UI
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Inter es el estándar de la industria (o Lato si prefieres mantenerla)
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 10px rgba(0, 0, 0, 0.03)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
};