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
      .select("*")
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

  // ── Review authors: only their public name and picture (never phone) ──
  const authorIds = Array.from(
    new Set((reviews || []).map((r: { customer_id: string | null }) => r.customer_id).filter(Boolean)),
  ) as string[];
  const authors = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  if (authorIds.length) {
    let { data: people, error: peopleError } = await supabase.rpc("public_profiles", { ids: authorIds });
    if (peopleError) {
      // Database not yet updated with 05_private_profiles.sql: use the old direct read.
      ({ data: people } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds));
    }
    for (const p of (people || []) as { id: string; full_name: string | null; avatar_url: string | null }[]) {
      authors.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
    }
  }
  const reviewsWithAuthors = (reviews || []).map((r: { customer_id: string | null }) => ({
    ...r,
    profiles: (r.customer_id && authors.get(r.customer_id)) || null,
  }));

  // ── Check if current user is logged in (for booking/waitlist) ──
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <BusinessProfileClient
      business={business}
      services={services || []}
      staff={staff || []}
      reviews={reviewsWithAuthors}
      initialSlots={slots || []}
    />
  );
}