"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ minimal = false }: { minimal?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle dark mode"
      style={{
        display: "flex",
        alignItems: "center",
        gap: minimal ? 0 : "0.5rem",
        padding: minimal ? "0.5rem" : "0.5rem 1rem",
        borderRadius: "0.75rem",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        cursor: "pointer",
        color: "var(--charcoal)",
        fontSize: "0.875rem",
        fontWeight: "600",
        fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      {isDark ? (
        <Sun size={16} color="#D4AF37" />
      ) : (
        <Moon size={16} color="#8A8680" />
      )}
      {!minimal && (
        <span style={{ color: "var(--muted)" }}>
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}