/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "outline-variant": "#5e3f3c",
        "tertiary-container": "#71716d",
        "inverse-primary": "#c00014",
        "primary-fixed": "#ffdad6",
        "tertiary-fixed-dim": "#c7c6c2",
        "on-surface-variant": "#e7bcb8",
        "surface-tint": "#ffb4ab",
        "surface-container": "#211f1f",
        "outline": "#ae8883",
        "surface": "#141313",
        "primary": "#ffb4ab",
        "surface-container-low": "#1d1b1b",
        "surface-variant": "#363434",
        "on-primary-container": "#fff4f3",
        "on-primary-fixed": "#410002",
        "primary-fixed-dim": "#ffb4ab",
        "inverse-on-surface": "#323030",
        "on-error": "#690005",
        "surface-dim": "#141313",
        "inverse-surface": "#e6e1e1",
        "on-background": "#e6e1e1",
        "on-secondary-fixed-variant": "#464744",
        "on-error-container": "#ffdad6",
        "secondary-fixed": "#e3e3dd",
        "background": "#141313",
        "surface-container-high": "#2b2a29",
        "on-primary-fixed-variant": "#93000d",
        "on-secondary-container": "#b8b9b4",
        "on-surface": "#e6e1e1",
        "on-secondary": "#2f312e",
        "surface-bright": "#3b3939",
        "secondary-container": "#484946",
        "tertiary-fixed": "#e4e2de",
        "on-tertiary-fixed": "#1b1c19",
        "error-container": "#93000a",
        "error": "#ffb4ab",
        "surface-container-highest": "#363434",
        "on-secondary-fixed": "#1a1c19",
        "on-tertiary-fixed-variant": "#464744",
        "surface-container-lowest": "#0f0e0e",
        "secondary-fixed-dim": "#c7c7c2",
        "on-primary": "#690006",
        "on-tertiary-container": "#f8f6f1",
        "primary-container": "#e0141f",
        "on-tertiary": "#30312e",
        "tertiary": "#c7c6c2",
        "secondary": "#c7c7c2"
      },
      borderRadius: {
        DEFAULT: "0px",
        lg: "0px",
        xl: "0px",
        full: "9999px"
      },
      spacing: {
        "stack-tight": "8px",
        "unit": "4px",
        "margin-desktop": "64px",
        "stack-loose": "48px",
        "gutter": "24px",
        "margin-mobile": "16px"
      },
      fontFamily: {
        "headline-xl": ["'Bebas Neue'", "'Black Ops One'", "sans-serif"],
        "headline-lg": ["'Bebas Neue'", "'Black Ops One'", "sans-serif"],
        "headline-md": ["'Bebas Neue'", "sans-serif"],
        "label-caps": ["'Hanken Grotesk'", "sans-serif"],
        "body-lg": ["'Hanken Grotesk'", "sans-serif"],
        "body-md": ["'Hanken Grotesk'", "sans-serif"],
        "accent-tag": ["'Bricolage Grotesque'", "sans-serif"],
        "stencil": ["'Black Ops One'", "'Saira Stencil One'", "system-ui"],
        "marker": ["'Permanent Marker'", "cursive"],
        "graffiti": ["'Wallpoet'", "'Permanent Marker'", "sans-serif"]
      },
      fontSize: {
        "headline-xl": ["80px", { lineHeight: "80px", letterSpacing: "0.02em", fontWeight: "700" }],
        "headline-lg": ["48px", { lineHeight: "48px", letterSpacing: "0.02em", fontWeight: "700" }],
        "headline-md": ["32px", { lineHeight: "32px", letterSpacing: "0.05em", fontWeight: "700" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "accent-tag": ["18px", { lineHeight: "20px", fontWeight: "800" }]
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'spray-drift': 'sprayDrift 8s infinite alternate ease-in-out',
        'glitch': 'glitch 0.3s ease-in-out infinite'
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(1.08)' }
        },
        sprayDrift: {
          '0%': { transform: 'rotate(-12deg) translateY(0px)' },
          '100%': { transform: 'rotate(-8deg) translateY(-15px)' }
        }
      }
    },
  },
  plugins: [],
}
