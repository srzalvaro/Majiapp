import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        titulo: ["Fraunces", "Georgia", "serif"],
        cuerpo: ["Nunito", "system-ui", "sans-serif"],
      },
      colors: {
        beige: { DEFAULT: "#d2b48c", dark: "#a98a5f", light: "#f3ead9" },
        ciruela: { DEFAULT: "#4b2a3d", claro: "#6d3a4a" },
        calabaza: { DEFAULT: "#e0592a", claro: "#f08a2b" },
        mostaza: { DEFAULT: "#f2cf8a", oscuro: "#5a3a10" },
        crema: "#fbf0e4",
        verde: { DEFAULT: "#4caf50", dark: "#2e7d32", light: "#e3f3e4" },
      },
    },
  },
  plugins: [],
};
export default config;
