import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GrainEffect } from "./ui/GrainEffect";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

// Define fonts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Create globally accessible polyfill script that runs immediately
const globalPolyfill = `
  ;(function() {
    if (typeof window !== 'undefined' && !window.process) {
      window.process = { 
        env: {
          NODE_ENV: "${process.env.NODE_ENV || "development"}",
          CLERK_TELEMETRY_DEBUG: "false",
          CLERK_TELEMETRY_DISABLED: "true",
          NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG: "false",
          NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED: "true" 
        } 
      };
    }
  })();
`;

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
    <>
      {/* Immediately execute polyfill script */}
      <script dangerouslySetInnerHTML={{ __html: globalPolyfill }} />
      <ClerkProvider
        telemetry={{
          disabled: true,
          debug: false,
        }}
      >
        <html lang="en">
          <head>
            <Script id="clerk-env-polyfill" strategy="beforeInteractive">
              {`
                if (typeof window !== 'undefined' && !window.process) {
                  window.process = { 
                    env: {
                      CLERK_TELEMETRY_DEBUG: "false",
                      CLERK_TELEMETRY_DISABLED: "true",
                      NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG: "false",
                      NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED: "true"
                    } 
                  };
                }
              `}
            </Script>
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <GrainEffect />
            {children}
          </body>
        </html>
      </ClerkProvider>
    </>
  );
}
