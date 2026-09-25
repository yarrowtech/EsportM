// export default {
//   darkMode: "class",
//   content: ["./index.html", "./src/**/*.{ts,tsx}"],
//   theme: {
//     extend: {
//       colors: {
//         bg: "#e0e5ec",
//         accent: "#2563eb",
//         primaryPanel: "#5b5ea9",
//         primaryPanelDark: "#2c2f66",
//         softText: "#1f2937",
//       },
//       boxShadow: {
//         neu: "8px 8px 16px #c8ccd1, -8px -8px 16px #ffffff",
//         "neu-inset": "inset 4px 4px 8px #c8ccd1, inset -4px -4px 8px #ffffff",
//       },
//     },
//   },
//   plugins: [],
// };















/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Onest", "sans-serif"],
        display: ["Onest", "sans-serif"],
        serif: ["Onest", "sans-serif"],
        mono: ["Onest", "sans-serif"],
      },
      colors: {
        background: "var(--bg-color)",
        surface: "var(--surface-color)",
        primary: "var(--primary-color)",
        textMain: "var(--text-main)",
        textMuted: "var(--text-muted)",
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '1.75rem',
        '3xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
