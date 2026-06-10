"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Calendar, Scissors, Clock, CalendarCheck,
  LogOut, Sparkles, ChevronRight, BarChart2,
  Menu, X, Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/shared/ThemeToggle";

const NAV = [
  { icon: BarChart2, label: "Analytics", href: "/business/dashboard/analytics" },
  { icon: Calendar, label: "Calendar", href: "/business/dashboard/calendar" },
  { icon: CalendarCheck, label: "Appointments", href: "/business/dashboard/appointments" },
  { icon: Scissors, label: "Services", href: "/business/dashboard/services" },
  { icon: Users, label: "Staff", href: "/business/dashboard/staff" },
  { icon: Clock, label: "Availability", href: "/business/dashboard/availability" },
  { icon: Users, label: "Customers", href: "/business/dashboard/customers" },
];

function SidebarContent({
  profile,
  business,
  onNav,
}: {
  profile: any;
  business: any;
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "1.5rem 1rem", background: "#1A1A1A", minHeight: "100%" }}>
      {/* Logo */}
      <Link href="/" onClick={onNav} style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "1.75rem" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={16} color="white" />
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "white" }}>
          Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
        </span>
      </Link>

      {/* Business info */}
      <div style={{ borderRadius: "0.875rem", padding: "0.875rem", marginBottom: "1.5rem", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.15)" }}>
        <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
          Business Account
        </div>
        <div style={{ fontSize: "0.9375rem", fontWeight: "600", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {business?.name || "Set up your business"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "#8A8680" }}>@{profile?.username}</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: "700", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 0.5rem", marginBottom: "0.5rem" }}>
          Management
        </p>
        {NAV.map(({ icon: Icon, label, href }) => {
          const isActive = pathname === href;
          return (
            <Link key={href} href={href} onClick={onNav} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.75rem 1rem", borderRadius: "0.75rem",
              fontSize: "0.875rem", fontWeight: "500",
              textDecoration: "none", marginBottom: "0.125rem",
              transition: "all 0.2s",
              background: isActive ? "rgba(212,175,55,0.12)" : "transparent",
              color: isActive ? "#D4AF37" : "rgba(255,255,255,0.65)",
            }}>
              <Icon size={18} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
        <ThemeToggle />
        {business?.slug && (
          <Link href={`/business/${business.slug}`} onClick={onNav} style={{ display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", fontSize: "0.8125rem", fontWeight: "500", color: "rgba(255,255,255,0.4)", textDecoration: "none", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Sparkles size={15} /> View Public Profile
          </Link>
        )}
        <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", border: "none", background: "none", cursor: "pointer", color: "rgba(232,92,92,0.8)", fontSize: "0.875rem", fontWeight: "500", width: "100%", fontFamily: "inherit" }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}

export default function BusinessSidebar({
  profile,
  business,
}: {
  profile: any;
  business: any;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside style={{
        width: "240px", minHeight: "100vh",
        background: "#1A1A1A",
        position: "sticky", top: 0, flexShrink: 0,
      }} className="desktop-only">
        <SidebarContent profile={profile} business={business} />
      </aside>

      {/* Mobile top bar */}
      <div className="mobile-only" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "#1A1A1A", borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 1rem", height: "60px",
        alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "7px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={14} color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "white" }}>
            Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
          </span>
        </Link>
        <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "0.5rem", display: "flex" }}>
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} />
          <div style={{
            position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100,
            width: "min(260px, 85vw)", overflowY: "auto",
            animation: "slideInLeft 0.25s ease-out",
          }}>
            <button onClick={() => setMobileOpen(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "white", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
              <X size={16} />
            </button>
            <SidebarContent profile={profile} business={business} onNav={() => setMobileOpen(false)} />
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