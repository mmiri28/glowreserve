"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sparkles, Bell, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/shared/ThemeToggle";
import type { Session } from "@supabase/supabase-js";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      if (authUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authUser.id)
          .maybeSingle();
        setUserRole(profile?.role || "customer");
      }
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: Session | null) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .maybeSingle();
          setUserRole(profile?.role || "customer");
        } else {
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Nav label and href change based on role
  const secondNavLabel = user && userRole === "customer"
    ? "Book a Service"
    : "For Business";

  const secondNavHref = user && userRole === "customer"
    ? "/explore"
    : "/for-business";

  return (
    <nav
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        transition: "all 0.3s ease",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        boxShadow: scrolled ? "0 2px 12px rgba(26,26,26,0.06)" : "none",
        backgroundColor: scrolled ? "var(--surface)" : "transparent",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "68px" }}>

          {/* Back button */}
          <a
            href="https://www.mmiri28.com"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "0.5rem 1rem", borderRadius: "999px",
              border: "1px solid rgba(212, 175, 55, 0.35)",
              background: "rgba(212, 175, 55, 0.08)",
              color: "#D4AF37", textDecoration: "none",
              fontSize: "0.85rem", fontWeight: "700",
              letterSpacing: "0.04em", transition: "all 0.25s ease", flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, #D4AF37, #B8941F)";
              e.currentTarget.style.color = "#fff";
              e.currentTarget.style.borderColor = "#D4AF37";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(212,175,55,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(212, 175, 55, 0.08)";
              e.currentTarget.style.color = "#D4AF37";
              e.currentTarget.style.borderColor = "rgba(212, 175, 55, 0.35)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            MMiri28
          </a>

          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", flexShrink: 0 }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={17} color="white" />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "700", color: "var(--charcoal)" }}>
              Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="desktop-only" style={{ alignItems: "center", gap: "0.25rem" }}>
            {[
              { label: "Explore", href: "/explore" },
              { label: secondNavLabel, href: secondNavHref },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{
                  padding: "0.5rem 1rem", borderRadius: "0.625rem",
                  fontSize: "0.875rem", fontWeight: "500",
                  color: "var(--muted)", textDecoration: "none", transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color = "var(--charcoal)";
                  (e.target as HTMLElement).style.background = "rgba(212,175,55,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color = "var(--muted)";
                  (e.target as HTMLElement).style.background = "transparent";
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="desktop-only" style={{ alignItems: "center", gap: "0.75rem" }}>
            <ThemeToggle minimal />
            {user ? (
              <>
                <Link href="/dashboard/notifications" style={{ color: "var(--muted)", padding: "0.5rem", display: "flex" }}>
                  <Bell size={20} />
                </Link>
                <Link
                  href={userRole === "business_owner" ? "/business/dashboard" : userRole === "admin" ? "/admin" : "/dashboard"}
                  className="btn-gold"
                  style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}
                >
                  <User size={15} style={{ marginRight: "0.375rem" }} />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}>
                  Sign In
                </Link>
                <Link href="/auth/get-started" className="btn-gold" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="mobile-only" style={{ alignItems: "center", gap: "0.5rem" }}>
            <ThemeToggle minimal />
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{ color: "var(--charcoal)", padding: "0.5rem", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isOpen && (
          <div style={{ background: "var(--surface)", borderRadius: "0 0 1rem 1rem", padding: "0.75rem", borderTop: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
            {[
              { label: "Explore", href: "/explore" },
              { label: secondNavLabel, href: secondNavHref },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                style={{ display: "block", padding: "0.75rem 1rem", borderRadius: "0.625rem", fontSize: "0.9375rem", fontWeight: "500", color: "var(--charcoal)", textDecoration: "none", marginBottom: "0.25rem" }}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div style={{ height: "1px", background: "var(--border)", margin: "0.5rem 0" }} />

            {user ? (
              <div style={{ display: "flex", gap: "0.625rem", padding: "0.25rem 0" }}>
                <Link
                  href="/dashboard/notifications"
                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid var(--border)", color: "var(--charcoal)", textDecoration: "none", fontSize: "0.875rem", fontWeight: "600" }}
                  onClick={() => setIsOpen(false)}
                >
                  <Bell size={16} /> Notifications
                </Link>
                <Link
                  href={userRole === "business_owner" ? "/business/dashboard" : userRole === "admin" ? "/admin" : "/dashboard"}
                  className="btn-gold"
                  style={{ flex: 1, justifyContent: "center", fontSize: "0.875rem" }}
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.625rem", padding: "0.25rem 0" }}>
                <Link href="/auth/login" className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: "0.875rem" }} onClick={() => setIsOpen(false)}>
                  Sign In
                </Link>
                <Link href="/auth/get-started" className="btn-gold" style={{ flex: 1, justifyContent: "center", fontSize: "0.875rem" }} onClick={() => setIsOpen(false)}>
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}