"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Camera, Save, Building2, MapPin, Phone, Mail, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function BusinessSettingsPage() {
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", description: "", category: "",
    address: "", city: "", phone: "", email: "",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadBusiness(); }, []);

  const loadBusiness = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("businesses").select("*").eq("owner_id", user.id).maybeSingle();
    if (data) {
      setBusiness(data);
      setForm({ name: data.name || "", description: data.description || "", category: data.category || "", address: data.address || "", city: data.city || "", phone: data.phone || "", email: data.email || "" });
      setLogoUrl(data.logo_url);
      setCoverUrl(data.cover_image_url);
    }
    setLoading(false);
  };

  const uploadImage = async (
    file: File,
    type: "logo" | "cover",
    setUploading: (v: boolean) => void,
    setUrl: (url: string) => void,
  ) => {
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${business.id}/${type}.${ext}`;
    const { error } = await supabase.storage.from("business-assets").upload(path, file, { upsert: true });
    if (error) { toast.error("Upload failed: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("business-assets").getPublicUrl(path);
    const field = type === "logo" ? "logo_url" : "cover_image_url";
    await supabase.from("businesses").update({ [field]: publicUrl }).eq("id", business.id);
    setUrl(publicUrl);
    toast.success(`${type === "logo" ? "Logo" : "Cover image"} updated!`);
    setUploading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("businesses").update({
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category.trim(),
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    }).eq("id", business.id);

    if (error) toast.error(error.message);
    else toast.success("Business updated successfully!");
    setSaving(false);
  };

  if (loading) return <div style={{ padding: "2rem", color: "var(--muted)" }}>Loading...</div>;
  if (!business) return <div style={{ padding: "2rem", color: "var(--muted)" }}>No business found. <a href="/business/register" style={{ color: "#D4AF37" }}>Create one</a></div>;

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem", maxWidth: "720px" }} className="md:p-8">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
        Business Settings
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Update your business profile, images, and information.
      </p>

      {/* Cover image */}
      <div style={{ background: "var(--surface)", borderRadius: "1.25rem", border: "1px solid var(--border)", overflow: "hidden", marginBottom: "1.5rem" }}>
        <div style={{ height: "180px", background: "var(--surface-2)", position: "relative", overflow: "hidden" }}>
          {coverUrl
            ? <img src={coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "0.9375rem" }}>
              No cover image
            </div>}
          <button onClick={() => coverRef.current?.click()} style={{ position: "absolute", bottom: "0.75rem", right: "0.75rem", display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderRadius: "0.625rem", background: "rgba(0,0,0,0.65)", color: "white", border: "none", cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600", fontFamily: "inherit" }}>
            <Camera size={14} /> {uploadingCover ? "Uploading..." : "Change Cover"}
          </button>
        </div>

        {/* Logo */}
        <div style={{ padding: "0 1.5rem 1.25rem", display: "flex", alignItems: "flex-end", gap: "1rem", marginTop: "-28px" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "1rem", border: "3px solid var(--surface)", background: "var(--surface-2)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", position: "relative", flexShrink: 0 }}>
            {logoUrl
              ? <img src={logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "✨"}
            <button onClick={() => logoRef.current?.click()} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", color: "white", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "0"}>
              <Camera size={18} />
            </button>
          </div>
          <div>
            <p style={{ fontWeight: "700", color: "var(--charcoal)", fontSize: "1.0625rem" }}>{business.name}</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
              {uploadingLogo ? "Uploading logo..." : "Click logo to change"}
            </p>
          </div>
        </div>
      </div>

      <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "logo", setUploadingLogo, setLogoUrl); }} />
      <input ref={coverRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "cover", setUploadingCover, setCoverUrl); }} />

      {/* Form */}
      <form onSubmit={handleSave} style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.75rem", border: "1px solid var(--border)" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "1.5rem" }}>
          Business Information
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>Business Name</label>
              <input type="text" className="input-glow" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>Category</label>
              <input type="text" className="input-glow" placeholder="e.g. Hair, Nails, Spa" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
              <FileText size={14} style={{ display: "inline", marginRight: "0.375rem" }} />Description
            </label>
            <textarea className="input-glow" rows={3} placeholder="Tell customers about your business..."
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                <MapPin size={14} style={{ display: "inline", marginRight: "0.375rem" }} />Address
              </label>
              <input type="text" className="input-glow" placeholder="Street address" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>City</label>
              <input type="text" className="input-glow" placeholder="City" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                <Phone size={14} style={{ display: "inline", marginRight: "0.375rem" }} />Phone
              </label>
              <input type="tel" className="input-glow" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                <Mail size={14} style={{ display: "inline", marginRight: "0.375rem" }} />Email
              </label>
              <input type="email" className="input-glow" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border)" }}>
          <button type="submit" className="btn-gold" disabled={saving} style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: saving ? 0.75 : 1 }}>
            <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}