import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://glowreserve.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/explore", "/business/"],
        disallow: ["/dashboard", "/admin", "/api/", "/auth/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}