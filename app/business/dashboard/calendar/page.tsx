"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";
import { ChevronLeft, ChevronRight, Phone } from "lucide-react";

type CalView = "month" | "week" | "day";

export default function CalendarPage() {
  const [view, setView] = useState<CalView>("month");
  const [current, setCurrent] = useState(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    fetchBookings();
  }, [current, view]);

  const fetchBookings = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: biz } = await supabase.from("businesses").select("id").eq("owner_id", user.id).single();
    if (!biz) return;

    let from: Date, to: Date;
    if (view === "month") {
      from = startOfWeek(startOfMonth(current));
      to = endOfWeek(endOfMonth(current));
    } else if (view === "week") {
      from = startOfWeek(current);
      to = endOfWeek(current);
    } else {
      from = new Date(current.getFullYear(), current.getMonth(), current.getDate());
      to = addDays(from, 1);
    }

    const { data } = await supabase
      .from("bookings")
      .select(`*, profiles(full_name, phone), services(name)`)
      .eq("business_id", biz.id)
      .gte("slot_datetime", from.toISOString())
      .lte("slot_datetime", to.toISOString())
      .not("status", "eq", "cancelled");
    setBookings(data || []);
  };

  const getBookingsForDay = (date: Date) =>
    bookings.filter(b => isSameDay(new Date(b.slot_datetime), date));

  const STATUS_COLORS: Record<string, string> = {
    confirmed: "#DBEEFF",
    pending: "#FEF3C7",
    completed: "#D1FAE5",
  };
  const STATUS_TEXT: Record<string, string> = {
    confirmed: "#1A6BC4",
    pending: "#92400E",
    completed: "#065F46",
  };

  const navigate = (dir: 1 | -1) => {
    if (view === "month") setCurrent(dir === 1 ? addMonths(current, 1) : subMonths(current, 1));
    else if (view === "week") setCurrent(addDays(current, dir * 7));
    else setCurrent(addDays(current, dir));
  };

  // ── Month Grid ──
  const renderMonth = () => {
    const monthStart = startOfMonth(current);
    const gridStart = startOfWeek(monthStart);
    const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

    return (
      <div>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", marginBottom: "1px" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} style={{ padding: "0.625rem", textAlign: "center", fontSize: "0.75rem", fontWeight: "700", color: "#8A8680", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "#E8E2D9" }}>
          {days.map((day, idx) => {
            const dayBookings = getBookingsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, current);
            return (
              <div key={idx} style={{
                background: isToday ? "rgba(212,175,55,0.05)" : "white",
                minHeight: "100px",
                padding: "0.5rem",
              }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "0.375rem",
                  background: isToday ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "transparent",
                  fontSize: "0.8125rem",
                  fontWeight: isToday ? "700" : "500",
                  color: isToday ? "white" : isCurrentMonth ? "#1A1A1A" : "#C4BFB9",
                }}>
                  {format(day, "d")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {dayBookings.slice(0, 3).map(b => (
                    <button key={b.id}
                      onClick={() => setSelected(b)}
                      style={{
                        background: STATUS_COLORS[b.status] || "#F5F0E8",
                        color: STATUS_TEXT[b.status] || "#8A8680",
                        fontSize: "0.6875rem",
                        fontWeight: "600",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "100%",
                      }}>
                      {format(new Date(b.slot_datetime), "h:mm")} {b.services?.name}
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <span style={{ fontSize: "0.6875rem", color: "#8A8680", paddingLeft: "6px" }}>
                      +{dayBookings.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Day List ──
  const renderDay = () => {
    const dayBookings = getBookingsForDay(current).sort(
      (a, b) => new Date(a.slot_datetime).getTime() - new Date(b.slot_datetime).getTime()
    );
    return (
      <div style={{ padding: "1rem 0" }}>
        {dayBookings.length === 0 ? (
          <p style={{ textAlign: "center", color: "#8A8680", padding: "3rem" }}>No bookings on this day.</p>
        ) : (
          dayBookings.map(b => (
            <div key={b.id} onClick={() => setSelected(b)} style={{
              display: "flex", gap: "1rem", alignItems: "flex-start",
              padding: "1rem", borderLeft: `4px solid ${STATUS_TEXT[b.status] || "#D4AF37"}`,
              marginBottom: "0.75rem", background: STATUS_COLORS[b.status] || "#F5F0E8",
              borderRadius: "0 0.75rem 0.75rem 0", cursor: "pointer",
            }}>
              <div style={{ minWidth: "60px", textAlign: "center" }}>
                <div style={{ fontSize: "1rem", fontWeight: "700", color: STATUS_TEXT[b.status] }}>
                  {format(new Date(b.slot_datetime), "h:mm")}
                </div>
                <div style={{ fontSize: "0.75rem", color: STATUS_TEXT[b.status] }}>
                  {format(new Date(b.slot_datetime), "a")}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: "600", color: "#1A1A1A" }}>
                  {b.profiles?.full_name || b.customer_name}
                </div>
                <div style={{ color: "#8A8680", fontSize: "0.875rem" }}>{b.services?.name}</div>
              </div>
              <span className={`badge-${b.status}`} style={{ marginLeft: "auto" }}>{b.status}</span>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem 2rem 4rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "#1A1A1A", marginBottom: "0.25rem" }}>
            Master Calendar
          </h1>
          <p style={{ color: "#8A8680" }}>
            {view === "month"
              ? format(current, "MMMM yyyy")
              : view === "week"
                ? `${format(startOfWeek(current), "MMM d")} – ${format(endOfWeek(current), "MMM d, yyyy")}`
                : format(current, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* View selector */}
          <div style={{ display: "flex", background: "#F5F0E8", borderRadius: "0.625rem", padding: "0.2rem" }}>
            {(["month", "week", "day"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "0.4rem 0.875rem", borderRadius: "0.4rem", border: "none",
                cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600",
                background: view === v ? "white" : "transparent",
                color: view === v ? "#1A1A1A" : "#8A8680",
                boxShadow: view === v ? "0 1px 4px rgba(26,26,26,0.08)" : "none",
                transition: "all 0.15s",
              }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {/* Nav */}
          <div style={{ display: "flex", gap: "0.25rem" }}>
            <button onClick={() => navigate(-1)} className="btn-ghost" style={{ padding: "0.5rem 0.75rem" }}>
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrent(new Date())} className="btn-ghost" style={{ padding: "0.5rem 0.875rem", fontSize: "0.8125rem" }}>
              Today
            </button>
            <button onClick={() => navigate(1)} className="btn-ghost" style={{ padding: "0.5rem 0.75rem" }}>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {[
          { label: "Confirmed", color: "#1A6BC4", bg: "#DBEEFF" },
          { label: "Pending", color: "#92400E", bg: "#FEF3C7" },
          { label: "Completed", color: "#065F46", bg: "#D1FAE5" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: l.bg, border: `1px solid ${l.color}` }} />
            <span style={{ fontSize: "0.75rem", color: "#8A8680" }}>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9", overflow: "hidden" }}>
        {view === "month" && renderMonth()}
        {view === "day" && <div style={{ padding: "1.5rem" }}>{renderDay()}</div>}
        {view === "week" && (
          <div style={{ padding: "1.5rem" }}>
            {Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(current), i)).map(day => {
              const dayBookings = getBookingsForDay(day);
              return (
                <div key={day.toISOString()} style={{ display: "flex", gap: "1rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                  <div style={{
                    minWidth: "80px", textAlign: "center",
                    paddingTop: "0.5rem",
                  }}>
                    <div style={{ fontSize: "0.75rem", color: "#8A8680", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {format(day, "EEE")}
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.25rem", fontWeight: "700",
                      color: isSameDay(day, new Date()) ? "#D4AF37" : "#1A1A1A",
                    }}>
                      {format(day, "d")}
                    </div>
                  </div>
                  <div style={{ flex: 1, minHeight: "60px", borderLeft: "2px solid #E8E2D9", paddingLeft: "1rem" }}>
                    {dayBookings.length === 0
                      ? <p style={{ fontSize: "0.8125rem", color: "#C4BFB9", paddingTop: "0.75rem" }}>No bookings</p>
                      : dayBookings.map(b => (
                        <button key={b.id} onClick={() => setSelected(b)} style={{
                          display: "block", width: "100%", textAlign: "left",
                          padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                          marginBottom: "0.375rem",
                          background: STATUS_COLORS[b.status] || "#F5F0E8",
                          color: STATUS_TEXT[b.status] || "#8A8680",
                          border: "none", cursor: "pointer",
                          fontSize: "0.8125rem", fontWeight: "600",
                        }}>
                          {format(new Date(b.slot_datetime), "h:mm a")} · {b.profiles?.full_name || b.customer_name} · {b.services?.name}
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking detail modal */}
      {selected && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(26,26,26,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
        }} onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div style={{
            background: "white", borderRadius: "1.5rem",
            width: "100%", maxWidth: "400px", padding: "2rem",
            animation: "slideUp 0.3s ease-out",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "600", color: "#1A1A1A" }}>
                Appointment Details
              </h2>
              <span className={`badge-${selected.status}`}>{selected.status}</span>
            </div>

            {[
              ["Customer", selected.profiles?.full_name || selected.customer_name || "—"],
              ["Service", selected.services?.name || "—"],
              ["Date", format(new Date(selected.slot_datetime), "EEEE, MMMM d, yyyy")],
              ["Time", format(new Date(selected.slot_datetime), "h:mm a")],
            ].map(([label, value]) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "0.75rem 0", borderBottom: "1px solid #F5F0E8",
              }}>
                <span style={{ color: "#8A8680", fontSize: "0.9375rem" }}>{label}</span>
                <span style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem" }}>{value}</span>
              </div>
            ))}

            {(selected.profiles?.phone || selected.customer_phone) && (
              <div style={{ marginTop: "1.25rem" }}>
                <a href={`tel:${selected.profiles?.phone || selected.customer_phone}`}
                  className="btn-gold"
                  style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                  <Phone size={16} />
                  Call {selected.profiles?.phone || selected.customer_phone}
                </a>
              </div>
            )}

            <button onClick={() => setSelected(null)} className="btn-ghost"
              style={{ width: "100%", marginTop: "0.75rem" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
