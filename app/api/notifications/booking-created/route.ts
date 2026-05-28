import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendBookingCreatedEmail, sendSMS } from "@/lib/notifications";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const { bookingData, userId } = await req.json();
    const supabase = await createServiceRoleClient();

    // Get customer profile
    const { data: customer } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .single();

    // Get business + owner info
    const { data: business } = await supabase
      .from("businesses")
      .select("name, owner_id, email, profiles(full_name)")
      .eq("id", bookingData.businessId)
      .single();

    // Get owner auth email
    const { data: ownerAuth } = await supabase.auth.admin.getUserById(
      (business as any)?.owner_id
    );

    const customerName = customer?.full_name || "A customer";
    const ownerEmail = ownerAuth?.user?.email;
    const formattedDate = format(new Date(bookingData.slotDatetime), "EEEE, MMMM d 'at' h:mm a");

    // 1. Email business owner
    if (ownerEmail) {
      await sendBookingCreatedEmail({
        ownerEmail,
        ownerName: (business as any)?.profiles?.full_name || "Owner",
        customerName,
        serviceName: bookingData.serviceName,
        businessName: bookingData.businessName,
        slotDatetime: bookingData.slotDatetime,
        bookingId: bookingData.id,
      });
    }

    // 2. In-app notification for business owner
    await supabase.from("notifications").insert({
      user_id: (business as any)?.owner_id,
      type: "booking_created",
      title: "New Booking Request!",
      message: `${customerName} wants ${bookingData.serviceName} on ${formattedDate}.`,
      metadata: { booking_id: bookingData.id },
    });

    // 3. In-app notification for customer (pending status)
    await supabase.from("notifications").insert({
      user_id: userId,
      type: "booking_created",
      title: "Booking Request Sent",
      message: `Your request for ${bookingData.serviceName} at ${bookingData.businessName} is pending approval.`,
      metadata: { booking_id: bookingData.id },
    });

    // 4. SMS to business owner if they have a phone
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("phone")
      .eq("id", (business as any)?.owner_id)
      .single();

    if (ownerProfile?.phone) {
      await sendSMS(
        ownerProfile.phone,
        `GlowReserve: New booking! ${customerName} wants ${bookingData.serviceName} on ${formattedDate}. Review: ${process.env.NEXT_PUBLIC_APP_URL}/business/dashboard/appointments`
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
