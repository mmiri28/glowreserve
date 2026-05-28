"use client";

import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  { name: "Hair", image: "/categories/hair2.jfif", href: "/explore?category=hair" },
  { name: "Barbing", image: "/categories/barbing.jfif", href: "/explore?category=barbing" },
  { name: "Nails", image: "/categories/nails.jfif", href: "/explore?category=nails" },
  { name: "Lashes", image: "/categories/lashes.jfif", href: "/explore?category=lashes" },
  { name: "Skincare", image: "/categories/skincare.jfif", href: "/explore?category=skincare" },
  { name: "Massage", image: "/categories/massageaux.jfif", href: "/explore?category=massage" },
  { name: "Makeup", image: "/categories/makeup.jfif", href: "/explore?category=makeup" },
  { name: "Brows", image: "/categories/brows.jfif", href: "/explore?category=brows" },
  { name: "Waxing", image: "/categories/waxing.jfif", href: "/explore?category=waxing" },
  { name: "Tattoo", image: "/categories/crosstattoos.jfif", href: "/explore?category=tattoo" },
  { name: "Piercing", image: "/categories/piercing.jfif", href: "/explore?category=piercing" },
  { name: "Spa", image: "/categories/spa.jfif", href: "/explore?category=spa" },
];

export default function CategoriesSection() {
  return (
    <section style={{
      padding: "5rem 1.5rem",
      background: "var(--surface)",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{
            fontSize: "0.8125rem",
            fontWeight: "600",
            color: "#D4AF37",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>
            Browse by
          </span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: "700",
            color: "var(--charcoal)",
            marginTop: "0.5rem",
          }}>
            Service Categories
          </h2>
          <p style={{
            color: "var(--muted)",
            marginTop: "0.75rem",
            fontSize: "0.9375rem",
          }}>
            From classic cuts to luxury spa treatments — find every service in one place
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: "1.25rem",
        }}>
          {CATEGORIES.map((cat) => (
            <Link key={cat.name} href={cat.href} style={{ textDecoration: "none" }}>
              <div
                style={{
                  position: "relative",
                  borderRadius: "1rem",
                  overflow: "hidden",
                  aspectRatio: "1 / 1",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(26,26,26,0.1)",
                  transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(26,26,26,0.18)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(26,26,26,0.1)";
                }}
              >
                {/* Image */}
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  style={{ objectFit: "cover" }}
                  onError={(e) => {
                    // Fallback if image not found
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />

                {/* Dark gradient overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)",
                }} />

                {/* Gold top accent bar */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "3px",
                  background: "linear-gradient(90deg, #D4AF37, #B8941F)",
                  opacity: 0,
                  transition: "opacity 0.25s",
                }} className="category-accent" />

                {/* Label */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "1rem 0.75rem 0.875rem",
                  textAlign: "center",
                }}>
                  <span style={{
                    fontSize: "0.9375rem",
                    fontWeight: "700",
                    color: "white",
                    letterSpacing: "0.01em",
                    textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                    display: "block",
                  }}>
                    {cat.name}
                  </span>
                </div>

                {/* Gold border on hover */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "1rem",
                  border: "2px solid transparent",
                  transition: "border-color 0.25s",
                  pointerEvents: "none",
                }} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}