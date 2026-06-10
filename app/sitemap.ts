import { MetadataRoute } from "next";
import { createServiceRoleClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://glowreserve.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/explore`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic business pages
  try {
    const supabase = await createServiceRoleClient();
    const { data: businesses } = await supabase
      .from("businesses")
      .select("slug, updated_at")
      .eq("is_verified", true);

    type Business = {
  slug: string;
  updated_at: string;
};

    const businessPages: MetadataRoute.Sitemap = ((businesses || []) as Business[]).map((biz) => ({
      url: `${baseUrl}/business/${biz.slug}`,
      lastModified: new Date(biz.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...businessPages];
  } catch {
    return staticPages;
  }
}