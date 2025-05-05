import type { Configuration } from 'webpack';
import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  webpack: (config: Configuration) => {
    if (config.module && config.module.rules) {
      config.module.rules.push({
        test: /gsap-trial\/src\/DrawSVGPlugin/,
        loader: 'string-replace-loader',
        options: {
          search: /this\.getDefaultDisplay\(\)/,
          replace:
            'function() { try { return this.getDefaultDisplay() } catch (e) { return "0px 0px" } }()',
        },
      });
    }
    return config;
  },
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#070014',
      },
      animation: {
        'text-slide': 'text-slide 15s linear infinite',
      },
      keyframes: {
        'text-slide': {
          '0%, 16.66%': {
            transform: 'translateY(0%)',
          },
          '16.67%, 33.33%': {
            transform: 'translateY(-16.67%)',
          },
          '33.34%, 50%': {
            transform: 'translateY(-33.34%)',
          },
          '50.01%, 66.66%': {
            transform: 'translateY(-50.01%)',
          },
          '66.67%, 83.33%': {
            transform: 'translateY(-66.67%)',
          },
          '83.34%, 100%': {
            transform: 'translateY(-83.34%)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;