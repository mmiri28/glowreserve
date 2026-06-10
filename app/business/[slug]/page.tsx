import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import BusinessProfileClient from "@/components/business/BusinessProfileClient";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("businesses")
    .select("name, description, city, category, cover_image_url")
    .eq("slug", params.slug)
    .single();

  if (!data) return { title: "Business Not Found — GlowReserve" };

  return {
    title: `${data.name} — GlowReserve`,
    description: data.description || `Book ${data.category} services at ${data.name} in ${data.city}`,
    openGraph: {
      title: `${data.name} — GlowReserve`,
      description: data.description || `Book ${data.category} services at ${data.name}`,
      images: data.cover_image_url ? [{ url: data.cover_image_url }] : [],
    },
  };
}

export default async function BusinessProfilePage({ params }: Props) {
  const supabase = await createServerSupabaseClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!business) notFound();

  const [
    { data: services },
    { data: reviews },
    { data: staff },
    { data: slots },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("category"),
    supabase
      .from("reviews")
      .select("*, profiles(full_name, avatar_url)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("staff")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true),
    supabase
      .from("slots")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "free")
      .gte("slot_datetime", new Date().toISOString())
      .lte("slot_datetime", new Date(Date.now() + 7 * 86400000).toISOString())
      .order("slot_datetime"),
  ]);

  return (
    <>
      <Navbar />
      <BusinessProfileClient
        business={business}
        services={services || []}
        reviews={reviews || []}
        staff={staff || []}
        initialSlots={slots || []}
      />
    </>
  );
}