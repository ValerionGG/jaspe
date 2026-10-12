/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--tint) / <alpha-value>)',
        snow: '#FFFFFF',
        ink: { DEFAULT: 'rgb(var(--ink-900) / <alpha-value>)', 900: 'rgb(var(--ink-900) / <alpha-value>)', 850: 'rgb(var(--ink-850) / <alpha-value>)', 800: 'rgb(var(--ink-800) / <alpha-value>)', 700: 'rgb(var(--ink-700) / <alpha-value>)', 600: 'rgb(var(--ink-600) / <alpha-value>)', 500: 'rgb(var(--ink-500) / <alpha-value>)' },
        bone: { DEFAULT: 'rgb(var(--bone-200) / <alpha-value>)', 50: 'rgb(var(--bone-50) / <alpha-value>)', 100: 'rgb(var(--bone-100) / <alpha-value>)', 200: 'rgb(var(--bone-200) / <alpha-value>)', 300: 'rgb(var(--bone-300) / <alpha-value>)', 400: 'rgb(var(--bone-400) / <alpha-value>)' },
        mist: { DEFAULT: 'rgb(var(--mist-500) / <alpha-value>)', 300: 'rgb(var(--mist-300) / <alpha-value>)', 400: 'rgb(var(--mist-400) / <alpha-value>)', 500: 'rgb(var(--mist-500) / <alpha-value>)', 600: 'rgb(var(--mist-600) / <alpha-value>)', 700: 'rgb(var(--mist-700) / <alpha-value>)' },
        champagne: { DEFAULT: 'rgb(var(--acc-500) / <alpha-value>)', 300: 'rgb(var(--acc-300) / <alpha-value>)', 400: 'rgb(var(--acc-400) / <alpha-value>)', 500: 'rgb(var(--acc-500) / <alpha-value>)', 600: 'rgb(var(--acc-600) / <alpha-value>)', 700: 'rgb(var(--acc-700) / <alpha-value>)' },
        sea: { DEFAULT: 'rgb(var(--sea) / <alpha-value>)', 600: 'rgb(var(--sea-600) / <alpha-value>)', 800: 'rgb(var(--sea-800) / <alpha-value>)' },
        sage: { DEFAULT: 'rgb(var(--sage) / <alpha-value>)', 600: 'rgb(var(--sage-600) / <alpha-value>)' },
        coral: { DEFAULT: 'rgb(var(--coral) / <alpha-value>)' },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: { tightest: '-0.045em', eyebrow: '0.22em' },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.32,0.72,0,1)',
        expo: 'cubic-bezier(0.16,1,0.3,1)',
        quart: 'cubic-bezier(0.76,0,0.24,1)',
      },
      boxShadow: {
        bezel: 'var(--sh-bezel)',
        float: 'var(--sh-float)',
        soft: '0 24px 60px -24px rgba(40,30,15,0.22)',
        glow: '0 0 0 1px rgb(var(--acc-500) / 0.25), 0 10px 40px -10px rgb(var(--acc-500) / 0.4)',
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        pulseRing: { '0%': { transform: 'scale(.6)', opacity: '.8' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
        shimmer: { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        scan: { '0%': { transform: 'translateY(-10%)' }, '100%': { transform: 'translateY(1100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        wave: { '0%,100%': { transform: 'scaleY(.35)' }, '50%': { transform: 'scaleY(1)' } },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        pulseRing: 'pulseRing 2.2s cubic-bezier(0.16,1,0.3,1) infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        scan: 'scan 3.2s cubic-bezier(0.76,0,0.24,1) infinite',
        float: 'float 6s cubic-bezier(0.45,0,0.55,1) infinite',
        wave: 'wave 1.1s cubic-bezier(0.45,0,0.55,1) infinite',
      },
    },
  },
  plugins: [],
}
