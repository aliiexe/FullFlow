import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GrainEffect } from "./ui/GrainEffect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Full Flow",
  description: "Full Flow - AI-powered automation for modern workflows",
  icons: {
    icon: "/FullFlowFav.ico",
    shortcut: "/FullFlowFav.svg",
    apple: "/FullFlowFav.svg",
    other: {
      rel: "apple-touch-icon",
      url: "/FullFlowFav.svg",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GrainEffect />
        {children}
      </body>
    </html>
  );
}
