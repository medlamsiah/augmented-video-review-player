/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        secure: {
          cyan: "#22d3ee",
          violet: "#a78bfa",
          green: "#34d399",
          ink: "#020617"
        }
      }
    }
  },
  plugins: []
};
