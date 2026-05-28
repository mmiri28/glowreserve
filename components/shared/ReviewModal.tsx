"use client";

import { useState } from "react";
import { X } from "lucide-react";
import StarRating from "@/components/shared/StarRating";
import toast from "react-hot-toast";

interface ReviewModalProps {
  bookingId: string;
  businessId: string;
  businessName: string;
  serviceName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  bookingId,
  businessId,
  businessName,
  serviceName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { toast.error("Please select a star rating"); return; }
    setSubmitting(true);

    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, businessId, rating, comment }),
    });

    if (res.ok) {
      toast.success("Review submitted! Thank you ✨");
      onSuccess();
    } else {
      const { error } = await res.json();
      toast.error(error || "Failed to submit review");
    }
    setSubmitting(false);
  };

  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(26,26,26,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: "white", borderRadius: "1.5rem",
          width: "100%", maxWidth: "440px",
          padding: "2rem",
          animation: "slideUp 0.3s ease-out",
          boxShadow: "0 24px 64px rgba(26,26,26,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.375rem", fontWeight: "700", color: "#1A1A1A",
              marginBottom: "0.25rem",
            }}>
              Leave a Review
            </h2>
            <p style={{ fontSize: "0.875rem", color: "#8A8680" }}>
              {serviceName} · {businessName}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#8A8680", padding: "0.25rem" }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Stars */}
          <div style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "0.75rem", justifyContent: "center", display: "flex" }}>
              <StarRating value={rating} onChange={setRating} size={36} />
            </div>
            {rating > 0 && (
              <p style={{
                fontSize: "1rem", fontWeight: "700",
                color: "#D4AF37",
                animation: "fadeIn 0.2s ease-out",
              }}>
                {LABELS[rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label style={{
              display: "block", fontSize: "0.875rem",
              fontWeight: "500", color: "#1A1A1A", marginBottom: "0.5rem",
            }}>
              Share your experience
            </label>
            <textarea
              className="input-glow"
              rows={4}
              placeholder="What did you love? What could be better?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ resize: "vertical", minHeight: "100px" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-gold"
              disabled={submitting || !rating}
              style={{ flex: 2, opacity: submitting || !rating ? 0.6 : 1 }}
            >
              {submitting ? "Submitting..." : "Submit Review ✨"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
