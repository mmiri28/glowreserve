"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar, Clock, MapPin, CheckCircle,
  XCircle, AlertCircle, Star, ChevronDown, ChevronUp,
} from "lucide-react";
import { format, isPast } from "date-fns";
import toast from "react-hot-toast";
import ReviewModal from "@/components/shared/ReviewModal";
import Link from "next/link";

type TabType = "upcoming" | "past";

export default function AppointmentsPage() {
  const [tab, setTab] = useState<TabType>("upcoming");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [tab]);

  // Also load which bookings already have reviews
  useEffect(() => {
    loadReviewedIds();
  }, []);

  const loadReviewedIds = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("reviews")
      .select("booking_id")
      .eq("customer_id", user.id);

    if (data) {
      setReviewedIds(new Set(data.map((r: any) => r.booking_id)));
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date().toISOString();

    let query = supabase
      .from("bookings")
      .select(`
        *,
        businesses(id, name, address, city, phone, slug, logo_url),
        services(name, duration_minutes, price)
      `)
      .eq("customer_id", user.id)
      .order("slot_datetime", { ascending: tab === "upcoming" });

    if (tab === "upcoming") {
      query = query
        .in("status", ["pending", "confirmed"])
        .gte("slot_datetime", now);
    } else {
      query = query.or(
        `status.in.(completed,cancelled),slot_datetime.lt.${now}`
      );
    }

    const { data } = await query.limit(50);
    setBookings(data || []);
    setLoading(false);
  };

  const handleCancel = async (bookingId: string, slotId: string | null) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setCancelling(bookingId);
    const supabase = createClient();

    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (error) {
      toast.error("Failed to cancel booking.");
    } else {
      // Free up the slot
      if (slotId) {
        await supabase
          .from("slots")
          .update({ status: "free", hold_expires_at: null })
          .eq("id", slotId);
      }
      toast.success("Booking cancelled.");
      fetchBookings();
    }
    setCancelling(null);
  };

  const STATUS_CONFIG: Record<string, {
    label: string;
    color: string;
    bg: string;
    icon: React.ReactNode;
  }> = {
    pending: {
      label: "Pending Approval",
      color: "#D4AF37",
      bg: "rgba(212,175,55,0.1)",
      icon: <AlertCircle size={13} />,
    },
    confirmed: {
      label: "Confirmed",
      color: "#4CAF7C",
      bg: "rgba(76,175,124,0.1)",
      icon: <CheckCircle size={13} />,
    },
    completed: {
      label: "Completed",
      color: "#4CAF7C",
      bg: "rgba(76,175,124,0.1)",
      icon: <CheckCircle size={13} />,
    },
    cancelled: {
      label: "Cancelled",
      color: "#E85C5C",
      bg: "rgba(232,92,92,0.1)",
      icon: <XCircle size={13} />,
    },
  };

  const upcoming = bookings.filter(
    (b) => !isPast(new Date(b.slot_datetime)) || b.status === "confirmed"
  );
  const past = bookings;

  const displayBookings = tab === "upcoming" ? bookings : past;

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
          fontWeight: "700", color: "var(--charcoal)",
          marginBottom: "0.375rem",
        }}>
          My Appointments
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Manage all your beauty bookings in one place.
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        background: "var(--surface-2)",
        borderRadius: "0.875rem",
        padding: "0.25rem",
        border: "1px solid var(--border)",
        width: "fit-content",
        marginBottom: "1.75rem",
      }}>
        {(["upcoming", "past"] as TabType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "0.5rem 1.5rem",
              borderRadius: "0.625rem",
              border: "none",
              background: tab === t
                ? "linear-gradient(135deg, #D4AF37, #B8941F)"
                : "transparent",
              color: tab === t ? "white" : "var(--muted)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "600",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Bookings list */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              background: "var(--surface)", borderRadius: "1.25rem",
              padding: "1.5rem", border: "1px solid var(--border)", opacity: 0.5,
            }}>
              <div style={{ height: "18px", background: "var(--surface-2)", borderRadius: "4px", width: "40%", marginBottom: "0.75rem" }} />
              <div style={{ height: "14px", background: "var(--surface-2)", borderRadius: "4px", width: "65%" }} />
            </div>
          ))}
        </div>
      ) : displayBookings.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          background: "var(--surface)",
          borderRadius: "1.5rem",
          border: "2px dashed rgba(212,175,55,0.2)",
        }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
            {tab === "upcoming" ? "📅" : "📋"}
          </div>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.25rem",
            color: "var(--charcoal)",
            marginBottom: "0.5rem",
          }}>
            {tab === "upcoming"
              ? "No upcoming appointments"
              : "No past appointments"}
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            {tab === "upcoming"
              ? "Ready for your next beauty treatment?"
              : "Your completed appointments will appear here."}
          </p>
          {tab === "upcoming" && (
            <Link href="/explore" className="btn-gold">
              Book a Service
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {displayBookings.map((booking: any) => {
            const statusConfig = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const isExpanded = expandedId === booking.id;
            const hasReview = reviewedIds.has(booking.id);
            const canReview = booking.status === "completed" && !hasReview;
            const canCancel = booking.status === "pending" &&
              !isPast(new Date(booking.slot_datetime));
            const slotDate = new Date(booking.slot_datetime);

            return (
              <div key={booking.id} style={{
                background: "var(--surface)",
                borderRadius: "1.25rem",
                border: "1px solid var(--border)",
                overflow: "hidden",
                transition: "box-shadow 0.2s",
              }}>
                {/* Status bar */}
                <div style={{
                  height: "3px",
                  background: statusConfig.color,
                  opacity: 0.7,
                }} />

                {/* Main content */}
                <div style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    flexWrap: "wrap",
                    marginBottom: "0.875rem",
                  }}>
                    {/* Business + service */}
                    <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                      <div style={{
                        width: "48px", height: "48px",
                        borderRadius: "0.75rem",
                        background: "rgba(212,175,55,0.08)",
                        border: "1px solid rgba(212,175,55,0.15)",
                        display: "flex", alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.375rem", flexShrink: 0,
                        overflow: "hidden",
                      }}>
                        {booking.businesses?.logo_url
                          ? <img
                              src={booking.businesses.logo_url}
                              alt=""
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          : "✨"}
                      </div>
                      <div>
                        <h3 style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "1.0625rem",
                          fontWeight: "600",
                          color: "var(--charcoal)",
                          marginBottom: "0.2rem",
                        }}>
                          {booking.services?.name || "Service"}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                          {booking.businesses?.name || "Business"}
                        </p>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      display: "inline-flex", alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.75rem", fontWeight: "600",
                      padding: "0.3rem 0.75rem", borderRadius: "9999px",
                      background: statusConfig.bg,
                      color: statusConfig.color,
                      flexShrink: 0,
                    }}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Date & time row */}
                  <div style={{
                    display: "flex",
                    gap: "1.25rem",
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Calendar size={14} color="#D4AF37" />
                      <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)" }}>
                        {format(slotDate, "EEEE, MMMM d, yyyy")}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                      <Clock size={14} color="#D4AF37" />
                      <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)" }}>
                        {format(slotDate, "h:mm a")}
                      </span>
                    </div>
                    {booking.services?.duration_minutes && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <Clock size={14} color="var(--muted)" />
                        <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                          {booking.services.duration_minutes} min
                        </span>
                      </div>
                    )}
                    {booking.services?.price && (
                      <div style={{
                        fontSize: "0.875rem", fontWeight: "700",
                        color: "#4CAF7C",
                      }}>
                        ${Number(booking.services.price).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center" }}>
                    {/* View business */}
                    {booking.businesses?.slug && (
                      <Link
                        href={`/business/${booking.businesses.slug}`}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.375rem",
                          padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                          border: "1px solid var(--border)",
                          color: "var(--muted)", textDecoration: "none",
                          fontSize: "0.8125rem", fontWeight: "600",
                          background: "var(--surface-2)",
                          transition: "all 0.2s",
                        }}
                      >
                        View Business
                      </Link>
                    )}

                    {/* Leave review */}
                    {canReview && (
                      <button
                        onClick={() => setReviewBooking(booking)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.375rem",
                          padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                          border: "1px solid rgba(212,175,55,0.3)",
                          background: "rgba(212,175,55,0.08)",
                          color: "#D4AF37", fontSize: "0.8125rem", fontWeight: "600",
                          cursor: "pointer", fontFamily: "inherit",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.15)"}
                        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)"}
                      >
                        <Star size={14} fill="#D4AF37" /> Leave Review
                      </button>
                    )}

                    {/* Already reviewed */}
                    {hasReview && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "0.375rem",
                        padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                        background: "rgba(76,175,124,0.08)",
                        color: "#4CAF7C", fontSize: "0.8125rem", fontWeight: "600",
                      }}>
                        <CheckCircle size={13} /> Reviewed
                      </span>
                    )}

                    {/* Cancel */}
                    {canCancel && (
                      <button
                        onClick={() => handleCancel(booking.id, booking.slot_id)}
                        disabled={cancelling === booking.id}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "0.375rem",
                          padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                          border: "1px solid rgba(232,92,92,0.3)",
                          background: "rgba(232,92,92,0.06)",
                          color: "#E85C5C", fontSize: "0.8125rem", fontWeight: "600",
                          cursor: cancelling === booking.id ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                          opacity: cancelling === booking.id ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={13} />
                        {cancelling === booking.id ? "Cancelling..." : "Cancel"}
                      </button>
                    )}

                    {/* Expand/collapse */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "0.25rem",
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
                      marginTop: "1.125rem",
                      paddingTop: "1.125rem",
                      borderTop: "1px solid var(--border)",
                      display: "flex", flexDirection: "column", gap: "0.625rem",
                    }}>
                      {booking.businesses?.address && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <MapPin size={14} color="var(--muted)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                            {booking.businesses.address}
                            {booking.businesses.city && `, ${booking.businesses.city}`}
                          </span>
                        </div>
                      )}
                      {booking.businesses?.phone && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted)", width: "14px" }}>📞</span>
                          
                            href={`tel:${booking.businesses.phone}`}
                            style={{ fontSize: "0.875rem", color: "#D4AF37", textDecoration: "none" }}
                          >
                            {booking.businesses.phone}
                          </a>
                        </div>
                      )}
                      {booking.notes && (
                        <div style={{
                          background: "var(--surface-2)", borderRadius: "0.625rem",
                          padding: "0.75rem", marginTop: "0.25rem",
                        }}>
                          <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--muted)", marginBottom: "0.25rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            Notes
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

      {/* Review modal */}
      {reviewBooking && (
        <ReviewModal
          bookingId={reviewBooking.id}
          businessId={reviewBooking.business_id}
          businessName={reviewBooking.businesses?.name || ""}
          serviceName={reviewBooking.services?.name || ""}
          onClose={() => setReviewBooking(null)}
          onSubmitted={() => {
            setReviewedIds((prev) => new Set([...prev, reviewBooking.id]));
            setReviewBooking(null);
            toast.success("Thank you for your review! ⭐");
          }}
        />
      )}
    </div>
  );
}