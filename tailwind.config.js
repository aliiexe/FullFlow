module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
      './app/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#5046e5',
            dark: '#4035c6',
          },
          secondary: {
            DEFAULT: '#ff6b6b',
          },
          accent: {
            DEFAULT: '#ffd166',
          },
          dark: {
            DEFAULT: '#0f0e17',
            light: '#1e1b36',
          },
        },
        animation: {
          'float': 'float 6s ease-in-out infinite',
        },
        keyframes: {
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          }
        }
      },
    },
    plugins: [require('@tailwindcss/typography')],
    
  }