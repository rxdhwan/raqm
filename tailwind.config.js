/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1E40AF", // UAE flag blue
        secondary: "#10B981", // UAE flag green
        accent: "#EF4444", // UAE flag red
        background: "#F9FAFB",
        foreground: "#111827",
      },
    },
  },
  plugins: [],
}
