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
        // CUSTOM DISPLAY FONTS
        "display": ["Tushiaeng", "serif"], // English titles
        "display-he": ["Tushia2", "serif"], // Hebrew titles
        // NEUTRAL BODY FONTS
        "body": ["DM Sans", "sans-serif"], // English body
        "body-he": ["Heebo", "sans-serif"], // Hebrew body
      },      
      colors: {
        canvas: "#FBF6F2",
        surface: "#FFFCFA",
        border: "#E9DCD3",
        ink: "#171210",
        "ink-secondary": "#6B5546",
        "ink-muted": "#A38D80",
        accent: "#0030F6",
        "accent-warm": "#472D1E",
      },
      maxWidth: {
        site: "1400px",
      },
      fontSize: {
        "display-sm": ["2.5rem", { lineHeight: "1" }],
        "display-md": ["3.5rem", { lineHeight: "1" }],
        "display-lg": ["4.5rem", { lineHeight: "1" }],
      },
    },
  },
  plugins: [],
};

export default config;