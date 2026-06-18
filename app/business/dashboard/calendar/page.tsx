"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  format, addDays, startOfWeek, addWeeks,
  subWeeks, isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8am to 8pm

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);
  const [view, setView] = useState<"week" | "list">("week");

  useEffect(() => {
    loadBusiness();
  }, []);

  useEffect(() => {
    if (business?.id) fetchBookings();
  }, [business, currentWeek]);

  const loadBusiness = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", user.id)
      .maybeSingle();
    setBusiness(data);
  };

  const fetchBookings = async () => {
    if (!business?.id) return;
    setLoading(true);
    const supabase = createClient();

    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    const { data } = await supabase
      .from("bookings")
      .select(`
        *,
        profiles(full_name),
        services(name, duration_minutes, price)
      `)
      .eq("business_id", business.id)
      .in("status", ["pending", "confirmed", "completed"])
      .gte("slot_datetime", weekStart.toISOString())
      .lt("slot_datetime", weekEnd.toISOString())
      .order("slot_datetime");

    setBookings(data || []);
    setLoading(false);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getBookingsForDay = (date: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.slot_datetime), date));

  const STATUS_COLORS: Record<string, string> = {
    pending: "#D4AF37",
    confirmed: "#4CAF7C",
    completed: "#5B8DEF",
  };

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "1.5rem",
        flexWrap: "wrap", gap: "1rem",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
            fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem",
          }}>
            Calendar
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {format(weekStart, "MMMM d")} — {format(addDays(weekStart, 6), "MMMM d, yyyy")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
          {/* View toggle */}
          <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "0.75rem", padding: "0.2rem", border: "1px solid var(--border)" }}>
            {(["week", "list"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "0.375rem 0.875rem", borderRadius: "0.5rem",
                border: "none", cursor: "pointer", fontSize: "0.8125rem",
                fontWeight: "600", fontFamily: "inherit",
                background: view === v ? "var(--surface)" : "transparent",
                color: view === v ? "var(--charcoal)" : "var(--muted)",
                boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Week navigation */}
          <button onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={18} color="var(--muted)" />
          </button>
          <button onClick={() => setCurrentWeek(new Date())} style={{ padding: "0.375rem 0.875rem", borderRadius: "0.625rem", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600", color: "var(--charcoal)", fontFamily: "inherit" }}>
            Today
          </button>
          <button onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={18} color="var(--muted)" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: color }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--muted)", fontWeight: "500" }}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        ))}
      </div>

      {/* Week view */}
      {view === "week" && (
        <div style={{ background: "var(--surface)", borderRadius: "1.25rem", border: "1px solid var(--border)", overflow: "hidden" }}>
          {/* Day headers */}
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", borderBottom: "1px solid var(--border)" }}>
            <div style={{ padding: "0.75rem 0.5rem" }} />
            {weekDays.map((day, i) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={i} style={{ padding: "0.875rem 0.5rem", textAlign: "center", borderLeft: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {format(day, "EEE")}
                  </p>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: isToday ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0.25rem auto 0",
                  }}>
                    <p style={{ fontSize: "0.9375rem", fontWeight: "700", color: isToday ? "white" : "var(--charcoal)" }}>
                      {format(day, "d")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div style={{ overflowY: "auto", maxHeight: "600px" }}>
            {HOURS.map((hour) => (
              <div key={hour} style={{ display: "grid", gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: "60px", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>
                <div style={{ padding: "0.375rem 0.5rem", textAlign: "right" }}>
                  <span style={{ fontSize: "0.6875rem", color: "var(--muted)", fontWeight: "500" }}>
                    {hour > 12 ? `${hour - 12}pm` : hour === 12 ? "12pm" : `${hour}am`}
                  </span>
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayBookings = getBookingsForDay(day).filter((b) => {
                    const bHour = new Date(b.slot_datetime).getHours();
                    return bHour === hour;
                  });

                  return (
                    <div key={dayIndex} style={{
                      borderLeft: "1px solid var(--border)",
                      padding: "0.25rem",
                      position: "relative",
                    }}>
                      {dayBookings.map((booking) => (
                        <div key={booking.id} style={{
                          background: STATUS_COLORS[booking.status] || "#D4AF37",
                          borderRadius: "0.375rem",
                          padding: "0.25rem 0.375rem",
                          marginBottom: "0.2rem",
                          opacity: 0.9,
                        }}>
                          <p style={{ fontSize: "0.6875rem", fontWeight: "700", color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {booking.profiles?.full_name || booking.customer_name || "Customer"}
                          </p>
                          <p style={{ fontSize: "0.625rem", color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {booking.services?.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {weekDays.map((day) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "50%",
                    background: isToday ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "var(--surface-2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: "0.9375rem", fontWeight: "700", color: isToday ? "white" : "var(--muted)" }}>
                      {format(day, "d")}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontWeight: "700", color: isToday ? "#D4AF37" : "var(--charcoal)", fontSize: "0.9375rem" }}>
                      {format(day, "EEEE")} {isToday && "· Today"}
                    </p>
                    <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                      {format(day, "MMMM d, yyyy")} · {dayBookings.length} booking{dayBookings.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>


                {dayBookings.length === 0 ? (
                  <div style={{ padding: "1rem 1.25rem", background: "var(--surface-2)", borderRadius: "0.875rem", marginLeft: "3.25rem" }}>
                    <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>No bookings this day</p>
                  </div>
                ) : (
                  <div style={{ marginLeft: "3.25rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {dayBookings.map((booking) => (
                      <div key={booking.id} style={{
                        background: "var(--surface)", borderRadius: "0.875rem",
                        padding: "0.875rem 1.125rem", border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", gap: "1rem",
                        flexWrap: "wrap",
                        borderLeft: `3px solid ${STATUS_COLORS[booking.status] || "#D4AF37"}`,
                      }}>
                        <div style={{ flex: 1, minWidth: "160px" }}>
                          <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem", marginBottom: "0.2rem" }}>
                            {booking.profiles?.full_name || booking.customer_name || "Customer"}
                          </p>
                          <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                            {booking.services?.name} · {format(new Date(booking.slot_datetime), "h:mm a")}
                          </p>
                        </div>
                        <span style={{
                          fontSize: "0.75rem", fontWeight: "600",
                          padding: "0.25rem 0.75rem", borderRadius: "9999px",
                          background: `${STATUS_COLORS[booking.status]}20`,
                          color: STATUS_COLORS[booking.status] || "#D4AF37",
                        }}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}