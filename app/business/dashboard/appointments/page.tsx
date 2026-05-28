"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Phone, Check, X, Clock, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

export default function BusinessAppointmentsPage() {
  const [tab, setTab] = useState<"pending" | "confirmed" | "all">("pending");
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
      if (biz) {
        setBusinessId(biz.id);
        fetchBookings(biz.id, tab);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (businessId) fetchBookings(businessId, tab);
  }, [tab, businessId]);

  const fetchBookings = async (bizId: string, currentTab: string) => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase
      .from("bookings")
      .select(`
        *,
        profiles(full_name, phone, avatar_url),
        services(name, duration_minutes, price)
      `)
      .eq("business_id", bizId)
      .order("slot_datetime", { ascending: true });

    if (currentTab === "pending") query = query.eq("status", "pending");
    else if (currentTab === "confirmed") query = query.in("status", ["confirmed", "completed"]);

    const { data } = await query;
    setBookings(data || []);
    setLoading(false);
  };

  const updateStatus = async (bookingId: string, status: string, customerId: string, slotId?: string) => {
    const supabase = createClient();
    const updates: any = { status };

    const { error } = await supabase.from("bookings").update(updates).eq("id", bookingId);
    if (error) { toast.error("Failed to update booking."); return; }

    // If cancelling, free the slot
    if (status === "cancelled" && slotId) {
      await supabase.from("slots").update({ status: "free" }).eq("id", slotId);
    }

    // Send notification to customer
    await fetch("/api/notifications/booking-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, status, customerId }),
    });

    toast.success(`Booking ${status}!`);
    if (businessId) fetchBookings(businessId, tab);
  };

  const pendingCount = bookings.filter(b => b.status === "pending").length;

  return (
    <div style={{ padding: "2rem 2rem 4rem" }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.875rem", fontWeight: "700", color: "#1A1A1A",
        marginBottom: "0.375rem",
      }}>
        Appointment Management
      </h1>
      <p style={{ color: "#8A8680", marginBottom: "2rem" }}>
        Review, approve, and manage incoming appointment requests.
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", background: "#F5F0E8", borderRadius: "0.875rem", padding: "0.25rem", width: "fit-content", marginBottom: "2rem" }}>
        {(["pending", "confirmed", "all"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "0.625rem 1.25rem", borderRadius: "0.625rem",
            border: "none", cursor: "pointer", fontSize: "0.875rem",
            fontWeight: "600", transition: "all 0.2s",
            background: tab === t ? "white" : "transparent",
            color: tab === t ? "#1A1A1A" : "#8A8680",
            boxShadow: tab === t ? "0 2px 8px rgba(26,26,26,0.08)" : "none",
            display: "flex", alignItems: "center", gap: "0.375rem",
          }}>
            {t === "pending" ? "Pending Requests" : t === "confirmed" ? "Confirmed" : "All"}
            {t === "pending" && pendingCount > 0 && tab !== "pending" && (
              <span style={{
                background: "#D4AF37", color: "white",
                fontSize: "0.6875rem", fontWeight: "700",
                padding: "0.1rem 0.45rem", borderRadius: "9999px",
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "#8A8680" }}>Loading...</p>
      ) : bookings.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "#1A1A1A", marginBottom: "0.5rem" }}>
            {tab === "pending" ? "No pending requests" : "No appointments found"}
          </h3>
          <p style={{ color: "#8A8680" }}>
            {tab === "pending" ? "All clear! New requests will appear here." : "Appointments will show up here once customers book."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} onUpdate={updateStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking: b, onUpdate }: { booking: any; onUpdate: Function }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      background: "white", borderRadius: "1.25rem",
      border: b.status === "pending" ? "2px solid rgba(212,175,55,0.4)" : "1px solid #E8E2D9",
      overflow: "hidden", transition: "all 0.2s",
    }}>
      <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        {/* Avatar */}
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          background: "linear-gradient(135deg, #D4AF37, #B8941F)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "700", fontSize: "1rem", flexShrink: 0,
        }}>
          {b.profiles?.full_name?.[0]?.toUpperCase() || b.customer_name?.[0]?.toUpperCase() || "?"}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: "180px" }}>
          <div style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem" }}>
            {b.profiles?.full_name || b.customer_name || "Customer"}
          </div>
          <div style={{ color: "#8A8680", fontSize: "0.8125rem" }}>
            {b.services?.name} · {b.services?.duration_minutes} min
          </div>
        </div>

        {/* DateTime */}
        <div style={{ textAlign: "center", minWidth: "120px" }}>
          <div style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem" }}>
            {format(new Date(b.slot_datetime), "MMM d")}
          </div>
          <div style={{ color: "#8A8680", fontSize: "0.8125rem" }}>
            {format(new Date(b.slot_datetime), "h:mm a")}
          </div>
        </div>

        {/* Status + Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className={`badge-${b.status}`}>
            {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
          </span>

          {b.status === "pending" && (
            <>
              <button
                onClick={() => onUpdate(b.id, "confirmed", b.customer_id, b.slot_id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.5rem 1rem", borderRadius: "0.625rem",
                  background: "rgba(76,175,124,0.1)", border: "1px solid rgba(76,175,124,0.3)",
                  color: "#4CAF7C", fontWeight: "600", fontSize: "0.8125rem", cursor: "pointer",
                }}>
                <Check size={14} /> Approve
              </button>
              <button
                onClick={() => onUpdate(b.id, "cancelled", b.customer_id, b.slot_id)}
                style={{
                  display: "flex", alignItems: "center", gap: "0.25rem",
                  padding: "0.5rem 1rem", borderRadius: "0.625rem",
                  background: "rgba(232,92,92,0.08)", border: "1px solid rgba(232,92,92,0.25)",
                  color: "#E85C5C", fontWeight: "600", fontSize: "0.8125rem", cursor: "pointer",
                }}>
                <X size={14} /> Decline
              </button>
            </>
          )}

          {b.status === "confirmed" && (
            <button
              onClick={() => onUpdate(b.id, "completed", b.customer_id)}
              style={{
                padding: "0.5rem 1rem", borderRadius: "0.625rem",
                background: "rgba(91,141,239,0.1)", border: "1px solid rgba(91,141,239,0.3)",
                color: "#5B8DEF", fontWeight: "600", fontSize: "0.8125rem", cursor: "pointer",
              }}>
              Mark Complete
            </button>
          )}

          <button onClick={() => setExpanded(!expanded)} style={{
            background: "none", border: "none", cursor: "pointer", color: "#8A8680",
          }}>
            <ChevronDown size={18} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{
          borderTop: "1px solid #E8E2D9",
          padding: "1rem 1.5rem",
          background: "#FDFBF7",
          display: "flex", gap: "2rem", flexWrap: "wrap",
        }}>
          {(b.profiles?.phone || b.customer_phone) && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Phone size={15} color="#D4AF37" />
              <a href={`tel:${b.profiles?.phone || b.customer_phone}`}
                style={{ color: "#1A1A1A", fontWeight: "600", fontSize: "0.9375rem", textDecoration: "none" }}>
                {b.profiles?.phone || b.customer_phone}
              </a>
            </div>
          )}
          {b.services?.price && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
              <span style={{ color: "#8A8680", fontSize: "0.875rem" }}>Price:</span>
              <span style={{ fontWeight: "600", color: "#D4AF37" }}>${b.services.price}</span>
            </div>
          )}
          {b.notes && (
            <div>
              <span style={{ color: "#8A8680", fontSize: "0.875rem" }}>Note: </span>
              <span style={{ color: "#1A1A1A", fontSize: "0.875rem" }}>{b.notes}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Clock size={15} color="#8A8680" />
            <span style={{ color: "#8A8680", fontSize: "0.8125rem" }}>
              Booked {format(new Date(b.created_at), "MMM d 'at' h:mm a")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
