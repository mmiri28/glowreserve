"use client";

import Link from "next/link";

const QUICK_ACTIONS = [
  { icon: "💅", label: "Book Nails", href: "/dashboard/book?category=nails" },
  { icon: "💇", label: "Book Hair", href: "/dashboard/book?category=hair" },
  { icon: "✨", label: "Book Lashes", href: "/dashboard/book?category=lashes" },
  { icon: "🌿", label: "Book Skincare", href: "/dashboard/book?category=skincare" },
];

export default function QuickActions() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem",
    }}>
      {QUICK_ACTIONS.map((item) => (
        <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
          <div
            style={{
              background: "white",
              borderRadius: "1rem",
              padding: "1.25rem 1rem",
              textAlign: "center",
              border: "1px solid #E8E2D9",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#D4AF37";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(26,26,26,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#E8E2D9";
              (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <span style={{ fontSize: "1.5rem", display: "block", marginBottom: "0.5rem" }}>
              {item.icon}
            </span>
            <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#1A1A1A" }}>
              {item.label}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}