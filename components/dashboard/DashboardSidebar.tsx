"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Calendar, User, Bell,
  Search, LogOut, Sparkles, ChevronRight,
  Menu, X, Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/shared/ThemeToggle";
import type { Profile } from "@/types/database";
import { WAITLIST_ENABLED } from "@/lib/features";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
  { icon: Calendar, label: "My Appointments", href: "/dashboard/appointments" },
  { icon: Search, label: "Book a Service", href: "/dashboard/book" },
  ...(WAITLIST_ENABLED ? [{ icon: Clock, label: "My Waitlist", href: "/dashboard/waitlist" }] : []),
  { icon: Bell, label: "Notifications", href: "/dashboard/notifications" },
  { icon: User, label: "Profile", href: "/dashboard/profile" },
];

function SidebarContent({
  profile,
  onNav,
}: {
  profile: Profile | null;
  onNav?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem 1rem" }}>
      {/* Logo */}
      <Link href="/" onClick={onNav} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "1.75rem" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={16} color="white" />
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "var(--charcoal)" }}>
          Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
        </span>
      </Link>

      {/* User card */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(212,175,55,0.06)", borderRadius: "0.875rem", padding: "0.875rem", marginBottom: "1.5rem", border: "1px solid rgba(212,175,55,0.1)" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "1rem", flexShrink: 0 }}>
          {profile?.full_name?.[0]?.toUpperCase() || "G"}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {profile?.full_name || "Welcome!"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>@{profile?.username}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: "700", color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 0.5rem", marginBottom: "0.5rem" }}>
          Menu
        </p>
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} onClick={onNav}
              className={`sidebar-item ${isActive ? "active" : ""}`}
              style={{ marginBottom: "0.125rem" }}>
              <Icon size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ paddingTop: "0.75rem", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
        <ThemeToggle />
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "none", background: "none", cursor: "pointer", color: "#E85C5C", fontSize: "0.875rem", fontWeight: "500", width: "100%", fontFamily: "inherit" }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}

export default function DashboardSidebar({ profile }: { profile: Profile | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Desktop sidebar — visible on md and up */}
      <aside style={{
        width: "260px", minHeight: "100vh",
        background: "var(--surface)", borderRight: "1px solid var(--border)",
        position: "sticky", top: 0, flexShrink: 0,
      }} className="desktop-only">
        <SidebarContent profile={profile} />
      </aside>

      {/* Mobile top bar — visible on mobile only */}
      <div className="mobile-only" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0 1rem", height: "60px",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "var(--charcoal)" }}>
            Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
          </span>
        </Link>
        <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--charcoal)", padding: "0.5rem", display: "flex" }}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}
          />
          {/* Drawer */}
          <div style={{
            position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
            width: "min(280px, 85vw)",
            background: "var(--surface)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.12)",
            overflowY: "auto",
            animation: "slideInLeft 0.25s ease-out",
          }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--charcoal)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={16} />
            </button>
            <SidebarContent profile={profile} onNav={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}