"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Lock, Sparkles, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Role = "customer" | "business_owner";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("customer");
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const update = (field: string, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
    setFieldErrors(p => ({ ...p, [field]: "" }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!form.username || form.username.length < 3) {
      setFieldErrors({ username: "Username must be at least 3 characters." });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }
    if (form.password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);

    // Step 1: Check uniqueness via server API (avoids 401)
    try {
      const checkRes = await fetch("/api/auth/check-unique", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.toLowerCase(),
          phone: form.phone || null,
        }),
      });
      const { errors } = await checkRes.json();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setLoading(false);
        return;
      }
    } catch (err) {
      // If check fails, continue — signup will catch duplicates
      console.warn("Uniqueness check failed, continuing:", err);
    }

    // Step 2: Create the auth user
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email.trim().toLowerCase(),
      password: form.password,
      options: {
        data: {
          username: form.username.toLowerCase(),
          full_name: form.full_name.trim(),
          role: role,
          phone: form.phone.trim() || null,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      if (
        error.message.toLowerCase().includes("already") ||
        error.message.toLowerCase().includes("email")
      ) {
        setFieldErrors({ email: "This email is already associated with an account." });
      } else if (error.message.toLowerCase().includes("password")) {
        setFieldErrors({ password: error.message });
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    // Role, username, full name and phone are saved by the database
    // trigger (handle_new_user) from the signup data above.
    const firstName = form.full_name.trim().split(" ")[0] || "there";
    toast.success(`Account created successfully. Welcome, ${firstName}! 🎉`);

    // Redirect based on role
    if (role === "business_owner") {
      router.push("/business/register");
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        padding: "1.25rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--border)", background: "var(--surface)",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={16} color="white" />
          </div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "700", color: "var(--charcoal)" }}>
            Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
          </span>
        </Link>
        <Link href="/auth/login" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#D4AF37", textDecoration: "none" }}>
          Sign In
        </Link>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1.5rem" }}>
        <div style={{ width: "100%", maxWidth: "520px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", color: "var(--muted)", fontSize: "0.875rem", textDecoration: "none", marginBottom: "1.5rem" }}>
            <ArrowLeft size={16} /> Back
          </Link>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
            Create Account
          </h1>
          <p style={{ color: "var(--muted)", marginBottom: "1.75rem", fontSize: "0.9375rem" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "#D4AF37", fontWeight: "600", textDecoration: "none" }}>
              Sign in
            </Link>
          </p>

          {/* Role selector */}
          <p style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.75rem" }}>
            I am joining as:
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.75rem" }}>
            {[
              {
                value: "customer",
                label: "Customer",
                desc: "Book beauty services",
                icon: "💅",
                features: ["Browse salons", "Book appointments", "Leave reviews"],
              },
              {
                value: "business_owner",
                label: "Business Owner",
                desc: "List & manage bookings",
                icon: "💼",
                features: ["List your business", "Manage bookings", "Track revenue"],
              },
            ].map(opt => {
              const isSelected = role === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRole(opt.value as Role)}
                  style={{
                    padding: "1.25rem", borderRadius: "1rem",
                    border: `2px solid ${isSelected ? "#D4AF37" : "var(--border)"}`,
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.04))"
                      : "var(--surface)",
                    cursor: "pointer", textAlign: "left",
                    transition: "all 0.2s", position: "relative",
                  }}
                >
                  {isSelected && (
                    <div style={{
                      position: "absolute", top: "0.75rem", right: "0.75rem",
                      width: "22px", height: "22px", borderRadius: "50%",
                      background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={12} color="white" />
                    </div>
                  )}
                  <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.625rem" }}>
                    {opt.icon}
                  </span>
                  <span style={{
                    fontSize: "1rem", fontWeight: "700",
                    color: isSelected ? "#D4AF37" : "var(--charcoal)",
                    display: "block", marginBottom: "0.25rem",
                    fontFamily: "'Playfair Display', serif",
                  }}>
                    {opt.label}
                  </span>
                  <span style={{ fontSize: "0.8125rem", color: "var(--muted)", display: "block", marginBottom: "0.625rem" }}>
                    {opt.desc}
                  </span>
                  {opt.features.map(f => (
                    <span key={f} style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: isSelected ? "var(--charcoal)" : "var(--muted)", marginBottom: "0.2rem" }}>
                      <span style={{ color: isSelected ? "#D4AF37" : "var(--border)" }}>✓</span>
                      {f}
                    </span>
                  ))}
                </button>
              );
            })}
          </div>

          {/* Role info banner */}
          <div style={{
            padding: "0.875rem 1rem", borderRadius: "0.75rem", marginBottom: "1.5rem",
            background: role === "business_owner" ? "rgba(212,175,55,0.08)" : "rgba(91,141,239,0.08)",
            border: `1px solid ${role === "business_owner" ? "rgba(212,175,55,0.25)" : "rgba(91,141,239,0.2)"}`,
            display: "flex", alignItems: "center", gap: "0.625rem",
          }}>
            <span style={{ fontSize: "1.125rem" }}>{role === "business_owner" ? "💼" : "💅"}</span>
            <p style={{ fontSize: "0.875rem", color: "var(--charcoal)", fontWeight: "500" }}>
              {role === "business_owner"
                ? "After registration you'll set up your business profile."
                : "After registration you'll go to your personal dashboard."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Full Name" error={fieldErrors.full_name}>
                <input
                  type="text" className="input-glow"
                  placeholder="Jane Doe"
                  value={form.full_name}
                  onChange={e => update("full_name", e.target.value)}
                  required
                />
              </Field>
              <Field
                label="Username"
                error={fieldErrors.username}
                hint={<><Lock size={11} style={{ display: "inline", marginRight: "3px" }} />Permanent</>}
              >
                <input
                  type="text" className="input-glow"
                  placeholder="janedoe"
                  value={form.username}
                  onChange={e => update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  required minLength={3} maxLength={20}
                />
              </Field>
            </div>

            <Field label="Email Address" error={fieldErrors.email}>
              <input
                type="email" className="input-glow"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                required autoComplete="email"
              />
            </Field>

            <Field label="Phone Number" error={fieldErrors.phone} hint="Optional">
              <input
                type="tel" className="input-glow"
                placeholder="+1 (555) 000-0000"
                value={form.phone}
                onChange={e => update("phone", e.target.value)}
              />
            </Field>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <Field label="Password" error={fieldErrors.password}>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"} className="input-glow"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => update("password", e.target.value)}
                    required minLength={8}
                    style={{ paddingRight: "3rem" }}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", background: "none", border: "none", cursor: "pointer" }}>
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
                <input
                  type="password" className="input-glow"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={e => update("confirmPassword", e.target.value)}
                  required
                />
              </Field>
            </div>

            {/* Username notice */}
            <div style={{ display: "flex", gap: "0.625rem", background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: "0.75rem", padding: "0.875rem" }}>
              <Lock size={16} color="#D4AF37" style={{ flexShrink: 0, marginTop: "0.125rem" }} />
              <p style={{ fontSize: "0.8125rem", color: "var(--muted)", lineHeight: "1.5" }}>
                <strong style={{ color: "var(--charcoal)" }}>Username is permanent.</strong>{" "}
                Choose carefully — it cannot be changed after registration.
              </p>
            </div>

            <button
              type="submit"
              className="btn-gold"
              disabled={loading}
              style={{ marginTop: "0.25rem", width: "100%", justifyContent: "center", fontSize: "1rem", padding: "0.875rem", opacity: loading ? 0.75 : 1 }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: "16px", height: "16px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  Creating account...
                </span>
              ) : (
                `Create ${role === "business_owner" ? "Business" : "Customer"} Account →`
              )}
            </button>

            <p style={{ fontSize: "0.75rem", color: "var(--muted)", textAlign: "center", lineHeight: "1.6" }}>
              By creating an account you agree to our{" "}
              <a href="#" style={{ color: "#D4AF37" }}>Terms</a> and{" "}
              <a href="#" style={{ color: "#D4AF37" }}>Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Field({ label, error, hint, children }: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
        <label style={{ fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)" }}>{label}</label>
        {hint && <span style={{ fontSize: "0.6875rem", color: "var(--muted)", display: "flex", alignItems: "center" }}>{hint}</span>}
      </div>
      {children}
      {error && <p style={{ fontSize: "0.75rem", color: "#E85C5C", marginTop: "0.375rem" }}>{error}</p>}
    </div>
  );
}