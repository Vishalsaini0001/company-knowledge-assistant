/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff8ff",
          100: "#ddf0ff",
          200: "#b3e3ff",
          300: "#78cdff",
          400: "#38b4ff",
          500: "#0d96f2",
          600: "#0076cf",
          700: "#005fa8",
        },
        surface: {
          950: "#030711",
          900: "#070e1a",
          800: "#0c1525",
          700: "#111e30",
          600: "#172540",
          500: "#1e3050",
        },
        border: {
          DEFAULT: "#1e2f4a",
          bright: "#2a4268",
        },
        ink: {
          100: "#eef4ff",
          200: "#c8dbf5",
          300: "#93b5de",
          400: "#628db8",
          500: "#3a6090",
          600: "#284570",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        blink: {
          "0%,100%": { opacity: "0.2" },
          "50%":     { opacity: "1"   },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0"  },
        },
      },
      animation: {
        "fade-up":   "fadeUp 0.35s ease forwards",
        "fade-in":   "fadeIn 0.25s ease forwards",
        "blink":     "blink 1.2s ease-in-out infinite",
        "shimmer":   "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};
