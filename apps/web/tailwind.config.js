/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
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
      },
      fontFamily: {
        sans: ["var(--font-montserrat)"],
      },
    },
  },
  plugins: [],
};
