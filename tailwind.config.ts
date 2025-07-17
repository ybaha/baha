import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';

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
      },
      fontFamily: {
        sans: ['Geist', ...defaultTheme.fontFamily.sans],
        mono: ['Jetbrains Mono', ...defaultTheme.fontFamily.mono],
        serif: ['Cormorant Garamond', ...defaultTheme.fontFamily.serif],
      },
      keyframes: {
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
