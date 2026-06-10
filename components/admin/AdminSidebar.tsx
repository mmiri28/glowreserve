"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Building2, Users,
  Calendar, Sparkles, LogOut, ChevronRight, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/shared/ThemeToggle";

const NAV = [
  { icon: LayoutDashboard, label: "Overview", href: "/admin" },
  { icon: Building2, label: "Businesses", href: "/admin/businesses" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Calendar, label: "All Bookings", href: "/admin/bookings" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside style={{
      width: "240px", minHeight: "100vh",
      background: "var(--surface)", borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "1.5rem 1rem", position: "sticky", top: 0, flexShrink: 0,
    }} className="hidden md:flex">
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "2rem", padding: "0 0.5rem" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={16} color="white" />
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "var(--charcoal)" }}>
          Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
        </span>
      </Link>

      <div style={{ background: "rgba(232,92,92,0.08)", border: "1px solid rgba(232,92,92,0.2)", borderRadius: "0.75rem", padding: "0.625rem 0.875rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Shield size={14} color="#E85C5C" />
        <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "#E85C5C", letterSpacing: "0.06em" }}>
          ADMIN PANEL
        </p>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              style={{ marginBottom: "0.125rem" }}>
              <Icon size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      <div style={{ paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <ThemeToggle />
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", fontSize: "0.875rem", fontWeight: "500", color: "var(--muted)", textDecoration: "none" }}>
          ← Customer Dashboard
        </Link>
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "none", background: "none", cursor: "pointer", color: "#E85C5C", fontSize: "0.875rem", fontWeight: "500", width: "100%", fontFamily: "inherit" }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </aside>
  );
}