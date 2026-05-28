"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Calendar, Clock, MapPin, Star } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import ReviewModal from "@/components/shared/ReviewModal";

export default function AppointmentsPage() {
  const [tab, setTab] = useState<"active" | "history">("active");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewTarget, setReviewTarget] = useState<any | null>(null);

  useEffect(() => { fetchBookings(); }, [tab]);

  const fetchBookings = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const query = supabase
      .from("bookings")
      .select(`*, businesses(name, address, city, slug, logo_url), services(name, duration_minutes, price)`)
      .eq("customer_id", user.id)
      .order("slot_datetime", { ascending: tab === "active" });

    if (tab === "active") query.in("status", ["pending", "confirmed"]);
    else query.in("status", ["completed", "cancelled", "rescheduled"]);

    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  };

  const handleCancel = async (bookingId: string, slotId: string) => {
    if (!confirm("Cancel this appointment?")) return;
    const supabase = createClient();
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
    if (slotId) await supabase.from("slots").update({ status: "free" }).eq("id", slotId);
    toast.success("Appointment cancelled.");
    fetchBookings();
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "#1A1A1A", marginBottom: "0.375rem" }}>
        My Appointments
      </h1>
      <p style={{ color: "#8A8680", marginBottom: "2rem" }}>Manage all your beauty appointments in one place.</p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", background: "#F5F0E8", borderRadius: "0.875rem", padding: "0.25rem", width: "fit-content", marginBottom: "2rem" }}>
        {(["active", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "0.625rem 1.25rem", borderRadius: "0.625rem", border: "none",
            cursor: "pointer", fontSize: "0.875rem", fontWeight: "600", transition: "all 0.2s",
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#1A1A1A" : "#8A8680",
            boxShadow: tab === t ? "0 2px 8px rgba(26,26,26,0.08)" : "none",
          }}>
            {t === "active" ? "Upcoming" : "History"}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "#8A8680" }}>Loading appointments...</div>
      ) : bookings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{tab === "active" ? "📅" : "📋"}</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "#1A1A1A", marginBottom: "0.5rem" }}>
            {tab === "active" ? "No upcoming appointments" : "No past appointments"}
          </h3>
          <p style={{ color: "#8A8680", marginBottom: "1.5rem" }}>
            {tab === "active" ? "Ready to book your next beauty treatment?" : "Your completed appointments will appear here."}
          </p>
          {tab === "active" && <Link href="/dashboard/book" className="btn-gold">Book Now</Link>}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bookings.map((booking) => (
            <div key={booking.id} style={{ background: "white", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid #E8E2D9", boxShadow: "0 2px 8px rgba(26,26,26,0.04)" }}>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "0.875rem", background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>
                    {booking.businesses?.logo_url
                      ? <img src={booking.businesses.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.75rem" }} />
                      : "✨"}
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "0.125rem" }}>
                      {booking.services?.name}
                    </h3>
                    <p style={{ color: "#8A8680", fontSize: "0.875rem" }}>{booking.businesses?.name}</p>
                  </div>
                </div>
                <span className={`badge-${booking.status}`} style={{ fontSize: "0.8125rem" }}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              {/* Details */}
              <div style={{ display: "flex", gap: "1.25rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "#4A4540" }}>
                  <Calendar size={14} color="#D4AF37" />{format(new Date(booking.slot_datetime), "EEEE, MMMM d, yyyy")}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "#4A4540" }}>
                  <Clock size={14} color="#D4AF37" />{format(new Date(booking.slot_datetime), "h:mm a")}
                </span>
                {booking.businesses?.city && (
                  <span style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", color: "#4A4540" }}>
                    <MapPin size={14} color="#D4AF37" />{booking.businesses.city}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
                {tab === "active" && (
                  <>
                    <button onClick={() => handleCancel(booking.id, booking.slot_id)} style={{ padding: "0.5rem 1rem", borderRadius: "0.625rem", border: "1px solid rgba(232,92,92,0.3)", background: "rgba(232,92,92,0.05)", color: "#E85C5C", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer" }}>
                      Cancel
                    </button>
                    {booking.businesses?.slug && (
                      <Link href={`/business/${booking.businesses.slug}`} style={{ padding: "0.5rem 1rem", borderRadius: "0.625rem", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37", fontSize: "0.8125rem", fontWeight: "600", textDecoration: "none" }}>
                        View Business
                      </Link>
                    )}
                  </>
                )}
                {tab === "history" && (
                  <>
                    {booking.businesses?.slug && (
                      <Link href={`/dashboard/book?business=${booking.business_id}`} className="btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>
                        Book Again
                      </Link>
                    )}
                    {booking.status === "completed" && (
                      <button
                        onClick={() => setReviewTarget(booking)}
                        className="btn-gold"
                        style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.375rem" }}
                      >
                        <Star size={14} />Leave Review
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          bookingId={reviewTarget.id}
          businessId={reviewTarget.business_id}
          businessName={reviewTarget.businesses?.name}
          serviceName={reviewTarget.services?.name}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => { setReviewTarget(null); fetchBookings(); }}
        />
      )}
    </div>
  );
}
