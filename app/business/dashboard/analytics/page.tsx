import { createServerSupabaseClient } from "@/lib/supabase/server";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import AnalyticsChart from "@/components/business/AnalyticsChart";
import { Calendar, Users, TrendingUp, Star } from "lucide-react";

export default async function AnalyticsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user!.id)
    .single();

  if (!business) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#8A8680" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "#1A1A1A", marginBottom: "0.75rem" }}>
          No business found
        </h2>
        <p>Please <a href="/business/register" style={{ color: "#D4AF37" }}>set up your business</a> first.</p>
      </div>
    );
  }

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();

  const [
    { count: monthlyBookings },
    { data: serviceStats },
    { data: recentBookings },
    { data: weeklyData },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd),
    supabase.from("bookings")
      .select("service_id, services(name)")
      .eq("business_id", business.id)
      .not("service_id", "is", null)
      .limit(100),
    supabase.from("bookings")
      .select("*, profiles(full_name, phone), services(name)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(5),
    // last 7 days bookings
    supabase.from("bookings")
      .select("created_at")
      .eq("business_id", business.id)
      .gte("created_at", subDays(now, 6).toISOString()),
  ]);

  // Calculate most popular service
  const serviceCounts: Record<string, { name: string; count: number }> = {};
  ((serviceStats || []) as any[]).forEach((b: any) => {
    if (b.services?.name) {
      const name = b.services.name;
      serviceCounts[name] = serviceCounts[name] || { name, count: 0 };
      serviceCounts[name].count++;
    }
  });
  const topService = Object.values(serviceCounts).sort((a, b) => b.count - a.count)[0];

  // Build weekly chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    const count = (weeklyData || []).filter((b: any) =>
      format(new Date(b.created_at), "yyyy-MM-dd") === dayStr
    ).length;
    return { day: format(day, "EEE"), count };
  });

  const KPIs = [
    {
      icon: <Calendar size={22} color="#D4AF37" />,
      label: "Bookings This Month",
      value: monthlyBookings ?? 0,
      bg: "rgba(212,175,55,0.08)",
    },
    {
      icon: <TrendingUp size={22} color="#4CAF7C" />,
      label: "Most Popular Service",
      value: topService?.name || "—",
      bg: "rgba(76,175,124,0.08)",
    },
    {
      icon: <Star size={22} color="#D4AF37" />,
      label: "Rating",
      value: business.rating > 0 ? `${business.rating} ★` : "No reviews yet",
      bg: "rgba(212,175,55,0.08)",
    },
    {
      icon: <Users size={22} color="#5B8DEF" />,
      label: "Total Reviews",
      value: business.total_reviews,
      bg: "rgba(91,141,239,0.08)",
    },
  ];

  return (
    <div style={{ padding: "2rem 2rem 4rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.875rem", fontWeight: "700", color: "#1A1A1A",
          marginBottom: "0.375rem",
        }}>
          Analytics Overview
        </h1>
        <p style={{ color: "#8A8680" }}>Welcome back — here's how {business.name} is doing.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {KPIs.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div style={{
              width: "44px", height: "44px", borderRadius: "0.75rem",
              background: kpi.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "1rem",
            }}>
              {kpi.icon}
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.625rem", fontWeight: "700",
              color: "#1A1A1A", lineHeight: 1.2, marginBottom: "0.25rem",
            }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#8A8680" }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{
        background: "white", borderRadius: "1.25rem",
        padding: "1.75rem", border: "1px solid #E8E2D9",
        marginBottom: "2rem",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.125rem", fontWeight: "600", color: "#1A1A1A",
          marginBottom: "1.5rem",
        }}>
          Bookings — Last 7 Days
        </h2>
        <AnalyticsChart data={chartData} />
      </div>

      {/* Recent bookings */}
      <div style={{
        background: "white", borderRadius: "1.25rem",
        padding: "1.75rem", border: "1px solid #E8E2D9",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.125rem", fontWeight: "600", color: "#1A1A1A",
          marginBottom: "1.25rem",
        }}>
          Recent Bookings
        </h2>
        {(recentBookings || []).length === 0 ? (
          <p style={{ color: "#8A8680", textAlign: "center", padding: "2rem" }}>No bookings yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(recentBookings || []).map((b: any) => (
              <div key={b.id} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "0.875rem",
                background: "#FDFBF7", borderRadius: "0.75rem",
                flexWrap: "wrap", gap: "0.5rem",
              }}>
                <div>
                  <span style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem" }}>
                    {b.customer_name || b.profiles?.full_name || "Customer"}
                  </span>
                  <span style={{ color: "#8A8680", fontSize: "0.8125rem", marginLeft: "0.5rem" }}>
                    · {b.services?.name}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontSize: "0.8125rem", color: "#8A8680" }}>
                    {format(new Date(b.created_at), "MMM d, h:mm a")}
                  </span>
                  <span className={`badge-${b.status}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
