import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, businessId, rating, comment } = await req.json();

  if (!bookingId || !businessId || !rating) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  // Verify booking belongs to customer and is completed
  const { data: booking } = await supabase
    .from("bookings").select("id, status, customer_id")
    .eq("id", bookingId).eq("customer_id", user.id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  // Check no existing review
  const { data: existing } = await supabase
    .from("reviews").select("id").eq("booking_id", bookingId).maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already reviewed this booking." }, { status: 409 });
  }

  const { data: review, error } = await supabase
    .from("reviews")
    .insert({
      booking_id: bookingId,
      customer_id: user.id,
      business_id: businessId,
      rating,
      comment: comment?.trim() || null,
    })
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ review }, { status: 201 });
}