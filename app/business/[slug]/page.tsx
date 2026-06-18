import { createServerSupabaseClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import BusinessProfileClient from "@/components/business/BusinessProfileClient";
import { startOfDay } from "date-fns";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("name, description, category, city")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) {
    return { title: "Business Not Found — GlowReserve" };
  }

  return {
    title: `${business.name} — GlowReserve`,
    description: business.description || `Book ${business.category} services at ${business.name} in ${business.city || "your area"}.`,
  };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();

  // ── Fetch business ──
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!business) notFound();

  // ── Fetch related data in parallel ──
  const [
    { data: services },
    { data: staff },
    { data: reviews },
    { data: slots },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true)
      .order("price", { ascending: true }),

    supabase
      .from("staff")
      .select("*")
      .eq("business_id", business.id)
      .eq("is_active", true),

    supabase
      .from("reviews")
      .select("*, profiles(full_name, avatar_url)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase
      .from("slots")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "free")
      .gte("slot_datetime", startOfDay(new Date()).toISOString())
      .order("slot_datetime", { ascending: true })
      .limit(200),
  ]);

  // ── Check if current user is logged in (for booking/waitlist) ──
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <BusinessProfileClient
      business={business}
      services={services || []}
      staff={staff || []}
      reviews={reviews || []}
      initialSlots={slots || []}
    />
  );
}