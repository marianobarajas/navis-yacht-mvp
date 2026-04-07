import "./globals.css";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Navis",
  description: "Yacht Operations Platform",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[var(--apple-bg)] font-sans text-[var(--apple-text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}