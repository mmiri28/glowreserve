"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Shield } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "business_owner" | "admin">("all");

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (roleFilter !== "all") q = q.eq("role", roleFilter);
    const { data } = await q;
    setUsers(data || []);
    setLoading(false);
  };

  const updateRole = async (id: string, newRole: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    }
  };

  const filtered = users.filter(u =>
    query
      ? u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        u.username?.toLowerCase().includes(query.toLowerCase()) ||
        u.phone?.includes(query)
      : true
  );

  const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
    customer: { bg: "rgba(91,141,239,0.1)", color: "#5B8DEF" },
    business_owner: { bg: "rgba(212,175,55,0.1)", color: "#D4AF37" },
    admin: { bg: "rgba(232,92,92,0.1)", color: "#E85C5C" },
  };

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
        Users
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Manage all platform users and their roles.
      </p>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--surface)", borderRadius: "0.75rem", padding: "0.625rem 1rem", border: "1px solid var(--border)", flex: 1, minWidth: "200px" }}>
          <Search size={16} color="#D4AF37" />
          <input type="text" placeholder="Search name, username, phone..." value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: "inherit", fontSize: "0.9375rem", color: "var(--charcoal)" }} />
        </div>
        <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "0.75rem", padding: "0.2rem", border: "1px solid var(--border)" }}>
          {(["all", "customer", "business_owner", "admin"] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r)} style={{
              padding: "0.4375rem 0.75rem", borderRadius: "0.5rem", border: "none",
              background: roleFilter === r ? "var(--surface)" : "transparent",
              color: roleFilter === r ? "var(--charcoal)" : "var(--muted)",
              cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600",
              fontFamily: "inherit",
              boxShadow: roleFilter === r ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {r === "all" ? "All" : r === "business_owner" ? "Business" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginBottom: "1rem" }}>
        {filtered.length} user{filtered.length !== 1 ? "s" : ""}
      </p>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.map((u) => {
            const roleStyle = ROLE_COLORS[u.role] || ROLE_COLORS.customer;
            return (
              <div key={u.id} style={{
                background: "var(--surface)", borderRadius: "1rem", padding: "1.125rem 1.25rem",
                border: "1px solid var(--border)",
                display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap",
              }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "1.125rem", flexShrink: 0 }}>
                  {u.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: "180px" }}>
                  <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem", marginBottom: "0.2rem" }}>
                    {u.full_name || "No name"}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                    @{u.username}
                    {u.phone && ` · ${u.phone}`}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", flexWrap: "wrap" }}>
                  {/* Role badge + change */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "600", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: roleStyle.bg, color: roleStyle.color }}>
                      {u.role === "business_owner" ? "Business" : u.role === "admin" ? "🔒 Admin" : "Customer"}
                    </span>
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      style={{
                        border: "1px solid var(--border)", borderRadius: "0.5rem",
                        padding: "0.25rem 0.5rem", fontSize: "0.75rem",
                        fontFamily: "inherit", color: "var(--charcoal)",
                        background: "var(--surface)", cursor: "pointer",
                      }}
                    >
                      <option value="customer">Customer</option>
                      <option value="business_owner">Business Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p style={{ color: "var(--muted)", textAlign: "center", padding: "3rem" }}>No users found.</p>
          )}
        </div>
      )}
    </div>
  );
}