"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, startOfDay } from "date-fns";
import { Check, ChevronRight, Sparkles, Calendar, Clock, User, Star } from "lucide-react";
import toast from "react-hot-toast";

type Step = 1 | 2 | 3 | 4;

interface BookingState {
  businessId: string;
  businessName: string;
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number | null;
  staffId: string | null;
  staffName: string | null;
  slotId: string;
  slotDatetime: string;
}

export default function BookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [booking, setBooking] = useState<Partial<BookingState>>({});
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { fetchBusinesses(); }, []);

  useEffect(() => {
    if (booking.businessId) fetchServices(booking.businessId);
  }, [booking.businessId]);

  useEffect(() => {
    if (booking.businessId) {
      fetchStaff(booking.businessId);
      fetchSlots(booking.businessId, selectedDate);
    }
  }, [booking.businessId, selectedDate]);

  const fetchBusinesses = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("businesses")
      .select("id, name, slug, category, rating, total_reviews, city, cover_image_url")
      .order("rating", { ascending: false })
      .limit(20);
    setBusinesses(data || []);
  };

  const fetchServices = async (businessId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true);
    setServices(data || []);
  };

  const fetchStaff = async (businessId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("staff")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true);
    setStaffList(data || []);
  };

  const fetchSlots = async (businessId: string, date: Date) => {
    setLoading(true);
    const supabase = createClient();
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = new Date(date.getTime() + 86400000).toISOString();

    const { data } = await supabase
      .from("slots")
      .select("*")
      .eq("business_id", businessId)
      .eq("status", "free")
      .gte("slot_datetime", dayStart)
      .lt("slot_datetime", dayEnd)
      .order("slot_datetime");
    setSlots(data || []);
    setLoading(false);
  };

  const holdSlot = async (slotId: string) => {
    const supabase = createClient();
    const holdUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from("slots")
      .update({ status: "hold", hold_expires_at: holdUntil })
      .eq("id", slotId)
      .eq("status", "free"); // only update if still free
    return !error;
  };

  const confirmBooking = async () => {
    setConfirming(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    // Reserve the slot
    const { error: slotError } = await supabase
      .from("slots")
      .update({ status: "reserved" })
      .eq("id", booking.slotId)
      .in("status", ["free", "hold"]);

    if (slotError) {
      toast.error("This slot was just taken. Please select another time.");
      setStep(3);
      setConfirming(false);
      return;
    }

    // Create booking
    const { error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_id: user.id,
        business_id: booking.businessId!,
        service_id: booking.serviceId!,
        staff_id: booking.staffId || null,
        slot_id: booking.slotId!,
        slot_datetime: booking.slotDatetime!,
        status: "pending",
        customer_name: profile?.full_name || "",
        customer_phone: profile?.phone || "",
        customer_email: user.email || "",
      });

    if (bookingError) {
      toast.error("Booking failed. Please try again.");
    } else {
      // Trigger notification via API
      await fetch("/api/notifications/booking-created", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingData: booking, userId: user.id }),
      });
      setSuccess(true);
    }
    setConfirming(false);
  };

  // ── SUCCESS SCREEN ──
  if (success) {
    return (
      <div style={{
        padding: "4rem 2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        textAlign: "center",
      }}>
        <ConfettiAnimation />
        <div style={{
          width: "80px", height: "80px", borderRadius: "50%",
          background: "linear-gradient(135deg, #D4AF37, #B8941F)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.5rem",
          animation: "bounceIn 0.6s ease-out",
        }}>
          <Check size={36} color="white" />
        </div>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2.25rem",
          fontWeight: "700",
          color: "#1A1A1A",
          marginBottom: "0.75rem",
        }}>
          Booking Request Sent!
        </h1>
        <p style={{ color: "#8A8680", fontSize: "1rem", marginBottom: "0.5rem", maxWidth: "420px" }}>
          Your request for <strong style={{ color: "#1A1A1A" }}>{booking.serviceName}</strong> at{" "}
          <strong style={{ color: "#1A1A1A" }}>{booking.businessName}</strong> is pending approval.
        </p>
        <p style={{ color: "#8A8680", fontSize: "0.9375rem", marginBottom: "2.5rem" }}>
          {format(new Date(booking.slotDatetime!), "EEEE, MMMM d 'at' h:mm a")}
        </p>
        <div style={{
          background: "rgba(212,175,55,0.06)",
          border: "1px solid rgba(212,175,55,0.2)",
          borderRadius: "1rem",
          padding: "1rem 1.5rem",
          marginBottom: "2rem",
          maxWidth: "380px",
        }}>
          <p style={{ fontSize: "0.875rem", color: "#8A8680", lineHeight: "1.6" }}>
            📲 You'll receive a confirmation once the business approves your booking. Please arrive 5 minutes early.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => router.push("/dashboard/appointments")} className="btn-gold">
            View My Appointments
          </button>
          <button onClick={() => { setSuccess(false); setStep(1); setBooking({}); }} className="btn-ghost">
            Book Another
          </button>
        </div>
      </div>
    );
  }

  // ── STEP PROGRESS ──
  const STEPS = [
    { n: 1, label: "Service" },
    { n: 2, label: "Staff" },
    { n: 3, label: "Time" },
    { n: 4, label: "Confirm" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "860px" }}>
      <h1 style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "1.875rem",
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: "0.375rem",
      }}>
        Book a Service
      </h1>
      <p style={{ color: "#8A8680", marginBottom: "2rem" }}>
        Follow the steps below to reserve your appointment.
      </p>

      {/* Step indicator */}
      <div style={{
        display: "flex",
        alignItems: "center",
        marginBottom: "2.5rem",
        overflowX: "auto",
        paddingBottom: "0.25rem",
      }}>
        {STEPS.map((s, i) => (
          <div key={s.n} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8125rem", fontWeight: "700",
                background: step > s.n
                  ? "linear-gradient(135deg, #D4AF37, #B8941F)"
                  : step === s.n
                    ? "linear-gradient(135deg, #D4AF37, #B8941F)"
                    : "#F5F0E8",
                color: step >= s.n ? "white" : "#8A8680",
                flexShrink: 0,
                transition: "all 0.3s",
              }}>
                {step > s.n ? <Check size={14} /> : s.n}
              </div>
              <span style={{
                fontSize: "0.8125rem",
                fontWeight: step === s.n ? "700" : "500",
                color: step === s.n ? "#1A1A1A" : "#8A8680",
                whiteSpace: "nowrap",
              }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: "40px", height: "2px",
                background: step > s.n ? "#D4AF37" : "#E8E2D9",
                margin: "0 0.75rem",
                flexShrink: 0,
                transition: "background 0.3s",
              }} />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Business + Service */}
      {step === 1 && (
        <div className="animate-slide-up">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "1.25rem" }}>
            Select a Business & Service
          </h2>

          {businesses.length === 0 ? (
            <EmptyState message="No businesses available yet. Check back soon!" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {businesses.map((biz) => (
                <div key={biz.id} style={{
                  background: "white",
                  borderRadius: "1.25rem",
                  border: `2px solid ${booking.businessId === biz.id ? "#D4AF37" : "#E8E2D9"}`,
                  overflow: "hidden",
                  transition: "all 0.2s",
                  cursor: "pointer",
                }}
                  onClick={() => setBooking(prev => ({ ...prev, businessId: biz.id, businessName: biz.name, serviceId: undefined, serviceName: undefined }))}
                >
                  <div style={{ padding: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "0.875rem",
                      background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.5rem", flexShrink: 0,
                    }}>
                      {biz.cover_image_url
                        ? <img src={biz.cover_image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.75rem" }} />
                        : "✨"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "1rem" }}>{biz.name}</span>
                        {biz.rating > 0 && (
                          <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.8125rem", color: "#D4AF37" }}>
                            <Star size={12} fill="#D4AF37" /> {biz.rating}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.8125rem", color: "#8A8680" }}>{biz.category} · {biz.city}</span>
                    </div>
                    {booking.businessId === biz.id && <Check size={20} color="#D4AF37" />}
                  </div>

                  {/* Services for this business */}
                  {booking.businessId === biz.id && services.length > 0 && (
                    <div style={{ borderTop: "1px solid #E8E2D9", padding: "1rem 1.25rem" }}>
                      <p style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#8A8680", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.08em" }}>Choose a Service</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {services.map((svc) => (
                          <button key={svc.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setBooking(prev => ({ ...prev, serviceId: svc.id, serviceName: svc.name, serviceDuration: svc.duration_minutes, servicePrice: svc.price }));
                            }}
                            style={{
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              padding: "0.75rem 1rem", borderRadius: "0.75rem",
                              border: `1px solid ${booking.serviceId === svc.id ? "#D4AF37" : "#E8E2D9"}`,
                              background: booking.serviceId === svc.id ? "rgba(212,175,55,0.06)" : "white",
                              cursor: "pointer", textAlign: "left", width: "100%",
                            }}>
                            <div>
                              <span style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem" }}>{svc.name}</span>
                              <span style={{ color: "#8A8680", fontSize: "0.8125rem", marginLeft: "0.625rem" }}>{svc.duration_minutes} min</span>
                            </div>
                            {svc.price && <span style={{ fontWeight: "700", color: "#D4AF37" }}>${svc.price}</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <StepNav
            nextDisabled={!booking.businessId || !booking.serviceId}
            onNext={() => setStep(2)}
          />
        </div>
      )}

      {/* STEP 2: Select Staff */}
      {step === 2 && (
        <div className="animate-slide-up">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "0.5rem" }}>
            Select a Staff Member
          </h2>
          <p style={{ color: "#8A8680", marginBottom: "1.5rem" }}>Optional — skip to let the business assign someone.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            {/* "No preference" option */}
            <StaffCard
              name="No Preference"
              emoji="🌟"
              selected={booking.staffId === null}
              onClick={() => setBooking(prev => ({ ...prev, staffId: null, staffName: null }))}
            />
            {staffList.map((s) => (
              <StaffCard
                key={s.id}
                name={s.name}
                emoji={s.avatar_url || "👤"}
                specialties={s.specialties}
                selected={booking.staffId === s.id}
                onClick={() => setBooking(prev => ({ ...prev, staffId: s.id, staffName: s.name }))}
              />
            ))}
          </div>

          <StepNav onBack={() => setStep(1)} onNext={() => setStep(3)} />
        </div>
      )}

      {/* STEP 3: Select Date & Time */}
      {step === 3 && (
        <div className="animate-slide-up">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "1.5rem" }}>
            Select Date & Time
          </h2>

          {/* Date carousel */}
          <div style={{ display: "flex", gap: "0.625rem", overflowX: "auto", paddingBottom: "0.75rem", marginBottom: "1.75rem" }}>
            {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map((date) => {
              const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
              return (
                <button key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    padding: "0.75rem 1rem", borderRadius: "0.875rem", flexShrink: 0,
                    border: `2px solid ${isSelected ? "#D4AF37" : "#E8E2D9"}`,
                    background: isSelected ? "linear-gradient(135deg, #D4AF37, #B8941F)" : "white",
                    cursor: "pointer", transition: "all 0.2s",
                    minWidth: "64px",
                  }}>
                  <span style={{ fontSize: "0.6875rem", fontWeight: "600", color: isSelected ? "rgba(255,255,255,0.8)" : "#8A8680", textTransform: "uppercase" }}>
                    {format(date, "EEE")}
                  </span>
                  <span style={{ fontSize: "1.25rem", fontWeight: "700", color: isSelected ? "white" : "#1A1A1A", lineHeight: 1.2 }}>
                    {format(date, "d")}
                  </span>
                  <span style={{ fontSize: "0.6875rem", color: isSelected ? "rgba(255,255,255,0.7)" : "#8A8680" }}>
                    {format(date, "MMM")}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Time slots */}
          <h3 style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "1rem" }}>
            Available Times — {format(selectedDate, "EEEE, MMMM d")}
          </h3>

          {loading ? (
            <p style={{ color: "#8A8680" }}>Loading slots...</p>
          ) : slots.length === 0 ? (
            <EmptyState message="No available slots on this date. Try another day." />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "0.625rem", marginBottom: "1.5rem" }}>
              {slots.map((slot) => {
                const isSelected = booking.slotId === slot.id;
                return (
                  <button key={slot.id}
                    onClick={() => setBooking(prev => ({ ...prev, slotId: slot.id, slotDatetime: slot.slot_datetime }))}
                    className={isSelected ? "slot-selected" : "slot-available"}
                    style={{ fontSize: "0.875rem", fontWeight: "600" }}>
                    {format(new Date(slot.slot_datetime), "h:mm a")}
                  </button>
                );
              })}
            </div>
          )}

          <StepNav
            onBack={() => setStep(2)}
            nextDisabled={!booking.slotId}
            onNext={async () => {
              if (booking.slotId) {
                const held = await holdSlot(booking.slotId);
                if (!held) {
                  toast.error("Slot was just taken! Please pick another.");
                  fetchSlots(booking.businessId!, selectedDate);
                } else {
                  setStep(4);
                }
              }
            }}
          />
        </div>
      )}

      {/* STEP 4: Summary & Confirm */}
      {step === 4 && (
        <div className="animate-slide-up">
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "600", color: "#1A1A1A", marginBottom: "1.5rem" }}>
            Booking Summary
          </h2>

          <div style={{ background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9", overflow: "hidden", marginBottom: "1.5rem" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg, #1A1A1A, #2D2D2D)", padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Sparkles size={16} color="#D4AF37" />
                <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "#D4AF37", letterSpacing: "0.08em" }}>BOOKING SUMMARY</span>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", color: "white", fontWeight: "600" }}>
                {booking.serviceName}
              </h3>
              <p style={{ color: "#8A8680" }}>at {booking.businessName}</p>
            </div>

            {/* Details */}
            <div style={{ padding: "1.5rem" }}>
              {[
                { icon: <Calendar size={16} color="#D4AF37" />, label: "Date", value: format(new Date(booking.slotDatetime!), "EEEE, MMMM d, yyyy") },
                { icon: <Clock size={16} color="#D4AF37" />, label: "Time", value: format(new Date(booking.slotDatetime!), "h:mm a") },
                { icon: <Clock size={16} color="#D4AF37" />, label: "Duration", value: `${booking.serviceDuration} minutes` },
                ...(booking.staffName ? [{ icon: <User size={16} color="#D4AF37" />, label: "Staff", value: booking.staffName }] : []),
                ...(booking.servicePrice ? [{ icon: <span style={{ color: "#D4AF37" }}>$</span>, label: "Price", value: `$${booking.servicePrice}` }] : []),
              ].map((row) => (
                <div key={row.label} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "0.875rem 0", borderBottom: "1px solid #F5F0E8",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    {row.icon}
                    <span style={{ fontSize: "0.9375rem", color: "#8A8680" }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: "0.9375rem", fontWeight: "600", color: "#1A1A1A" }}>{row.value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "1rem 1.5rem", background: "rgba(212,175,55,0.04)", borderTop: "1px solid #E8E2D9" }}>
              <p style={{ fontSize: "0.8125rem", color: "#8A8680", lineHeight: "1.6" }}>
                ⏱ Your slot is held for <strong style={{ color: "#D4AF37" }}>5 minutes</strong>. Confirm now to secure your booking.
              </p>
            </div>
          </div>

          <StepNav
            onBack={() => setStep(3)}
            nextLabel={confirming ? "Confirming..." : "Confirm Booking"}
            nextDisabled={confirming}
            onNext={confirmBooking}
          />
        </div>
      )}
    </div>
  );
}

function StaffCard({ name, emoji, specialties, selected, onClick }: any) {
  return (
    <button onClick={onClick} style={{
      padding: "1.25rem 1rem", borderRadius: "1rem",
      border: `2px solid ${selected ? "#D4AF37" : "#E8E2D9"}`,
      background: selected ? "rgba(212,175,55,0.06)" : "white",
      cursor: "pointer", textAlign: "center", transition: "all 0.2s",
    }}>
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        {typeof emoji === "string" && emoji.startsWith("http")
          ? <img src={emoji} alt="" style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }} />
          : emoji}
      </div>
      <div style={{ fontSize: "0.875rem", fontWeight: "600", color: "#1A1A1A" }}>{name}</div>
      {specialties?.length > 0 && (
        <div style={{ fontSize: "0.6875rem", color: "#8A8680", marginTop: "0.25rem" }}>
          {specialties.slice(0, 2).join(" · ")}
        </div>
      )}
      {selected && <Check size={16} color="#D4AF37" style={{ margin: "0.375rem auto 0" }} />}
    </button>
  );
}

function StepNav({ onBack, onNext, nextLabel = "Continue", nextDisabled = false }: any) {
  return (
    <div style={{ display: "flex", gap: "0.75rem", marginTop: "2rem" }}>
      {onBack && (
        <button onClick={onBack} className="btn-ghost" style={{ flex: "0 0 auto" }}>
          ← Back
        </button>
      )}
      <button onClick={onNext} disabled={nextDisabled} className="btn-gold"
        style={{ flex: 1, opacity: nextDisabled ? 0.6 : 1 }}>
        {nextLabel} <ChevronRight size={16} style={{ marginLeft: "0.25rem" }} />
      </button>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      background: "rgba(212,175,55,0.04)",
      border: "2px dashed rgba(212,175,55,0.2)",
      borderRadius: "1rem",
      padding: "2.5rem",
      textAlign: "center",
      color: "#8A8680",
      fontSize: "0.9375rem",
      marginBottom: "1.5rem",
    }}>
      {message}
    </div>
  );
}

function ConfettiAnimation() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${Math.random() * 100}%`,
          top: "-20px",
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          background: ["#D4AF37", "#E8CC6B", "#F5E6E8", "#1A1A1A", "#B8941F"][Math.floor(Math.random() * 5)],
          animation: `confetti ${1.5 + Math.random() * 2}s ease-out ${Math.random() * 0.8}s forwards`,
        }} />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(${Math.random() > 0.5 ? "" : "-"}720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
