import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0c0c14",
          surface: "#13131f",
          elevated: "#1a1a2e",
          hover: "#1e1e32",
        },
        border: {
          DEFAULT: "#1e1e2e",
          subtle: "#16161f",
          strong: "#2a2a40",
        },
        accent: {
          DEFAULT: "#7c3aed",
          light: "#a78bfa",
          dim: "#7c3aed33",
        },
        ink: {
          DEFAULT: "#f0f0f8",
          muted: "#6b6b85",
          faint: "#3a3a50",
        },
        status: {
          discovery: "#3b82f6",
          progress: "#f59e0b",
          review: "#8b5cf6",
          delivered: "#10b981",
          archived: "#6b7280",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
