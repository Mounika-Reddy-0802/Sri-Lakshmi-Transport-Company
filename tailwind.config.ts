import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Institutional palette: dependable navy + blue + safety green,
        // with ONE warm school-bus amber reserved for primary CTAs.
        navy: "#2A2E3A",       // brand (from logo) — dominant
        blue: "#1F5F92",       // trust blue — secondary accent / links
        bluesoft: "#E8F0F7",
        green: "#1E8A63",      // safety / positive
        greensoft: "#E5F2EC",
        amber: "#F4A521",      // single warm CTA accent
        amberdark: "#DE9415",
        ambersoft: "#FDF3E0",
        ink: "#2A2E3A",
        muted: "#5C6675",
        mist: "#9AA3AE",
        line: "#E4E8EC",
        haze: "#F4F6F8",
        // legacy aliases so older classes resolve into the new palette
        midnight: "#2A2E3A",
        steel: "#1F5F92",
        slate: "#5C6675",
        fog: "#F4F6F8",
      },
      fontFamily: {
        display: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: { xl2: "1rem" },
      boxShadow: {
        soft: "0 1px 2px rgba(42,46,58,0.04), 0 10px 30px rgba(42,46,58,0.06)",
        card: "0 1px 3px rgba(42,46,58,0.06), 0 12px 28px rgba(42,46,58,0.07)",
        glass: "0 8px 40px rgba(42,46,58,0.16)",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-8px)" } },
      },
      animation: { float: "float 7s ease-in-out infinite" },
    },
  },
  plugins: [],
};
export default config;
