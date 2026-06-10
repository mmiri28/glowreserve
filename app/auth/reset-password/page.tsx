"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, Sparkles, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

function ResetContent() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (password.length < 8) { toast.error("Password must be at least 8 characters."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2500);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "linear-gradient(135deg, #4CAF7C, #3A9E6B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <CheckCircle size={28} color="white" />
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
          Password updated!
        </h2>
        <p style={{ color: "var(--muted)" }}>Redirecting you to login...</p>
      </div>
    );
  }

  return (
    <>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.875rem", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
        Set New Password
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>Choose a strong password for your account.</p>

      <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>New Password</label>
          <div style={{ position: "relative" }}>
            <input type={showPw ? "text" : "password"} className="input-glow"
              placeholder="Min. 8 characters" value={password}
              onChange={(e) => setPassword(e.target.value)}
              required minLength={8} style={{ paddingRight: "3rem" }} />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>Confirm Password</label>
          <input type="password" className="input-glow"
            placeholder="Repeat password" value={confirm}
            onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        <button type="submit" className="btn-gold" disabled={loading}
          style={{ width: "100%", justifyContent: "center", padding: "0.875rem", opacity: loading ? 0.75 : 1 }}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", width: "fit-content" }}>
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
          <Suspense fallback={<p>Loading...</p>}>
            <ResetContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}