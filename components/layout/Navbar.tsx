"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Sparkles, Bell, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/shared/ThemeToggle";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: any) => setUser(data.user));
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      transition: "all 0.3s ease",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid var(--border)" : "none",
      boxShadow: scrolled ? "0 2px 12px rgba(26,26,26,0.06)" : "none",
      backgroundColor: scrolled ? "var(--surface)" : "transparent",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "72px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={18} color="white" />
            </div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "700", color: "var(--charcoal)", letterSpacing: "-0.01em" }}>
              Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} className="hidden md:flex">
            {[{ label: "Explore", href: "/explore" }, { label: "For Business", href: "/business/register" }].map((item) => (
              <Link key={item.label} href={item.href} style={{ padding: "0.5rem 1rem", borderRadius: "0.625rem", fontSize: "0.875rem", fontWeight: "500", color: "var(--muted)", textDecoration: "none", transition: "all 0.2s" }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--charcoal)"; (e.target as HTMLElement).style.background = "rgba(212,175,55,0.06)"; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; (e.target as HTMLElement).style.background = "transparent"; }}>
                {item.label}
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="hidden md:flex">
            <ThemeToggle minimal />
            {user ? (
              <>
                <Link href="/dashboard/notifications" style={{ color: "var(--muted)", padding: "0.5rem" }}><Bell size={20} /></Link>
                <Link href="/dashboard" className="btn-gold" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}>
                  <User size={16} style={{ marginRight: "0.375rem" }} />Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}>Sign In</Link>
                <Link href="/auth/register" className="btn-gold" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem" }}>Get Started</Link>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="md:hidden">
            <ThemeToggle minimal />
            <button onClick={() => setIsOpen(!isOpen)} style={{ color: "var(--charcoal)", padding: "0.5rem", background: "none", border: "none", cursor: "pointer" }}>
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div style={{ background: "var(--surface)", borderRadius: "0 0 1rem 1rem", padding: "1rem", borderTop: "1px solid var(--border)" }} className="md:hidden animate-slide-up">
            {[{ label: "Explore", href: "/explore" }, { label: "For Business", href: "/business/register" }].map((item) => (
              <Link key={item.label} href={item.href} style={{ display: "block", padding: "0.75rem 1rem", borderRadius: "0.625rem", fontSize: "0.9375rem", fontWeight: "500", color: "var(--charcoal)", textDecoration: "none", marginBottom: "0.25rem" }}
                onClick={() => setIsOpen(false)}>{item.label}</Link>
            ))}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
              <Link href="/auth/login" className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: "0.875rem" }}>Sign In</Link>
              <Link href="/auth/register" className="btn-gold" style={{ flex: 1, justifyContent: "center", fontSize: "0.875rem" }}>Get Started</Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}