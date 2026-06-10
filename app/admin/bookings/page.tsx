"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search } from "lucide-react";
import { format } from "date-fns";

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { fetchBookings(); }, [statusFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("bookings")
      .select("*, profiles(full_name), businesses(name), services(name, price)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (statusFilter !== "all") q = q.eq("status", statusFilter);
    const { data } = await q;
    setBookings(data || []);
    setLoading(false);
  };

  const filtered = bookings.filter(b =>
    query
      ? b.businesses?.name?.toLowerCase().includes(query.toLowerCase()) ||
        b.profiles?.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        b.services?.name?.toLowerCase().includes(query.toLowerCase())
      : true
  );

  const totalRevenue = filtered
    .filter(b => ["confirmed", "completed"].includes(b.status))
    .reduce((sum, b) => sum + Number(b.services?.price || 0), 0);

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
        All Bookings
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Platform-wide booking activity.
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { label: "Total", value: bookings.length, color: "var(--charcoal)" },
          { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, color: "#5B8DEF" },
          { label: "Completed", value: bookings.filter(b => b.status === "completed").length, color: "#4CAF7C" },
          { label: "Pending", value: bookings.filter(b => b.status === "pending").length, color: "#D4AF37" },
          { label: "Cancelled", value: bookings.filter(b => b.status === "cancelled").length, color: "#E85C5C" },
          { label: "Revenue", value: `$${totalRevenue.toFixed(0)}`, color: "#4CAF7C" },
        ].map(s => (
          <div key={s.label} className="kpi-card">
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: "700", color: s.color, marginBottom: "0.25rem" }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface)", borderRadius: "0.75rem", padding: "0.625rem 1rem", border: "1px solid var(--border)", flex: 1, minWidth: "180px" }}>
          <Search size={16} color="#D4AF37" />
          <input type="text" placeholder="Search bookings..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "0.9375rem", color: "var(--charcoal)" }} />
        </div>
        <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "0.75rem", padding: "0.2rem", border: "1px solid var(--border)", flexWrap: "wrap" }}>
          {["all", "pending", "confirmed", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: "0.4375rem 0.75rem", borderRadius: "0.5rem", border: "none",
              background: statusFilter === s ? "var(--surface)" : "transparent",
              color: statusFilter === s ? "var(--charcoal)" : "var(--muted)",
              cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600",
              fontFamily: "inherit",
              boxShadow: statusFilter === s ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map((b) => (
            <div key={b.id} style={{
              background: "var(--surface)", borderRadius: "0.875rem", padding: "1rem 1.25rem",
              border: "1px solid var(--border)",
              display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem" }}>
                    {b.profiles?.full_name || b.customer_name || "Customer"}
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>→ {b.businesses?.name}</span>
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                  {b.services?.name}
                  {b.services?.price && <span style={{ color: "#4CAF7C", fontWeight: "600", marginLeft: "0.5rem" }}>${b.services.price}</span>}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--charcoal)" }}>
                    {format(new Date(b.slot_datetime), "MMM d, yyyy")}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {format(new Date(b.slot_datetime), "h:mm a")}
                  </p>
                </div>
                <span className={`badge-${b.status}`}>{b.status}</span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem" }}>No bookings found.</p>
          )}
        </div>
      )}
    </div>
  );
}