"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Sparkles, Camera, Upload, Building2 } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Hair Salon", "Barbershop", "Nail Salon", "Spa & Wellness",
  "Makeup Artist", "Lash & Brow", "Skincare", "Massage Therapy", "Other",
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function BusinessRegisterPage() {
  const router = useRouter();
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

  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Logo image
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
  };

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File) => void,
    setPreview: (s: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, or WEBP images allowed");
      return;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.category) {
      toast.error("Please fill in business name and category.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/auth/login");
      setSaving(false);
      return;
    }

    const slug = slugify(form.name);

    // Step 1 — Create the business via server API
    const res = await fetch("/api/business/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.trim(),
        slug,
        category: form.category,
        description: form.description.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || user.email,
      }),
    });

    let result = await res.json();

    // Handle duplicate slug — retry with random suffix
    if (res.status === 409) {
      const retrySlug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      const retryRes = await fetch("/api/business/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: retrySlug,
          category: form.category,
          description: form.description.trim() || null,
          address: form.address.trim() || null,
          city: form.city.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || user.email,
        }),
      });
      result = await retryRes.json();
      if (!retryRes.ok) {
        toast.error(result.error || "Failed to create business.");
        setSaving(false);
        return;
      }
    } else if (!res.ok) {
      toast.error(result.error || "Failed to create business.");
      setSaving(false);
      return;
    }

    const businessId = result.business?.id;

    // Step 2 — Upload cover image (if provided)
    if (coverFile && businessId) {
      const ext = coverFile.name.split(".").pop();
      const path = `${businessId}/cover.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(path, coverFile, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("business-assets")
          .getPublicUrl(path);
        await supabase.from("businesses").update({ cover_image_url: publicUrl }).eq("id", businessId);
      } else {
        console.error("Cover upload error:", uploadError);
      }
    }

    // Step 3 — Upload logo image (if provided)
    if (logoFile && businessId) {
      const ext = logoFile.name.split(".").pop();
      const path = `${businessId}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("business-assets")
        .upload(path, logoFile, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("business-assets")
          .getPublicUrl(path);
        await supabase.from("businesses").update({ logo_url: publicUrl }).eq("id", businessId);
      } else {
        console.error("Logo upload error:", uploadError);
      }
    }

    toast.success("Business profile created successfully! ✨");
    router.push("/business/dashboard/services");
    setSaving(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "var(--charcoal)" }}>
            Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
          </span>
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1.5rem 4rem" }}>
        <div style={{ width: "100%", maxWidth: "560px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: "1.5rem" }}>
            <ArrowLeft size={16} /> Back
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "0.875rem", background: "rgba(212,175,55,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={22} color="#D4AF37" />
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "var(--charcoal)" }}>
              Set Up Your Business
            </h1>
          </div>
          <p style={{ color: "var(--muted)", marginBottom: "2rem", lineHeight: "1.6" }}>
            Tell us about your business so customers can find and book with you.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Cover image */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Cover Image <span style={{ color: "var(--muted)", fontWeight: "400" }}>(recommended)</span>
              </label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageSelect(e, setCoverFile, setCoverPreview)}
                style={{ display: "none" }}
              />
              {coverPreview ? (
                <div style={{ position: "relative", borderRadius: "1rem", overflow: "hidden", border: "1px solid var(--border)" }}>
                  <img src={coverPreview} alt="" style={{ width: "100%", height: "160px", objectFit: "cover", display: "block" }} />
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    style={{ position: "absolute", bottom: "0.625rem", right: "0.625rem", display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderRadius: "0.625rem", background: "rgba(0,0,0,0.6)", color: "white", border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600", fontFamily: "inherit" }}
                  >
                    <Camera size={14} /> Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  style={{ width: "100%", height: "140px", borderRadius: "1rem", border: "2px dashed rgba(212,175,55,0.3)", background: "rgba(212,175,55,0.04)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer", color: "var(--muted)", fontFamily: "inherit", transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#D4AF37"; (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)"; (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.04)"; }}
                >
                  <Upload size={22} color="#D4AF37" />
                  <span style={{ fontSize: "0.9375rem", fontWeight: "500" }}>Upload a cover photo</span>
                  <span style={{ fontSize: "0.75rem" }}>JPG, PNG, WEBP · Max 5MB</span>
                </button>
              )}
            </div>

            {/* Logo image */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Logo <span style={{ color: "var(--muted)", fontWeight: "400" }}>(optional)</span>
              </label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleImageSelect(e, setLogoFile, setLogoPreview)}
                style={{ display: "none" }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "1rem", border: "1px solid var(--border)", background: "var(--surface-2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", flexShrink: 0 }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : "✨"}
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1.125rem", borderRadius: "0.625rem", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--charcoal)", fontSize: "0.875rem", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}
                >
                  <Camera size={15} /> {logoPreview ? "Change Logo" : "Upload Logo"}
                </button>
              </div>
            </div>

            {/* Business name */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Business Name *
              </label>
              <input
                type="text"
                className="input-glow"
                placeholder="e.g. Glow Beauty Studio"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Category *
              </label>
              <select
                className="input-glow"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Description <span style={{ color: "var(--muted)", fontWeight: "400" }}>(optional)</span>
              </label>
              <textarea
                className="input-glow"
                rows={3}
                placeholder="Tell customers what makes your business special..."
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Address + City */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  Address
                </label>
                <input
                  type="text"
                  className="input-glow"
                  placeholder="Street address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  City
                </label>
                <input
                  type="text"
                  className="input-glow"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>
            </div>

            {/* Phone + Email */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  className="input-glow"
                  placeholder="+1 (555) 000-0000"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  Email
                </label>
                <input
                  type="email"
                  className="input-glow"
                  placeholder="business@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={saving}
              style={{ width: "100%", justifyContent: "center", padding: "0.9375rem", fontSize: "1rem", opacity: saving ? 0.75 : 1, marginTop: "0.5rem" }}
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Creating your business...
                </span>
              ) : (
                "Create Business Profile →"
              )}
            </button>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}