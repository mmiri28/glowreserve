"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Star, MapPin, Phone, Clock, Check, ChevronRight,
  Calendar, Tag, ChevronLeft, Share2, CheckCircle,
} from "lucide-react";
import {
  format, addDays, isSameDay, isToday, isTomorrow, startOfDay,
} from "date-fns";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import WaitlistButton from "@/components/shared/WaitlisButton";

type Tab = "services" | "availability" | "reviews";

export default function BusinessProfileClient({
  business,
  services,
  reviews,
  staff,
  initialSlots = [],
}: {
  business: any;
  services: any[];
  reviews: any[];
  staff: any[];
  initialSlots?: any[];
}) {
  const [tab, setTab] = useState<Tab>("services");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availView, setAvailView] = useState<"day" | "week">("day");
  const [availDate, setAvailDate] = useState<Date>(new Date());
  const [daySlots, setDaySlots] = useState<any[]>([]);
  const [weekData, setWeekData] = useState<{ date: Date; slots: any[] }[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const today = startOfDay(new Date());
    const todaySlots = initialSlots.filter(s =>
      isSameDay(new Date(s.slot_datetime), today)
    );
    setSlots(todaySlots);
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setIsLoggedIn(!!user);
  };

  const loadSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const supabase = createClient();
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = new Date(startOfDay(date).getTime() + 86400000).toISOString();
    const { data } = await supabase
      .from("slots").select("*")
      .eq("business_id", business.id).eq("status", "free")
      .gte("slot_datetime", dayStart).lt("slot_datetime", dayEnd)
      .order("slot_datetime");
    setSlots(data || []);
    setLoadingSlots(false);
  }, [business.id]);

  const loadAvailability = useCallback(async () => {
    setLoadingAvail(true);
    const supabase = createClient();

    if (availView === "day") {
      const dayStart = startOfDay(availDate).toISOString();
      const dayEnd = new Date(startOfDay(availDate).getTime() + 86400000).toISOString();
      const { data } = await supabase
        .from("slots").select("*")
        .eq("business_id", business.id).eq("status", "free")
        .gte("slot_datetime", dayStart).lt("slot_datetime", dayEnd)
        .order("slot_datetime");
      setDaySlots(data || []);
    } else {
      const weekStart = startOfDay(availDate);
      const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
      const { data } = await supabase
        .from("slots").select("*")
        .eq("business_id", business.id).eq("status", "free")
        .gte("slot_datetime", weekStart.toISOString())
        .lt("slot_datetime", weekEnd.toISOString())
        .order("slot_datetime");
      const grouped = Array.from({ length: 7 }, (_, i) => {
        const day = addDays(weekStart, i);
        return {
          date: day,
          slots: (data || []).filter((s: any) => isSameDay(new Date(s.slot_datetime), day)),

        };
      });
      setWeekData(grouped);
    }
    setLoadingAvail(false);
  }, [business.id, availDate, availView]);

  useEffect(() => {
    if (tab === "availability") loadAvailability();
  }, [tab, availView, availDate, loadAvailability]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    loadSlots(date);
  };

  const handleBook = async () => {
    if (!isLoggedIn) {
      toast.error("Please sign in to book");
      router.push(`/auth/login?redirect=/business/${business.slug}`);
      return;
    }
    if (!selectedService) { toast.error("Please select a service first"); return; }
    if (!selectedSlot) { toast.error("Please select a time slot"); return; }

    const res = await fetch(`/api/slots/${selectedSlot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hold" }),
    });

    if (!res.ok) {
      toast.error("This slot was just taken. Please choose another time.");
      loadSlots(selectedDate);
      return;
    }

    router.push(
      `/dashboard/book?business=${business.id}&service=${selectedService.id}&slot=${selectedSlot.id}&datetime=${encodeURIComponent(selectedSlot.slot_datetime)}`
    );
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({
        title: business.name,
        text: `Check out ${business.name} on GlowReserve`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const categories = Array.from(
    new Set(services.map((s: any) => s.category))
  ).filter(Boolean) as string[];

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const minPrice = services
    .filter(s => s.price)
    .reduce((min, s) => s.price < min ? s.price : min, Infinity);

  const dayLabel = (date: Date) =>
    isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "EEE, MMM d");

  return (
    <div style={{ paddingTop: "72px", background: "var(--cream)", minHeight: "100vh" }}>
      {/* Cover */}
      <div style={{
        position: "relative",
        height: "clamp(200px, 35vw, 320px)",
        background: "#1A1A1A",
        overflow: "hidden",
      }}>
        {business.cover_image_url ? (
          <img src={business.cover_image_url} alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.75 }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 60%, rgba(212,175,55,0.2) 100%)" }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 60%)" }} />
        <button onClick={handleShare} style={{
          position: "absolute", top: "1rem", right: "1rem",
          width: "40px", height: "40px", borderRadius: "50%",
          background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "white",
        }}>
          <Share2 size={18} />
        </button>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.25rem" }}>
        {/* Header */}
        <div style={{
          display: "flex", gap: "1.25rem", alignItems: "flex-end",
          marginTop: "-52px", marginBottom: "1.75rem", flexWrap: "wrap",
        }}>
          <div style={{
            width: "88px", height: "88px", borderRadius: "1.125rem",
            background: "var(--surface)", border: "4px solid var(--surface)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.25rem", flexShrink: 0, overflow: "hidden",
          }}>
            {business.logo_url
              ? <img src={business.logo_url} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "✨"}
          </div>
          <div style={{ flex: 1, paddingBottom: "0.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexWrap: "wrap" }}>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.375rem, 4vw, 2rem)",
                fontWeight: "700", color: "var(--charcoal)",
              }}>
                {business.name}
              </h1>
              {business.is_verified && (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "0.25rem",
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#D4AF37", fontSize: "0.75rem", fontWeight: "700",
                  padding: "0.2rem 0.625rem", borderRadius: "9999px",
                }}>
                  <CheckCircle size={12} /> Verified
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "0.375rem", alignItems: "center" }}>
              {business.category && (
                <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{business.category}</span>
              )}
              {business.city && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9rem", color: "var(--muted)" }}>
                  <MapPin size={13} /> {business.city}
                </span>
              )}
              {avgRating && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9rem", fontWeight: "600", color: "var(--charcoal)" }}>
                  <Star size={13} fill="#D4AF37" color="#D4AF37" />
                  {avgRating}{" "}
                  <span style={{ color: "var(--muted)", fontWeight: "400" }}>
                    ({reviews.length} reviews)
                  </span>
                </span>
              )}
              {minPrice !== Infinity && (
                <span style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
                  From <strong style={{ color: "var(--charcoal)" }}>${minPrice}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {business.description && (
          <p style={{
            color: "var(--muted)", fontSize: "0.9375rem", lineHeight: "1.75",
            marginBottom: "1.75rem", maxWidth: "680px",
          }}>
            {business.description}
          </p>
        )}

        {/* Main grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.5rem",
        }} className="lg:grid-cols-[1fr_340px]">

          {/* LEFT */}
          <div>
            {/* Tabs */}
            <div style={{
              display: "flex", background: "var(--surface-2)", borderRadius: "0.875rem",
              padding: "0.25rem", width: "fit-content", marginBottom: "1.75rem",
              border: "1px solid var(--border)",
            }}>
              {(["services", "availability", "reviews"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "0.5rem 1.125rem", borderRadius: "0.625rem",
                  border: "none", cursor: "pointer",
                  fontSize: "0.875rem", fontWeight: "600",
                  background: tab === t ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "transparent",
                  color: tab === t ? "white" : "var(--muted)",
                  transition: "all 0.2s", fontFamily: "inherit",
                }}>
                  {t === "availability" ? "Availability" : t.charAt(0).toUpperCase() + t.slice(1)}
                  {t === "reviews" && reviews.length > 0 && (
                    <span style={{
                      marginLeft: "0.375rem", fontSize: "0.6875rem",
                      background: tab === t ? "rgba(255,255,255,0.2)" : "rgba(212,175,55,0.15)",
                      color: tab === t ? "white" : "#D4AF37",
                      padding: "0.1rem 0.375rem", borderRadius: "9999px",
                    }}>
                      {reviews.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* SERVICES TAB */}
            {tab === "services" && (
              <div>
                {categories.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "3rem",
                    color: "var(--muted)", background: "var(--surface)",
                    borderRadius: "1rem", border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✂️</div>
                    <p>No services listed yet.</p>
                  </div>
                ) : categories.map((cat) => (
                  <div key={cat} style={{ marginBottom: "2rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
                      <Tag size={13} color="#D4AF37" />
                      <h3 style={{
                        fontSize: "0.75rem", fontWeight: "700",
                        color: "#D4AF37", letterSpacing: "0.1em", textTransform: "uppercase",
                      }}>
                        {cat}
                      </h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                      {services.filter(s => s.category === cat).map((svc) => (
                        <div key={svc.id}
                          onClick={() => setSelectedService(selectedService?.id === svc.id ? null : svc)}
                          style={{
                            background: "var(--surface)", borderRadius: "1rem",
                            padding: "1.125rem 1.25rem",
                            border: `2px solid ${selectedService?.id === svc.id ? "#D4AF37" : "var(--border)"}`,
                            cursor: "pointer", transition: "all 0.2s",
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", gap: "1rem",
                            boxShadow: selectedService?.id === svc.id
                              ? "0 4px 16px rgba(212,175,55,0.15)" : "none",
                          }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                              {selectedService?.id === svc.id && <Check size={15} color="#D4AF37" />}
                              <span style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem" }}>
                                {svc.name}
                              </span>
                            </div>
                            {svc.description && (
                              <p style={{ color: "var(--muted)", fontSize: "0.8125rem", marginBottom: "0.375rem", lineHeight: "1.5" }}>
                                {svc.description}
                              </p>
                            )}
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "0.25rem",
                              fontSize: "0.75rem", color: "var(--muted)",
                              background: "var(--surface-2)", padding: "0.2rem 0.625rem",
                              borderRadius: "9999px", border: "1px solid var(--border)",
                            }}>
                              <Clock size={11} /> {svc.duration_minutes} min
                            </span>
                          </div>
                          {svc.price != null && (
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: "1.375rem", fontWeight: "700", color: "#D4AF37",
                              }}>
                                ${Number(svc.price).toFixed(0)}
                              </div>
                              <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>per session</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AVAILABILITY TAB */}
            {tab === "availability" && (
              <div>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem",
                }}>
                  <div style={{
                    display: "flex", background: "var(--surface-2)", borderRadius: "0.75rem",
                    padding: "0.2rem", border: "1px solid var(--border)",
                  }}>
                    {(["day", "week"] as const).map((v) => (
                      <button key={v} onClick={() => setAvailView(v)} style={{
                        padding: "0.4375rem 1rem", borderRadius: "0.5rem", border: "none",
                        cursor: "pointer", fontSize: "0.875rem", fontWeight: "600",
                        background: availView === v ? "var(--surface)" : "transparent",
                        color: availView === v ? "var(--charcoal)" : "var(--muted)",
                        boxShadow: availView === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                        transition: "all 0.15s", fontFamily: "inherit",
                      }}>
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => setAvailDate(d => addDays(d, availView === "day" ? -1 : -7))}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        border: "1px solid var(--border)", background: "var(--surface)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <ChevronLeft size={16} color="var(--muted)" />
                    </button>
                    <span style={{
                      fontSize: "0.9375rem", fontWeight: "600", color: "var(--charcoal)",
                      minWidth: "140px", textAlign: "center",
                    }}>
                      {availView === "day"
                        ? dayLabel(availDate)
                        : `${format(availDate, "MMM d")} – ${format(addDays(availDate, 6), "MMM d")}`}
                    </span>
                    <button
                      onClick={() => setAvailDate(d => addDays(d, availView === "day" ? 1 : 7))}
                      style={{
                        width: "32px", height: "32px", borderRadius: "50%",
                        border: "1px solid var(--border)", background: "var(--surface)",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                      <ChevronRight size={16} color="var(--muted)" />
                    </button>
                    <button
                      onClick={() => setAvailDate(new Date())}
                      style={{
                        padding: "0.375rem 0.75rem", borderRadius: "0.5rem",
                        border: "1px solid var(--border)", background: "var(--surface)",
                        cursor: "pointer", fontSize: "0.8125rem", fontWeight: "600",
                        color: "var(--muted)", fontFamily: "inherit",
                      }}>
                      Today
                    </button>
                  </div>
                </div>

                {loadingAvail ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                    Loading availability...
                  </div>
                ) : availView === "day" ? (
                  <DayAvailability
                    date={availDate}
                    slots={daySlots}
                    services={services}
                    businessId={business.id}
                    onSlotClick={(slot) => {
                      setSelectedSlot(slot);
                      setSelectedDate(new Date(slot.slot_datetime));
                      setTab("services");
                      toast("Select a service to complete your booking", { icon: "👆" });
                    }}
                  />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                    {weekData.map((day) => (
                      <DayAvailability
                        key={day.date.toISOString()}
                        date={day.date}
                        slots={day.slots}
                        services={services}
                        businessId={business.id}
                        compact
                        onSlotClick={(slot) => {
                          setSelectedSlot(slot);
                          setSelectedDate(new Date(slot.slot_datetime));
                          setTab("services");
                          toast("Select a service to complete your booking", { icon: "👆" });
                        }}
                      />
                    ))}
                  </div>
                )}

                <div style={{
                  marginTop: "1.5rem", padding: "1.25rem",
                  background: "linear-gradient(135deg, #1A1A1A, #2D2D2D)",
                  borderRadius: "1.25rem", textAlign: "center",
                }}>
                  <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", marginBottom: "0.875rem" }}>
                    Ready to book? Select a slot above or go to the booking form.
                  </p>
                  <button onClick={() => setTab("services")} className="btn-gold">
                    Book an Appointment →
                  </button>
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {tab === "reviews" && (
              <div>
                {reviews.length === 0 ? (
                  <div style={{
                    textAlign: "center", padding: "3rem",
                    background: "var(--surface)", borderRadius: "1rem",
                    border: "1px solid var(--border)",
                  }}>
                    <Star size={36} color="var(--border)" style={{ margin: "0 auto 0.875rem" }} />
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                      No reviews yet
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.9375rem" }}>
                      Be the first to book and leave a review!
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Rating summary */}
                    <div style={{
                      background: "var(--surface)", borderRadius: "1.25rem", padding: "1.5rem",
                      border: "1px solid var(--border)", marginBottom: "1.25rem",
                      display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "center",
                    }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: "3.5rem", fontWeight: "700",
                          color: "var(--charcoal)", lineHeight: 1,
                        }}>
                          {avgRating}
                        </div>
                        <div style={{ display: "flex", gap: "2px", justifyContent: "center", margin: "0.375rem 0" }}>
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14}
                              fill={i < Math.round(Number(avgRating)) ? "#D4AF37" : "transparent"}
                              color="#D4AF37" />
                          ))}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                          {reviews.length} reviews
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: "160px" }}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviews.filter(r => r.rating === star).length;
                          const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                          return (
                            <div key={star} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.375rem" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--muted)", width: "10px" }}>{star}</span>
                              <Star size={11} fill="#D4AF37" color="#D4AF37" />
                              <div style={{ flex: 1, height: "6px", background: "var(--surface-2)", borderRadius: "9999px", overflow: "hidden" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: "#D4AF37", borderRadius: "9999px", transition: "width 0.5s" }} />
                              </div>
                              <span style={{ fontSize: "0.75rem", color: "var(--muted)", width: "20px" }}>{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {reviews.map((r) => (
                      <div key={r.id} style={{
                        background: "var(--surface)", borderRadius: "1rem",
                        padding: "1.25rem", border: "1px solid var(--border)", marginBottom: "0.75rem",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                              width: "40px", height: "40px", borderRadius: "50%",
                              background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "white", fontWeight: "700", fontSize: "1rem", flexShrink: 0,
                            }}>
                              {r.profiles?.full_name?.[0]?.toUpperCase() || "G"}
                            </div>
                            <div>
                              <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem" }}>
                                {r.profiles?.full_name || "Customer"}
                              </p>
                              <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                                {format(new Date(r.created_at), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "2px" }}>
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14}
                                fill={i < r.rating ? "#D4AF37" : "transparent"}
                                color="#D4AF37" />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p style={{ color: "var(--muted)", fontSize: "0.9375rem", lineHeight: "1.65" }}>
                            {r.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT — Booking widget */}
          <div>
            <div style={{
              position: "sticky", top: "88px",
              background: "var(--surface)", borderRadius: "1.25rem",
              border: "1px solid var(--border)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
              overflow: "hidden",
            }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.25rem" }}>
                  Book an Appointment
                </h3>
                {selectedService ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "0.875rem", color: "#D4AF37", fontWeight: "600" }}>
                      {selectedService.name} ✓
                    </p>
                    {selectedService.price != null && (
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "var(--charcoal)" }}>
                        ${Number(selectedService.price).toFixed(0)}
                      </span>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                    Select a service from the list
                  </p>
                )}
              </div>

              <div style={{ padding: "1.25rem 1.5rem" }}>
                <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                  Select Date
                </p>
                <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto", paddingBottom: "0.5rem", marginBottom: "1.25rem" }}>
                  {Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)).map((date) => {
                    const isSel = isSameDay(date, selectedDate);
                    return (
                      <button key={date.toISOString()} onClick={() => handleDateSelect(date)} style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "0.5rem 0.625rem", borderRadius: "0.75rem", flexShrink: 0,
                        border: `2px solid ${isSel ? "#D4AF37" : "var(--border)"}`,
                        background: isSel ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "var(--surface)",
                        cursor: "pointer", transition: "all 0.2s", minWidth: "46px",
                        fontFamily: "inherit",
                      }}>
                        <span style={{ fontSize: "0.625rem", fontWeight: "600", color: isSel ? "rgba(255,255,255,0.8)" : "var(--muted)", textTransform: "uppercase" }}>
                          {format(date, "EEE")}
                        </span>
                        <span style={{ fontSize: "1.0625rem", fontWeight: "700", color: isSel ? "white" : "var(--charcoal)" }}>
                          {format(date, "d")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {loadingSlots ? (
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                    Loading slots...
                  </p>
                ) : slots.length > 0 ? (
                  <>
                    <p style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
                      Available Times
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.375rem", marginBottom: "1rem" }}>
                      {slots.map((slot) => (
                        <button key={slot.id}
                          onClick={() => setSelectedSlot(selectedSlot?.id === slot.id ? null : slot)}
                          className={selectedSlot?.id === slot.id ? "slot-selected" : "slot-available"}
                          style={{ fontSize: "0.8125rem", fontWeight: "600" }}>
                          {format(new Date(slot.slot_datetime), "h:mm a")}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ marginBottom: "1rem" }}>
                    <WaitlistButton
                      businessId={business.id}
                      serviceId={selectedService?.id}
                      date={selectedDate}
                    />
                  </div>
                )}

                {selectedService?.price != null && (
                  <div style={{
                    background: "var(--surface-2)", borderRadius: "0.75rem",
                    padding: "0.875rem", marginBottom: "1rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    border: "1px solid var(--border)",
                  }}>
                    <div>
                      <p style={{ fontSize: "0.8125rem", fontWeight: "600", color: "var(--charcoal)" }}>
                        {selectedService.name}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {selectedService.duration_minutes} min
                      </p>
                    </div>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "700", color: "#D4AF37" }}>
                      ${Number(selectedService.price).toFixed(0)}
                    </p>
                  </div>
                )}

                <button onClick={handleBook} className="btn-gold"
                  disabled={!selectedService || !selectedSlot}
                  style={{ width: "100%", justifyContent: "center", opacity: !selectedService || !selectedSlot ? 0.5 : 1 }}>
                  {!selectedService ? "Select a Service First"
                    : !selectedSlot ? "Select a Time Slot"
                      : "Confirm Booking →"}
                </button>

                {business.phone && (
                  <a href={`tel:${business.phone}`} style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "0.375rem", marginTop: "0.875rem",
                    fontSize: "0.875rem", color: "var(--muted)", textDecoration: "none",
                  }}>
                    <Phone size={14} /> {business.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: "3rem" }} />
      </div>
    </div>
  );
}

function DayAvailability({
  date, slots, services, businessId, compact = false, onSlotClick,
}: {
  date: Date; slots: any[]; services: any[]; businessId: string;
  compact?: boolean; onSlotClick: (slot: any) => void;
}) {
  const label = isToday(date) ? "Today"
    : isTomorrow(date) ? "Tomorrow"
      : format(date, "EEEE, MMMM d");

  return (
    <div style={{
      background: "var(--surface)", borderRadius: "1.25rem",
      border: `1px solid ${isToday(date) ? "rgba(212,175,55,0.35)" : "var(--border)"}`,
      overflow: "hidden",
    }}>
      <div style={{
        padding: compact ? "0.75rem 1.25rem" : "1rem 1.25rem",
        background: isToday(date) ? "rgba(212,175,55,0.05)" : "var(--surface-2)",
        borderBottom: slots.length > 0 ? "1px solid var(--border)" : "none",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.6875rem", fontWeight: "700", color: isToday(date) ? "#D4AF37" : "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {format(date, "EEE")}
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: compact ? "1.125rem" : "1.375rem", fontWeight: "700", color: isToday(date) ? "#D4AF37" : "var(--charcoal)", lineHeight: 1.1 }}>
              {format(date, "d")}
            </div>
          </div>
          <span style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem" }}>
            {label}
          </span>
        </div>
        {slots.length > 0 ? (
          <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#4CAF7C" }}>
            {slots.length} open
          </span>
        ) : (
          <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>Fully booked</span>
        )}
      </div>

      {slots.length > 0 && (
        <div style={{ padding: "1rem 1.25rem" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: services.filter(s => s.price).length > 0 ? "0.875rem" : "0" }}>
            {slots.map((slot) => (
              <button key={slot.id} onClick={() => onSlotClick(slot)} style={{
                padding: "0.4375rem 0.875rem", borderRadius: "0.625rem",
                border: "2px solid #D4AF37", background: "var(--surface)",
                color: "var(--charcoal)", fontWeight: "600", fontSize: "0.875rem",
                cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#D4AF37";
                  (e.currentTarget as HTMLElement).style.color = "white";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                  (e.currentTarget as HTMLElement).style.color = "var(--charcoal)";
                }}>
                {format(new Date(slot.slot_datetime), "h:mm a")}
              </button>
            ))}
          </div>
          {services.filter(s => s.price != null).length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.5rem" }}>Services from:</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {services.filter(s => s.price != null).slice(0, 3).map((svc) => (
                  <span key={svc.id} style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    background: "var(--surface-2)", borderRadius: "9999px",
                    padding: "0.25rem 0.75rem", fontSize: "0.8125rem",
                    border: "1px solid var(--border)",
                  }}>
                    <span style={{ color: "var(--charcoal)", fontWeight: "600" }}>{svc.name}</span>
                    <span style={{ color: "#D4AF37", fontWeight: "700" }}>${Number(svc.price).toFixed(0)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {slots.length === 0 && (
        <div style={{ padding: "1rem 1.25rem" }}>
          <WaitlistButton businessId={businessId} date={date} />
        </div>
      )}
    </div>
  );
}