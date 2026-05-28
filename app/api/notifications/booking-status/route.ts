import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendBookingConfirmedEmail, sendSMS } from "@/lib/notifications";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const { bookingId, status, customerId } = await req.json();
    const supabase = await createServiceRoleClient();

    // Fetch full booking details
    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        *,
        businesses(name),
        services(name)
      `)
      .eq("id", bookingId)
      .single();

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Get customer auth email
    const { data: customerAuth } = await supabase.auth.admin.getUserById(customerId);
    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", customerId)
      .single();

    const customerName = customerProfile?.full_name || "there";
    const serviceName = (booking as any).services?.name || "your service";
    const businessName = (booking as any).businesses?.name || "the salon";
    const formattedDate = format(new Date(booking.slot_datetime), "EEEE, MMMM d 'at' h:mm a");

    if (status === "confirmed") {
      // Email customer
      if (customerAuth?.user?.email) {
        await sendBookingConfirmedEmail({
          customerEmail: customerAuth.user.email,
          customerName,
          serviceName,
          businessName,
          slotDatetime: booking.slot_datetime,
        });
      }

      // SMS to customer
      if (customerProfile?.phone) {
        await sendSMS(
          customerProfile.phone,
          `GlowReserve: ✅ Confirmed! See you at ${businessName} on ${formattedDate}. Please arrive 5 mins early.`
        );
      }

      // In-app notification
      await supabase.from("notifications").insert({
        user_id: customerId,
        type: "booking_confirmed",
        title: "Booking Confirmed! ✅",
        message: `Your ${serviceName} at ${businessName} on ${formattedDate} has been confirmed. See you soon!`,
        metadata: { booking_id: bookingId },
      });
    } else if (status === "cancelled") {
      // In-app notification
      await supabase.from("notifications").insert({
        user_id: customerId,
        type: "booking_cancelled",
        title: "Booking Declined",
        message: `Your request for ${serviceName} at ${businessName} on ${formattedDate} could not be accommodated. Please book another time.`,
        metadata: { booking_id: bookingId },
      });

      // SMS
      if (customerProfile?.phone) {
        await sendSMS(
          customerProfile.phone,
          `GlowReserve: Your booking for ${serviceName} at ${businessName} on ${formattedDate} was cancelled. Visit GlowReserve to book another slot.`
        );
      }
    } else if (status === "completed") {
      // In-app notification prompting review
      await supabase.from("notifications").insert({
        user_id: customerId,
        type: "review_requested",
        title: "How was your experience?",
        message: `You just completed ${serviceName} at ${businessName}. Leave a review to help others!`,
        metadata: { booking_id: bookingId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Status notification error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
