"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, ArrowRight, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TopSalons() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const fetchBusinesses = async () => {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("businesses")
      .select(
        "id, name, slug, category, city, rating, total_reviews, cover_image_url, logo_url, is_verified, description"
      )
      .order("rating", { ascending: false })
      .limit(6);

    if (error) {
      console.error(error);
    }

    setBusinesses(data || []);
    setLoading(false);
  };

  fetchBusinesses();
}, []);
  return (
    <section style={{ padding: "5rem 1.5rem", background: "var(--cream)" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#D4AF37", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Featured
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: "700", color: "var(--charcoal)", marginTop: "0.5rem" }}>
              Top Rated Businesses
            </h2>
          </div>
          <Link href="/explore" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#D4AF37", fontWeight: "600", textDecoration: "none", fontSize: "0.9375rem" }}>
            View all <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "var(--surface)", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid var(--border)", opacity: 0.5 }}>
                <div style={{ height: "180px", background: "var(--surface-2)" }} />
                <div style={{ padding: "1.25rem" }}>
                  <div style={{ height: "16px", background: "var(--surface-2)", borderRadius: "4px", width: "60%", marginBottom: "0.625rem" }} />
                  <div style={{ height: "13px", background: "var(--surface-2)", borderRadius: "4px", width: "80%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : businesses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "1.25rem", border: "2px dashed rgba(212,175,55,0.2)" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✨</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
              No businesses yet
            </h3>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
              Be the first to list your beauty business on GlowReserve!
            </p>
            <Link href="/business/register" className="btn-gold">
              Register Your Business
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {businesses.map((biz) => (
              <Link key={biz.id} href={`/business/${biz.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "var(--surface)", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid var(--border)", transition: "all 0.25s", cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>

                  {/* Cover image */}
                  <div style={{ height: "180px", background: "var(--surface-2)", position: "relative", overflow: "hidden" }}>
                    {biz.cover_image_url ? (
                      <img src={biz.cover_image_url} alt={biz.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3.5rem" }}>
                        ✨
                      </div>
                    )}
                    {biz.is_verified && (
                      <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", background: "rgba(212,175,55,0.95)", color: "white", fontSize: "0.6875rem", fontWeight: "700", padding: "0.2rem 0.625rem", borderRadius: "9999px", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <CheckCircle size={11} /> Verified
                      </div>
                    )}
                    {biz.rating > 0 && (
                      <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", background: "rgba(255,255,255,0.95)", borderRadius: "0.625rem", padding: "0.3rem 0.625rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Star size={12} fill="#D4AF37" color="#D4AF37" />
                        <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#1A1A1A" }}>{biz.rating}</span>
                        <span style={{ fontSize: "0.6875rem", color: "#8A8680" }}>({biz.total_reviews})</span>
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "1.125rem" }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>
                      {biz.category}
                    </div>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
                      {biz.name}
                    </h3>
                    {biz.city && (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem" }}>
                        <MapPin size={12} color="var(--muted)" />
                        <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{biz.city}</span>
                      </div>
                    )}
                    {biz.description && (
                      <p style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginBottom: "0.75rem" }}>
                        {biz.description}
                      </p>
                    )}
                    <div className="btn-gold" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem", width: "100%", justifyContent: "center" }}>
                      View & Book
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}