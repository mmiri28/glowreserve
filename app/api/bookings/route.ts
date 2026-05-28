import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { businessId, serviceId, staffId, slotId, slotDatetime, notes } = body;

  // Step 1: Verify slot is available (free or on hold by this session)
  const { data: slot } = await supabase
    .from("slots")
    .select("*")
    .eq("id", slotId)
    .single();

  if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  if (slot.status === "reserved") {
    return NextResponse.json({ error: "This slot has already been booked." }, { status: 409 });
  }
  if (slot.status === "blocked") {
    return NextResponse.json({ error: "This slot is not available." }, { status: 409 });
  }

  // Step 2: Reserve the slot atomically (unique constraint is the safety net)
  const { error: slotError } = await supabase
    .from("slots")
    .update({ status: "reserved", hold_expires_at: null })
    .eq("id", slotId)
    .in("status", ["free", "hold"]);

  if (slotError) {
    return NextResponse.json({ error: "Could not reserve slot." }, { status: 409 });
  }

  // Step 3: Fetch customer profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  // Step 4: Create the booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      customer_id: user.id,
      business_id: businessId,
      service_id: serviceId,
      staff_id: staffId || null,
      slot_id: slotId,
      slot_datetime: slotDatetime,
      status: "pending",
      notes: notes || null,
      customer_name: profile?.full_name || "",
      customer_phone: profile?.phone || "",
      customer_email: user.email || "",
    })
    .select()
    .single();

  if (bookingError) {
    // If booking failed, release the slot
    await supabase.from("slots").update({ status: "free" }).eq("id", slotId);
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  return NextResponse.json({ booking }, { status: 201 });
}

// GET /api/bookings — fetch customer's bookings
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("bookings")
    .select(`
      *,
      businesses(name, address, city, logo_url),
      services(name, duration_minutes, price)
    `)
    .eq("customer_id", user.id)
    .order("slot_datetime", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ bookings: data });
}
