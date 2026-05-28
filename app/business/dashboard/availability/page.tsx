"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, startOfWeek } from "date-fns";
import { Plus, Save, Lock, Unlock } from "lucide-react";
import toast from "react-hot-toast";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 7;
  const m = i % 2 === 0 ? "00" : "30";
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const ampm = h < 12 ? "AM" : "PM";
  return { value: `${String(h).padStart(2, "0")}:${m}`, label: `${hour12}:${m} ${ampm}` };
});

const SLOT_DURATIONS = [30, 45, 60, 90, 120];

export default function AvailabilityPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [blockedDate, setBlockedDate] = useState("");
  const [blockedStart, setBlockedStart] = useState("12:00");
  const [blockedEnd, setBlockedEnd] = useState("14:00");

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
      if (biz) {
        setBusinessId(biz.id);
        fetchTemplates(biz.id);
      }
    };
    init();
  }, []);

  const fetchTemplates = async (bizId: string) => {
    const supabase = createClient();
    const { data } = await supabase.from("availability_templates")
      .select("*").eq("business_id", bizId).order("day_of_week");
    // Build full 7-day template
    const full = DAYS.map((_, i) => {
      const existing = data?.find((t: any) => t.day_of_week === i);
      return existing || { day_of_week: i, start_time: "09:00", end_time: "18:00", slot_duration_minutes: 60, is_active: false, business_id: bizId };
    });
    setTemplates(full);
  };

  const updateTemplate = (dayIndex: number, field: string, value: any) => {
    setTemplates(prev => prev.map((t, i) => i === dayIndex ? { ...t, [field]: value } : t));
  };

  const saveTemplates = async () => {
    if (!businessId) return;
    setSaving(true);
    const supabase = createClient();

    for (const t of templates) {
      if (t.id) {
        await supabase.from("availability_templates")
          .update({ start_time: t.start_time, end_time: t.end_time, slot_duration_minutes: t.slot_duration_minutes, is_active: t.is_active })
          .eq("id", t.id);
      } else if (t.is_active) {
        await supabase.from("availability_templates").insert({
          business_id: businessId,
          day_of_week: t.day_of_week,
          start_time: t.start_time,
          end_time: t.end_time,
          slot_duration_minutes: t.slot_duration_minutes,
          is_active: true,
        });
      }
    }
    toast.success("Availability saved!");
    fetchTemplates(businessId);
    setSaving(false);
  };

  const generateSlots = async () => {
    if (!businessId) return;
    setGenerating(true);
    const supabase = createClient();

    const weekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
    let created = 0;

    for (const template of templates.filter((t: any) => t.is_active)) {
      const dayDate = addDays(weekStart, template.day_of_week);
      const [startH, startM] = template.start_time.split(":").map(Number);
      const [endH, endM] = template.end_time.split(":").map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      const dur = template.slot_duration_minutes;

      for (let m = startMins; m + dur <= endMins; m += dur) {
        const slotDate = new Date(dayDate);
        slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0);

        const { error } = await supabase.from("slots").insert({
          business_id: businessId,
          slot_datetime: slotDate.toISOString(),
          duration_minutes: dur,
          status: "free",
        }).select().single();

        if (!error) created++;
      }
    }

    toast.success(`Generated ${created} time slots for week of ${format(weekStart, "MMM d")}!`);
    setGenerating(false);
  };

  const blockTime = async () => {
    if (!businessId || !blockedDate) return;
    const supabase = createClient();
    const [sH, sM] = blockedStart.split(":").map(Number);
    const [eH, eM] = blockedEnd.split(":").map(Number);
    const startMins = sH * 60 + sM;
    const endMins = eH * 60 + eM;

    const date = new Date(blockedDate + "T00:00:00");
    let blocked = 0;

    for (let m = startMins; m < endMins; m += 30) {
      const slotDate = new Date(date);
      slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0);
      await supabase.from("slots").upsert({
        business_id: businessId,
        slot_datetime: slotDate.toISOString(),
        duration_minutes: 30,
        status: "blocked",
      }, { onConflict: "business_id,staff_id,slot_datetime", ignoreDuplicates: false });
      blocked++;
    }

    toast.success(`Blocked ${blocked} slots on ${format(new Date(blockedDate), "MMM d")}`);
  };

  return (
    <div style={{ padding: "2rem 2rem 4rem", maxWidth: "900px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "#1A1A1A", marginBottom: "0.375rem" }}>
        Availability Settings
      </h1>
      <p style={{ color: "#8A8680", marginBottom: "2rem" }}>
        Set your weekly schedule, then generate time slots for clients to book.
      </p>

      {/* Weekly Template */}
      <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9", padding: "1.75rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "#1A1A1A" }}>
            Weekly Schedule Template
          </h2>
          <button onClick={saveTemplates} className="btn-gold" disabled={saving}
            style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem", opacity: saving ? 0.7 : 1 }}>
            <Save size={14} style={{ marginRight: "0.375rem" }} />
            {saving ? "Saving..." : "Save Template"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {templates.map((t, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "130px 1fr 1fr 110px auto",
              gap: "0.75rem",
              alignItems: "center",
              padding: "0.75rem 1rem",
              borderRadius: "0.75rem",
              background: t.is_active ? "rgba(212,175,55,0.04)" : "#FAFAFA",
              border: `1px solid ${t.is_active ? "rgba(212,175,55,0.2)" : "#F0EDE8"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <button
                  onClick={() => updateTemplate(i, "is_active", !t.is_active)}
                  style={{
                    width: "36px", height: "20px", borderRadius: "10px",
                    background: t.is_active ? "#D4AF37" : "#E8E2D9",
                    border: "none", cursor: "pointer", position: "relative",
                    transition: "background 0.2s",
                  }}>
                  <div style={{
                    position: "absolute",
                    width: "14px", height: "14px", borderRadius: "50%",
                    background: "white",
                    top: "3px",
                    left: t.is_active ? "19px" : "3px",
                    transition: "left 0.2s",
                  }} />
                </button>
                <span style={{ fontSize: "0.875rem", fontWeight: t.is_active ? "600" : "400", color: t.is_active ? "#1A1A1A" : "#8A8680" }}>
                  {DAYS[i].slice(0, 3)}
                </span>
              </div>

              <select className="input-glow" disabled={!t.is_active}
                value={t.start_time} onChange={(e) => updateTemplate(i, "start_time", e.target.value)}
                style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem", opacity: t.is_active ? 1 : 0.4 }}>
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <select className="input-glow" disabled={!t.is_active}
                value={t.end_time} onChange={(e) => updateTemplate(i, "end_time", e.target.value)}
                style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem", opacity: t.is_active ? 1 : 0.4 }}>
                {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              <select className="input-glow" disabled={!t.is_active}
                value={t.slot_duration_minutes} onChange={(e) => updateTemplate(i, "slot_duration_minutes", Number(e.target.value))}
                style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem", opacity: t.is_active ? 1 : 0.4 }}>
                {SLOT_DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
              </select>

              <span style={{ fontSize: "0.75rem", color: t.is_active ? "#4CAF7C" : "#8A8680", fontWeight: "600", whiteSpace: "nowrap" }}>
                {t.is_active ? "✓ Open" : "Closed"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Generate slots */}
      <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9", padding: "1.75rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "0.5rem" }}>
          Generate Time Slots
        </h2>
        <p style={{ color: "#8A8680", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          Generate bookable slots for a specific week based on your template above.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} className="btn-ghost" style={{ padding: "0.5rem 0.875rem" }}>←</button>
            <span style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem", minWidth: "160px", textAlign: "center" }}>
              {format(addDays(startOfWeek(new Date()), weekOffset * 7), "MMM d")} –{" "}
              {format(addDays(startOfWeek(new Date()), weekOffset * 7 + 6), "MMM d, yyyy")}
            </span>
            <button onClick={() => setWeekOffset(w => w + 1)} className="btn-ghost" style={{ padding: "0.5rem 0.875rem" }}>→</button>
          </div>
          <button onClick={generateSlots} className="btn-gold" disabled={generating}
            style={{ opacity: generating ? 0.7 : 1 }}>
            <Plus size={16} style={{ marginRight: "0.375rem" }} />
            {generating ? "Generating..." : "Generate Slots"}
          </button>
        </div>
      </div>

      {/* Block time */}
      <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9", padding: "1.75rem" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "0.5rem" }}>
          Block Out Time
        </h2>
        <p style={{ color: "#8A8680", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
          Mark slots as unavailable for breaks, holidays, or emergencies.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.375rem" }}>Date</label>
            <input type="date" className="input-glow" value={blockedDate}
              onChange={(e) => setBlockedDate(e.target.value)} style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.375rem" }}>From</label>
            <select className="input-glow" value={blockedStart} onChange={(e) => setBlockedStart(e.target.value)}
              style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: "500", color: "#1A1A1A", marginBottom: "0.375rem" }}>To</label>
            <select className="input-glow" value={blockedEnd} onChange={(e) => setBlockedEnd(e.target.value)}
              style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}>
              {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={blockTime} className="btn-ghost" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <Lock size={15} /> Block Time
          </button>
        </div>
      </div>
    </div>
  );
}
