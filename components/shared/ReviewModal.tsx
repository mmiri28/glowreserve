"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import toast from "react-hot-toast";

interface ReviewModalProps {
  bookingId: string;
  businessId: string;
  businessName: string;
  serviceName: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function ReviewModal({
  bookingId, businessId, businessName, serviceName, onClose, onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating."); return; }
    setLoading(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, businessId, rating, comment }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to submit review.");
    } else {
      toast.success("Review submitted! Thank you ⭐");
      onSubmitted();
    }
    setLoading(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--surface)", borderRadius: "1.5rem", width: "100%", maxWidth: "440px", padding: "2rem", boxShadow: "0 24px 64px rgba(0,0,0,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.25rem" }}>
              Leave a Review
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
              {serviceName} at {businessName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} />
          </button>
        </div>

        {/* Star rating */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.875rem" }}>
            How was your experience?
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem", transition: "transform 0.1s" }}
                onMouseDown={e => (e.currentTarget as HTMLElement).style.transform = "scale(0.9)"}
                onMouseUp={e => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
              >
                <Star
                  size={36}
                  fill={(hovered || rating) >= star ? "#D4AF37" : "transparent"}
                  color={(hovered || rating) >= star ? "#D4AF37" : "var(--border)"}
                  style={{ transition: "all 0.15s" }}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#D4AF37", fontWeight: "600" }}>
              {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
            Comment <span style={{ color: "var(--muted)", fontWeight: "400" }}>(optional)</span>
          </label>
          <textarea className="input-glow" rows={3}
            placeholder="Share your experience..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ resize: "none" }} />
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={onClose} className="btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading || rating === 0} className="btn-gold"
            style={{ flex: 2, justifyContent: "center", opacity: loading || rating === 0 ? 0.6 : 1 }}>
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}