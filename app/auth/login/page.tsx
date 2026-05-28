"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    
    if (error) {
      toast.error(error.message);
      console.error("Full error:", error);
      
    } else {
      toast.success("Welcome back! ✨");
      // Check user role for redirect
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profile?.role === "business_owner") {
          router.push("/business/dashboard");
        } else {
          router.push("/dashboard");
        }
      }
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      background: "linear-gradient(135deg, #FDFBF7 0%, #F5E6E8 100%)",
    }}>
      {/* Left panel - decorative */}
      <div style={{
        flex: 1,
        background: "linear-gradient(160deg, #1A1A1A 0%, #2D2D2D 100%)",
        display: "none",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem",
        position: "relative",
        overflow: "hidden",
      }}
        className="lg:flex">
        <div style={{
          position: "absolute",
          top: "10%",
          right: "10%",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute",
          bottom: "15%",
          left: "5%",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,230,232,0.1) 0%, transparent 70%)",
        }} />

        <div style={{ textAlign: "center", position: "relative" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "18px",
            background: "linear-gradient(135deg, #D4AF37, #B8941F)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}>
            <Sparkles size={32} color="white" />
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2rem",
            fontWeight: "700",
            color: "white",
            marginBottom: "1rem",
          }}>
            Welcome back to<br />
            <span style={{ color: "#D4AF37" }}>GlowReserve</span>
          </h2>
          <p style={{ color: "#8A8680", fontSize: "0.9375rem", lineHeight: "1.7", maxWidth: "320px" }}>
            Your beauty journey continues. Sign in to manage bookings, discover new providers, and more.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Back link */}
          <Link href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.375rem",
            color: "#8A8680",
            fontSize: "0.875rem",
            textDecoration: "none",
            marginBottom: "2rem",
            transition: "color 0.2s",
          }}
            onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = "#1A1A1A"}
            onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = "#8A8680"}>
            <ArrowLeft size={16} />
            Back to home
          </Link>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2rem",
            fontWeight: "700",
            color: "#1A1A1A",
            marginBottom: "0.5rem",
          }}>
            Sign In
          </h1>
          <p style={{ color: "#8A8680", marginBottom: "2rem", fontSize: "0.9375rem" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" style={{ color: "#D4AF37", fontWeight: "600", textDecoration: "none" }}>
              Sign up
            </Link>
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#1A1A1A",
                marginBottom: "0.5rem",
              }}>
                Email Address
              </label>
              <input
                type="email"
                className="input-glow"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                color: "#1A1A1A",
                marginBottom: "0.5rem",
              }}>
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"}
                  className="input-glow"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "3rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  style={{
                    position: "absolute",
                    right: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#8A8680",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}>
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ textAlign: "right", marginTop: "0.375rem" }}>
                <a href="#" style={{ fontSize: "0.8125rem", color: "#D4AF37", textDecoration: "none" }}>
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{ marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div style={{
            textAlign: "center",
            margin: "1.5rem 0",
            position: "relative",
          }}>
            <span style={{
              background: "var(--cream)",
              padding: "0 0.75rem",
              fontSize: "0.8125rem",
              color: "#8A8680",
              position: "relative",
              zIndex: 1,
            }}>or</span>
            <div style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "1px",
              background: "#E8E2D9",
            }} />
          </div>

          <button className="btn-ghost" style={{ width: "100%", gap: "0.75rem" }}>
            <img src="https://www.google.com/favicon.ico" alt="Google" style={{ width: "18px" }} />
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
