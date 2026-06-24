import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080B14',
        surface: 'rgba(255,255,255,0.05)',
        border: 'rgba(255,255,255,0.08)',
        neon: '#00D4FF',
        purple: '#7C3AED',
        argblue: '#74ACDF',
        textprimary: '#F0F4FF',
        textmuted: '#6B7280',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        'float-fast': 'float 1.5s ease-in-out infinite',
        'pulse-neon': 'pulseNeon 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'blink': 'blink 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 5px #00D4FF, 0 0 10px #00D4FF' },
          '50%': { boxShadow: '0 0 20px #00D4FF, 0 0 40px #00D4FF' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' },
        },
      },
      backdropBlur: { card: '12px' },
      fontFamily: { sans: ['var(--font-inter)', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
