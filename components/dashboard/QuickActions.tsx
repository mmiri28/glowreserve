"use client";

import { useRouter } from "next/navigation";

const CATEGORIES = [
  { image: "/categories/hair2.jfif", label: "Book Hair", category: "Hair" },
  { image: "/categories/nails.jfif", label: "Book Nails", category: "Nails" },
  { image: "/categories/spa.jfif", label: "Book Spa", category: "Spa" },
  { image: "/categories/makeup.jfif", label: "Book Makeup", category: "Makeup" },
  { image: "/categories/brows.jfif", label: "Book Lashes", category: "Lashes" },
  { image: "/categories/barbing.jfif", label: "Book Barbing", category: "Barbing" },
  { image: "/categories/skincare.jfif", label: "Book Skincare", category: "Skincare" },
  { image: "/categories/massageaux.jfif", label: "Book Massage", category: "Massage" },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "0.75rem",
      marginBottom: "1.5rem",
    }}>
      {CATEGORIES.map((item) => (
        <button
          key={item.category}
          onClick={() => router.push(`/explore?category=${encodeURIComponent(item.category)}`)}
          style={{
            position: "relative",
            borderRadius: "1rem",
            border: "2px solid transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            padding: 0,
            overflow: "hidden",
            height: "110px",
            transition: "all 0.2s",
            background: "var(--surface-2)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "#D4AF37";
            el.style.transform = "translateY(-3px)";
            el.style.boxShadow = "0 8px 24px rgba(212,175,55,0.2)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = "transparent";
            el.style.transform = "translateY(0)";
            el.style.boxShadow = "none";
          }}
        >
          {/* Background image using plain img tag — works with jfif */}
          <img
            src={item.image}
            alt={item.label}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            onError={(e) => {
              // If image fails, show a coloured background instead
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          {/* Dark overlay so text is readable */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 60%)",
          }} />

          {/* Label */}
          <span style={{
            position: "absolute",
            bottom: "0.625rem",
            left: 0,
            right: 0,
            textAlign: "center",
            fontSize: "0.75rem",
            fontWeight: "700",
            color: "white",
            letterSpacing: "0.02em",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
            padding: "0 0.25rem",
          }}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}