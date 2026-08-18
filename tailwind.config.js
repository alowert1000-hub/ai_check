/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: "#FFF6F0",
        blush: "#FFD6E0",
        peach: "#FFD8C2",
        mint: "#C8EDE0",
        lilac: "#E0D4F7",
        sky: "#D6ECFF",
        lemon: "#FFF1B8",
        ink: "#3D2C2E",
        muted: "#8A6E72",
        rose: "#F2789F",
        coral: "#FF8B7B",
      },
    },
  },
  plugins: [],
};
