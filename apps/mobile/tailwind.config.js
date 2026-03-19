/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        focuslab: {
          background: "#F0FFF4",
          border: "#B7E4C7",
          primary: "#40916C",
          primaryDark: "#1B4332",
          secondary: "#2D6A4F",
          surface: "#FFFFFF",
        },
        dark: {
          bg: "#0F1A14",
          border: "#2D6A4F",
          surface: "#1A2E23",
          "surface-raised": "#243D2F",
          "text-primary": "#E8F5E9",
          "text-secondary": "#A5D6A7",
        },
      },
      fontFamily: {
        sans: ["Montserrat"],
      },
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
};
