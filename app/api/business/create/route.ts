import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { name, slug, category, description, address, city, phone, email } = body;

    if (!name || !slug || !category) {
      return NextResponse.json({ error: "Name, slug and category are required." }, { status: 400 });
    }

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "slug_taken" }, { status: 409 });
    }

    // Insert business
    const { data: business, error } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        slug: slug.trim(),
        category: category.trim(),
        description: description?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || user.email,
        is_verified: false,
        rating: 0,
        total_reviews: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Business insert failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update profile role
    await supabase
      .from("profiles")
      .update({ role: "business_owner" })
      .eq("id", user.id);

    return NextResponse.json({ business }, { status: 201 });
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json({ error: err?.message || "Something went wrong" }, { status: 500 });
  }
}