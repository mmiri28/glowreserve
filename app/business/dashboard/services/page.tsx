"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORIES = ["Hair", "Nails", "Lashes", "Skincare", "Massage", "Makeup", "Brows", "Waxing", "Other"];

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", description: "", duration_minutes: 60, price: "", category: "Hair" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
      if (biz) { setBusinessId(biz.id); fetchServices(biz.id); }
    };
    init();
  }, []);

  const fetchServices = async (bizId: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("services").select("*").eq("business_id", bizId).order("created_at");
    setServices(data || []);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", description: "", duration_minutes: 60, price: "", category: "Hair" });
    setShowForm(true);
  };

  const openEdit = (svc: any) => {
    setEditing(svc);
    setForm({ name: svc.name, description: svc.description || "", duration_minutes: svc.duration_minutes, price: svc.price ? String(svc.price) : "", category: svc.category || "Hair" });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setSaving(true);
    const supabase = createClient();
    const payload = {
      business_id: businessId,
      name: form.name,
      description: form.description || null,
      duration_minutes: Number(form.duration_minutes),
      price: form.price ? Number(form.price) : null,
      category: form.category,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("services").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("services").insert(payload));
    }

    if (error) toast.error(error.message);
    else {
      toast.success(editing ? "Service updated!" : "Service added!");
      setShowForm(false);
      fetchServices(businessId);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Service deleted."); if (businessId) fetchServices(businessId); }
  };

  const toggleActive = async (svc: any) => {
    const supabase = createClient();
    await supabase.from("services").update({ is_active: !svc.is_active }).eq("id", svc.id);
    if (businessId) fetchServices(businessId);
  };

  return (
    <div style={{ padding: "2rem 2rem 4rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "#1A1A1A", marginBottom: "0.375rem" }}>
            Service Management
          </h1>
          <p style={{ color: "#8A8680" }}>Add and manage the services your business offers.</p>
        </div>
        <button onClick={openNew} className="btn-gold">
          <Plus size={16} style={{ marginRight: "0.5rem" }} /> Add Service
        </button>
      </div>

      {/* Service list */}
      {services.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "white", borderRadius: "1.25rem", border: "2px dashed rgba(212,175,55,0.3)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✂️</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "#1A1A1A", marginBottom: "0.5rem" }}>No services yet</h3>
          <p style={{ color: "#8A8680", marginBottom: "1.5rem" }}>Add your first service so clients can start booking.</p>
          <button onClick={openNew} className="btn-gold">Add First Service</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {services.map((svc) => (
            <div key={svc.id} style={{
              background: "white", borderRadius: "1.25rem",
              border: "1px solid #E8E2D9", padding: "1.5rem",
              opacity: svc.is_active ? 1 : 0.6,
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <div>
                  <span style={{
                    fontSize: "0.6875rem", fontWeight: "600",
                    color: "#D4AF37", textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}>
                    {svc.category}
                  </span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "#1A1A1A", marginTop: "0.25rem" }}>
                    {svc.name}
                  </h3>
                </div>
                <div style={{ display: "flex", gap: "0.375rem" }}>
                  <button onClick={() => openEdit(svc)} style={{
                    width: "32px", height: "32px", borderRadius: "0.5rem",
                    background: "#F5F0E8", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Pencil size={14} color="#8A8680" />
                  </button>
                  <button onClick={() => handleDelete(svc.id)} style={{
                    width: "32px", height: "32px", borderRadius: "0.5rem",
                    background: "rgba(232,92,92,0.08)", border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Trash2 size={14} color="#E85C5C" />
                  </button>
                </div>
              </div>

              {svc.description && (
                <p style={{ fontSize: "0.875rem", color: "#8A8680", marginBottom: "0.875rem", lineHeight: "1.5" }}>
                  {svc.description}
                </p>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <span style={{ fontSize: "0.875rem", color: "#8A8680" }}>⏱ {svc.duration_minutes} min</span>
                  {svc.price && <span style={{ fontSize: "0.875rem", fontWeight: "700", color: "#D4AF37" }}>${svc.price}</span>}
                </div>
                {/* Toggle */}
                <button onClick={() => toggleActive(svc)} style={{
                  display: "flex", alignItems: "center", gap: "0.375rem",
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: "0.8125rem", fontWeight: "600",
                  color: svc.is_active ? "#4CAF7C" : "#8A8680",
                }}>
                  {svc.is_active ? <><Check size={14} /> Active</> : "Inactive"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(26,26,26,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{
            background: "white", borderRadius: "1.5rem",
            width: "100%", maxWidth: "480px",
            padding: "2rem",
            animation: "slideUp 0.3s ease-out",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "600", color: "#1A1A1A" }}>
                {editing ? "Edit Service" : "Add New Service"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8680" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Service Name *
                </label>
                <input type="text" className="input-glow" placeholder="e.g. Classic Manicure"
                  value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Category *
                </label>
                <select className="input-glow" value={form.category}
                  onChange={(e) => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                  Description
                </label>
                <textarea className="input-glow" rows={3} placeholder="Brief description of this service..."
                  value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ resize: "vertical" }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                    Duration (minutes) *
                  </label>
                  <input type="number" className="input-glow" min="15" step="15"
                    value={form.duration_minutes}
                    onChange={(e) => setForm(p => ({ ...p, duration_minutes: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem" }}>
                    Price ($)
                  </label>
                  <input type="number" className="input-glow" min="0" step="0.01" placeholder="e.g. 65"
                    value={form.price} onChange={(e) => setForm(p => ({ ...p, price: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn-gold" disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
