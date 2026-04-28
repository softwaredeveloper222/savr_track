import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Surevia - Contractor Compliance Management",
  description:
    "The compliance management platform built for contractors. Track licenses, certifications, insurance, and deadlines across your entire team.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-[#f8fafb] min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
