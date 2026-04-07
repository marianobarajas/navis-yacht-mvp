import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        teal: {
          DEFAULT: "#1e4a52",
          hover: "#1a3d44",
        },
        navy: {
          DEFAULT: "#1e4a52",
          hover: "#1a3d44",
        },
        slate: {
          DEFAULT: "#5c656d",
        },
        ocean: {
          salmon: "#c48c72",
          "dusty-rose": "#b67b8a",
          "muted-teal": "#5a8f8f",
          charcoal: "#36424b",
          coral: "#d94a4a",
          peacock: "#1e4a52",
          sand: "#e8dcc8",
          brown: "#8b7355",
          "dusty-blue": "#b8cbd4",
          primary: "#1e4a52",
          "primary-dark": "#1a3d44",
          teal: "#5a8f8f",
          success: "#5a8f8f",
          cream: "#e8dcc8",
        },
        apple: {
          bg: "var(--apple-bg)",
          "bg-elevated": "var(--apple-bg-elevated)",
          accent: "var(--apple-accent)",
          "accent-hover": "var(--apple-accent-hover)",
        },
      },
      borderRadius: {
        apple: "var(--apple-radius)",
        "apple-lg": "var(--apple-radius-lg)",
        "apple-xl": "var(--apple-radius-xl)",
      },
      boxShadow: {
        apple: "var(--apple-shadow)",
        "apple-lg": "var(--apple-shadow-lg)",
      },
    },
  },
  plugins: [],
};
export default config;
