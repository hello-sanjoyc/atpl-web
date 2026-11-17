import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F5F0E8",
        "bg-alt": "#ECE6D9",
        dark: "#1C1308",
        darker: "#100C05",
        accent: "#C4813A",
        "accent-light": "#E8A94D",
        sage: "#3A5444",
        muted: "#7A6E5F",
      },
      fontFamily: {
        sans: ["var(--sans)", "system-ui", "sans-serif"],
        serif: ["var(--serif)", "Georgia", "serif"],
      },
    },
  },
  plugins: [forms],
};

export default config;
