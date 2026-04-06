import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F2341',
          50: '#E8EBF0',
          100: '#C5CCD8',
          200: '#8A99B1',
          300: '#50668A',
          400: '#2F4466',
          500: '#0F2341',
          600: '#0C1C34',
          700: '#091527',
          800: '#060E1A',
          900: '#03070D',
        },
        teal: {
          DEFAULT: '#1A8A7D',
          50: '#E8F5F3',
          100: '#D1EBE7',
          200: '#A3D7CF',
          300: '#75C3B7',
          400: '#47AF9F',
          500: '#1A8A7D',
          600: '#156E64',
          700: '#10534B',
          800: '#0B3732',
          900: '#051C19',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
