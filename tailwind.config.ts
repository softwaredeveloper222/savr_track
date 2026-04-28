import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Status colors used dynamically
    "bg-emerald-100", "text-emerald-700", "text-emerald-800", "border-emerald-200", "bg-emerald-500",
    "bg-amber-100", "text-amber-700", "text-amber-800", "border-amber-200", "bg-amber-500",
    "bg-red-100", "text-red-700", "text-red-800", "border-red-200", "bg-red-500",
    "bg-blue-100", "text-blue-700", "text-blue-800", "border-blue-200", "bg-blue-500",
    "bg-purple-100", "text-purple-700", "text-purple-800", "border-purple-200", "bg-purple-500",
    "bg-slate-100", "text-slate-600", "border-slate-200",
    "bg-teal-500", "bg-teal-600", "bg-teal-700", "bg-teal-50", "bg-teal-100",
    "text-teal-600", "text-teal-700", "text-teal-800", "border-teal-200", "border-teal-500",
    "bg-indigo-500", "bg-rose-500", "bg-cyan-500",
    // Dynamic border colors for deadline rows
    "border-l-emerald-500", "border-l-amber-500", "border-l-red-500", "border-l-blue-500",
    "border-l-purple-500", "border-l-slate-400", "border-l-teal-500",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
          950: "#042f2e",
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      boxShadow: {
        "soft": "0 2px 15px -3px rgba(0, 0, 0, 0.04), 0 2px 6px -2px rgba(0, 0, 0, 0.03)",
        "card": "0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.03)",
        "elevated": "0 10px 40px -10px rgba(0, 0, 0, 0.08), 0 4px 15px -3px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
export default config;
