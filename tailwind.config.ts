import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Warm earthy palette evoking the book's tone
        terre: {
          50:  '#faf7f2',
          100: '#f2ebe0',
          200: '#e4d5be',
          300: '#d0b896',
          400: '#bb9670',
          500: '#a87c54',
          600: '#8f6344',
          700: '#724e38',
          800: '#5d4031',
          900: '#4e362b',
        },
        mousse: {
          50:  '#f3f7f0',
          100: '#e3edd9',
          200: '#c6dab4',
          300: '#9ec086',
          400: '#74a35b',
          500: '#548540',
          600: '#416831',
          700: '#345228',
          800: '#2b4223',
          900: '#25381e',
        },
        eau: {
          50:  '#f0f7fa',
          100: '#daedf4',
          200: '#b8daea',
          300: '#85c0da',
          400: '#4ca0c6',
          500: '#3284ad',
          600: '#2b6a93',
          700: '#275779',
          800: '#264865',
          900: '#243d55',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
