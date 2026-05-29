import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/shared/Providers";
import { Toaster } from "react-hot-toast";

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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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