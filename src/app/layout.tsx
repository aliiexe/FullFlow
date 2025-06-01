import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GrainEffect } from "./ui/GrainEffect";
import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";

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
        <ClerkProvider telemetry={{ disabled: true, debug: false }}>
          <div className="absolute right-4 top-4 z-50 flex items-center gap-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton>
                <button className="rounded-md border border-white/30 bg-white/10 px-4 py-2 text-white">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-md border border-white/30 bg-white/10 px-4 py-2 text-white">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
          </div>

          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
