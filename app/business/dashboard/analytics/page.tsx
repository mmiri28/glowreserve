import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  format, subDays, startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
} from "date-fns";
import AnalyticsChart from "@/components/business/AnalyticsChart";
import {
  Calendar, Users, TrendingUp, Star,
  DollarSign, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "var(--charcoal)", marginBottom: "0.75rem" }}>
          No business found
        </h2>
        <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
          Set up your business to start tracking analytics.
        </p>
        <Link href="/business/register" className="btn-gold">
          Set Up Business
        </Link>
      </div>
    );
  }

  const now = new Date();
  const monthStart = startOfMonth(now).toISOString();
  const monthEnd = endOfMonth(now).toISOString();
  const lastMonthStart = startOfMonth(subDays(now, 30)).toISOString();
  const lastMonthEnd = endOfMonth(subDays(now, 30)).toISOString();

  const [
    { count: monthlyBookings },
    { count: lastMonthBookings },
    { data: serviceStats },
    { data: recentBookings },
    { data: weeklyData },
    { data: allBookings },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", monthStart).lte("created_at", monthEnd),
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .eq("business_id", business.id)
      .gte("created_at", lastMonthStart).lte("created_at", lastMonthEnd),
    supabase.from("bookings")
      .select("service_id, services(name, price)")
      .eq("business_id", business.id)
      .in("status", ["confirmed", "completed"])
      .not("service_id", "is", null).limit(200),
    supabase.from("bookings")
      .select("*, profiles(full_name, phone), services(name, price)")
      .eq("business_id", business.id)
      .order("created_at", { ascending: false }).limit(8),
    supabase.from("bookings")
      .select("created_at, services(price)")
      .eq("business_id", business.id)
      .in("status", ["confirmed", "completed"])
      .gte("created_at", subDays(now, 6).toISOString()),
    supabase.from("bookings")
      .select("status, services(price)")
      .eq("business_id", business.id),
  ]);

  // Service popularity
  const serviceCounts: Record<string, { name: string; count: number; revenue: number }> = {};
  (serviceStats || []).forEach((b: any) => {
    if (b.services?.name) {
      const name = b.services.name;
      if (!serviceCounts[name]) serviceCounts[name] = { name, count: 0, revenue: 0 };
      serviceCounts[name].count++;
      serviceCounts[name].revenue += Number(b.services?.price || 0);
    }
  });
  const topServices = Object.values(serviceCounts).sort((a, b) => b.count - a.count).slice(0, 5);
  const topService = topServices[0];

  // Revenue calculations
  const totalRevenue = (allBookings || [])
    .filter((b: any) => ["confirmed", "completed"].includes(b.status))
    .reduce((sum: number, b: any) => sum + Number(b.services?.price || 0), 0);

  const monthlyRevenue = (serviceStats || [])
    .reduce((sum: number, b: any) => sum + Number(b.services?.price || 0), 0);

  // Weekly chart data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    const dayStr = format(day, "yyyy-MM-dd");
    const count = (weeklyData || []).filter((b: any) =>
      format(new Date(b.created_at), "yyyy-MM-dd") === dayStr
    ).length;
    const revenue = (weeklyData || [])
      .filter((b: any) => format(new Date(b.created_at), "yyyy-MM-dd") === dayStr)
      .reduce((sum: number, b: any) => sum + Number(b.services?.price || 0), 0);
    return { day: format(day, "EEE"), count, revenue };
  });

  // Booking status breakdown
  const statusCounts = {
    confirmed: (allBookings || []).filter((b: any) => b.status === "confirmed").length,
    completed: (allBookings || []).filter((b: any) => b.status === "completed").length,
    pending: (allBookings || []).filter((b: any) => b.status === "pending").length,
    cancelled: (allBookings || []).filter((b: any) => b.status === "cancelled").length,
  };

  const bookingGrowth = lastMonthBookings && lastMonthBookings > 0
    ? Math.round(((monthlyBookings || 0) - lastMonthBookings) / lastMonthBookings * 100)
    : 0;

  const KPIs = [
    {
      icon: <Calendar size={22} color="#D4AF37" />,
      label: "Bookings This Month",
      value: monthlyBookings ?? 0,
      sub: bookingGrowth !== 0
        ? `${bookingGrowth > 0 ? "+" : ""}${bookingGrowth}% vs last month`
        : "No change vs last month",
      trend: bookingGrowth,
      bg: "rgba(212,175,55,0.08)",
    },
    {
      icon: <DollarSign size={22} color="#4CAF7C" />,
      label: "Revenue This Month",
      value: `$${monthlyRevenue.toFixed(0)}`,
      sub: `$${totalRevenue.toFixed(0)} total all time`,
      trend: 0,
      bg: "rgba(76,175,124,0.08)",
    },
    {
      icon: <TrendingUp size={22} color="#D4AF37" />,
      label: "Most Popular Service",
      value: topService?.name || "—",
      sub: topService ? `${topService.count} bookings` : "No data yet",
      trend: 0,
      bg: "rgba(212,175,55,0.08)",
    },
    {
      icon: <Star size={22} color="#D4AF37" />,
      label: "Rating",
      value: business.rating > 0 ? `${business.rating} ★` : "No reviews",
      sub: `${business.total_reviews} review${business.total_reviews !== 1 ? "s" : ""}`,
      trend: 0,
      bg: "rgba(212,175,55,0.08)",
    },
  ];

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
          Analytics Overview
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Welcome back — here&apos;s how <strong style={{ color: "var(--charcoal)" }}>{business.name}</strong> is performing.
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        {KPIs.map((kpi) => (
          <div key={kpi.label} className="kpi-card">
            <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              {kpi.icon}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.625rem", fontWeight: "700", color: "var(--charcoal)", lineHeight: 1.2, marginBottom: "0.25rem" }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "0.375rem" }}>{kpi.label}</div>
            {kpi.sub && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem" }}>
                {kpi.trend !== 0 && (
                  kpi.trend > 0
                    ? <ArrowUpRight size={12} color="#4CAF7C" />
                    : <ArrowDownRight size={12} color="#E85C5C" />
                )}
                <span style={{ color: kpi.trend > 0 ? "#4CAF7C" : kpi.trend < 0 ? "#E85C5C" : "var(--muted)" }}>
                  {kpi.sub}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Bookings chart */}
        <div style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "1.25rem" }}>
            Bookings — Last 7 Days
          </h2>
          <AnalyticsChart data={chartData} />
        </div>

        {/* Booking status breakdown */}
        <div style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "1.25rem" }}>
            Booking Status
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {[
              { label: "Completed", count: statusCounts.completed, color: "#4CAF7C", bg: "rgba(76,175,124,0.1)" },
              { label: "Confirmed", count: statusCounts.confirmed, color: "#5B8DEF", bg: "rgba(91,141,239,0.1)" },
              { label: "Pending", count: statusCounts.pending, color: "#D4AF37", bg: "rgba(212,175,55,0.1)" },
              { label: "Cancelled", count: statusCounts.cancelled, color: "#E85C5C", bg: "rgba(232,92,92,0.1)" },
            ].map((item) => {
              const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                    <span style={{ fontSize: "0.875rem", fontWeight: "500", color: "var(--charcoal)" }}>{item.label}</span>
                    <span style={{ fontSize: "0.875rem", fontWeight: "700", color: item.color }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: "8px", background: "var(--surface-2)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: item.color, borderRadius: "9999px", transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top services */}
      {topServices.length > 0 && (
        <div style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "1.25rem" }}>
            Top Services by Bookings
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
            {topServices.map((svc, i) => {
              const maxCount = topServices[0].count;
              const pct = maxCount > 0 ? Math.round((svc.count / maxCount) * 100) : 0;
              return (
                <div key={svc.name} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: i === 0 ? "linear-gradient(135deg,#D4AF37,#B8941F)" : "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "700", color: i === 0 ? "white" : "var(--muted)", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--charcoal)" }}>{svc.name}</span>
                      <div style={{ display: "flex", gap: "1rem" }}>
                        <span style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{svc.count} bookings</span>
                        {svc.revenue > 0 && <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#4CAF7C" }}>${svc.revenue.toFixed(0)}</span>}
                      </div>
                    </div>
                    <div style={{ height: "6px", background: "var(--surface-2)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, #D4AF37, #B8941F)", borderRadius: "9999px" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent bookings */}
      <div style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "var(--charcoal)" }}>
            Recent Bookings
          </h2>
          <Link href="/business/dashboard/appointments" style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#D4AF37", textDecoration: "none" }}>
            View all →
          </Link>
        </div>
        {(recentBookings || []).length === 0 ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>No bookings yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(recentBookings || []).map((b: any) => (
              <div key={b.id} style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "0.875rem",
                background: "var(--surface-2)", borderRadius: "0.75rem",
                flexWrap: "wrap", gap: "0.5rem",
              }}>
                <div style={{ display: "flex", gap: "0.875rem", alignItems: "center" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "0.875rem", flexShrink: 0 }}>
                    {(b.customer_name || b.profiles?.full_name || "?")[0]?.toUpperCase()}
                  </div>
                  <div>
                    <span style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem" }}>
                      {b.customer_name || b.profiles?.full_name || "Customer"}
                    </span>
                    <span style={{ color: "var(--muted)", fontSize: "0.8125rem", marginLeft: "0.5rem" }}>
                      · {b.services?.name}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                  {b.services?.price && (
                    <span style={{ fontWeight: "700", color: "#4CAF7C", fontSize: "0.9375rem" }}>
                      ${Number(b.services.price).toFixed(0)}
                    </span>
                  )}
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
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