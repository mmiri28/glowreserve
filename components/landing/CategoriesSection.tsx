"use client";

import { useState } from "react";
import Link from "next/link";
import { X, LayoutGrid, ChevronRight } from "lucide-react";

const CATEGORIES = [
  { name: "Hair", image: "/categories/hair2.jfif", href: "/explore?category=hair", desc: "Cuts, colour & styling" },
  { name: "Barbing", image: "/categories/barbing.jfif", href: "/explore?category=barbing", desc: "Fades, trims & shaves" },
  { name: "Nails", image: "/categories/nails.jfif", href: "/explore?category=nails", desc: "Manicure & pedicure" },
  { name: "Lashes", image: "/categories/lashes.jfif", href: "/explore?category=lashes", desc: "Extensions & lifts" },
  { name: "Skincare", image: "/categories/skincare.jfif", href: "/explore?category=skincare", desc: "Facials & treatments" },
  { name: "Massage", image: "/categories/massageaux.jfif", href: "/explore?category=massage", desc: "Relaxation & therapy" },
  { name: "Makeup", image: "/categories/makeup.jfif", href: "/explore?category=makeup", desc: "Glam & bridal looks" },
  { name: "Brows", image: "/categories/brows.jfif", href: "/explore?category=brows", desc: "Shaping & tinting" },
  { name: "Waxing", image: "/categories/waxing.jfif", href: "/explore?category=waxing", desc: "Full body waxing" },
  { name: "Tattoo", image: "/categories/crosstattoos.jfif", href: "/explore?category=tattoo", desc: "Custom ink & design" },
  { name: "Piercing", image: "/categories/piercing.jfif", href: "/explore?category=piercing", desc: "Safe & stylish piercings" },
  { name: "Spa", image: "/categories/spa.jfif", href: "/explore?category=spa", desc: "Full body wellness" },
];

export default function CategoriesSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger section — always visible */}
      <section style={{ padding: "3rem 1.5rem", background: "var(--surface)" }}>
        <div style={{
          maxWidth: "1280px", margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
        }}>
          <div>
            <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#D4AF37", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Browse by
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "700", color: "var(--charcoal)", marginTop: "0.25rem" }}>
              Service Categories
            </h2>
            <p style={{ color: "var(--muted)", marginTop: "0.375rem", fontSize: "0.9375rem" }}>
              {CATEGORIES.length} categories available — tap to explore
            </p>
          </div>

          {/* Button that opens the sidebar */}
          <button
            onClick={() => setOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: "0.625rem",
              padding: "0.875rem 1.75rem", borderRadius: "0.875rem",
              background: "linear-gradient(135deg, #D4AF37, #B8941F)",
              color: "white", fontWeight: "600", fontSize: "0.9375rem",
              border: "none", cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 16px rgba(212,175,55,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(212,175,55,0.45)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(212,175,55,0.35)";
            }}
          >
            <LayoutGrid size={18} />
            Browse All Categories
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      {/* Dark backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 90,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            animation: "fadeIn 0.2s ease-out",
          }}
        />
      )}

      {/* Sliding sidebar */}
      <div style={{
        position: "fixed",
        top: 0, right: 0, bottom: 0,
        zIndex: 100,
        width: "min(420px, 92vw)",
        background: "var(--surface)",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        overflowY: "auto",
      }}>

        {/* Sidebar header */}
        <div style={{
          padding: "1.5rem 1.5rem 1.25rem",
          borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0,
          background: "var(--surface)", zIndex: 1,
        }}>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#D4AF37", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
              Browse by
            </p>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "700", color: "var(--charcoal)" }}>
              Service Categories
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "var(--surface-2)", border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--muted)", flexShrink: 0,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.1)";
              (e.currentTarget as HTMLElement).style.color = "#D4AF37";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-2)";
              (e.currentTarget as HTMLElement).style.color = "var(--muted)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Subtitle bar */}
        <div style={{ padding: "0.875rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            {CATEGORIES.length} categories — tap one to explore
          </span>
        </div>

        {/* Category list */}
        <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1 }}>
          {CATEGORIES.map((cat, index) => (
            <Link
              key={cat.name}
              href={cat.href}
              onClick={() => setOpen(false)}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "0.875rem 1rem",
                  borderRadius: "0.875rem",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  animationDelay: `${index * 0.04}s`,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#D4AF37";
                  (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.05)";
                  (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                  (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                }}
              >
                {/* Image thumbnail */}
                <div style={{
                  width: "56px", height: "56px",
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  flexShrink: 0,
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                      if (e.currentTarget.parentElement) {
                        (e.currentTarget.parentElement as HTMLElement).style.background =
                          "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))";
                      }
                    }}
                  />
                </div>

                {/* Text */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem", marginBottom: "0.2rem" }}>
                    {cat.name}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {cat.desc}
                  </p>
                </div>

                <ChevronRight size={16} color="var(--muted)" style={{ flexShrink: 0 }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer CTA */}
        <div style={{
          padding: "1.25rem 1.5rem",
          borderTop: "1px solid var(--border)",
          position: "sticky", bottom: 0,
          background: "var(--surface)",
        }}>
          <Link
            href="/explore"
            onClick={() => setOpen(false)}
            className="btn-gold"
            style={{ width: "100%", justifyContent: "center" }}
          >
            View All Businesses →
          </Link>
        </div>
      </div>
    </>
  );
}