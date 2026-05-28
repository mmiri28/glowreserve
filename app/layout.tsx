import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/shared/Providers";

export const metadata: Metadata = {
  title: "GlowReserve — Premium Beauty & Wellness Marketplace",
  description: "Discover and book top-rated beauty salons, spas, and wellness providers near you.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}