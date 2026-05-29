import { createServerSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Sparkles } from "lucide-react";
import { format } from "date-fns";
import QuickActions from "@/components/dashboard/QuickActions";

export default async function DashboardHome() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: upcomingBookings }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase
      .from("bookings")
      .select(`*, businesses(name, address, logo_url), services(name, duration_minutes)`)
      .eq("customer_id", user!.id)
      .in("status", ["pending", "confirmed"])
      .gte("slot_datetime", new Date().toISOString())
      .order("slot_datetime", { ascending: true })
      .limit(3),
  ]);

  const nextBooking = upcomingBookings?.[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ padding: "1.25rem", maxWidth: "900px" }} className="md:p-8">
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
          fontWeight: "700",
          color: "var(--charcoal)",
          marginBottom: "0.25rem",
        }}>
          {greeting}, {profile?.full_name?.split(" ")[0] || "there"}! 👋
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.9375rem" }}>
          Ready for your next glow-up?
        </p>
      </div>

      {/* Next Appointment */}
      {nextBooking ? (
        <div style={{
          background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
          borderRadius: "1.25rem",
          padding: "1.5rem",
          marginBottom: "1.5rem",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", position: "relative" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", background: "rgba(212,175,55,0.15)", borderRadius: "9999px", padding: "0.25rem 0.75rem", marginBottom: "0.75rem" }}>
                <Sparkles size={12} color="#D4AF37" />
                <span style={{ fontSize: "0.6875rem", fontWeight: "600", color: "#D4AF37" }}>NEXT APPOINTMENT</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "600", color: "white", marginBottom: "0.25rem" }}>
                {(nextBooking as any).services?.name || "Service"}
              </h3>
              <p style={{ color: "#8A8680", fontSize: "0.9375rem", marginBottom: "0.75rem" }}>
                at {(nextBooking as any).businesses?.name}
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Calendar size={14} color="#D4AF37" />
                  <span style={{ fontSize: "0.875rem", color: "#E8E2D9" }}>
                    {format(new Date(nextBooking.slot_datetime), "EEE, MMM d")}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Clock size={14} color="#D4AF37" />
                  <span style={{ fontSize: "0.875rem", color: "#E8E2D9" }}>
                    {format(new Date(nextBooking.slot_datetime), "h:mm a")}
                  </span>
                </div>
              </div>
            </div>
            <span className={`badge-${nextBooking.status}`}>
              {nextBooking.status.charAt(0).toUpperCase() + nextBooking.status.slice(1)}
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          background: "rgba(212,175,55,0.05)",
          border: "2px dashed rgba(212,175,55,0.25)",
          borderRadius: "1.25rem",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✨</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
            No upcoming appointments
          </h3>
          <p style={{ color: "var(--muted)", fontSize: "0.9375rem", marginBottom: "1.25rem" }}>
            Ready for your next beauty treatment?
          </p>
          <Link href="/dashboard/book" className="btn-gold" style={{ display: "inline-flex" }}>
            Book a Service
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "1rem" }}>
        Quick Book
      </h2>
      <QuickActions />

      {/* Upcoming list */}
      {upcomingBookings && upcomingBookings.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)" }}>
              Upcoming
            </h2>
            <Link href="/dashboard/appointments" style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", fontWeight: "600", color: "#D4AF37", textDecoration: "none" }}>
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {upcomingBookings.map((booking: any) => (
              <div key={booking.id} style={{
                background: "var(--surface)",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
              }}>
                <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                  <div style={{ width: "42px", height: "42px", borderRadius: "0.75rem", background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.25rem", flexShrink: 0 }}>
                    ✨
                  </div>
                  <div>
                    <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--charcoal)" }}>
                      {booking.services?.name}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {booking.businesses?.name}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--charcoal)" }}>
                      {format(new Date(booking.slot_datetime), "MMM d")}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {format(new Date(booking.slot_datetime), "h:mm a")}
                    </p>
                  </div>
                  <span className={`badge-${booking.status}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}