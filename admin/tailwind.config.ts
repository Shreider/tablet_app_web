import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#060d17',
        surface: '#0d1929',
        primary: '#2567bc',
        foreground: '#eaf3ff',
        muted: '#a6bbdb',
        border: '#2b425f'
      },
      boxShadow: {
        panel: '0 16px 38px rgba(8, 15, 33, 0.36)'
      },
      borderRadius: {
        panel: '22px',
        card: '14px'
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' }
        },
        popIn: {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.985)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fadeIn 180ms ease-out',
        'pop-in': 'popIn 220ms ease-out'
      }
    }
  },
  plugins: []
};

export default config;
