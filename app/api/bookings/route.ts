import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "You must be logged in to book." }, { status: 401 });
    }

    const { serviceId, businessId, slotId, slotDatetime, staffId, notes } = await req.json();

    if (!serviceId || !businessId || !slotId || !slotDatetime) {
      return NextResponse.json({ error: "Missing required booking fields." }, { status: 400 });
    }

    // ── Step 1: Get customer profile (maybeSingle avoids 406) ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const customerName = profile?.full_name || user.email?.split("@")[0] || "Customer";
    const customerPhone = profile?.phone || null;

    // ── Step 2: Check slot is still available ──
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("id, status")
      .eq("id", slotId)
      .maybeSingle();

    if (slotError || !slot) {
      return NextResponse.json({ error: "Slot not found." }, { status: 404 });
    }

    if (slot.status === "reserved") {
      return NextResponse.json(
        { error: "This time slot was just booked by someone else. Please choose another time." },
        { status: 409 }
      );
    }

    if (slot.status === "blocked") {
      return NextResponse.json(
        { error: "This time slot is not available." },
        { status: 409 }
      );
    }

    // ── Step 3: Check customer doesn't already have a booking for this slot ──
    const { data: duplicate } = await supabase
      .from("bookings")
      .select("id")
      .eq("slot_id", slotId)
      .maybeSingle();

    if (duplicate) {
      return NextResponse.json(
        { error: "This time slot has already been booked. Please choose another." },
        { status: 409 }
      );
    }

    // ── Step 4: Create the booking ──
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
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: user.email,
        notes: notes || null,
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);

      // Handle unique constraint violation
      if (bookingError.code === "23505") {
        return NextResponse.json(
          { error: "This slot has just been taken. Please choose another time." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: bookingError.message }, { status: 500 });
    }

    // ── Step 5: Mark slot as reserved ──
    await supabase
      .from("slots")
      .update({ status: "reserved", hold_expires_at: null })
      .eq("id", slotId);

    // ── Step 6: Notify business owner ──
    const { data: business } = await supabase
      .from("businesses")
      .select("owner_id, name")
      .eq("id", businessId)
      .maybeSingle();

    if (business) {
      await supabase.from("notifications").insert({
        user_id: (business as any).owner_id,
        type: "booking_created",
        title: "New Booking Request! 📅",
        message: `${customerName} has requested a booking for ${new Date(slotDatetime).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`,
        metadata: { booking_id: booking.id },
      });
    }

    // ── Step 7: Notify customer ──
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "booking_pending",
      title: "Booking Request Sent ✅",
      message: `Your booking request has been sent. You'll be notified once it's confirmed.`,
      metadata: { booking_id: booking.id },
    });

    return NextResponse.json({ booking }, { status: 201 });

  } catch (err: any) {
    console.error("Booking unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}