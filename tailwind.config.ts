import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        beige: { DEFAULT: "#d2b48c", dark: "#a98a5f", light: "#f3ead9" },
        verde: { DEFAULT: "#4caf50", dark: "#2e7d32", light: "#e3f3e4" },
      },
    },
  },
  plugins: [],
};
export default config;
