"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const CATEGORIES = ["Hair", "Nails", "Lashes", "Skincare", "Massage", "Makeup", "Brows", "Waxing", "Spa", "Other"];

function slugify(str: string) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function BusinessRegisterPage() {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    address: "",
    city: "",
    phone: "",
    email: "",
  });
  const router = useRouter();

  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    // Generate unique slug
    let slug = slugify(form.name);
    const { data: existing } = await supabase.from("businesses").select("slug").eq("slug", slug).single();
    if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name: form.name,
      slug,
      category: form.category,
      description: form.description || null,
      address: form.address || null,
      city: form.city || null,
      phone: form.phone || null,
      email: form.email || user.email,
    });

    if (error) {
      toast.error(error.message);
    } else {
      // Update profile role to business_owner
      await supabase.from("profiles").update({ role: "business_owner" }).eq("id", user.id);
      toast.success("Business created! Let's set up your services.");
      router.push("/business/dashboard/services");
    }
    setSaving(false);
  };

  const STEPS = [
    { n: 1, label: "Basic Info" },
    { n: 2, label: "Details" },
    { n: 3, label: "Contact" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FDFBF7 0%, #F5E6E8 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: "520px" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: "0.375rem",
          color: "#8A8680", fontSize: "0.875rem", textDecoration: "none",
          marginBottom: "2rem",
        }}>
          <ArrowLeft size={16} /> Back
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "60px", height: "60px", borderRadius: "14px",
            background: "linear-gradient(135deg, #D4AF37, #B8941F)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem",
          }}>
            <Sparkles size={28} color="white" />
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2rem", fontWeight: "700", color: "#1A1A1A",
          }}>
            List Your Business
          </h1>
          <p style={{ color: "#8A8680", marginTop: "0.5rem" }}>
            Join thousands of beauty professionals on GlowReserve
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem" }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.375rem" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8125rem", fontWeight: "700",
                  background: step > s.n
                    ? "linear-gradient(135deg, #D4AF37, #B8941F)"
                    : step === s.n ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "#F5F0E8",
                  color: step >= s.n ? "white" : "#8A8680",
                }}>
                  {step > s.n ? <Check size={14} /> : s.n}
                </div>
                <span style={{ fontSize: "0.6875rem", color: step === s.n ? "#D4AF37" : "#8A8680", fontWeight: "600" }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: "60px", height: "2px", background: step > s.n ? "#D4AF37" : "#E8E2D9", margin: "0 0.5rem 1.25rem" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: "white", borderRadius: "1.5rem",
          padding: "2rem", border: "1px solid #E8E2D9",
          boxShadow: "0 8px 32px rgba(26,26,26,0.06)",
        }}>
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }} className="animate-slide-up">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "600", color: "#1A1A1A" }}>
                Tell us about your business
              </h2>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Business Name *
                </label>
                <input type="text" className="input-glow" placeholder="e.g. Luxe Lash Lounge"
                  value={form.name} onChange={(e) => update("name", e.target.value)} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Primary Category *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                  {CATEGORIES.map((cat) => (
                    <button key={cat} type="button"
                      onClick={() => update("category", cat)}
                      style={{
                        padding: "0.625rem",
                        borderRadius: "0.625rem",
                        border: `2px solid ${form.category === cat ? "#D4AF37" : "#E8E2D9"}`,
                        background: form.category === cat ? "rgba(212,175,55,0.08)" : "white",
                        color: form.category === cat ? "#1A1A1A" : "#8A8680",
                        fontWeight: form.category === cat ? "600" : "400",
                        fontSize: "0.8125rem", cursor: "pointer",
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button type="button" onClick={() => form.name && form.category ? setStep(2) : toast.error("Fill in all required fields")}
                className="btn-gold" style={{ marginTop: "0.5rem" }}>
                Continue →
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }} className="animate-slide-up">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "600", color: "#1A1A1A" }}>
                Describe your business
              </h2>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Description
                </label>
                <textarea className="input-glow" rows={4}
                  placeholder="Tell clients what makes your business special..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  style={{ resize: "vertical" }} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  City / Location *
                </label>
                <input type="text" className="input-glow" placeholder="e.g. New York, NY"
                  value={form.city} onChange={(e) => update("city", e.target.value)} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Street Address
                </label>
                <input type="text" className="input-glow" placeholder="123 Beauty Lane"
                  value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ flex: 1 }}>
                  ← Back
                </button>
                <button type="button" onClick={() => form.city ? setStep(3) : toast.error("Enter a city")}
                  className="btn-gold" style={{ flex: 2 }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }} className="animate-slide-up">
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "600", color: "#1A1A1A" }}>
                Contact details
              </h2>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Business Phone
                </label>
                <input type="tel" className="input-glow" placeholder="+1 (555) 000-0000"
                  value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Business Email
                </label>
                <input type="email" className="input-glow" placeholder="hello@yourbusiness.com"
                  value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>

              {/* Preview */}
              {form.name && (
                <div style={{
                  background: "rgba(212,175,55,0.06)",
                  border: "1px solid rgba(212,175,55,0.2)",
                  borderRadius: "0.875rem",
                  padding: "1rem",
                }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "#D4AF37", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Your public URL will be:
                  </p>
                  <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#1A1A1A" }}>
                    glowreserve.com/business/{slugify(form.name)}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button type="button" onClick={() => setStep(2)} className="btn-ghost" style={{ flex: 1 }}>
                  ← Back
                </button>
                <button type="submit" className="btn-gold" disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Creating..." : "Launch My Business ✨"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
