import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2B2B2B",
        coral: "#C3272B",
        mist: "#F7F3EB",
        moss: "#4A7C59",
        teal: "#2F5D62",
        gold: "#C9A96E",
        paper: "#FFFFFF",
        line: "#E5DFD3",
        failure: "#A3320B"
      }
    }
  },
  plugins: []
};
export default config;
