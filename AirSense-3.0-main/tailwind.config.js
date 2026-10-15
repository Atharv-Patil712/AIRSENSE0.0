import colors from 'tailwindcss/colors';

// Theme-aware utility aliases consume the same tokens as charts and panels.
// Generates full 50–950 semantic scales so any utility (bg-, text-, border-) works seamlessly.
const semantic = (token, textToken = token) => ({
  50: `color-mix(in srgb, var(${token}) 6%, var(--color-surface, #ffffff))`,
  100: `color-mix(in srgb, var(${token}) 14%, var(--color-surface, #ffffff))`,
  200: `color-mix(in srgb, var(${token}) 24%, var(--color-surface, #ffffff))`,
  300: `color-mix(in srgb, var(${token}) 38%, var(--color-surface, #ffffff))`,
  400: `var(${textToken})`,
  500: `var(${token})`,
  600: `var(${textToken})`,
  700: `color-mix(in srgb, var(${token}) 75%, #000000)`,
  800: `color-mix(in srgb, var(${token}) 55%, #000000)`,
  900: `color-mix(in srgb, var(${token}) 35%, #000000)`,
  950: `color-mix(in srgb, var(${token}) 18%, #000000)`,
  DEFAULT: `var(${token})`,
});

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // AirSense sky-blue identity; green is reserved for safe conditions.
        primary: colors.sky,
        accent: colors.sky,
        success: semantic('--color-good', '--color-good-text'),
        warning: semantic('--color-moderate', '--color-moderate-text'),
        danger: semantic('--color-critical', '--color-critical-text'),
        error: semantic('--color-critical', '--color-critical-text'),
        info: semantic('--color-primary-bg', '--color-primary-text'),
        prediction: semantic('--color-prediction', '--color-prediction-text'),
        // Modern layered surface tokens
        surface: {
          DEFAULT: 'var(--color-surface)',
          bg: 'var(--color-bg)',
          card: 'var(--color-surface)',
          elevated: 'var(--color-surface-2)',
          border: 'var(--color-border)',
          'border-strong': 'var(--color-border-strong)',
        },
        // ── Cinematic surface (public experience at /) ──
        cinema: {
          bg: '#040711',
          soft: '#090F1E',
          raised: '#0F172A',
          accent: '#38BDF8',
          blue: '#0EA5E9',
          ice: '#E0F2FE',
          indigo: '#818CF8',
          violet: '#C084FC',
          clean: '#34D399',
          warn: '#FBBF24',
          high: '#FB923C',
          severe: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        panel: '14px',
        pill: '9999px',
      },
      letterSpacing: {
        tightest: '-0.035em',
        widest2: '0.12em',
      },
      boxShadow: {
        panel: 'var(--panel-shadow)',
        card: 'var(--panel-shadow)',
        popover:
          '0 12px 32px -4px rgba(0, 0, 0, 0.28), 0 2px 8px -2px rgba(0, 0, 0, 0.16)',
        drawer: '-16px 0 48px rgba(0, 0, 0, 0.35)',
        'glow-primary': '0 0 24px -2px rgba(14, 165, 233, 0.4)',
        'glow-success': '0 0 24px -2px rgba(52, 211, 153, 0.4)',
        'glow-warning': '0 0 24px -2px rgba(251, 191, 36, 0.4)',
        'glow-danger': '0 0 24px -2px rgba(244, 63, 94, 0.4)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.25, 1, 0.5, 1)',
        cinema: 'cubic-bezier(0.22, 1, 0.36, 1)',
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        250: '250ms',
      },
      spacing: {
        18: '4.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-up': 'fadeUp 0.32s cubic-bezier(0.16, 1, 0.3, 1) both',
        'drawer-in': 'drawerIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        'overlay-in': 'overlayIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        drawerIn: {
          from: { transform: 'translateX(24px)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        overlayIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.25)' },
        },
        pulseSubtle: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.03)', opacity: '0.9' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};