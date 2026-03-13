/** @type {import('tailwindcss').Config} */
const forms = require('@tailwindcss/forms');

module.exports = {
    content: [
        './index.html',
        './src/**/*.{ts,tsx,js,jsx}',
    ],
    darkMode: 'class', // ativa o dark mode via classe .dark
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: '#0284c7',        // sky-600
                'primary-dark': '#0369a1', // sky-700
                'background-light': '#f8fafc', // slate-50
                'background-dark': '#0f172a',  // slate-900
            },
        },
    },
    plugins: [
        forms, // ativa estilos default para inputs, selects, checkboxes
    ],
};