import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F6F8FB",
        surface: "#FFFFFF",
        navy: "#10233F",
        muted: "#64748B",
        border: "#E2E8F0",
        teal: "#0F8B8D",
        blue: "#2563EB",
        orange: "#F59E0B",
        green: "#16A34A",
        purple: "#7C3AED",
        negative: "#DC2626",
        positive: "#059669",
        warning: "#D97706"
      },
      boxShadow: {
        card: "0 6px 18px rgba(16, 35, 63, 0.06)"
      },
      borderRadius: {
        card: "18px"
      }
    },
  },
  plugins: [],
};

export default config;
