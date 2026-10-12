import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#070910',
        panel: '#101624',
        ink: '#e8edf7',
        mute: '#8b95ab',
        gold: '#e8c36a',
        arc: '#5ce1e6',
        iron: '#e23d3d',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: '0 0 40px rgba(232, 195, 106, 0.12)',
        arc: '0 0 28px rgba(92, 225, 230, 0.18)',
      },
    },
  },
  plugins: [],
};

export default config;
