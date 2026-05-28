"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 20,
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
            onMouseLeave={() => !readonly && setHovered(0)}
            style={{
              background: "none",
              border: "none",
              padding: "2px",
              cursor: readonly ? "default" : "pointer",
              transition: "transform 0.1s",
              transform: hovered === star && !readonly ? "scale(1.15)" : "scale(1)",
            }}
          >
            <Star
              size={size}
              fill={filled ? "#D4AF37" : "transparent"}
              color={filled ? "#D4AF37" : "#C4BFB9"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
