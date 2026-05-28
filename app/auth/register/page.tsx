"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Check, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

type Role = "customer" | "business_owner";

export default function RegisterPage() {
  const [step, setStep] = useState(1);
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
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }
    if (form.password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters." });
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // Check uniqueness of username and phone BEFORE creating auth user
    const [{ data: existingUsername }, { data: existingPhone }] = await Promise.all([
      supabase.from("profiles").select("id").eq("username", form.username).maybeSingle(),
      form.phone
        ? supabase.from("profiles").select("id").eq("phone", form.phone).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (existingUsername) {
      setFieldErrors({ username: "This username is already taken." });
      setLoading(false);
      return;
    }
    if (existingPhone && form.phone) {
      setFieldErrors({ phone: "This phone number is already associated with an account." });
      setLoading(false);
      return;
    }

    // Create auth user (email uniqueness enforced by Supabase Auth)
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          full_name: form.full_name,
          role: role,
        },
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("email")) {
        setFieldErrors({ email: "This email is already associated with an account." });
      } else {
        toast.error(error.message);
      }
      setLoading(false);
      return;
    }

    // Update profile with phone and role
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        username: form.username,
        full_name: form.full_name,
        phone: form.phone || null,
        role: role,
      });
    }

    toast.success("Account created! Welcome to GlowReserve ✨");
    if (role === "business_owner") {
      router.push("/business/register");
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #FDFBF7 0%, #F5E6E8 100%)",
      padding: "2rem 1.5rem",
    }}>
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <Link href="/" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.375rem",
          color: "#8A8680",
          fontSize: "0.875rem",
          textDecoration: "none",
          marginBottom: "2rem",
        }}>
          <ArrowLeft size={16} />
          Back to home
        </Link>

        {/* Header */}
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "2rem",
          fontWeight: "700",
          color: "#1A1A1A",
          marginBottom: "0.5rem",
        }}>
          Create Account
        </h1>
        <p style={{ color: "#8A8680", marginBottom: "1.75rem", fontSize: "0.9375rem" }}>
          Already have an account?{" "}
          <Link href="/auth/login" style={{ color: "#D4AF37", fontWeight: "600", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>

        {/* Role selector */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          marginBottom: "1.75rem",
        }}>
          {[
            { value: "customer", label: "I'm a Customer", desc: "Book beauty services", icon: "💅" },
            { value: "business_owner", label: "I'm a Business", desc: "List & manage bookings", icon: "💼" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRole(opt.value as Role)}
              style={{
                padding: "1rem",
                borderRadius: "0.875rem",
                border: `2px solid ${role === opt.value ? "#D4AF37" : "#E8E2D9"}`,
                background: role === opt.value ? "rgba(212,175,55,0.06)" : "white",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s",
              }}>
              <span style={{ fontSize: "1.25rem", display: "block", marginBottom: "0.375rem" }}>
                {opt.icon}
              </span>
              <span style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: "#1A1A1A",
                display: "block",
                marginBottom: "0.125rem",
              }}>
                {opt.label}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#8A8680" }}>{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <FormField label="Full Name" error={fieldErrors.full_name}>
              <input
                type="text"
                className="input-glow"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                required
              />
            </FormField>
            <FormField label="Username" error={fieldErrors.username}
              hint={<Lock size={12} style={{ display: "inline", marginRight: "0.25rem" }} />}>
              <input
                type="text"
                className="input-glow"
                placeholder="janedoe"
                value={form.username}
                onChange={(e) => update("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
                required
                minLength={3}
                maxLength={20}
              />
              {form.username && !fieldErrors.username && (
                <div style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}>
                  <Check size={16} color="#4CAF7C" />
                </div>
              )}
            </FormField>
          </div>

          <FormField label="Email Address" error={fieldErrors.email}>
            <input
              type="email"
              className="input-glow"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </FormField>

          <FormField label="Phone Number" error={fieldErrors.phone}
            hint="Optional — used for booking confirmations">
            <input
              type="tel"
              className="input-glow"
              placeholder="+1 (555) 000-0000"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </FormField>

          <FormField label="Password" error={fieldErrors.password}>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                className="input-glow"
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={8}
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
          </FormField>

          <FormField label="Confirm Password" error={fieldErrors.confirmPassword}>
            <input
              type="password"
              className="input-glow"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
          </FormField>

          {/* Username permanence notice */}
          <div style={{
            display: "flex",
            gap: "0.625rem",
            background: "rgba(212,175,55,0.06)",
            border: "1px solid rgba(212,175,55,0.2)",
            borderRadius: "0.75rem",
            padding: "0.875rem",
          }}>
            <Lock size={16} color="#D4AF37" style={{ flexShrink: 0, marginTop: "0.125rem" }} />
            <p style={{ fontSize: "0.8125rem", color: "#8A8680", lineHeight: "1.5" }}>
              <strong style={{ color: "#1A1A1A" }}>Username is permanent.</strong>{" "}
              Choose carefully — your username cannot be changed after registration.
            </p>
          </div>

          <button
            type="submit"
            className="btn-gold"
            disabled={loading}
            style={{ marginTop: "0.5rem", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p style={{ fontSize: "0.75rem", color: "#8A8680", textAlign: "center", lineHeight: "1.6" }}>
            By creating an account you agree to our{" "}
            <a href="#" style={{ color: "#D4AF37" }}>Terms of Service</a>{" "}
            and{" "}
            <a href="#" style={{ color: "#D4AF37" }}>Privacy Policy</a>.
          </p>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: "0.875rem",
        fontWeight: "500",
        color: "#1A1A1A",
        marginBottom: "0.5rem",
      }}>
        <span>{label}</span>
        {hint && (
          <span style={{ fontSize: "0.6875rem", color: "#8A8680", display: "flex", alignItems: "center" }}>
            {hint}
          </span>
        )}
      </label>
      <div style={{ position: "relative" }}>{children}</div>
      {error && (
        <p style={{ fontSize: "0.75rem", color: "#E85C5C", marginTop: "0.375rem" }}>{error}</p>
      )}
    </div>
  );
}
