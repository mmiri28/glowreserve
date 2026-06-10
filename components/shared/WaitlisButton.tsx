"use client";

import { useState } from "react";
import { Bell, BellOff, Clock, X } from "lucide-react";
import toast from "react-hot-toast";

interface WaitlistButtonProps {
  businessId: string;
  serviceId?: string;
  date: Date;
  onJoined?: () => void;
}

export default function WaitlistButton({
  businessId,
  serviceId,
  date,
  onJoined,
}: WaitlistButtonProps) {
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [preferredStart, setPreferredStart] = useState("09:00");
  const [preferredEnd, setPreferredEnd] = useState("17:00");
  const [notes, setNotes] = useState("");

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const handleJoin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          serviceId: serviceId || null,
          preferredDate: date.toISOString().split("T")[0],
          preferredTimeStart: preferredStart,
          preferredTimeEnd: preferredEnd,
          notes,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        toast.error("Please sign in to join the waitlist");
        setLoading(false);
        return;
      }

      if (res.status === 409) {
        toast.error("You are already on the waitlist for this date.");
        setJoined(true);
        setShowModal(false);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        toast.error(data.error || "Failed to join waitlist");
        setLoading(false);
        return;
      }

      setJoined(true);
      setShowModal(false);
      toast.success("You're on the waitlist! We'll notify you when a slot opens. 🔔");
      onJoined?.();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleLeave = () => {
    setJoined(false);
    toast("Removed from waitlist");
  };

  // Already joined state
  if (joined) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "rgba(91,141,239,0.08)",
        border: "1px solid rgba(91,141,239,0.2)",
        borderRadius: "0.875rem",
        padding: "0.875rem 1.125rem",
      }}>
        <div style={{
          width: "36px", height: "36px", borderRadius: "50%",
          background: "rgba(91,141,239,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Bell size={18} color="#5B8DEF" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "0.9375rem", marginBottom: "0.125rem" }}>
            You&apos;re on the waitlist
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
            We&apos;ll notify you when a slot opens on {dateLabel}
          </p>
        </div>
        <button
          onClick={handleLeave}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--muted)", padding: "0.25rem",
            display: "flex", alignItems: "center",
          }}
          title="Leave waitlist"
        >
          <BellOff size={16} />
        </button>
      </div>
    );
  }

  // Default — fully booked state
  return (
    <>
      <div style={{
        background: "rgba(212,175,55,0.04)",
        border: "1px dashed rgba(212,175,55,0.3)",
        borderRadius: "0.875rem",
        padding: "1.125rem",
        textAlign: "center",
      }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "50%",
          background: "rgba(212,175,55,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 0.625rem",
        }}>
          <Clock size={20} color="#D4AF37" />
        </div>
        <p style={{
          fontWeight: "600", color: "var(--charcoal)",
          fontSize: "0.9375rem", marginBottom: "0.25rem",
        }}>
          Fully Booked
        </p>
        <p style={{
          fontSize: "0.8125rem", color: "var(--muted)",
          marginBottom: "0.875rem", lineHeight: "1.5",
        }}>
          No open slots on {dateLabel}
        </p>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.375rem",
            padding: "0.5rem 1.25rem", borderRadius: "0.625rem",
            background: "linear-gradient(135deg, #5B8DEF, #3B6CD6)",
            color: "white", fontWeight: "600", fontSize: "0.875rem",
            border: "none", cursor: "pointer", fontFamily: "inherit",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.opacity = "0.9"}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.opacity = "1"}
        >
          <Bell size={14} /> Join Waitlist
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center",
            justifyContent: "center", padding: "1rem",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div style={{
            background: "var(--surface)", borderRadius: "1.5rem",
            width: "100%", maxWidth: "420px",
            padding: "2rem",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            animation: "slideUp 0.25s ease-out",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.25rem" }}>
                  Join Waitlist
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  {dateLabel}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: "0.9375rem", color: "var(--muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
              We&apos;ll notify you instantly when a slot opens up on this day.
            </p>

            {/* Preferred time */}
            <div style={{ marginBottom: "1.125rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.625rem" }}>
                Preferred time window
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.375rem" }}>From</label>
                  <input
                    type="time"
                    className="input-glow"
                    value={preferredStart}
                    onChange={(e) => setPreferredStart(e.target.value)}
                    style={{ fontSize: "0.9375rem" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.375rem" }}>Until</label>
                  <input
                    type="time"
                    className="input-glow"
                    value={preferredEnd}
                    onChange={(e) => setPreferredEnd(e.target.value)}
                    style={{ fontSize: "0.9375rem" }}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Notes <span style={{ color: "var(--muted)", fontWeight: "400" }}>(optional)</span>
              </label>
              <textarea
                className="input-glow"
                rows={2}
                placeholder="Any special requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => setShowModal(false)}
                className="btn-ghost"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                onClick={handleJoin}
                disabled={loading}
                style={{
                  flex: 2, display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "0.5rem",
                  padding: "0.75rem", borderRadius: "0.75rem",
                  background: loading ? "rgba(91,141,239,0.6)" : "linear-gradient(135deg, #5B8DEF, #3B6CD6)",
                  color: "white", fontWeight: "600", border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontFamily: "inherit", fontSize: "0.9375rem",
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  <>
                    <span style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                    Joining...
                  </>
                ) : (
                  <><Bell size={16} /> Join Waitlist</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}