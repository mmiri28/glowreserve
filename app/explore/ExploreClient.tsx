"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { Search, MapPin, Star, SlidersHorizontal, X } from "lucide-react";

const CATEGORIES = ["All", "Hair", "Nails", "Lashes", "Skincare", "Massage", "Makeup", "Brows", "Waxing"];

export default function ExploreClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "newest">("rating");

  const search = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("businesses").select("*");
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    if (category && category !== "All") q = q.ilike("category", `%${category}%`);
    if (location) q = q.ilike("city", `%${location}%`);
    if (sortBy === "rating") q = q.order("rating", { ascending: false });
    else if (sortBy === "reviews") q = q.order("total_reviews", { ascending: false });
    else q = q.order("created_at", { ascending: false });
    const { data } = await q.limit(30);
    setBusinesses(data || []);
    setLoading(false);
  }, [query, category, location, sortBy]);

  useEffect(() => { search(); }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (category !== "All") params.set("category", category);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: "72px", background: "#FDFBF7", minHeight: "100vh" }}>
        {/* Search bar */}
        <div style={{ background: "white", borderBottom: "1px solid #E8E2D9", padding: "1.25rem 1.5rem" }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: "220px", display: "flex", alignItems: "center", gap: "0.625rem", background: "#F5F0E8", borderRadius: "0.75rem", padding: "0.75rem 1rem" }}>
                <Search size={16} color="#D4AF37" />
                <input type="text" placeholder="Search services, salons..." value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "0.9375rem", color: "#1A1A1A" }} />
                {query && <button type="button" onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8680" }}><X size={14} /></button>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", background: "#F5F0E8", borderRadius: "0.75rem", padding: "0.75rem 1rem", minWidth: "160px" }}>
                <MapPin size={16} color="#D4AF37" />
                <input type="text" placeholder="City or location" value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "0.9375rem", color: "#1A1A1A" }} />
              </div>
              <button type="submit" className="btn-gold">Search</button>
            </form>
          </div>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem 1.5rem" }}>
          {/* Filters */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)} style={{
                  padding: "0.5rem 1rem", borderRadius: "9999px",
                  border: `2px solid ${category === cat ? "#D4AF37" : "#E8E2D9"}`,
                  background: category === cat ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "white",
                  color: category === cat ? "white" : "#8A8680",
                  fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", flexShrink: 0, transition: "all 0.2s",
                }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <SlidersHorizontal size={16} color="#8A8680" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
                style={{ border: "1px solid #E8E2D9", borderRadius: "0.625rem", padding: "0.5rem 0.75rem", fontSize: "0.875rem", fontFamily: "inherit", color: "#1A1A1A", background: "white", cursor: "pointer" }}>
                <option value="rating">Top Rated</option>
                <option value="reviews">Most Reviewed</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <span style={{ fontSize: "0.9375rem", color: "#8A8680" }}>
              {loading ? "Searching..." : `${businesses.length} business${businesses.length !== 1 ? "es" : ""} found`}
            </span>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9", overflow: "hidden" }}>
                  <div style={{ height: "180px", background: "linear-gradient(90deg, #F5F0E8 25%, #FDFBF7 50%, #F5F0E8 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                  <div style={{ padding: "1.25rem" }}>
                    <div style={{ height: "20px", background: "#F5F0E8", borderRadius: "4px", marginBottom: "0.75rem", width: "60%" }} />
                    <div style={{ height: "14px", background: "#F5F0E8", borderRadius: "4px", width: "80%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 2rem", background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>🔍</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "#1A1A1A", marginBottom: "0.5rem" }}>No results found</h3>
              <p style={{ color: "#8A8680", marginBottom: "1.5rem" }}>Try adjusting your filters or search terms.</p>
              <button onClick={() => { setQuery(""); setLocation(""); setCategory("All"); }} className="btn-gold">Clear Filters</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
              {businesses.map((biz) => (
                <Link key={biz.id} href={`/business/${biz.slug}`} style={{ textDecoration: "none" }}>
                  <div style={{ background: "white", borderRadius: "1.25rem", overflow: "hidden", border: "1px solid #E8E2D9", transition: "all 0.25s", cursor: "pointer", height: "100%" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(26,26,26,0.1)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                    <div style={{ height: "180px", position: "relative", overflow: "hidden", background: "#F5F0E8" }}>
                      {biz.cover_image_url
                        ? <img src={biz.cover_image_url} alt={biz.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #F5E6E8, #E8C8CC)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>✨</div>}
                      {biz.is_verified && <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", background: "rgba(212,175,55,0.95)", color: "white", fontSize: "0.6875rem", fontWeight: "600", padding: "0.25rem 0.625rem", borderRadius: "9999px" }}>✓ VERIFIED</div>}
                      {biz.rating > 0 && (
                        <div style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", background: "rgba(255,255,255,0.95)", borderRadius: "0.625rem", padding: "0.375rem 0.625rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Star size={12} fill="#D4AF37" color="#D4AF37" />
                          <span style={{ fontSize: "0.8125rem", fontWeight: "700", color: "#1A1A1A" }}>{biz.rating}</span>
                          <span style={{ fontSize: "0.6875rem", color: "#8A8680" }}>({biz.total_reviews})</span>
                        </div>
                      )}
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <div style={{ fontSize: "0.6875rem", fontWeight: "600", color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>{biz.category}</div>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.0625rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "0.375rem" }}>{biz.name}</h3>
                      {biz.city && <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.5rem" }}><MapPin size={12} color="#8A8680" /><span style={{ fontSize: "0.8125rem", color: "#8A8680" }}>{biz.city}</span></div>}
                      {biz.description && <p style={{ fontSize: "0.8125rem", color: "#8A8680", lineHeight: "1.5", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{biz.description}</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
