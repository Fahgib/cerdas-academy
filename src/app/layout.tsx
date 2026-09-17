import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Cerdas Academy • Bimbingan Belajar Privat",
  description: "Platform Bimbel Privat Datang ke Rumah No. 1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      {/* Warna background dinamis mengikuti class dark di html */}
      <body className="min-h-full flex flex-col font-sans bg-[#f8fafc] text-slate-900 dark:bg-[#0f131c] dark:text-[#dfe2ef] transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}