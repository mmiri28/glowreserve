"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  User,
  Bell,
  Search,
  LogOut,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
  { icon: Calendar, label: "My Appointments", href: "/dashboard/appointments" },
  { icon: Search, label: "Book a Service", href: "/dashboard/book" },
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
];

export default function DashboardSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <aside style={{
      width: "260px",
      minHeight: "100vh",
      background: "white",
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      padding: "1.5rem 1rem",
      position: "sticky",
      top: 0,
      boxShadow: "1px 0 12px rgba(26,26,26,0.04)",
      flexShrink: 0,
    }}
      className="hidden md:flex">
      {/* Logo */}
      <Link href="/" style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        textDecoration: "none",
        marginBottom: "2rem",
        padding: "0 0.5rem",
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
          fontSize: "1.125rem",
          fontWeight: "700",
          color: "#1A1A1A",
        }}>
          Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
        </span>
      </Link>

      {/* Avatar / User info */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "rgba(212,175,55,0.06)",
        borderRadius: "0.875rem",
        padding: "0.875rem",
        marginBottom: "1.5rem",
        border: "1px solid rgba(212,175,55,0.1)",
      }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "linear-gradient(135deg, #D4AF37, #B8941F)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white",
          fontWeight: "700",
          fontSize: "1rem",
          flexShrink: 0,
        }}>
          {profile?.full_name?.[0]?.toUpperCase() || "G"}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#1A1A1A",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {profile?.full_name || "Welcome!"}
          </div>
          <div style={{
            fontSize: "0.75rem",
            color: "#8A8680",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            @{profile?.username}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <p style={{
          fontSize: "0.6875rem",
          fontWeight: "700",
          color: "#8A8680",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "0 0.5rem",
          marginBottom: "0.5rem",
        }}>
          Menu
        </p>
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              style={{ marginBottom: "0.125rem" }}>
              <Icon size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="sidebar-item"
        style={{
          border: "none",
          background: "none",
          width: "100%",
          cursor: "pointer",
          marginTop: "0.5rem",
          color: "#E85C5C",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = "rgba(232,92,92,0.06)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }}>
        <LogOut size={18} />
        Sign Out
      </button>
    </aside>
  );
}
