/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f7f5fd",
          100: "#efe9fb",
          200: "#ddd1f6",
          300: "#c3aeef",
          400: "#a883e3",
          500: "#8b5fd6",
          600: "#7440c2",
          700: "#5f31a1",
          800: "#4d2882",
          900: "#3d2168",
        },
        accent: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
        },
      },
    },
  },
  plugins: [],
};
