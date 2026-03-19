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
    "bg-indigo-500", "bg-rose-500", "bg-cyan-500",
    // Dynamic border colors for deadline rows
    "border-l-emerald-400", "border-l-amber-400", "border-l-red-400", "border-l-blue-400",
    "border-l-purple-400", "border-l-slate-400",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
