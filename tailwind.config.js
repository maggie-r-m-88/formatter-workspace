/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/components/**/*.{js,vue,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/plugins/**/*.{js,ts}",
    "./app/app.vue",
    "./app/error.vue",
  ],
  theme: {
    extend: {
      colors: {
        // Add your custom colors here
        // Example: custom color palette
        'theme-green': {
          50: '#EBF7F4',
          100: '#D6EFE6',
          200: '#ABE6CE',
          300: '#81DDB5',
          400: '#5AC69F',
          500: '#41A67E', // your main green
          600: '#38916F',
          700: '#2E7B5F',
          800: '#23664F',
          900: '#1B5040',
        },
        'theme-blue': {
          50: '#E6EEFB',
          100: '#CCE0F7',
          200: '#99C1F0',
          300: '#66A3E9',
          400: '#3384E2',
          500: '#1055C9', // your main blue
          600: '#0E49AB',
          700: '#0B3B8C',
          800: '#082E6D',
          900: '#061F4F',
        },
        'theme-yellow': {
          50: '#FEF9EB',
          100: '#FDF3D6',
          200: '#FAE5AB',
          300: '#F7D980',
          400: '#F4CC5A',
          500: '#E5C95F',
          600: '#D1B950',
          700: '#BFA240',
          800: '#A48E33',
          900: '#897226',
        },
        // Or simple custom colors
        'brand-primary': '#3b82f6',
        'brand-secondary': '#10b981',
        'brand-accent': '#8b5cf6',
      },
      // You can also extend other theme properties
      fontFamily: {
        // 'custom': ['Your Font', 'sans-serif'],
      },
      spacing: {
        // '128': '32rem',
      },
    },
  },
  plugins: [],
}

