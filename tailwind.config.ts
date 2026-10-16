import defaultTheme from 'tailwindcss/defaultTheme';
import allColors from 'tailwindcss/colors';

// Tailwind v3 still exposes renamed palettes as warning-emitting getters, so
// copy only the current palette names instead of spreading the whole object.
const renamed = new Set(['lightBlue', 'warmGray', 'trueGray', 'coolGray', 'blueGray']);
const colors = Object.fromEntries(
  Object.keys(allColors)
    .filter((name) => !renamed.has(name))
    .map((name) => [name, allColors[name as keyof typeof allColors]])
);

module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    'src/app/**/*.{js,ts,jsx,tsx,mdx,json}',
    'src/components/**/*.{js,ts,jsx,tsx,mdx,json}',
  ],
  theme: {
    colors: {
      primary: 'rgb(var(--color-primary) / <alpha-value>)',
      secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
      foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
      content: 'rgb(var(--color-content) / <alpha-value>)',
      subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
      'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
      background: 'rgb(var(--color-background) / <alpha-value>)',
      'background-tertiary': 'rgb(var(--color-background-tertiary) / <alpha-value>)',
      border: 'rgb(var(--color-border) / <alpha-value>)',
      input: 'rgb(var(--color-input) / <alpha-value>)',
      muted: 'rgb(var(--color-muted) / <alpha-value>)',
      ...colors,
    },
    screens: {
      xs: '390px',
      sm: '435px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      animation: {
        reveal: 'reveal 0.7s ease-in-out',
        'quote-pop': 'quote-pop 500ms cubic-bezier(0.34,1.45,0.64,1) both',
        'node-ripple': 'node-ripple 700ms ease-in-out both',
        'node-flash': 'node-flash 700ms ease-in-out both',
        'node-dot-flash': 'node-dot-flash 700ms ease-in-out both',
        'event-slide-in': 'event-slide-in 280ms cubic-bezier(0.22,1,0.36,1) both',
        'event-slide-out': 'event-slide-out 280ms cubic-bezier(0.22,1,0.36,1) both',
        'event-icon-in': 'event-icon-in 220ms cubic-bezier(0.22,1,0.36,1) both',
        'event-icon-out': 'event-icon-out 160ms ease-in both',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-geist-mono)', ...defaultTheme.fontFamily.mono],
        serif: ['var(--font-cormorant)', ...defaultTheme.fontFamily.serif],
      },
      fontSize: {
        'page-title': ['30px', { lineHeight: '1.2' }],
        'page-title-lg': ['36px', { lineHeight: '1.2' }],
        'section-title': ['20px', { lineHeight: '1.4' }],
        'card-title': ['16px', { lineHeight: '1.5' }],
        body: ['14px', { lineHeight: '1.75' }],
        caption: ['12px', { lineHeight: '1.5' }],
        stat: ['30px', { lineHeight: '1.2' }],
        quote: ['18px', { lineHeight: '1.5' }],
      },
      keyframes: {
        'quote-pop': {
          from: { transform: 'translateY(8px)', opacity: '0', filter: 'blur(2px)' },
          to: { transform: 'translateY(0)', opacity: '1', filter: 'blur(0)' },
        },
        'node-ripple': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '20%': { opacity: '0.6' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
        'node-flash': {
          '0%, 100%': { color: 'rgb(var(--color-foreground) / 0.6)' },
          '20%': { color: 'rgb(var(--color-primary))' },
        },
        'node-dot-flash': {
          '0%, 100%': { backgroundColor: 'rgb(var(--color-foreground) / 0.25)' },
          '20%': { backgroundColor: 'rgb(var(--color-primary))' },
        },
        'event-slide-in': {
          from: { opacity: '0.65', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'event-slide-out': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(-100%)' },
        },
        'event-icon-in': {
          from: { opacity: '0', transform: 'scale(0.55)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'event-icon-out': {
          from: { opacity: '1', transform: 'scale(1)' },
          to: { opacity: '0', transform: 'scale(0.55)' },
        },
        reveal: {
          '0%': {
            opacity: 0,
            filter: 'brightness(1) blur(15px)',
            scale: '1.0125',
          },
          '10%': { opacity: 1, filter: 'brightness(1.25) blur(10px)' },
          '100%': { opacity: 1, filter: 'brightness(1) blur(0)', scale: '1' },
        },
      },
      lineHeight: {
        slacker: '1.75',
      },
      gridTemplateRows: {
        'max-1': 'repeat(1, minmax(0, max-content))',
      },
      height: {
        'dynamic-screen': '100dvh',
      },
      minHeight: {
        'dynamic-screen': '100dvh',
      },
      maxHeight: {
        'dynamic-screen': '100dvh',
      },
    },
  },
  plugins: [require('@tailwindcss/container-queries'), require('tailwindcss-animate')],
  future: {
    hoverOnlyWhenSupported: true,
  },
};

// import type { Config } from "tailwindcss";

// const config = {
//   darkMode: ["class", '[data-theme="dark"]'],
//   content: [
//     "src/app/**/*.{js,ts,jsx,tsx,mdx,json}",
//     "src/components/**/*.{js,ts,jsx,tsx,mdx,json}",
//   ],
//   prefix: "",
//   theme: {
//     container: {
//       center: true,
//       padding: "2rem",
//       screens: {
//         "2xl": "1400px",
//       },
//     },

//     colors: {
//       white: "var(--white)",
//       border: "rgb(var(--border) / <alpha-value>)",
//       input: "rgb(var(--input) / <alpha-value>)",
//       ring: "rgb(var(--ring) / <alpha-value>)",
//       background: "rgb(var(--background) / <alpha-value>)",
//       foreground: "rgb(var(--foreground) / <alpha-value>)",
//       primary: {
//         DEFAULT: "rgb(var(--primary) / <alpha-value>)",
//         foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
//       },
//       secondary: {
//         DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
//         foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
//       },
//       destructive: {
//         DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
//         foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
//       },
//       muted: {
//         DEFAULT: "rgb(var(--muted) / <alpha-value>)",
//         foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
//       },
//       accent: {
//         DEFAULT: "rgb(var(--accent) / <alpha-value>)",
//         foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
//       },
//       popover: {
//         DEFAULT: "rgb(var(--popover) / <alpha-value>)",
//         foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
//       },
//       card: {
//         DEFAULT: "rgb(var(--card) / <alpha-value>)",
//         foreground: "rgb(var(--card-foreground) / <alpha-value>)",
//       },
//     },
//     borderRadius: {
//       lg: "var(--radius)",
//       md: "calc(var(--radius) - 2px)",
//       sm: "calc(var(--radius) - 4px)",
//     },
//     keyframes: {
//       "accordion-down": {
//         from: { height: "0" },
//         to: { height: "var(--radix-accordion-content-height)" },
//       },
//       "accordion-up": {
//         from: { height: "var(--radix-accordion-content-height)" },
//         to: { height: "0" },
//       },
//     },
//     animation: {
//       "accordion-down": "accordion-down 0.2s ease-out",
//       "accordion-up": "accordion-up 0.2s ease-out",
//     },
//   },
//   plugins: [require("tailwindcss-animate")],
// } satisfies Config;

// export default config;
