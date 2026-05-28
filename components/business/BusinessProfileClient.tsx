"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, MapPin, Phone, Clock, Check, ChevronRight } from "lucide-react";
import { format, addDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Tab = "services" | "reviews" | "gallery";

export default function BusinessProfileClient({
  business,
  services,
  reviews,
  staff,
}: {
  business: any;
  services: any[];
  reviews: any[];
  staff: any[];
}) {
  const [tab, setTab] = useState<Tab>("services");
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const router = useRouter();

  const loadSlots = async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    const supabase = createClient();
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

    const { data } = await supabase
      .from("slots")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "free")
      .gte("slot_datetime", dayStart)
      .lt("slot_datetime", dayEnd)
      .order("slot_datetime");

    setSlots(data || []);
    setLoadingSlots(false);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    loadSlots(date);
  };

  const handleBook = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please sign in to book");
      router.push(`/auth/login?redirect=/business/${business.slug}`);
      return;
    }
    if (!selectedService || !selectedSlot) {
      toast.error("Please select a service and time slot");
      return;
    }
    router.push(
      `/dashboard/book?business=${business.id}&service=${selectedService.id}&slot=${selectedSlot.id}`
    );
  };

  const categories = Array.from(new Set(services.map((s: any) => s.category))).filter(Boolean) as string[];

  return (
    <div style={{ paddingTop: "72px", background: "#FDFBF7", minHeight: "100vh" }}>
      {/* Cover */}
      <div style={{ position: "relative", height: "280px", background: "#1A1A1A", overflow: "hidden" }}>
        {business.cover_image_url ? (
          <img
            src={business.cover_image_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.7 }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 50%, #D4AF37 200%)",
          }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 1.5rem" }}>
        {/* Profile header */}
        <div style={{
          display: "flex", gap: "1.5rem", alignItems: "flex-end",
          marginTop: "-48px", marginBottom: "2rem",
          flexWrap: "wrap",
        }}>
          {/* Logo */}
          <div style={{
            width: "96px", height: "96px", borderRadius: "1.25rem",
            background: "white", border: "4px solid white",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.5rem", flexShrink: 0,
            overflow: "hidden",
          }}>
            {business.logo_url
              ? <img src={business.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : "✨"}
          </div>

          <div style={{ flex: 1, paddingBottom: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.5rem, 4vw, 2rem)",
                fontWeight: "700", color: "#1A1A1A",
              }}>
                {business.name}
              </h1>
              {business.is_verified && (
                <span style={{
                  display: "flex", alignItems: "center", gap: "0.25rem",
                  background: "rgba(212,175,55,0.1)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#D4AF37",
                  fontSize: "0.75rem", fontWeight: "700",
                  padding: "0.25rem 0.625rem", borderRadius: "9999px",
                }}>
                  <Check size={12} /> Verified
                </span>
              )}
            </div>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", marginTop: "0.375rem" }}>
              {business.category && (
                <span style={{ fontSize: "0.9375rem", color: "#8A8680" }}>{business.category}</span>
              )}
              {business.city && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9375rem", color: "#8A8680" }}>
                  <MapPin size={14} /> {business.city}
                </span>
              )}
              {business.rating > 0 && (
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.9375rem", color: "#1A1A1A" }}>
                  <Star size={14} fill="#D4AF37" color="#D4AF37" />
                  <strong>{business.rating}</strong>
                  <span style={{ color: "#8A8680" }}>({business.total_reviews} reviews)</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}
          className="lg:grid">
          {/* Left: Tabs */}
          <div>
            {/* Tabs */}
            <div style={{
              display: "flex", gap: "0", background: "white",
              borderRadius: "0.875rem", padding: "0.25rem",
              border: "1px solid #E8E2D9",
              width: "fit-content", marginBottom: "2rem",
            }}>
              {(["services", "reviews"] as Tab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "0.625rem 1.5rem",
                  borderRadius: "0.625rem",
                  border: "none", cursor: "pointer",
                  fontSize: "0.9375rem", fontWeight: "600",
                  background: tab === t ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "transparent",
                  color: tab === t ? "white" : "#8A8680",
                  transition: "all 0.2s",
                }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Services Tab */}
            {tab === "services" && (
              <div>
                {categories.map((cat) => (
                  <div key={cat} style={{ marginBottom: "2rem" }}>
                    <h3 style={{
                      fontSize: "0.75rem", fontWeight: "700",
                      color: "#D4AF37", letterSpacing: "0.1em",
                      textTransform: "uppercase", marginBottom: "0.875rem",
                    }}>
                      {cat}
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {services.filter((s) => s.category === cat).map((svc) => (
                        <div key={svc.id}
                          onClick={() => setSelectedService(selectedService?.id === svc.id ? null : svc)}
                          style={{
                            background: "white",
                            borderRadius: "1rem",
                            padding: "1.25rem",
                            border: `2px solid ${selectedService?.id === svc.id ? "#D4AF37" : "#E8E2D9"}`,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "1rem",
                          }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <span style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "1rem" }}>
                                {svc.name}
                              </span>
                              {selectedService?.id === svc.id && (
                                <Check size={16} color="#D4AF37" />
                              )}
                            </div>
                            {svc.description && (
                              <p style={{ color: "#8A8680", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                                {svc.description}
                              </p>
                            )}
                            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8125rem", color: "#8A8680" }}>
                                <Clock size={12} /> {svc.duration_minutes} min
                              </span>
                            </div>
                          </div>
                          {svc.price && (
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <span style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: "1.25rem", fontWeight: "700", color: "#1A1A1A",
                              }}>
                                ${svc.price}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {services.length === 0 && (
                  <p style={{ color: "#8A8680", textAlign: "center", padding: "3rem" }}>
                    No services listed yet.
                  </p>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {tab === "reviews" && (
              <div>
                {reviews.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem", color: "#8A8680" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⭐</div>
                    <p>No reviews yet. Be the first to book and leave a review!</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {reviews.map((r) => (
                      <div key={r.id} style={{
                        background: "white", borderRadius: "1rem",
                        padding: "1.5rem", border: "1px solid #E8E2D9",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{
                              width: "40px", height: "40px", borderRadius: "50%",
                              background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "white", fontWeight: "700",
                            }}>
                              {r.profiles?.full_name?.[0]?.toUpperCase() || "G"}
                            </div>
                            <div>
                              <p style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem" }}>
                                {r.profiles?.full_name || "Customer"}
                              </p>
                              <p style={{ fontSize: "0.75rem", color: "#8A8680" }}>
                                {format(new Date(r.created_at), "MMMM d, yyyy")}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "2px" }}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < r.rating ? "#D4AF37" : "transparent"}
                                color="#D4AF37"
                              />
                            ))}
                          </div>
                        </div>
                        {r.comment && (
                          <p style={{ color: "#4A4540", fontSize: "0.9375rem", lineHeight: "1.6" }}>
                            {r.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Booking widget */}
          <div style={{
            position: "sticky", top: "90px",
            background: "white", borderRadius: "1.25rem",
            border: "1px solid #E8E2D9",
            boxShadow: "0 8px 32px rgba(26,26,26,0.08)",
            overflow: "hidden",
          }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid #E8E2D9" }}>
              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.125rem", fontWeight: "600", color: "#1A1A1A",
                marginBottom: "0.25rem",
              }}>
                Book an Appointment
              </h3>
              {selectedService ? (
                <p style={{ fontSize: "0.875rem", color: "#D4AF37", fontWeight: "600" }}>
                  {selectedService.name} selected ✓
                </p>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#8A8680" }}>
                  Select a service from the list
                </p>
              )}
            </div>

            <div style={{ padding: "1.5rem" }}>
              {/* Date selector */}
              <p style={{
                fontSize: "0.75rem", fontWeight: "700", color: "#8A8680",
                letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}>
                Select Date
              </p>
              <div style={{
                display: "flex", gap: "0.375rem", overflowX: "auto",
                paddingBottom: "0.5rem", marginBottom: "1.25rem",
              }}>
                {Array.from({ length: 7 }, (_, i) => addDays(new Date(), i)).map((date) => {
                  const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                  return (
                    <button key={date.toISOString()}
                      onClick={() => handleDateSelect(date)}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        padding: "0.625rem 0.75rem",
                        borderRadius: "0.75rem", flexShrink: 0,
                        border: `2px solid ${isSelected ? "#D4AF37" : "#E8E2D9"}`,
                        background: isSelected ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "white",
                        cursor: "pointer", transition: "all 0.2s", minWidth: "52px",
                      }}>
                      <span style={{ fontSize: "0.6rem", fontWeight: "600", color: isSelected ? "rgba(255,255,255,0.8)" : "#8A8680", textTransform: "uppercase" }}>
                        {format(date, "EEE")}
                      </span>
                      <span style={{ fontSize: "1.0625rem", fontWeight: "700", color: isSelected ? "white" : "#1A1A1A" }}>
                        {format(date, "d")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Slots */}
              {slots.length > 0 || loadingSlots ? (
                <>
                  <p style={{
                    fontSize: "0.75rem", fontWeight: "700", color: "#8A8680",
                    letterSpacing: "0.08em", textTransform: "uppercase",
                    marginBottom: "0.75rem",
                  }}>
                    Available Times
                  </p>
                  {loadingSlots ? (
                    <p style={{ color: "#8A8680", fontSize: "0.875rem" }}>Loading...</p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.375rem", marginBottom: "1.25rem" }}>
                      {slots.map((slot) => (
                        <button key={slot.id}
                          onClick={() => setSelectedSlot(selectedSlot?.id === slot.id ? null : slot)}
                          className={selectedSlot?.id === slot.id ? "slot-selected" : "slot-available"}
                          style={{ fontSize: "0.8125rem", fontWeight: "600" }}>
                          {format(new Date(slot.slot_datetime), "h:mm a")}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#8A8680", textAlign: "center", padding: "1rem", marginBottom: "1rem" }}>
                  Select a date to see available times
                </p>
              )}

              {/* CTA */}
              <button
                onClick={handleBook}
                className="btn-gold"
                disabled={!selectedService || !selectedSlot}
                style={{ width: "100%", opacity: !selectedService || !selectedSlot ? 0.5 : 1 }}>
                {!selectedService
                  ? "Select a Service"
                  : !selectedSlot
                    ? "Select a Time"
                    : "Book Now"}
                <ChevronRight size={16} style={{ marginLeft: "0.25rem" }} />
              </button>

              {business.phone && (
                <a href={`tel:${business.phone}`} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "0.375rem", marginTop: "0.75rem",
                  fontSize: "0.875rem", color: "#8A8680",
                  textDecoration: "none",
                }}>
                  <Phone size={14} /> {business.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <div style={{ height: "4rem" }} />
      </div>
    </div>
  );
}
