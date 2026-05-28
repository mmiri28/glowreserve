import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import BusinessProfileClient from "@/components/business/BusinessProfileClient";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("businesses")
    .select("name, description")
    .eq("slug", params.slug)
    .single();

  return {
    title: data ? `${data.name} — GlowReserve` : "Business — GlowReserve",
    description: data?.description || "",
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = await createServerSupabaseClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (!business) notFound();

  const [{ data: services }, { data: reviews }, { data: staff }] = await Promise.all([
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
  ]);

  return (
    <>
      <Navbar />
      <BusinessProfileClient
        business={business}
        services={services || []}
        reviews={reviews || []}
        staff={staff || []}
      />
    </>
  );
}
