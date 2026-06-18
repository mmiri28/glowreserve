import Link from "next/link";
import { Sparkles, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--cream)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "2rem", textAlign: "center",
    }}>
      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", marginBottom: "3rem" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Sparkles size={18} color="white" />
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "700", color: "var(--charcoal)" }}>
          Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
        </span>
      </Link>

      {/* 404 */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(5rem, 20vw, 9rem)",
        fontWeight: "700", lineHeight: 1,
        background: "linear-gradient(135deg, #D4AF37, #B8941F)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        marginBottom: "1.5rem",
      }}>
        404
      </div>

      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(1.5rem, 4vw, 2rem)",
        fontWeight: "700", color: "var(--charcoal)",
        marginBottom: "0.75rem",
      }}>
        Page Not Found
      </h1>

      <p style={{
        color: "var(--muted)", fontSize: "1.0625rem",
        marginBottom: "2.5rem", maxWidth: "420px", lineHeight: "1.7",
      }}>
        Looks like this page doesn&apos;t exist. It may have been moved or deleted.
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          padding: "0.75rem 1.5rem", borderRadius: "0.875rem",
          border: "1px solid var(--border)", background: "var(--surface)",
          color: "var(--charcoal)", textDecoration: "none",
          fontWeight: "600", fontSize: "0.9375rem",
        }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <Link href="/explore" className="btn-gold">
          <Search size={16} style={{ marginRight: "0.375rem" }} />
          Explore Businesses
        </Link>
      </div>
    </div>
  );
}