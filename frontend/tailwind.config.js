/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8f0',
          100: '#ffe5db',
          200: '#ffccbc',
          300: '#ffab91',
          400: '#ff8a65',
          500: '#ff5722',
          600: '#f4511e',
          700: '#e64a19',
          800: '#d84315',
          900: '#bf360c',
        },
        accent: {
          50: '#fff8f0',
          100: '#ffece4',
          200: '#ffccbc',
          300: '#ffb39c',
          400: '#ff9d80',
          500: '#ffccbc',
        },
        surface: {
          50: '#fff8f0',
          100: '#ffece4',
          200: '#ffccbc',
        },
        ink: {
          50: '#fff8ef',
          100: '#fde7d2',
          200: '#f7cfad',
          300: '#d8b28d',
          400: '#9f7b58',
          500: '#7b5a3d',
          600: '#65472d',
          700: '#4c3420',
          800: '#352314',
          900: '#24170c',
          950: '#1a1008',
        },
        success: {
          50: '#f8fff3',
          100: '#dcf5c8',
          700: '#5f8a1f',
          800: '#4a6b18',
        },
      },
      boxShadow: {
        glow: '0 18px 45px rgba(255, 87, 34, 0.28)',
        soft: '0 16px 45px rgba(255, 87, 34, 0.14)',
        float: '0 24px 70px rgba(255, 87, 34, 0.18)',
      },
      backgroundImage: {
        'hero-warm': 'linear-gradient(180deg, #FFF8F0 0%, #FFE5DB 45%, #FFF8F0 100%)',
      },
    },
  },
  plugins: [],
}
