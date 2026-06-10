import { createServerSupabaseClient } from "@/lib/supabase/server";
import { Users, Building2, Calendar, Star } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  const [
    { count: totalUsers },
    { count: totalBusinesses },
    { count: pendingBusinesses },
    { count: totalBookings },
    { data: recentBusinesses },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*", { count: "exact", head: true }).eq("is_verified", false),
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("businesses").select("*, profiles(full_name, username)")
      .order("created_at", { ascending: false }).limit(8),
    supabase.from("profiles").select("*")
      .order("created_at", { ascending: false }).limit(6),
  ]);

  const KPIs = [
    { icon: <Users size={22} color="#5B8DEF" />, label: "Total Users", value: totalUsers ?? 0, bg: "rgba(91,141,239,0.08)", href: "/admin/users" },
    { icon: <Building2 size={22} color="#D4AF37" />, label: "Total Businesses", value: totalBusinesses ?? 0, bg: "rgba(212,175,55,0.08)", href: "/admin/businesses" },
    { icon: <Star size={22} color="#E85C5C" />, label: "Pending Verification", value: pendingBusinesses ?? 0, bg: "rgba(232,92,92,0.08)", href: "/admin/businesses?filter=unverified" },
    { icon: <Calendar size={22} color="#4CAF7C" />, label: "Total Bookings", value: totalBookings ?? 0, bg: "rgba(76,175,124,0.08)", href: "/admin/bookings" },
  ];

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
          Admin Dashboard
        </h1>
        <p style={{ color: "var(--muted)" }}>Platform overview and management.</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {KPIs.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} style={{ textDecoration: "none" }}>
            <div className="kpi-card" style={{ cursor: "pointer", transition: "all 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.borderColor = "#D4AF37"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"}>
              <div style={{ width: "44px", height: "44px", borderRadius: "0.75rem", background: kpi.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                {kpi.icon}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: "700", color: "var(--charcoal)", lineHeight: 1.2, marginBottom: "0.25rem" }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{kpi.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        {/* Recent businesses */}
        <div style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "var(--charcoal)" }}>
              Recent Businesses
            </h2>
            <Link href="/admin/businesses" style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#D4AF37", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(recentBusinesses || []).map((biz: any) => (
              <div key={biz.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "var(--surface-2)", borderRadius: "0.75rem" }}>
                <div>
                  <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem" }}>{biz.name}</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{biz.category} · {biz.city}</p>
                </div>
                {biz.is_verified ? (
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#4CAF7C", background: "rgba(76,175,124,0.1)", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                    ✓ Verified
                  </span>
                ) : (
                  <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#E85C5C", background: "rgba(232,92,92,0.1)", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
                    Unverified
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent users */}
        <div style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "var(--charcoal)" }}>
              Recent Users
            </h2>
            <Link href="/admin/users" style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#D4AF37", textDecoration: "none" }}>
              View all →
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {(recentUsers || []).map((u: any) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem", background: "var(--surface-2)", borderRadius: "0.75rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", flexShrink: 0 }}>
                  {u.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.full_name || "—"}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>@{u.username}</p>
                </div>
                <span style={{
                  fontSize: "0.75rem", fontWeight: "600", padding: "0.2rem 0.625rem", borderRadius: "9999px",
                  background: u.role === "business_owner" ? "rgba(212,175,55,0.1)" : "rgba(91,141,239,0.1)",
                  color: u.role === "business_owner" ? "#D4AF37" : "#5B8DEF",
                }}>
                  {u.role === "business_owner" ? "Business" : "Customer"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}