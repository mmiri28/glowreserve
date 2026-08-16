"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle, XCircle, Clock, Calendar,
  ChevronDown, ChevronUp, Phone, User,
} from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

type FilterType = "pending" | "confirmed" | "completed" | "cancelled" | "all";

export default function BusinessAppointmentsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    loadBusiness();
  }, []);

  useEffect(() => {
    if (business?.id) fetchBookings();
  }, [business, filter]);

  const loadBusiness = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", user.id)
      .maybeSingle();
    setBusiness(data);
  };

  const fetchBookings = async () => {
    if (!business?.id) return;
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("bookings")
      .select(`
        *,
        profiles(full_name, avatar_url, phone),
        services(name, duration_minutes, price)
      `)
      .eq("business_id", business.id)
      .order("slot_datetime", { ascending: filter === "pending" });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query.limit(100);
    setBookings(data || []);
    setLoading(false);
  };

  const handleApprove = async (booking: any) => {
    setProcessing(booking.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", booking.id);

    if (error) {
      toast.error("Failed to approve: " + error.message);
    } else {
      // Notify customer
      await supabase.from("notifications").insert({
        user_id: booking.customer_id,
        type: "booking_confirmed",
        title: "Booking Confirmed! ✅",
        message: `Your booking for ${booking.services?.name} on ${format(new Date(booking.slot_datetime), "MMM d 'at' h:mm a")} has been confirmed.`,
        metadata: { booking_id: booking.id },
      });

      toast.success("Booking approved! Customer has been notified.");
      fetchBookings();
    }
    setProcessing(null);
  };

  const handleDecline = async (booking: any) => {
    if (!confirm("Decline this booking? The slot will be freed up.")) return;
    setProcessing(booking.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);

    if (error) {
      toast.error("Failed to decline: " + error.message);
    } else {
      // Free the slot
      if (booking.slot_id) {
        await supabase
          .from("slots")
          .update({ status: "free", hold_expires_at: null })
          .eq("id", booking.slot_id);
      }

      // Notify customer
      await supabase.from("notifications").insert({
        user_id: booking.customer_id,
        type: "booking_cancelled",
        title: "Booking Update",
        message: `Your booking for ${booking.services?.name} on ${format(new Date(booking.slot_datetime), "MMM d 'at' h:mm a")} was not confirmed. Please book another time.`,
        metadata: { booking_id: booking.id },
      });

      toast.success("Booking declined. Slot is now free.");
      fetchBookings();
    }
    setProcessing(null);
  };

  const handleComplete = async (bookingId: string) => {
    setProcessing(bookingId);
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to mark complete.");
    } else {
      toast.success("Marked as completed!");
      fetchBookings();
    }
    setProcessing(null);
  };

  const FILTERS: { value: FilterType; label: string; color?: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "all", label: "All" },
  ];

  const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
    pending: { color: "#D4AF37", bg: "rgba(212,175,55,0.1)" },
    confirmed: { color: "#4CAF7C", bg: "rgba(76,175,124,0.1)" },
    completed: { color: "#5B8DEF", bg: "rgba(91,141,239,0.1)" },
    cancelled: { color: "#E85C5C", bg: "rgba(232,92,92,0.1)" },
  };

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
          fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem",
        }}>
          Appointments
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Manage all bookings for {business?.name || "your business"}.
          {pendingCount > 0 && (
            <span style={{ marginLeft: "0.5rem", fontWeight: "600", color: "#D4AF37" }}>
              {pendingCount} pending approval
            </span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: "flex", gap: "0.375rem", flexWrap: "wrap",
        marginBottom: "1.75rem",
        background: "var(--surface-2)", borderRadius: "0.875rem",
        padding: "0.25rem", border: "1px solid var(--border)",
        width: "fit-content",
      }}>
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{
            padding: "0.5rem 1rem", borderRadius: "0.625rem", border: "none",
            background: filter === f.value
              ? "linear-gradient(135deg, #D4AF37, #B8941F)"
              : "transparent",
            color: filter === f.value ? "white" : "var(--muted)",
            cursor: "pointer", fontSize: "0.875rem", fontWeight: "600",
            fontFamily: "inherit", transition: "all 0.2s",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)", opacity: 0.5 }}>
              <div style={{ height: "18px", background: "var(--surface-2)", borderRadius: "4px", width: "40%", marginBottom: "0.75rem" }} />
              <div style={{ height: "14px", background: "var(--surface-2)", borderRadius: "4px", width: "65%" }} />
            </div>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "1.5rem", border: "2px dashed rgba(212,175,55,0.2)" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📅</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
            No {filter === "all" ? "" : filter} bookings
          </h3>
          <p style={{ color: "var(--muted)" }}>
            {filter === "pending"
              ? "No bookings waiting for approval right now."
              : "No bookings in this category yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bookings.map((booking: any) => {
            const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
            const isExpanded = expandedId === booking.id;
            const isProcessing = processing === booking.id;
            const slotDate = new Date(booking.slot_datetime);
            const customerName = booking.profiles?.full_name ||
              booking.customer_name || "Customer";

            return (
              <div key={booking.id} style={{
                background: "var(--surface)", borderRadius: "1.25rem",
                border: "1px solid var(--border)", overflow: "hidden",
              }}>
                {/* Status bar */}
                <div style={{ height: "3px", background: statusStyle.color, opacity: 0.7 }} />

                <div style={{ padding: "1.25rem 1.5rem" }}>
                  {/* Top row */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: "1rem",
                    flexWrap: "wrap", marginBottom: "0.875rem",
                  }}>
                    {/* Customer info */}
                    <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: "700", fontSize: "1.125rem",
                        flexShrink: 0, overflow: "hidden",
                      }}>
                        {booking.profiles?.avatar_url
                          ? <img src={booking.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : customerName[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "1.0625rem", fontWeight: "600",
                          color: "var(--charcoal)", marginBottom: "0.2rem",
                        }}>
                          {customerName}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                          {booking.services?.name}
                          {booking.services?.price && (
                            <span style={{ color: "#4CAF7C", fontWeight: "700", marginLeft: "0.5rem" }}>
                              ₦{Number(booking.services.price).toLocaleString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "0.3rem",
                      fontSize: "0.75rem", fontWeight: "600",
                      padding: "0.3rem 0.75rem", borderRadius: "9999px",
                      background: statusStyle.bg, color: statusStyle.color,
                      flexShrink: 0,
                    }}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  {/* Date & time */}
                  <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)" }}>
                      <Calendar size={14} color="#D4AF37" />
                      {format(slotDate, "EEEE, MMMM d, yyyy")}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)" }}>
                      <Clock size={14} color="#D4AF37" />
                      {format(slotDate, "h:mm a")}
                    </span>
                    {booking.services?.duration_minutes && (
                      <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                        {booking.services.duration_minutes} min
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center" }}>

                    {/* PENDING — approve / decline */}
                    {booking.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(booking)}
                          disabled={isProcessing}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.375rem",
                            padding: "0.5rem 1.125rem", borderRadius: "0.625rem",
                            border: "none",
                            background: isProcessing ? "rgba(76,175,124,0.5)" : "linear-gradient(135deg, #4CAF7C, #3A9E6B)",
                            color: "white", fontWeight: "600", fontSize: "0.875rem",
                            cursor: isProcessing ? "not-allowed" : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <CheckCircle size={15} />
                          {isProcessing ? "Approving..." : "Approve"}
                        </button>
                        <button
                          onClick={() => handleDecline(booking)}
                          disabled={isProcessing}
                          style={{
                            display: "flex", alignItems: "center", gap: "0.375rem",
                            padding: "0.5rem 1.125rem", borderRadius: "0.625rem",
                            border: "1px solid rgba(232,92,92,0.3)",
                            background: "rgba(232,92,92,0.08)",
                            color: "#E85C5C", fontWeight: "600", fontSize: "0.875rem",
                            cursor: isProcessing ? "not-allowed" : "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          <XCircle size={15} />
                          Decline
                        </button>
                      </>
                    )}

                    {/* CONFIRMED — mark complete */}
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => handleComplete(booking.id)}
                        disabled={isProcessing}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.375rem",
                          padding: "0.5rem 1.125rem", borderRadius: "0.625rem",
                          border: "1px solid rgba(91,141,239,0.3)",
                          background: "rgba(91,141,239,0.08)",
                          color: "#5B8DEF", fontWeight: "600", fontSize: "0.875rem",
                          cursor: isProcessing ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        <CheckCircle size={15} />
                        {isProcessing ? "Updating..." : "Mark Complete"}
                      </button>
                    )}

                    {/* Expand details */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.25rem",
                        padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                        border: "1px solid var(--border)", background: "transparent",
                        color: "var(--muted)", fontSize: "0.8125rem", fontWeight: "600",
                        cursor: "pointer", fontFamily: "inherit", marginLeft: "auto",
                      }}
                    >
                      Details
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{
                      marginTop: "1rem", paddingTop: "1rem",
                      borderTop: "1px solid var(--border)",
                      display: "flex", flexDirection: "column", gap: "0.5rem",
                    }}>
                      {(booking.customer_phone || booking.profiles?.phone) && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <Phone size={14} color="var(--muted)" />
                          <a
                            href={`tel:${booking.customer_phone || booking.profiles?.phone}`}
                            style={{ fontSize: "0.875rem", color: "#D4AF37", textDecoration: "none" }}
                          >
                            {booking.customer_phone || booking.profiles?.phone}
                          </a>
                        </div>
                      )}
                      {booking.customer_email && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <User size={14} color="var(--muted)" />
                          <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                            {booking.customer_email}
                          </span>
                        </div>
                      )}
                      {booking.notes && (
                        <div style={{
                          background: "var(--surface-2)", borderRadius: "0.625rem",
                          padding: "0.75rem",
                        }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Customer Notes
                          </p>
                          <p style={{ fontSize: "0.875rem", color: "var(--charcoal)", lineHeight: "1.6" }}>
                            {booking.notes}
                          </p>
                        </div>
                      )}
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        Booking ID: {booking.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}