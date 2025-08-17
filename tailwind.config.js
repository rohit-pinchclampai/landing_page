/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#1E3A8A",
        secondary: "#2563EB",
        accent: "#F59E0B",
        bgLight: "#F9FAFB",
        cardBg: "#FFFFFF",
        textGray: "#4B5563",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
      animation: {
        fadeUp: "fadeUp 0.8s ease forwards",
        fadeIn: "fadeIn 1s ease forwards",
        slideIn: "slideIn 1s ease forwards",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: 0, transform: "translateY(20px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        slideIn: { "0%": { opacity: 0, transform: "translateX(-30px)" }, "100%": { opacity: 1, transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
