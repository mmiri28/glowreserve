"use client"
import Link from "next/link";
import { Star, MapPin, Clock, ArrowRight } from "lucide-react";

// Mock data for demo — real data comes from Supabase
const TOP_SALONS = [
  {
    id: "1",
    slug: "luxe-lash-lounge",
    name: "Luxe Lash Lounge",
    category: "Lashes & Brows",
    rating: 4.9,
    reviews: 342,
    city: "New York, NY",
    startingFrom: 85,
    turnaround: "45 min",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80",
    verified: true,
    tags: ["Classic Lashes", "Volume", "Brow Lamination"],
  },
  {
    id: "2",
    slug: "glow-nail-studio",
    name: "Glow Nail Studio",
    category: "Nails",
    rating: 4.8,
    reviews: 218,
    city: "Los Angeles, CA",
    startingFrom: 45,
    turnaround: "60 min",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80",
    verified: true,
    tags: ["Gel", "Acrylic", "Nail Art"],
  },
  {
    id: "3",
    slug: "velvet-hair-salon",
    name: "Velvet Hair Salon",
    category: "Hair",
    rating: 4.7,
    reviews: 481,
    city: "Miami, FL",
    startingFrom: 65,
    turnaround: "90 min",
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&q=80",
    verified: true,
    tags: ["Balayage", "Cuts", "Treatment"],
  },
  {
    id: "4",
    slug: "serenity-spa",
    name: "Serenity Spa & Wellness",
    category: "Spa & Massage",
    rating: 5.0,
    reviews: 156,
    city: "Chicago, IL",
    startingFrom: 110,
    turnaround: "75 min",
    image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80",
    verified: true,
    tags: ["Deep Tissue", "Facial", "Hot Stone"],
  },
];

export default function TopSalons() {
  return (
    <section style={{ padding: "5rem 1.5rem", background: "white" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}>
          <div>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: "600",
              color: "#D4AF37",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}>
              Editor&apos;s Pick
            </span>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: "700",
              color: "#1A1A1A",
              marginTop: "0.5rem",
            }}>
              Top-Rated Providers
            </h2>
          </div>
          <Link href="/explore" style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            color: "#D4AF37",
            fontWeight: "600",
            fontSize: "0.9375rem",
            textDecoration: "none",
          }}>
            View all <ArrowRight size={16} />
          </Link>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.5rem",
        }}>
          {TOP_SALONS.map((salon) => (
            <Link
              key={salon.id}
              href={`/business/${salon.slug}`}
              style={{ textDecoration: "none" }}
            >
              <div style={{
                background: "white",
                borderRadius: "1.25rem",
                overflow: "hidden",
                border: "1px solid rgba(232,226,217,0.8)",
                transition: "all 0.25s",
                cursor: "pointer",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-6px)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 16px 48px rgba(26,26,26,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}>
                {/* Image */}
                <div style={{ position: "relative", height: "200px", overflow: "hidden" }}>
                  <img
                    src={salon.image}
                    alt={salon.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  {salon.verified && (
                    <div style={{
                      position: "absolute",
                      top: "0.75rem",
                      left: "0.75rem",
                      background: "rgba(212,175,55,0.95)",
                      color: "white",
                      fontSize: "0.6875rem",
                      fontWeight: "600",
                      padding: "0.25rem 0.625rem",
                      borderRadius: "9999px",
                      letterSpacing: "0.04em",
                    }}>
                      ✓ VERIFIED
                    </div>
                  )}
                  <div style={{
                    position: "absolute",
                    bottom: "0.75rem",
                    right: "0.75rem",
                    background: "rgba(255,255,255,0.95)",
                    borderRadius: "0.625rem",
                    padding: "0.375rem 0.75rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}>
                    <Star size={12} fill="#D4AF37" color="#D4AF37" />
                    <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#1A1A1A" }}>
                      {salon.rating}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "#8A8680" }}>
                      ({salon.reviews})
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "1.25rem" }}>
                  <div style={{
                    fontSize: "0.6875rem",
                    fontWeight: "600",
                    color: "#D4AF37",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    marginBottom: "0.375rem",
                  }}>
                    {salon.category}
                  </div>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.125rem",
                    fontWeight: "600",
                    color: "#1A1A1A",
                    marginBottom: "0.625rem",
                  }}>
                    {salon.name}
                  </h3>

                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.875rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <MapPin size={12} color="#8A8680" />
                      <span style={{ fontSize: "0.75rem", color: "#8A8680" }}>{salon.city}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Clock size={12} color="#8A8680" />
                      <span style={{ fontSize: "0.75rem", color: "#8A8680" }}>{salon.turnaround}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    {salon.tags.map((tag) => (
                      <span key={tag} style={{
                        background: "rgba(212,175,55,0.08)",
                        color: "#8B7A00",
                        fontSize: "0.6875rem",
                        fontWeight: "500",
                        padding: "0.25rem 0.625rem",
                        borderRadius: "9999px",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "#8A8680" }}>Starting from </span>
                      <span style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.125rem",
                        fontWeight: "700",
                        color: "#1A1A1A",
                      }}>
                        ${salon.startingFrom}
                      </span>
                    </div>
                    <div className="btn-gold" style={{ fontSize: "0.75rem", padding: "0.5rem 1rem" }}>
                      Book Now
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
