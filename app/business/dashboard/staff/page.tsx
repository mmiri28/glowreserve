"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X, User, Clock } from "lucide-react";
import toast from "react-hot-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return { value: `${String(h).padStart(2, "0")}:${m}`, label: `${h12}:${m} ${ampm}` };
});

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", specialties: "", avatar_url: "" });
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [availability, setAvailability] = useState<any[]>([]);
  const [savingAvail, setSavingAvail] = useState(false);

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase
        .from("businesses").select("id").eq("owner_id", user.id).single();
      if (biz) { setBusinessId(biz.id); fetchStaff(biz.id); }
    };
    init();
  }, []);

  const fetchStaff = async (bizId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("staff").select("*").eq("business_id", bizId).order("created_at");
    setStaff(data || []);
  };

  const loadAvailability = async (staffId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("staff_availability").select("*").eq("staff_id", staffId);
    const full = DAYS.map((_, i) => {
      const existing = (data || []).find((d: any) => d.day_of_week === i);
      return existing || {
        staff_id: staffId, day_of_week: i,
        start_time: "09:00", end_time: "18:00", is_active: false,
      };
    });
    setAvailability(full);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", specialties: "", avatar_url: "" });
    setShowForm(true);
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setForm({
      name: s.name,
      specialties: (s.specialties || []).join(", "),
      avatar_url: s.avatar_url || "",
    });
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
      specialties: form.specialties ? form.specialties.split(",").map(s => s.trim()).filter(Boolean) : [],
      avatar_url: form.avatar_url || null,
    };

    let error;
    if (editing) {
      ({ error } = await supabase.from("staff").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("staff").insert(payload));
    }

    if (error) toast.error(error.message);
    else {
      toast.success(editing ? "Staff updated!" : "Staff member added!");
      setShowForm(false);
      fetchStaff(businessId);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this staff member?")) return;
    const supabase = createClient();
    await supabase.from("staff").delete().eq("id", id);
    toast.success("Staff member removed.");
    if (businessId) fetchStaff(businessId);
  };

  const handleSelectStaff = async (s: any) => {
    setSelectedStaff(s);
    await loadAvailability(s.id);
  };

  const updateAvail = (index: number, field: string, value: any) => {
    setAvailability(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const saveAvailability = async () => {
    if (!selectedStaff) return;
    setSavingAvail(true);
    const supabase = createClient();
    for (const a of availability) {
      if (a.id) {
        await supabase.from("staff_availability")
          .update({ start_time: a.start_time, end_time: a.end_time, is_active: a.is_active })
          .eq("id", a.id);
      } else if (a.is_active) {
        await supabase.from("staff_availability").insert({
          staff_id: selectedStaff.id, day_of_week: a.day_of_week,
          start_time: a.start_time, end_time: a.end_time, is_active: true,
        });
      }
    }
    toast.success("Schedule saved!");
    await loadAvailability(selectedStaff.id);
    setSavingAvail(false);
  };

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
            Staff Management
          </h1>
          <p style={{ color: "var(--muted)" }}>Add team members and set their individual schedules.</p>
        </div>
        <button onClick={openNew} className="btn-gold">
          <Plus size={16} style={{ marginRight: "0.5rem" }} />Add Staff
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedStaff ? "1fr 1fr" : "1fr", gap: "1.5rem" }} className="lg:grid-cols-[1fr_1fr]">
        {/* Staff list */}
        <div>
          {staff.length === 0 ? (
            <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "1.25rem", border: "2px dashed rgba(212,175,55,0.3)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>👤</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>No staff yet</h3>
              <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>Add team members so customers can choose who serves them.</p>
              <button onClick={openNew} className="btn-gold">Add First Staff Member</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {staff.map((s) => (
                <div key={s.id}
                  onClick={() => handleSelectStaff(s)}
                  style={{
                    background: "var(--surface)", borderRadius: "1rem", padding: "1.25rem",
                    border: `2px solid ${selectedStaff?.id === s.id ? "#D4AF37" : "var(--border)"}`,
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", gap: "1rem", alignItems: "center",
                  }}>
                  <div style={{
                    width: "52px", height: "52px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: "700", fontSize: "1.25rem",
                    flexShrink: 0, overflow: "hidden",
                  }}>
                    {s.avatar_url
                      ? <img src={s.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : s.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "1rem", marginBottom: "0.25rem" }}>{s.name}</p>
                    {s.specialties?.length > 0 && (
                      <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                        {s.specialties.join(" · ")}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={(e) => { e.stopPropagation(); openEdit(s); }} style={{ width: "32px", height: "32px", borderRadius: "0.5rem", background: "var(--surface-2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Pencil size={14} color="var(--muted)" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} style={{ width: "32px", height: "32px", borderRadius: "0.5rem", background: "rgba(232,92,92,0.08)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={14} color="#E85C5C" />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Clock size={14} color={selectedStaff?.id === s.id ? "#D4AF37" : "var(--muted)"} />
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {selectedStaff?.id === s.id ? "Editing schedule" : "Set schedule →"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule editor */}
        {selectedStaff && (
          <div style={{ background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.25rem" }}>
                  {selectedStaff.name}&apos;s Schedule
                </h2>
                <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>Set working days and hours</p>
              </div>
              <button onClick={() => setSelectedStaff(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0.25rem" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.25rem" }}>
              {availability.map((a, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "80px 1fr 1fr auto",
                  gap: "0.5rem", alignItems: "center",
                  padding: "0.625rem 0.75rem", borderRadius: "0.75rem",
                  background: a.is_active ? "rgba(212,175,55,0.04)" : "var(--surface-2)",
                  border: `1px solid ${a.is_active ? "rgba(212,175,55,0.2)" : "var(--border)"}`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => updateAvail(i, "is_active", !a.is_active)}
                      style={{
                        width: "32px", height: "18px", borderRadius: "9px",
                        background: a.is_active ? "#D4AF37" : "var(--border)",
                        border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
                      }}>
                      <div style={{ position: "absolute", width: "12px", height: "12px", borderRadius: "50%", background: "white", top: "3px", left: a.is_active ? "17px" : "3px", transition: "left 0.2s" }} />
                    </button>
                    <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: a.is_active ? "var(--charcoal)" : "var(--muted)" }}>
                      {DAYS[i]}
                    </span>
                  </div>
                  <select className="input-glow" disabled={!a.is_active} value={a.start_time}
                    onChange={(e) => updateAvail(i, "start_time", e.target.value)}
                    style={{ fontSize: "0.8125rem", padding: "0.375rem 0.625rem", opacity: a.is_active ? 1 : 0.4 }}>
                    {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <select className="input-glow" disabled={!a.is_active} value={a.end_time}
                    onChange={(e) => updateAvail(i, "end_time", e.target.value)}
                    style={{ fontSize: "0.8125rem", padding: "0.375rem 0.625rem", opacity: a.is_active ? 1 : 0.4 }}>
                    {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <span style={{ fontSize: "0.6875rem", color: a.is_active ? "#4CAF7C" : "var(--muted)", fontWeight: "600", whiteSpace: "nowrap" }}>
                    {a.is_active ? "✓ On" : "Off"}
                  </span>
                </div>
              ))}
            </div>

            <button onClick={saveAvailability} className="btn-gold" disabled={savingAvail}
              style={{ width: "100%", justifyContent: "center", opacity: savingAvail ? 0.7 : 1 }}>
              {savingAvail ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={{ background: "var(--surface)", borderRadius: "1.5rem", width: "100%", maxWidth: "440px", padding: "2rem", animation: "slideUp 0.3s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "600", color: "var(--charcoal)" }}>
                {editing ? "Edit Staff Member" : "Add Staff Member"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>Full Name *</label>
                <input type="text" className="input-glow" placeholder="e.g. Sarah Johnson"
                  value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  Specialties <span style={{ color: "var(--muted)", fontWeight: "400" }}>(comma separated)</span>
                </label>
                <input type="text" className="input-glow" placeholder="e.g. Lashes, Brows, Makeup"
                  value={form.specialties} onChange={(e) => setForm(p => ({ ...p, specialties: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  Photo URL <span style={{ color: "var(--muted)", fontWeight: "400" }}>(optional)</span>
                </label>
                <input type="url" className="input-glow" placeholder="https://..."
                  value={form.avatar_url} onChange={(e) => setForm(p => ({ ...p, avatar_url: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-gold" disabled={saving} style={{ flex: 2, opacity: saving ? 0.7 : 1 }}>
                  {saving ? "Saving..." : editing ? "Save Changes" : "Add Staff"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}