"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, ArrowRight } from "lucide-react";

const STATS = [
  { value: "2,400+", label: "Verified Businesses" },
  { value: "48k+", label: "Happy Clients" },
  { value: "4.9", label: "Average Rating" },
];

export default function HeroSection() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <section style={{
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      background: "linear-gradient(160deg, #FDFBF7 0%, #F5F0E8 40%, #F5E6E8 100%)",
    }}>
      {/* Decorative elements */}
      <div style={{
        position: "absolute",
        top: "10%",
        right: "5%",
        width: "480px",
        height: "480px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute",
        bottom: "10%",
        left: "0",
        width: "320px",
        height: "320px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,230,232,0.8) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Floating review card */}
      <div style={{
        position: "absolute",
        top: "22%",
        right: "8%",
        background: "white",
        borderRadius: "1rem",
        padding: "1rem 1.25rem",
        boxShadow: "0 8px 32px rgba(26,26,26,0.12)",
        border: "1px solid rgba(232,226,217,0.8)",
        maxWidth: "200px",
        animation: "slideUp 0.6s ease-out 0.3s both",
        zIndex: 2,
      }}
        className="hidden lg:block">
        <div style={{ display: "flex", gap: "0.25rem", marginBottom: "0.5rem" }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} fill="#D4AF37" color="#D4AF37" />
          ))}
        </div>
        <p style={{ fontSize: "0.75rem", color: "#1A1A1A", fontWeight: "500", marginBottom: "0.25rem" }}>
          "Absolutely stunning lash work!"
        </p>
        <p style={{ fontSize: "0.6875rem", color: "#8A8680" }}>— Sarah M.</p>
      </div>

      {/* Floating booking card */}
      <div style={{
        position: "absolute",
        bottom: "28%",
        right: "12%",
        background: "white",
        borderRadius: "1rem",
        padding: "0.875rem 1.125rem",
        boxShadow: "0 8px 32px rgba(26,26,26,0.12)",
        border: "1px solid rgba(232,226,217,0.8)",
        animation: "slideUp 0.6s ease-out 0.5s both",
        zIndex: 2,
      }}
        className="hidden lg:block">
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "50%",
            background: "linear-gradient(135deg, #D4AF37, #B8941F)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.875rem",
          }}>✓</div>
          <div>
            <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#1A1A1A" }}>Booking Confirmed!</p>
            <p style={{ fontSize: "0.6875rem", color: "#8A8680" }}>Classic Manicure · 2:00 PM</p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "7rem 1.5rem 4rem", width: "100%" }}>
        <div style={{ maxWidth: "680px" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "9999px",
            padding: "0.375rem 1rem",
            marginBottom: "1.5rem",
          }}
            className="animate-fade-in">
            <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#D4AF37" }}>
              ✦ Premium Beauty Marketplace
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
            fontWeight: "700",
            lineHeight: "1.1",
            color: "#1A1A1A",
            marginBottom: "1.25rem",
          }}
            className="animate-slide-up">
            Your Beauty,
            <br />
            <span style={{
              background: "linear-gradient(135deg, #D4AF37, #B8941F)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Effortlessly
            </span>{" "}Booked
          </h1>

          <p style={{
            fontSize: "1.0625rem",
            color: "#8A8680",
            lineHeight: "1.7",
            marginBottom: "2.5rem",
            maxWidth: "520px",
          }}
            className="animate-slide-up">
            Discover top-rated salons, spas, and beauty studios near you. Book your perfect appointment in seconds — no calls, no waiting.
          </p>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              background: "white",
              borderRadius: "1.25rem",
              padding: "1rem",
              boxShadow: "0 8px 40px rgba(26,26,26,0.1)",
              border: "1px solid rgba(232,226,217,0.8)",
              marginBottom: "3rem",
              maxWidth: "580px",
            }}
            className="animate-slide-up sm:flex-row">
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.625rem" }}>
              <Search size={18} color="#D4AF37" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="What service are you looking for?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: "0.9375rem",
                  color: "#1A1A1A",
                  fontFamily: "inherit",
                  background: "transparent",
                }}
              />
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.625rem",
              borderLeft: "1px solid #E8E2D9",
              paddingLeft: "0.75rem",
            }}
              className="hidden sm:flex">
              <MapPin size={18} color="#D4AF37" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  width: "120px",
                  border: "none",
                  outline: "none",
                  fontSize: "0.9375rem",
                  color: "#1A1A1A",
                  fontFamily: "inherit",
                  background: "transparent",
                }}
              />
            </div>
            <button type="submit" className="btn-gold" style={{ padding: "0.75rem 1.5rem", flexShrink: 0 }}>
              Search
            </button>
          </form>

          {/* Stats */}
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }} className="animate-fade-in">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.625rem",
                  fontWeight: "700",
                  color: "#1A1A1A",
                  lineHeight: "1.2",
                }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: "0.8125rem", color: "#8A8680", marginTop: "0.125rem" }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
