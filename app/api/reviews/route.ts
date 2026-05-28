import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, businessId, rating, comment } = await req.json();

  if (!bookingId || !businessId || !rating) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5" }, { status: 400 });
  }

  // Verify the booking belongs to this customer and is completed
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, customer_id")
    .eq("id", bookingId)
    .eq("customer_id", user.id)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  if (booking.status !== "completed") {
    return NextResponse.json({ error: "Can only review completed bookings" }, { status: 400 });
  }

  // Upsert review (unique on booking_id)
  const { data, error } = await supabase
    .from("reviews")
    .upsert({
      booking_id: bookingId,
      customer_id: user.id,
      business_id: businessId,
      rating,
      comment: comment || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ review: data }, { status: 201 });
}
