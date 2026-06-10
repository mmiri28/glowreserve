"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Eye, Search } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "verified" | "unverified">("all");
  const [query, setQuery] = useState("");

  useEffect(() => { fetchBusinesses(); }, [filter]);

  const fetchBusinesses = async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("businesses")
      .select("*, profiles(full_name, username)")
      .order("created_at", { ascending: false });
    if (filter === "verified") q = q.eq("is_verified", true);
    if (filter === "unverified") q = q.eq("is_verified", false);
    const { data } = await q;
    setBusinesses(data || []);
    setLoading(false);
  };

  const verify = async (id: string, verify: boolean) => {
    const supabase = createClient();
    const { error } = await supabase.from("businesses")
      .update({ is_verified: verify }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(verify ? "Business verified!" : "Verification removed");
      fetchBusinesses();
    }
  };

  const filtered = businesses.filter(b =>
    query ? b.name.toLowerCase().includes(query.toLowerCase()) ||
      b.city?.toLowerCase().includes(query.toLowerCase()) : true
  );

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
        Businesses
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Manage and verify business listings.
      </p>

      {/* Controls */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface)", borderRadius: "0.75rem", padding: "0.625rem 1rem", border: "1px solid var(--border)", flex: 1, minWidth: "200px" }}>
          <Search size={16} color="#D4AF37" />
          <input type="text" placeholder="Search businesses..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "0.9375rem", color: "var(--charcoal)" }} />
        </div>
        <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "0.75rem", padding: "0.2rem", border: "1px solid var(--border)" }}>
          {(["all", "verified", "unverified"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "0.4375rem 0.875rem", borderRadius: "0.5rem", border: "none",
              background: filter === f ? "var(--surface)" : "transparent",
              color: filter === f ? "var(--charcoal)" : "var(--muted)",
              cursor: "pointer", fontSize: "0.875rem", fontWeight: "600",
              fontFamily: "inherit",
              boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map((biz) => (
            <div key={biz.id} style={{
              background: "var(--surface)", borderRadius: "1rem", padding: "1.25rem",
              border: "1px solid var(--border)",
              display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap",
            }}>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "1rem" }}>{biz.name}</span>
                  {biz.is_verified && <span style={{ fontSize: "0.6875rem", color: "#4CAF7C", background: "rgba(76,175,124,0.1)", padding: "0.1rem 0.5rem", borderRadius: "9999px", fontWeight: "600" }}>✓ Verified</span>}
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                  {biz.category} · {biz.city} · Owner: {biz.profiles?.full_name || "—"}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.2rem" }}>
                  ⭐ {biz.rating} · {biz.total_reviews} reviews
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.625rem", flexShrink: 0 }}>
                <Link href={`/business/${biz.slug}`} style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                  border: "1px solid var(--border)", color: "var(--muted)",
                  textDecoration: "none", fontSize: "0.8125rem", fontWeight: "600",
                }}>
                  <Eye size={14} /> View
                </Link>
                {biz.is_verified ? (
                  <button onClick={() => verify(biz.id, false)} style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                    border: "1px solid rgba(232,92,92,0.3)", background: "rgba(232,92,92,0.08)",
                    color: "#E85C5C", fontSize: "0.8125rem", fontWeight: "600",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <XCircle size={14} /> Unverify
                  </button>
                ) : (
                  <button onClick={() => verify(biz.id, true)} style={{
                    display: "flex", alignItems: "center", gap: "0.375rem",
                    padding: "0.5rem 0.875rem", borderRadius: "0.625rem",
                    border: "1px solid rgba(76,175,124,0.3)", background: "rgba(76,175,124,0.08)",
                    color: "#4CAF7C", fontSize: "0.8125rem", fontWeight: "600",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                    <CheckCircle size={14} /> Verify
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem" }}>
              No businesses found.
            </p>
          )}
        </div>
      )}
    </div>
  );
}