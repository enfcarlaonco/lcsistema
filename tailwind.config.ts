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
        brand: {
          50:  '#E6F1FB',
          100: '#B5D4F4',
          200: '#85B7EB',
          400: '#378ADD',
          600: '#185FA5',
          800: '#0C447C',
          900: '#042C53',
        },
        success: {
          50:  '#EAF3DE',
          600: '#3B6D11',
        },
        warning: {
          50:  '#FAEEDA',
          600: '#854F0B',
        },
        danger: {
          50:  '#FCEBEB',
          600: '#A32D2D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

export default config
