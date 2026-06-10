"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error("Please enter your email."); return; }
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "var(--charcoal)" }}>
            Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
          </span>
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "420px" }}>
          <Link href="/auth/login" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: "1.5rem" }}>
            <ArrowLeft size={16} /> Back to login
          </Link>

          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", boxShadow: "0 8px 24px rgba(212,175,55,0.3)" }}>
                <Mail size={28} color="white" />
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.75rem", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.75rem" }}>
                Check your email
              </h1>
              <p style={{ color: "var(--muted)", lineHeight: "1.7", marginBottom: "2rem" }}>
                We sent a password reset link to <strong style={{ color: "var(--charcoal)" }}>{email}</strong>. Check your inbox and follow the link.
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                Didn&apos;t receive it?{" "}
                <button onClick={() => setSent(false)} style={{ color: "#D4AF37", background: "none", border: "none", cursor: "pointer", fontWeight: "600", fontFamily: "inherit" }}>
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                Forgot Password?
              </h1>
              <p style={{ color: "var(--muted)", marginBottom: "2rem", lineHeight: "1.6" }}>
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                    Email Address
                  </label>
                  <input type="email" className="input-glow"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required autoComplete="email" />
                </div>
                <button type="submit" className="btn-gold" disabled={loading}
                  style={{ width: "100%", justifyContent: "center", padding: "0.875rem", opacity: loading ? 0.75 : 1 }}>
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}