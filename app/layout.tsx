import type { Metadata } from "next";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/500-italic.css";
import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "GlowReserve — Premium Beauty & Wellness Marketplace",
  description:
    "Discover and book top-rated beauty salons, spas, and wellness providers near you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#D4AF37" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GlowReserve" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "Montserrat, sans-serif",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--charcoal)",
                boxShadow: "0 4px 16px rgba(26,26,26,0.08)",
              },
              success: { iconTheme: { primary: "#D4AF37", secondary: "#fff" } },
              error: { iconTheme: { primary: "#E85C5C", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
