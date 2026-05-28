"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Lock, Camera, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setForm({ full_name: data?.full_name || "", phone: data?.phone || "", email: user.email || "" });
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: form.full_name, phone: form.phone || null })
      .eq("id", user.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Profile updated!");
      setProfile((p: any) => ({ ...p, full_name: form.full_name, phone: form.phone }));
    }
    setSaving(false);
  };

  if (!profile) return <div style={{ padding: "2rem", color: "#8A8680" }}>Loading...</div>;

  return (
    <div style={{ padding: "2rem", maxWidth: "640px" }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.875rem",
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: "0.375rem",
      }}>
        Profile Settings
      </h1>
      <p style={{ color: "#8A8680", marginBottom: "2rem" }}>
        Manage your personal information.
      </p>

      {/* Avatar */}
      <div style={{
        background: "white",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        border: "1px solid #E8E2D9",
        marginBottom: "1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
        flexWrap: "wrap",
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "linear-gradient(135deg, #D4AF37, #B8941F)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: "700", fontSize: "1.75rem",
          }}>
            {profile.full_name?.[0]?.toUpperCase() || "G"}
          </div>
          <button style={{
            position: "absolute", bottom: 0, right: 0,
            width: "26px", height: "26px", borderRadius: "50%",
            background: "#1A1A1A", border: "2px solid white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}>
            <Camera size={12} color="white" />
          </button>
        </div>
        <div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "600", color: "#1A1A1A" }}>
            {profile.full_name}
          </h3>
          <p style={{ color: "#8A8680", fontSize: "0.9375rem" }}>@{profile.username}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} style={{
        background: "white",
        borderRadius: "1.25rem",
        padding: "1.75rem",
        border: "1px solid #E8E2D9",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.125rem",
          fontWeight: "600",
          color: "#1A1A1A",
          marginBottom: "1.5rem",
        }}>
          Personal Information
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
          {/* Full Name */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
              Full Name
            </label>
            <input
              type="text"
              className="input-glow"
              value={form.full_name}
              onChange={(e) => setForm(p => ({ ...p, full_name: e.target.value }))}
              required
            />
          </div>

          {/* Username — LOCKED */}
          <div>
            <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.875rem", fontWeight: "500", color: "#8A8680", marginBottom: "0.5rem" }}>
              <Lock size={14} />
              Username <span style={{ fontSize: "0.75rem", color: "#D4AF37" }}>(permanent — cannot be changed)</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                value={profile.username}
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem 3rem 0.75rem 1rem",
                  borderRadius: "0.75rem",
                  border: "1px solid #E8E2D9",
                  background: "#F5F0E8",
                  color: "#8A8680",
                  fontFamily: "inherit",
                  cursor: "not-allowed",
                }}
              />
              <Lock size={16} color="#C4BFB9" style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)" }} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              disabled
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "0.75rem",
                border: "1px solid #E8E2D9",
                background: "#F5F0E8",
                color: "#8A8680",
                fontFamily: "inherit",
                cursor: "not-allowed",
              }}
            />
            <p style={{ fontSize: "0.75rem", color: "#8A8680", marginTop: "0.375rem" }}>
              Contact support to change your email address.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
              Phone Number
            </label>
            <input
              type="tel"
              className="input-glow"
              value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>

        <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid #E8E2D9" }}>
          <button type="submit" className="btn-gold" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
            <Save size={16} style={{ marginRight: "0.5rem" }} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      {/* Role badge */}
      <div style={{
        marginTop: "1.5rem",
        background: "white",
        borderRadius: "1.25rem",
        padding: "1.25rem 1.75rem",
        border: "1px solid #E8E2D9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}>
        <div>
          <p style={{ fontWeight: "600", color: "#1A1A1A", marginBottom: "0.25rem" }}>Account Type</p>
          <p style={{ fontSize: "0.875rem", color: "#8A8680" }}>
            {profile.role === "business_owner" ? "Business Owner" : "Customer"}
          </p>
        </div>
        <span style={{
          background: "rgba(212,175,55,0.1)",
          color: "#D4AF37",
          fontWeight: "600",
          fontSize: "0.8125rem",
          padding: "0.375rem 0.875rem",
          borderRadius: "9999px",
        }}>
          {profile.role === "business_owner" ? "✦ Business" : "✦ Customer"}
        </span>
      </div>
    </div>
  );
}
