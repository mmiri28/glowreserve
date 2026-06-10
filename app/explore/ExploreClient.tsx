"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  Search, MapPin, Star, X,
  Grid, List, ChevronDown, Filter,
} from "lucide-react";

const CATEGORIES = [
  "All", "Hair", "Barbing", "Nails", "Lashes",
  "Skincare", "Massage", "Makeup", "Brows",
  "Waxing", "Tattoo", "Piercing", "Spa",
];

type SortOption = "rating" | "reviews" | "newest";
type ViewMode = "grid" | "list";

export default function ExploreClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const searchRef = useRef<any>();

  const search = useCallback(async (
    q: string, loc: string, cat: string, sort: SortOption
  ) => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("businesses").select("*", { count: "exact" });

    if (q.trim()) {
      query = query.or(
        `name.ilike.%${q.trim()}%,description.ilike.%${q.trim()}%,category.ilike.%${q.trim()}%`
      );
    }
    if (cat && cat !== "All") query = query.ilike("category", `%${cat}%`);
    if (loc.trim()) query = query.ilike("city", `%${loc.trim()}%`);
    if (minRating > 0) query = query.gte("rating", minRating);
    if (verifiedOnly) query = query.eq("is_verified", true);

    if (sort === "rating") query = query.order("rating", { ascending: false });
    else if (sort === "reviews") query = query.order("total_reviews", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, count } = await query.limit(30);
    setBusinesses(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [minRating, verifiedOnly]);

  useEffect(() => {
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      search(query, location, category, sortBy);
    }, 350);
    return () => clearTimeout(searchRef.current);
  }, [query, location, category, sortBy, minRating, verifiedOnly, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (location) params.set("location", location);
    if (category !== "All") params.set("category", category);
    router.push(`/explore?${params.toString()}`);
  };

  const clearAll = () => {
    setQuery(""); setLocation(""); setCategory("All");
    setMinRating(0); setVerifiedOnly(false); setSortBy("rating");
  };

  const hasFilters = query || location || category !== "All" || minRating > 0 || verifiedOnly;

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: "72px", background: "var(--cream)", minHeight: "100vh" }}>

        {/* Search bar */}
        <div style={{
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          padding: "1rem 1.5rem", position: "sticky", top: "72px", zIndex: 30,
        }}>
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
              <div style={{
                flex: 1, minWidth: "200px", display: "flex", alignItems: "center",
                gap: "0.625rem", background: "var(--surface-2)", borderRadius: "0.75rem",
                padding: "0.625rem 1rem", border: "1px solid var(--border)",
              }}>
                <Search size={16} color="#D4AF37" />
                <input type="text" placeholder="Search services, salons..." value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{
                    flex: 1, border: "none", outline: "none",
                    background: "transparent", fontFamily: "inherit",
                    fontSize: "0.9375rem", color: "var(--charcoal)",
                  }} />
                {query && (
                  <button type="button" onClick={() => setQuery("")}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div style={{
                display: "flex", alignItems: "center", gap: "0.625rem",
                background: "var(--surface-2)", borderRadius: "0.75rem",
                padding: "0.625rem 1rem", border: "1px solid var(--border)", minWidth: "160px",
              }}>
                <MapPin size={16} color="#D4AF37" />
                <input type="text" placeholder="City or location" value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{
                    flex: 1, border: "none", outline: "none",
                    background: "transparent", fontFamily: "inherit",
                    fontSize: "0.9375rem", color: "var(--charcoal)", width: "120px",
                  }} />
              </div>

              <button type="submit" className="btn-gold" style={{ padding: "0.625rem 1.5rem" }}>
                Search
              </button>

              <button type="button" onClick={() => setShowFilters(!showFilters)} style={{
                display: "flex", alignItems: "center", gap: "0.375rem",
                padding: "0.625rem 1rem", borderRadius: "0.75rem",
                border: `1px solid ${showFilters ? "#D4AF37" : "var(--border)"}`,
                background: showFilters ? "rgba(212,175,55,0.08)" : "var(--surface)",
                color: showFilters ? "#D4AF37" : "var(--muted)",
                cursor: "pointer", fontSize: "0.875rem", fontWeight: "600",
                fontFamily: "inherit",
              }}>
                <Filter size={15} />
                Filters
                {(minRating > 0 || verifiedOnly) && (
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#D4AF37", display: "inline-block" }} />
                )}
              </button>
            </form>

            {showFilters && (
              <div style={{
                marginTop: "0.875rem", paddingTop: "0.875rem",
                borderTop: "1px solid var(--border)",
                display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--charcoal)" }}>
                    Min Rating:
                  </span>
                  {[0, 3, 4, 4.5].map((r) => (
                    <button key={r} onClick={() => setMinRating(r)} style={{
                      padding: "0.25rem 0.625rem", borderRadius: "9999px", fontSize: "0.8125rem",
                      border: `1px solid ${minRating === r ? "#D4AF37" : "var(--border)"}`,
                      background: minRating === r ? "rgba(212,175,55,0.1)" : "var(--surface)",
                      color: minRating === r ? "#D4AF37" : "var(--muted)",
                      cursor: "pointer", fontFamily: "inherit", fontWeight: "600",
                    }}>
                      {r === 0 ? "Any" : `${r}★`}
                    </button>
                  ))}
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <div onClick={() => setVerifiedOnly(!verifiedOnly)} style={{
                    width: "36px", height: "20px", borderRadius: "10px",
                    background: verifiedOnly ? "#D4AF37" : "var(--border)",
                    position: "relative", cursor: "pointer", transition: "background 0.2s",
                  }}>
                    <div style={{
                      position: "absolute", width: "14px", height: "14px",
                      borderRadius: "50%", background: "white", top: "3px",
                      left: verifiedOnly ? "19px" : "3px", transition: "left 0.2s",
                    }} />
                  </div>
                  <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--charcoal)" }}>
                    Verified only
                  </span>
                </label>

                {hasFilters && (
                  <button onClick={clearAll} style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#E85C5C", fontSize: "0.8125rem", fontWeight: "600",
                    fontFamily: "inherit",
                  }}>
                    <X size={14} /> Clear all
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "1.5rem 1.5rem 3rem" }}>
          {/* Category chips */}
          <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.25rem" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat} onClick={() => setCategory(cat)} style={{
                padding: "0.4375rem 1rem", borderRadius: "9999px", flexShrink: 0,
                border: `2px solid ${category === cat ? "#D4AF37" : "var(--border)"}`,
                background: category === cat ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "var(--surface)",
                color: category === cat ? "white" : "var(--muted)",
                fontSize: "0.875rem", fontWeight: "600", cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s",
              }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Results bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <span style={{ fontSize: "0.9375rem", color: "var(--muted)" }}>
              {loading ? "Searching..." : (
                <>
                  <strong style={{ color: "var(--charcoal)" }}>{totalCount}</strong>{" "}
                  business{totalCount !== 1 ? "es" : ""} found
                  {category !== "All" && (
                    <> in <strong style={{ color: "#D4AF37" }}>{category}</strong></>
                  )}
                </>
              )}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ position: "relative" }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    appearance: "none", border: "1px solid var(--border)",
                    borderRadius: "0.625rem", padding: "0.4375rem 2rem 0.4375rem 0.75rem",
                    fontSize: "0.875rem", fontFamily: "inherit",
                    color: "var(--charcoal)", background: "var(--surface)", cursor: "pointer",
                  }}>
                  <option value="rating">Top Rated</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="newest">Newest</option>
                </select>
                <ChevronDown size={14} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
              </div>

              <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "0.625rem", padding: "0.2rem", border: "1px solid var(--border)" }}>
                {(["grid", "list"] as const).map((mode) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{
                    width: "30px", height: "30px", borderRadius: "0.4rem", border: "none",
                    background: viewMode === mode ? "var(--surface)" : "transparent",
                    color: viewMode === mode ? "#D4AF37" : "var(--muted)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: viewMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}>
                    {mode === "grid" ? <Grid size={16} /> : <List size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(280px, 1fr))" : "1fr", gap: "1.25rem" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: "var(--surface)", borderRadius: "1.25rem", border: "1px solid var(--border)", overflow: "hidden", opacity: 0.6 }}>
                  <div style={{ height: viewMode === "grid" ? "180px" : "80px", background: "var(--surface-2)" }} />
                  <div style={{ padding: "1.25rem" }}>
                    <div style={{ height: "18px", background: "var(--surface-2)", borderRadius: "4px", width: "55%", marginBottom: "0.625rem" }} />
                    <div style={{ height: "14px", background: "var(--surface-2)", borderRadius: "4px", width: "75%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : businesses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 2rem", background: "var(--surface)", borderRadius: "1.25rem", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔍</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                No results found
              </h3>
              <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
                Try different keywords, remove filters, or browse another category.
              </p>
              <button onClick={clearAll} className="btn-gold">Clear All Filters</button>
            </div>
          ) : viewMode === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem" }}>
              {businesses.map((biz) => <BusinessCardGrid key={biz.id} business={biz} />)}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {businesses.map((biz) => <BusinessCardList key={biz.id} business={biz} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function BusinessCardGrid({ business: biz }: { business: any }) {
  return (
    <Link href={`/business/${biz.slug}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--surface)", borderRadius: "1.25rem", overflow: "hidden",
        border: "1px solid var(--border)", transition: "all 0.25s", cursor: "pointer",
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}>
        <div style={{ height: "180px", position: "relative", overflow: "hidden", background: "var(--surface-2)" }}>
          {biz.cover_image_url ? (
            <img src={biz.cover_image_url} alt={biz.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "rgba(212,175,55,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem" }}>✨</div>
          )}
          {biz.is_verified && (
            <div style={{ position: "absolute", top: "0.75rem", left: "0.75rem", background: "rgba(212,175,55,0.95)", color: "white", fontSize: "0.6875rem", fontWeight: "700", padding: "0.2rem 0.625rem", borderRadius: "9999px" }}>
              ✓ VERIFIED
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
  );
}

function BusinessCardList({ business: biz }: { business: any }) {
  return (
    <Link href={`/business/${biz.slug}`} style={{ textDecoration: "none" }}>
      <div style={{
        background: "var(--surface)", borderRadius: "1rem", border: "1px solid var(--border)",
        transition: "all 0.2s", display: "flex", gap: "1.25rem",
        padding: "1.125rem", alignItems: "center",
      }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#D4AF37";
          (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(212,175,55,0.12)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}>
        <div style={{ width: "80px", height: "80px", borderRadius: "0.875rem", overflow: "hidden", flexShrink: 0, background: "var(--surface-2)" }}>
          {biz.cover_image_url ? (
            <img src={biz.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem" }}>✨</div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: "600", color: "var(--charcoal)" }}>
              {biz.name}
            </h3>
            {biz.is_verified && (
              <span style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#D4AF37", background: "rgba(212,175,55,0.1)", padding: "0.1rem 0.5rem", borderRadius: "9999px" }}>
                ✓ Verified
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", marginBottom: "0.375rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{biz.category}</span>
            {biz.city && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.8125rem", color: "var(--muted)" }}>
                <MapPin size={11} />{biz.city}
              </span>
            )}
            {biz.rating > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.8125rem", fontWeight: "600", color: "var(--charcoal)" }}>
                <Star size={11} fill="#D4AF37" color="#D4AF37" />{biz.rating} ({biz.total_reviews})
              </span>
            )}
          </div>
          {biz.description && (
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {biz.description}
            </p>
          )}
        </div>
        <div className="btn-gold" style={{ fontSize: "0.8125rem", padding: "0.5rem 1.125rem", flexShrink: 0 }}>
          Book
        </div>
      </div>
    </Link>
  );
}