"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  addDays, startOfWeek, format,
  addWeeks, startOfDay,
} from "date-fns";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, RefreshCw, Save, Sparkles } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let h = 6; h <= 22; h++) {
  for (const m of [0, 30]) {
    const pad = (n: number) => String(n).padStart(2, "0");
    const value = `${pad(h)}:${pad(m)}`;
    const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const ampm = h < 12 ? "AM" : "PM";
    const label = `${hour12}:${pad(m)} ${ampm}`;
    TIME_OPTIONS.push({ value, label });
  }
}

interface DayTemplate {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
}

export default function AvailabilityPage() {
  const [business, setBusiness] = useState<any>(null);
  const [templates, setTemplates] = useState<DayTemplate[]>(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      start_time: "09:00",
      end_time: "18:00",
      slot_duration_minutes: 60,
      is_active: i >= 1 && i <= 5, // Mon-Fri active by default
    }))
  );
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadBusiness();
  }, []);

  useEffect(() => {
    if (business?.id) {
      loadSlots();
    }
  }, [business, weekOffset]);

  const loadBusiness = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: biz } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!biz) return;
    setBusiness(biz);

    // Load existing templates
    const { data: existingTemplates } = await supabase
      .from("availability_templates")
      .select("*")
      .eq("business_id", biz.id)
      .order("day_of_week");

    if (existingTemplates && existingTemplates.length > 0) {
      setTemplates((prev) =>
        prev.map((t) => {
          const found = existingTemplates.find(
            (e: any) => e.day_of_week === t.day_of_week
          );
          return found
            ? {
                day_of_week: found.day_of_week,
                start_time: found.start_time,
                end_time: found.end_time,
                slot_duration_minutes: found.slot_duration_minutes || 60,
                is_active: found.is_active,
              }
            : t;
        })
      );
    }
  };

  const loadSlots = async () => {
    if (!business?.id) return;
    setLoadingSlots(true);
    const supabase = createClient();

    const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 });
    const weekEnd = addDays(weekStart, 7);

    const { data } = await supabase
      .from("slots")
      .select("*")
      .eq("business_id", business.id)
      .gte("slot_datetime", weekStart.toISOString())
      .lt("slot_datetime", weekEnd.toISOString())
      .order("slot_datetime");

    setSlots(data || []);
    setLoadingSlots(false);
  };

  const updateTemplate = (dayIndex: number, field: keyof DayTemplate, value: any) => {
    setTemplates((prev) =>
      prev.map((t, i) => (i === dayIndex ? { ...t, [field]: value } : t))
    );
  };

  const handleSaveTemplate = async () => {
    if (!business?.id) {
      toast.error("No business found. Please create your business first.");
      return;
    }
    setSavingTemplate(true);
    const supabase = createClient();

    let successCount = 0;
    let errorCount = 0;

    for (const template of templates) {
      const { error } = await supabase
        .from("availability_templates")
        .upsert(
          {
            business_id: business.id,
            day_of_week: template.day_of_week,
            start_time: template.start_time,
            end_time: template.end_time,
            slot_duration_minutes: template.slot_duration_minutes,
            is_active: template.is_active,
          },
          { onConflict: "business_id,day_of_week" }
        );

      if (error) {
        console.error(`Error saving day ${template.day_of_week}:`, error);
        errorCount++;
      } else {
        successCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`Availability template saved! (${successCount} days)`);
    } else {
      toast.error(`Saved ${successCount} days, failed ${errorCount}. Check console.`);
    }

    setSavingTemplate(false);
  };

 const generateSlotsForWeek = async (weeksAhead: number = 1) => {
  if (!business?.id) {
    toast.error("No business found.");
    return;
  }

  const activeTemplates = templates.filter((t) => t.is_active);
  if (activeTemplates.length === 0) {
    toast.error("Please enable at least one day and click Save Template first.");
    return;
  }

  setGenerating(true);

  try {
    const supabase = createClient();

    // Call the database function directly — no API route needed
    const { data, error } = await supabase.rpc(
      "generate_slots_for_business",
      {
        p_business_id: business.id,
        p_weeks_ahead: weeksAhead,
      }
    );

    if (error) {
      console.error("RPC error:", error);
      toast.error("Failed to generate slots: " + error.message);
      setGenerating(false);
      return;
    }

    const result = data as {
      success: boolean;
      generated: number;
      skipped: number;
      total: number;
      error?: string;
    };

    if (!result.success) {
      toast.error("Generation failed: " + (result.error || "Unknown error"));
      setGenerating(false);
      return;
    }

    if (result.generated > 0) {
      toast.success(
        `✅ Generated ${result.generated} new slots for ${weeksAhead} week${weeksAhead > 1 ? "s" : ""}!` +
        (result.skipped > 0 ? ` (${result.skipped} already existed)` : ""),
        { duration: 5000 }
      );
    } else if (result.skipped > 0) {
      toast.success(
        `All ${result.skipped} slots already exist for this period.`,
        { duration: 4000 }
      );
    } else {
      toast.error(
        "No slots generated. Make sure your template days are not all in the past."
      );
    }

    await loadSlots();

  } catch (err: any) {
    console.error("Generate slots error:", err);
    toast.error("Something went wrong: " + (err?.message || "Unknown error"));
  }

  setGenerating(false);
};

  // Group slots by day for the week view
  const weekStart = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getSlotCountForDay = (date: Date) => {
    const dayStr = format(date, "yyyy-MM-dd");
    return slots.filter(
      (s) => format(new Date(s.slot_datetime), "yyyy-MM-dd") === dayStr
    );
  };

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
          fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem",
        }}>
          Availability
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Set your working hours, then generate bookable slots for customers.
        </p>
      </div>

      {/* How it works */}
      <div style={{
        background: "rgba(212,175,55,0.06)",
        border: "1px solid rgba(212,175,55,0.2)",
        borderRadius: "1rem",
        padding: "1rem 1.25rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
      }}>
        <Sparkles size={18} color="#D4AF37" style={{ flexShrink: 0, marginTop: "0.125rem" }} />
        <div>
          <p style={{ fontSize: "0.9375rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.25rem" }}>
            How it works
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: "1.6" }}>
            <strong style={{ color: "var(--charcoal)" }}>Step 1:</strong> Set your working days and hours below, then click <strong style={{ color: "var(--charcoal)" }}>Save Template</strong>.<br />
            <strong style={{ color: "var(--charcoal)" }}>Step 2:</strong> Click <strong style={{ color: "var(--charcoal)" }}>Generate Slots</strong> to create bookable time slots for customers.<br />
            You need to regenerate slots for each new week.
          </p>
        </div>
      </div>

      {/* Template editor */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "1.25rem",
        border: "1px solid var(--border)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)" }}>
            Weekly Schedule
          </h2>
          <button
            onClick={handleSaveTemplate}
            disabled={savingTemplate}
            className="btn-gold"
            style={{ opacity: savingTemplate ? 0.7 : 1 }}
          >
            <Save size={15} style={{ marginRight: "0.375rem" }} />
            {savingTemplate ? "Saving..." : "Save Template"}
          </button>
        </div>

        {/* Slot duration */}
        <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", flexShrink: 0 }}>
            Slot Duration:
          </label>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {[30, 45, 60, 90, 120].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setTemplates((prev) => prev.map((t) => ({ ...t, slot_duration_minutes: mins })))}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${templates[0]?.slot_duration_minutes === mins ? "#D4AF37" : "var(--border)"}`,
                  background: templates[0]?.slot_duration_minutes === mins ? "rgba(212,175,55,0.1)" : "var(--surface-2)",
                  color: templates[0]?.slot_duration_minutes === mins ? "#D4AF37" : "var(--muted)",
                  cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600",
                  fontFamily: "inherit",
                }}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>

        {/* Day rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {templates.map((template, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 1fr auto",
                gap: "0.75rem",
                alignItems: "center",
                padding: "0.875rem 1rem",
                borderRadius: "0.875rem",
                background: template.is_active
                  ? "rgba(212,175,55,0.04)"
                  : "var(--surface-2)",
                border: `1px solid ${template.is_active ? "rgba(212,175,55,0.2)" : "var(--border)"}`,
                opacity: template.is_active ? 1 : 0.6,
                transition: "all 0.2s",
              }}
            >
              {/* Toggle + day name */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <button
                  type="button"
                  onClick={() => updateTemplate(index, "is_active", !template.is_active)}
                  style={{
                    width: "38px", height: "22px",
                    borderRadius: "9999px",
                    background: template.is_active
                      ? "linear-gradient(135deg, #D4AF37, #B8941F)"
                      : "var(--border)",
                    border: "none", cursor: "pointer",
                    position: "relative", transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: "absolute",
                    width: "16px", height: "16px",
                    borderRadius: "50%", background: "white",
                    top: "3px",
                    left: template.is_active ? "19px" : "3px",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
                <span style={{
                  fontSize: "0.875rem", fontWeight: "600",
                  color: template.is_active ? "var(--charcoal)" : "var(--muted)",
                }}>
                  {DAY_SHORT[index]}
                </span>
              </div>

              {/* Start time */}
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", color: "var(--muted)", marginBottom: "0.25rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Start
                </label>
                <select
                  className="input-glow"
                  value={template.start_time}
                  disabled={!template.is_active}
                  onChange={(e) => updateTemplate(index, "start_time", e.target.value)}
                  style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
                >
                  {TIME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* End time */}
              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", color: "var(--muted)", marginBottom: "0.25rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  End
                </label>
                <select
                  className="input-glow"
                  value={template.end_time}
                  disabled={!template.is_active}
                  onChange={(e) => updateTemplate(index, "end_time", e.target.value)}
                  style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
                >
                  {TIME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              {/* Slot count preview */}
              <div style={{ textAlign: "right", minWidth: "50px" }}>
                {template.is_active && (
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: "600" }}>
                    {(() => {
                      const [sh, sm] = template.start_time.split(":").map(Number);
                      const [eh, em] = template.end_time.split(":").map(Number);
                      const totalMins = (eh * 60 + em) - (sh * 60 + sm);
                      const count = Math.floor(totalMins / template.slot_duration_minutes);
                      return count > 0 ? `${count} slots/day` : "—";
                    })()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate slots section */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "1.25rem",
        border: "1px solid var(--border)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.125rem", fontWeight: "600",
          color: "var(--charcoal)", marginBottom: "0.5rem",
        }}>
          Generate Bookable Slots
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9375rem", marginBottom: "1.25rem", lineHeight: "1.6" }}>
          After saving your template above, generate actual time slots that customers can book. Generate as many weeks ahead as you need.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => generateSlotsForWeek(1)}
            disabled={generating}
            className="btn-gold"
            style={{ opacity: generating ? 0.7 : 1 }}
          >
            {generating ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Generating...
              </span>
            ) : (
              <><Sparkles size={15} style={{ marginRight: "0.375rem" }} /> Generate This Week</>
            )}
          </button>

          <button
            onClick={() => generateSlotsForWeek(2)}
            disabled={generating}
            className="btn-ghost"
            style={{ opacity: generating ? 0.7 : 1 }}
          >
            Generate Next 2 Weeks
          </button>

          <button
            onClick={() => generateSlotsForWeek(4)}
            disabled={generating}
            className="btn-ghost"
            style={{ opacity: generating ? 0.7 : 1 }}
          >
            Generate Next 4 Weeks
          </button>
        </div>
      </div>

      {/* Week view */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "1.25rem",
        border: "1px solid var(--border)",
        padding: "1.5rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)" }}>
            Slot Preview
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ChevronLeft size={16} color="var(--muted)" />
            </button>
            <span style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", minWidth: "160px", textAlign: "center" }}>
              {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </span>
            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <ChevronRight size={16} color="var(--muted)" />
            </button>
            <button
              onClick={loadSlots}
              style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Refresh"
            >
              <RefreshCw size={14} color="var(--muted)" />
            </button>
          </div>
        </div>

        {loadingSlots ? (
          <p style={{ color: "var(--muted)", textAlign: "center", padding: "1.5rem" }}>Loading slots...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "0.5rem" }}>
            {weekDays.map((day, i) => {
              const daySlots = getSlotCountForDay(day);
              const freeSlots = daySlots.filter((s) => s.status === "free");
              const reservedSlots = daySlots.filter((s) => s.status === "reserved");
              const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              const isPastDay = day < startOfDay(new Date());

              return (
                <div
                  key={i}
                  style={{
                    borderRadius: "0.75rem",
                    padding: "0.75rem 0.5rem",
                    textAlign: "center",
                    background: isToday
                      ? "rgba(212,175,55,0.08)"
                      : "var(--surface-2)",
                    border: `1px solid ${isToday ? "rgba(212,175,55,0.3)" : "var(--border)"}`,
                    opacity: isPastDay ? 0.5 : 1,
                  }}
                >
                  <p style={{ fontSize: "0.6875rem", fontWeight: "700", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>
                    {DAY_SHORT[i]}
                  </p>
                  <p style={{ fontSize: "1.125rem", fontWeight: "700", color: isToday ? "#D4AF37" : "var(--charcoal)", marginBottom: "0.5rem" }}>
                    {format(day, "d")}
                  </p>
                  {daySlots.length > 0 ? (
                    <>
                      <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: "#4CAF7C", marginBottom: "0.2rem" }}>
                        {freeSlots.length} free
                      </div>
                      {reservedSlots.length > 0 && (
                        <div style={{ fontSize: "0.6875rem", color: "#E85C5C" }}>
                          {reservedSlots.length} booked
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
                      No slots
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}