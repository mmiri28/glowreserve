"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, BellOff, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import Link from "next/link";

export default function WaitlistPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchWaitlist(); }, []);

  const fetchWaitlist = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("waitlist")
      .select("*, businesses(name, slug, city), services(name)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    setEntries(data || []);
    setLoading(false);
  };

  const handleLeave = async (id: string) => {
    const res = await fetch("/api/waitlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ waitlistId: id }),
    });
    if (res.ok) {
      toast.success("Removed from waitlist");
      fetchWaitlist();
    }
  };

  const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    waiting:  { bg: "rgba(212,175,55,0.1)", color: "#D4AF37", label: "Waiting" },
    notified: { bg: "rgba(76,175,124,0.1)", color: "#4CAF7C", label: "Slot Available!" },
    booked:   { bg: "rgba(91,141,239,0.1)", color: "#5B8DEF", label: "Booked" },
    expired:  { bg: "var(--surface-2)", color: "var(--muted)", label: "Expired" },
  };

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
        My Waitlist
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        You'll get notified the moment a slot opens up.
      </p>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "1.25rem", border: "2px dashed rgba(212,175,55,0.25)" }}>
          <Bell size={40} color="rgba(212,175,55,0.4)" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
            No waitlist entries
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            When a business is fully booked, you can join the waitlist and get notified instantly when a slot opens.
          </p>
          <Link href="/explore" className="btn-gold">Find Businesses</Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {entries.map((entry) => {
            const style = STATUS_STYLES[entry.status] || STATUS_STYLES.waiting;
            return (
              <div key={entry.id} style={{
                background: "var(--surface)", borderRadius: "1.25rem",
                padding: "1.25rem 1.5rem", border: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between",
                alignItems: "center", flexWrap: "wrap", gap: "1rem",
              }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", background: style.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Bell size={20} color={style.color} />
                  </div>
                  <div>
                    <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                      {entry.businesses?.name}
                      {entry.services?.name && (
                        <span style={{ color: "var(--muted)", fontWeight: "400" }}> · {entry.services.name}</span>
                      )}
                    </p>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
                        <Calendar size={13} />
                        {format(new Date(entry.preferred_date), "EEEE, MMMM d, yyyy")}
                      </span>
                      {entry.preferred_time_start && (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
                          <Clock size={13} />
                          {entry.preferred_time_start} – {entry.preferred_time_end}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: "600", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: style.bg, color: style.color }}>
                    {style.label}
                  </span>
                  {entry.status === "notified" && (
                    <Link href={`/business/${entry.businesses?.slug}`} className="btn-gold" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>
                      Book Now →
                    </Link>
                  )}
                  {entry.status === "waiting" && (
                    <button onClick={() => handleLeave(entry.id)} style={{
                      display: "flex", alignItems: "center", gap: "0.375rem",
                      background: "none", border: "1px solid var(--border)",
                      borderRadius: "0.625rem", padding: "0.5rem 0.875rem",
                      cursor: "pointer", color: "var(--muted)", fontSize: "0.8125rem",
                      fontWeight: "600", fontFamily: "inherit",
                    }}>
                      <BellOff size={14} /> Leave
                    </button>
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