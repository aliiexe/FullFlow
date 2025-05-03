/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Color palette for dark theme
        dark: {
          DEFAULT: '#1e1e2a',
          light: '#262638',
          lighter: '#32324a',
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        'shimmer': {
          '0%': {
            transform: 'translateX(-150%) skewX(-12deg)',
          },
          '100%': {
            transform: 'translateX(150%) skewX(-12deg)',
          },
        },
        'pulse-glow': {
          '0%, 100%': {
            opacity: 0.4,
          },
          '50%': {
            opacity: 0.7,
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-3px)',
          },
        },
        'gradient-shift': {
          '0%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
          '100%': {
            backgroundPosition: '0% 50%',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}