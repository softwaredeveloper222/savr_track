import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SavrTrack - Contractor Compliance Tracking",
  description:
    "Track contractor deadlines, compliance requirements, and documentation with ease. Stay on top of every obligation and never miss a critical date.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
