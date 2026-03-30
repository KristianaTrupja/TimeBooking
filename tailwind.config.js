/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          keania: ["var(--font-keania-one)", "cursive"],
          anek: ["var(--font-anek-bangla)", "sans-serif"],
        },
        colors: {
          primary: "#244B77", // dark blue
          accent: "#6C99CB",  // hover blue
          light: "#F6F6F6",
          muted: "#E7E7E7",
          success: "#116B16",
        },
        boxShadow: {
          card: "0 2px 8px rgba(0, 0, 0, 0.1)",
          panel: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        spacing: {
          '18': '4.5rem',
          '22': '5.5rem',
        },
        maxWidth: {
          "2/3": "66.666667%",
          "1/3": "33.333333%",
        },
        zIndex: {
          60: "60",
        },
        borderRadius: {
          md: "6px",
          lg: "12px",
          xl: "20px",
        },
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          lg: "3rem",
          xl: "4rem",
        },
      },
    },
    plugins: [],
  };
  