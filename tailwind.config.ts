import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#EDEDED",
        card: {
          DEFAULT: "#0A0A0A",
          foreground: "#EDEDED",
          border: "#1C1C1C",
          hover: "#141414",
        },
        popover: {
          DEFAULT: "#0C0C0C",
          foreground: "#EDEDED",
        },
        primary: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#18181B",
          foreground: "#A1A1AA",
        },
        muted: {
          DEFAULT: "#121212",
          foreground: "#71717A",
        },
        accent: {
          DEFAULT: "#27272A",
          foreground: "#FFFFFF",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#10B981",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F59E0B",
          foreground: "#000000",
        },
        border: "#202022",
        input: "#18181A",
        ring: "#FFFFFF",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
