/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1c2538',
        surface: '#2a3752',
        primary: '#3b82f6',
        foreground: '#ffffff',
        muted: '#dce7f5',
        border: '#3e4c6b'
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
