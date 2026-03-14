import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        portal: {
          ink: "#13343B",
          line: "#CBD5E1",
          mist: "#F8FAFC",
          soft: "#EEF4F7",
          accent: "#D97706",
          success: "#0F766E",
          alert: "#B91C1C"
        }
      },
      boxShadow: {
        sheet: "0 18px 50px rgba(19, 52, 59, 0.08)"
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
