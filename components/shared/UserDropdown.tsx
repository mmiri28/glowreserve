"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, Settings, LogOut, ChevronDown,
  LayoutDashboard, Edit3, Building2,
  CheckCircle, Star, Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

export default function UserDropdown() {
  const { user, profile, business, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface-2)", border: "2px solid var(--border)" }} />
    );
  }

  if (!user || !profile) return null;

  const initials = profile.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0] || "U").toUpperCase();

  const displayName = profile.full_name?.split(" ")[0] || user.email?.split("@")[0] || "User";
  const fullName = profile.full_name || user.email?.split("@")[0] || "User";

  const dashboardHref = profile.role === "business_owner"
    ? "/business/dashboard"
    : profile.role === "admin" ? "/admin" : "/dashboard";

  const roleLabel = profile.role === "business_owner"
    ? "Business Owner"
    : profile.role === "admin" ? "Admin" : "Customer";

  const roleColor = profile.role === "business_owner"
    ? { bg: "rgba(212,175,55,0.12)", color: "#D4AF37" }
    : profile.role === "admin"
      ? { bg: "rgba(232,92,92,0.12)", color: "#E85C5C" }
      : { bg: "rgba(91,141,239,0.12)", color: "#5B8DEF" };

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Avatar trigger button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.3rem 0.75rem 0.3rem 0.3rem",
          borderRadius: "2rem",
          border: `2px solid ${open ? "#D4AF37" : "var(--border)"}`,
          background: "var(--surface)",
          cursor: "pointer", transition: "all 0.2s",
          boxShadow: open ? "0 0 0 3px rgba(212,175,55,0.15)" : "none",
        }}
      >
        {/* Avatar */}
        <div style={{
          width: "32px", height: "32px", borderRadius: "50%",
          overflow: "hidden", flexShrink: 0,
          background: "linear-gradient(135deg, #D4AF37, #B8941F)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: "700", fontSize: "0.8125rem",
        }}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
        {/* Name — desktop only */}
        <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", maxWidth: "90px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          className="desktop-only">
          {displayName}
        </span>
        <ChevronDown size={13} color="var(--muted)"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
          className="desktop-only" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: "280px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "1.125rem",
          boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
          zIndex: 200,
          overflow: "hidden",
          animation: "dropdownFade 0.15s ease-out",
        }}>

          {/* User identity header */}
          <div style={{ padding: "1.125rem", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
            <div style={{ display: "flex", gap: "0.875rem", alignItems: "center", marginBottom: "0.75rem" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "1.0625rem" }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : initials}
              </div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <p style={{ fontWeight: "700", color: "var(--charcoal)", fontSize: "0.9375rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {fullName}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </p>
                <span style={{ display: "inline-block", marginTop: "0.25rem", fontSize: "0.6875rem", fontWeight: "600", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: roleColor.bg, color: roleColor.color }}>
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Business info for business owners */}
            {profile.role === "business_owner" && business && (
              <div style={{ background: "rgba(212,175,55,0.08)", borderRadius: "0.75rem", padding: "0.75rem", border: "1px solid rgba(212,175,55,0.15)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "0.5rem", overflow: "hidden", flexShrink: 0, background: "rgba(212,175,55,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.125rem" }}>
                  {business.logo_url
                    ? <img src={business.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : "✨"}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {business.name}
                    </p>
                    {business.is_verified && <CheckCircle size={13} color="#4CAF7C" style={{ flexShrink: 0 }} />}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{business.category}</span>
                    {business.rating > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.6875rem", color: "#D4AF37" }}>
                        <Star size={10} fill="#D4AF37" /> {business.rating}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation items */}
          <div style={{ padding: "0.5rem" }}>
            <MenuItem icon={<LayoutDashboard size={15} />} label="Dashboard" href={dashboardHref} onClick={() => setOpen(false)} />
            <MenuItem icon={<User size={15} />} label="View Profile" href="/dashboard/profile" onClick={() => setOpen(false)} />
            <MenuItem icon={<Edit3 size={15} />} label="Edit Profile" href="/dashboard/profile" onClick={() => setOpen(false)} />
            {profile.role === "business_owner" && (
              <MenuItem icon={<Building2 size={15} />} label="Manage Business" href="/business/dashboard" onClick={() => setOpen(false)} />
            )}
            {profile.role === "admin" && (
              <MenuItem icon={<Shield size={15} />} label="Admin Panel" href="/admin" onClick={() => setOpen(false)} />
            )}
            <MenuItem icon={<Settings size={15} />} label="Settings" href="/dashboard/profile" onClick={() => setOpen(false)} />
          </div>

          {/* Logout */}
          <div style={{ padding: "0.5rem", borderTop: "1px solid var(--border)" }}>
            <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "0.75rem", width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.625rem", border: "none", background: "transparent", cursor: "pointer", color: "#E85C5C", fontSize: "0.875rem", fontWeight: "600", fontFamily: "inherit", transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(232,92,92,0.08)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MenuItem({ icon, label, href, onClick }: {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.625rem 0.75rem", borderRadius: "0.625rem", color: "var(--charcoal)", textDecoration: "none", fontSize: "0.875rem", fontWeight: "500", transition: "background 0.15s" }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
      <span style={{ color: "var(--muted)", display: "flex" }}>{icon}</span>
      {label}
    </Link>
  );
}