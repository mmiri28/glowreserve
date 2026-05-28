"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, Scissors, Clock,
  CalendarCheck, LogOut, Sparkles, ChevronRight, BarChart2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { icon: BarChart2, label: "Analytics", href: "/business/dashboard/analytics" },
  { icon: Calendar, label: "Master Calendar", href: "/business/dashboard/calendar" },
  { icon: CalendarCheck, label: "Appointments", href: "/business/dashboard/appointments" },
  { icon: Scissors, label: "Services", href: "/business/dashboard/services" },
  { icon: Clock, label: "Availability", href: "/business/dashboard/availability" },
];

export default function BusinessSidebar({ profile, business }: { profile: any; business: any }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside style={{
      width: "260px", minHeight: "100vh",
      background: "#1A1A1A",
      display: "flex", flexDirection: "column",
      padding: "1.5rem 1rem",
      position: "sticky", top: 0,
      flexShrink: 0,
    }}
      className="hidden md:flex">
      {/* Logo */}
      <Link href="/" style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        textDecoration: "none", marginBottom: "2rem", padding: "0 0.5rem",
      }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "8px",
          background: "linear-gradient(135deg, #D4AF37, #B8941F)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={16} color="white" />
        </div>
        <span style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.125rem", fontWeight: "700", color: "white",
        }}>
          Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
        </span>
      </Link>

      {/* Business info */}
      <div style={{
        borderRadius: "0.875rem", padding: "0.875rem",
        marginBottom: "1.5rem",
        background: "rgba(212,175,55,0.08)",
        border: "1px solid rgba(212,175,55,0.15)",
      }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
          Business Account
        </div>
        <div style={{ fontSize: "0.9375rem", fontWeight: "600", color: "white" }}>
          {business?.name || "Set up your business"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#8A8680" }}>
          @{profile?.username}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        <p style={{
          fontSize: "0.6875rem", fontWeight: "700",
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.1em", textTransform: "uppercase",
          padding: "0 0.5rem", marginBottom: "0.5rem",
        }}>
          Management
        </p>
        {NAV.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "0.75rem",
              fontSize: "0.875rem", fontWeight: "500",
              textDecoration: "none",
              marginBottom: "0.125rem",
              transition: "all 0.2s",
              background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
              color: isActive ? "#D4AF37" : "rgba(255,255,255,0.6)",
            }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}>
              <Icon size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* View public profile */}
      {business?.slug && (
        <Link href={`/business/${business.slug}`}
          style={{
            display: "flex", alignItems: "center", gap: "0.625rem",
            padding: "0.75rem 1rem", borderRadius: "0.75rem",
            fontSize: "0.8125rem", fontWeight: "500",
            color: "rgba(255,255,255,0.4)",
            textDecoration: "none",
            border: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "0.5rem",
          }}>
          <Sparkles size={15} />
          View Public Profile
        </Link>
      )}

      <button onClick={handleLogout} style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.75rem 1rem", borderRadius: "0.75rem",
        background: "none", border: "none", cursor: "pointer",
        color: "rgba(232,92,92,0.8)", fontSize: "0.875rem", fontWeight: "500",
        width: "100%",
      }}
        onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(232,92,92,0.08)"}
        onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}>
        <LogOut size={18} /> Sign Out
      </button>
    </aside>
  );
}
