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
    if (!email || !password) {
      toast.error("Please enter your email and password.");
      return;
    }
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error("Login error:", error);
        if (error.message.toLowerCase().includes("invalid")) {
          toast.error("Wrong email or password. Please try again.");
        } else if (error.message.toLowerCase().includes("confirm")) {
          toast.error("Please confirm your email first. Check your inbox.");
        } else if (error.message.toLowerCase().includes("rate")) {
          toast.error("Too many attempts. Please wait a moment and try again.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Get name for personalized toast
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        const firstName =
          profileData?.full_name?.split(" ")[0] ||
          data.user.email?.split("@")[0] ||
          "there";
        toast.success(`Welcome back, ${firstName}! ✨`);

        // Fetch profile role to decide where to redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        const role = profile?.role || "customer";

        if (role === "admin") {
          router.push("/admin");
        } else if (role === "business_owner") {
          // Check if they have a business set up
          const { data: business } = await supabase
            .from("businesses")
            .select("id")
            .eq("owner_id", data.user.id)
            .single();

          if (business) {
            router.push("/business/dashboard");
          } else {
            // Business owner but no business yet — send to onboarding
            router.push("/business/register");
          }
        } else {
          router.push("/dashboard");
        }

        router.refresh();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--cream)",
      }}
    >
      {/* Mobile header */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #D4AF37, #B8941F)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={16} color="white" />
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.125rem",
              fontWeight: "700",
              color: "var(--charcoal)",
            }}
          >
            Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
          </span>
        </Link>
        <Link
          href="/auth/register"
          style={{
            fontSize: "0.875rem",
            fontWeight: "600",
            color: "#D4AF37",
            textDecoration: "none",
          }}
        >
          Register
        </Link>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
        {/* Left decorative panel — desktop only */}
        <div
          style={{
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
          className="lg:flex"
        >
          <div
            style={{
              position: "absolute",
              top: "10%",
              right: "10%",
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "15%",
              left: "5%",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(245,230,232,0.08) 0%, transparent 70%)",
            }}
          />
          <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 2rem",
                boxShadow: "0 8px 32px rgba(212,175,55,0.3)",
              }}
            >
              <Sparkles size={36} color="white" />
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "2.25rem",
                fontWeight: "700",
                color: "white",
                marginBottom: "1rem",
                lineHeight: 1.2,
              }}
            >
              Welcome back to
              <br />
              <span style={{ color: "#D4AF37" }}>GlowReserve</span>
            </h2>
            <p
              style={{
                color: "#8A8680",
                fontSize: "1rem",
                lineHeight: "1.7",
                maxWidth: "320px",
              }}
            >
              Your beauty journey continues. Sign in to manage bookings,
              discover new providers, and more.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1.5rem",
                justifyContent: "center",
                marginTop: "2.5rem",
              }}
            >
              {[
                ["2,400+", "Providers"],
                ["48k+", "Bookings"],
                ["4.9★", "Rating"],
              ].map(([val, label]) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: "#D4AF37",
                    }}
                  >
                    {val}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#8A8680",
                      marginTop: "0.2rem",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
            background: "var(--cream)",
          }}
        >
          <div style={{ width: "100%", maxWidth: "420px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                color: "var(--muted)",
                fontSize: "0.875rem",
                textDecoration: "none",
                marginBottom: "2rem",
              }}
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>

            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "2rem",
                fontWeight: "700",
                color: "var(--charcoal)",
                marginBottom: "0.375rem",
              }}
            >
              Sign In
            </h1>
            <p
              style={{
                color: "var(--muted)",
                marginBottom: "2rem",
                fontSize: "0.9375rem",
              }}
            >
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                style={{
                  color: "#D4AF37",
                  fontWeight: "600",
                  textDecoration: "none",
                }}
              >
                Create one free
              </Link>
            </p>

            <form
              onSubmit={handleLogin}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.125rem",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--charcoal)",
                    marginBottom: "0.5rem",
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-glow"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      color: "var(--charcoal)",
                    }}
                  >
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    style={{
                      fontSize: "0.8125rem",
                      color: "#D4AF37",
                      textDecoration: "none",
                    }}
                  >
                    Forgot password?
                  </Link>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    className="input-glow"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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
                      color: "var(--muted)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: "0.25rem",
                    }}
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-gold"
                disabled={loading}
                style={{
                  marginTop: "0.5rem",
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "1rem",
                  padding: "0.875rem",
                  opacity: loading ? 0.75 : 1,
                }}
              >
                {loading ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.4)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        animation: "spin 0.7s linear infinite",
                        display: "inline-block",
                      }}
                    />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                margin: "1.5rem 0",
              }}
            >
              <div
                style={{ flex: 1, height: "1px", background: "var(--border)" }}
              />
              <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>
                or
              </span>
              <div
                style={{ flex: 1, height: "1px", background: "var(--border)" }}
              />
            </div>

            <button
              className="btn-ghost"
              style={{
                width: "100%",
                gap: "0.75rem",
                justifyContent: "center",
              }}
            >
              <img
                src="https://www.google.com/favicon.ico"
                alt="Google"
                style={{ width: "18px", height: "18px" }}
              />
              Continue with Google
            </button>

            <p
              style={{
                textAlign: "center",
                fontSize: "0.8125rem",
                color: "var(--muted)",
                marginTop: "1.5rem",
              }}
            >
              By signing in you agree to our{" "}
              <a href="#" style={{ color: "#D4AF37" }}>
                Terms
              </a>{" "}
              &amp;{" "}
              <a href="#" style={{ color: "#D4AF37" }}>
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
