import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        forest: {
          900: '#072118', // Used in pressed states
          800: '#0B3023', // Used in hover states
          DEFAULT: '#0F3F2E', // Primary Base
        },
        emerald: {
          DEFAULT: '#14533D', // Accent
        },
        mint: {
          DEFAULT: '#E8F3EE', // Surface
        },
        slate: {
          900: '#111827', // Slate Dark
          600: '#4B5563', // Slate Medium
          400: '#9CA3AF', // Text Muted
        },
        border: {
          DEFAULT: '#E2E8E0', // Borders
          success: '#D1E7DD',
          destructive: '#FEE2E2',
        },
        semantic: {
          threat: {
            text: '#B91C1C',
            bg: '#FEF2F2',
          },
          warning: {
            text: '#B45309',
            bg: '#FFFBEB',
          },
          positive: {
            text: '#15803D',
            bg: '#F0FDF4',
          },
        },
        background: '#F9FAF8', // Level 0 Base Ground
        surface: '#FFFFFF', // Level 1 Elevated Cards
      },
      borderRadius: {
        none: '0',
        sm: '4px',
        md: '8px', // Control radius
        lg: '16px', // Card radius
        full: '9999px', // Pills
      },
      boxShadow: {
        card: '0px 1px 3px rgba(15, 63, 46, 0.04), 0px 4px 12px rgba(15, 63, 46, 0.03)', // Level 1
        dropdown: '0px 4px 6px rgba(15, 63, 46, 0.04), 0px 12px 24px rgba(15, 63, 46, 0.06)', // Level 2
        modal: '0px 20px 48px rgba(15, 63, 46, 0.12), 0px 8px 16px rgba(15, 63, 46, 0.06)', // Level 3
      },
    },
  },
  plugins: [],
}
export default config
