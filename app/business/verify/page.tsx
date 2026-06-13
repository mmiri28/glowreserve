"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle,
  Mail,
  Phone,
  FileText,
  Upload,
  X,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type VerificationStep = "email" | "phone" | "documents" | "submitted";
type DocumentType = "national_id" | "drivers_license" | "passport";

const STATUS_STEPS: Record<string, VerificationStep> = {
  not_started: "email",
  email_verified: "phone",
  phone_verified: "documents",
  documents_submitted: "submitted",
  pending_review: "submitted",
  verified: "submitted",
  rejected: "documents",
};

export default function VerifyPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [step, setStep] = useState<VerificationStep>("email");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Phone step
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Document step
  const [docType, setDocType] = useState<DocumentType>("national_id");
  const [files, setFiles] = useState<{
    front: File | null;
    back: File | null;
    selfie: File | null;
    selfieWithId: File | null;
  }>({ front: null, back: null, selfie: null, selfieWithId: null });
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/auth/login");
      return;
    }
    setUser(authUser);

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle();
    setProfile(profileData);

    const { data: verif } = await supabase
      .from("verifications")
      .select("*")
      .eq("user_id", authUser.id)
      .maybeSingle();
    setVerification(verif);

    const status = profileData?.verification_status || "not_started";
    setStep(STATUS_STEPS[status] || "email");

    if (profileData?.phone) setPhone(profileData.phone);

    setLoading(false);
  };

  const checkEmailVerified = async () => {
    const supabase = createClient();
    const {
      data: { user: freshUser },
    } = await supabase.auth.getUser();

    if (freshUser?.email_confirmed_at) {
      await supabase
        .from("profiles")
        .update({ verification_status: "email_verified" })
        .eq("id", freshUser.id);
      setStep("phone");
      toast.success("Email verified! ✅");
    } else {
      toast.error("Email not confirmed yet. Please check your inbox.");
    }
  };

  const resendConfirmation = async () => {
    const supabase = createClient();
    if (!user?.email) return;
    await supabase.auth.resend({ type: "signup", email: user.email });
    toast.success("Confirmation email sent!");
  };

  const sendOtp = async () => {
    if (!phone || phone.length < 8) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setSendingOtp(true);
    // For demo: use Supabase phone OTP
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) {
      // Fallback: skip OTP in dev, just mark phone verified
      if (process.env.NODE_ENV === "development") {
        await supabase
          .from("profiles")
          .update({ verification_status: "phone_verified", phone })
          .eq("id", user.id);
        setStep("documents");
        toast.success("Phone verified (dev mode)!");
      } else {
        toast.error("Failed to send OTP: " + error.message);
      }
    } else {
      setOtpSent(true);
      toast.success(`OTP sent to ${phone}`);
    }
    setSendingOtp(false);
  };

  const verifyOtp = async () => {
    if (!otp || otp.length < 4) {
      toast.error("Please enter the OTP code.");
      return;
    }
    setVerifyingOtp(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    if (error) {
      toast.error("Invalid OTP. Please try again.");
    } else {
      await supabase
        .from("profiles")
        .update({ verification_status: "phone_verified", phone })
        .eq("id", user.id);
      setStep("documents");
      toast.success("Phone verified! ✅");
    }
    setVerifyingOtp(false);
  };

  const handleFileSelect =
    (key: keyof typeof files) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File must be under 5MB");
        return;
      }
      if (
        !["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type,
        )
      ) {
        toast.error("Only JPG, PNG, WEBP files allowed");
        return;
      }
      setFiles((p) => ({ ...p, [key]: file }));
      const reader = new FileReader();
      reader.onload = () =>
        setPreviews((p) => ({ ...p, [key]: reader.result as string }));
      reader.readAsDataURL(file);
    };

  const removeFile = (key: keyof typeof files) => {
    setFiles((p) => ({ ...p, [key]: null }));
    setPreviews((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  };

  const submitDocuments = async () => {
    if (!files.front || !files.selfie || !files.selfieWithId) {
      toast.error("Please upload all required documents.");
      return;
    }
    setUploading(true);
    const supabase = createClient();

    const uploadFile = async (file: File, name: string) => {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${name}.${ext}`;
      const { error } = await supabase.storage
        .from("verifications")
        .upload(path, file, { upsert: true });
      if (error) throw error;
      return path;
    };

    try {
      const [frontPath, backPath, selfiePath, selfieIdPath] = await Promise.all(
        [
          uploadFile(files.front!, "document_front"),
          files.back
            ? uploadFile(files.back, "document_back")
            : Promise.resolve(null),
          uploadFile(files.selfie!, "selfie"),
          uploadFile(files.selfieWithId!, "selfie_with_id"),
        ],
      );

      await supabase.from("verifications").upsert(
        {
          user_id: user.id,
          verification_status: "pending_review",
          document_type: docType,
          document_front_url: frontPath,
          document_back_url: backPath,
          selfie_url: selfiePath,
          selfie_with_id_url: selfieIdPath,
          phone,
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

      await supabase
        .from("profiles")
        .update({ verification_status: "pending_review" })
        .eq("id", user.id);

      // Notify admins
      const { data: admins } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");
      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((a: { id: string }) => ({
            user_id: a.id,
            type: "verification_submitted",
            title: "New Verification Request",
            message: `${profile?.full_name || user.email} submitted verification documents for review.`,
            metadata: { user_id: user.id },
          })),
        );
      }

      setStep("submitted");
      toast.success("Documents submitted! We'll review within 24 hours.");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    }
    setUploading(false);
  };

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--cream)",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid rgba(212,175,55,0.2)",
            borderTopColor: "#D4AF37",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  const isVerified = profile?.verification_status === "verified";
  const isRejected = profile?.verification_status === "rejected";

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      {/* Header */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
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
      </div>

      <div
        style={{
          maxWidth: "620px",
          margin: "0 auto",
          padding: "2rem 1.25rem 4rem",
        }}
      >
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.5rem,4vw,2rem)",
            fontWeight: "700",
            color: "var(--charcoal)",
            marginBottom: "0.5rem",
          }}
        >
          Business Owner Verification
        </h1>
        <p
          style={{
            color: "var(--muted)",
            marginBottom: "2.5rem",
            lineHeight: "1.7",
          }}
        >
          Complete all steps to publish your business and start accepting
          bookings.
        </p>

        {/* Progress steps */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "2.5rem",
            overflow: "hidden",
          }}
        >
          {[
            { key: "email", icon: <Mail size={16} />, label: "Email" },
            { key: "phone", icon: <Phone size={16} />, label: "Phone" },
            {
              key: "documents",
              icon: <FileText size={16} />,
              label: "Documents",
            },
          ].map((s, i) => {
            const steps = ["email", "phone", "documents"];
            const currentIndex = steps.indexOf(
              step === "submitted" ? "documents" : step,
            );
            const sIndex = steps.indexOf(s.key);
            const isDone =
              sIndex < currentIndex || step === "submitted" || isVerified;
            const isActive = s.key === step;
            return (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: i < 2 ? 1 : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isDone
                        ? "linear-gradient(135deg, #D4AF37, #B8941F)"
                        : isActive
                          ? "rgba(212,175,55,0.15)"
                          : "var(--surface-2)",
                      border: `2px solid ${isDone || isActive ? "#D4AF37" : "var(--border)"}`,
                      color: isDone ? "white" : "#D4AF37",
                      transition: "all 0.3s",
                    }}
                  >
                    {isDone ? <CheckCircle size={18} /> : s.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color:
                        isDone || isActive ? "var(--charcoal)" : "var(--muted)",
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < 2 && (
                  <div
                    style={{
                      flex: 1,
                      height: "2px",
                      background: isDone ? "#D4AF37" : "var(--border)",
                      margin: "0 0.5rem 1.25rem",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Rejected state */}
        {isRejected && verification?.rejection_reason && (
          <div
            style={{
              background: "rgba(232,92,92,0.08)",
              border: "1px solid rgba(232,92,92,0.25)",
              borderRadius: "1rem",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              display: "flex",
              gap: "0.875rem",
            }}
          >
            <AlertCircle
              size={20}
              color="#E85C5C"
              style={{ flexShrink: 0, marginTop: "0.125rem" }}
            />
            <div>
              <p
                style={{
                  fontWeight: "600",
                  color: "#E85C5C",
                  marginBottom: "0.25rem",
                }}
              >
                Verification Rejected
              </p>
              <p style={{ fontSize: "0.9375rem", color: "var(--muted)" }}>
                {verification.rejection_reason}
              </p>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                  marginTop: "0.375rem",
                }}
              >
                Please resubmit your documents below.
              </p>
            </div>
          </div>
        )}

        {/* Verified state */}
        {isVerified && (
          <div
            style={{
              background: "rgba(76,175,124,0.08)",
              border: "1px solid rgba(76,175,124,0.25)",
              borderRadius: "1.25rem",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #4CAF7C, #3A9E6B)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
                boxShadow: "0 8px 24px rgba(76,175,124,0.3)",
              }}
            >
              <CheckCircle size={28} color="white" />
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.5rem",
                color: "var(--charcoal)",
                marginBottom: "0.5rem",
              }}
            >
              Verification Complete!
            </h2>
            <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
              Your identity has been verified. You can now create and publish
              your business.
            </p>
            <Link href="/business/register" className="btn-gold">
              Create Your Business →
            </Link>
          </div>
        )}

        {/* Step: Email */}
        {step === "email" && !isVerified && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "1.25rem",
              padding: "2rem",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "0.75rem",
                  background: "rgba(212,175,55,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mail size={22} color="#D4AF37" />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "var(--charcoal)",
                  }}
                >
                  Step 1: Email Verification
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Verify your email address
                </p>
              </div>
            </div>

            <div
              style={{
                background: "var(--surface-2)",
                borderRadius: "0.875rem",
                padding: "1rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
              }}
            >
              <Mail size={16} color="var(--muted)" />
              <span style={{ fontSize: "0.9375rem", color: "var(--charcoal)" }}>
                {user?.email}
              </span>
              {user?.email_confirmed_at ? (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#4CAF7C",
                    background: "rgba(76,175,124,0.1)",
                    padding: "0.2rem 0.625rem",
                    borderRadius: "9999px",
                  }}
                >
                  ✓ Confirmed
                </span>
              ) : (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: "#E85C5C",
                    background: "rgba(232,92,92,0.1)",
                    padding: "0.2rem 0.625rem",
                    borderRadius: "9999px",
                  }}
                >
                  Not confirmed
                </span>
              )}
            </div>

            {user?.email_confirmed_at ? (
              <button
                onClick={checkEmailVerified}
                className="btn-gold"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Continue to Phone Verification <ArrowRight size={16} />
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9375rem",
                    color: "var(--muted)",
                    lineHeight: "1.6",
                  }}
                >
                  We sent a confirmation email to your address. Please check
                  your inbox and click the link to verify.
                </p>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={resendConfirmation}
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Resend Email
                  </button>
                  <button
                    onClick={checkEmailVerified}
                    className="btn-gold"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    I've Confirmed →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Phone */}
        {step === "phone" && !isVerified && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "1.25rem",
              padding: "2rem",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "0.75rem",
                  background: "rgba(212,175,55,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Phone size={22} color="#D4AF37" />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "var(--charcoal)",
                  }}
                >
                  Step 2: Phone Verification
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Verify your phone number with OTP
                </p>
              </div>
            </div>

            {!otpSent ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
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
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    className="input-glow"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <button
                  onClick={sendOtp}
                  disabled={sendingOtp}
                  className="btn-gold"
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    opacity: sendingOtp ? 0.7 : 1,
                  }}
                >
                  {sendingOtp ? "Sending..." : "Send Verification Code"}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <p style={{ fontSize: "0.9375rem", color: "var(--muted)" }}>
                  Enter the 6-digit code sent to{" "}
                  <strong style={{ color: "var(--charcoal)" }}>{phone}</strong>
                </p>
                <input
                  type="text"
                  className="input-glow"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  style={{
                    letterSpacing: "0.5rem",
                    fontSize: "1.5rem",
                    textAlign: "center",
                  }}
                />
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button
                    onClick={() => setOtpSent(false)}
                    className="btn-ghost"
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Change Number
                  </button>
                  <button
                    onClick={verifyOtp}
                    disabled={verifyingOtp || otp.length < 4}
                    className="btn-gold"
                    style={{
                      flex: 2,
                      justifyContent: "center",
                      opacity: verifyingOtp ? 0.7 : 1,
                    }}
                  >
                    {verifyingOtp ? "Verifying..." : "Verify Code →"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step: Documents */}
        {(step === "documents" || isRejected) && !isVerified && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "1.25rem",
              padding: "2rem",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "0.75rem",
                  background: "rgba(212,175,55,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={22} color="#D4AF37" />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "var(--charcoal)",
                  }}
                >
                  Step 3: Identity Documents
                </h2>
                <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>
                  Upload your government-issued ID
                </p>
              </div>
            </div>

            {/* Document type */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "var(--charcoal)",
                  marginBottom: "0.75rem",
                }}
              >
                Document Type
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "0.625rem",
                }}
              >
                {[
                  { value: "national_id", label: "National ID" },
                  { value: "drivers_license", label: "Driver's License" },
                  { value: "passport", label: "Passport" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDocType(opt.value as DocumentType)}
                    style={{
                      padding: "0.75rem 0.5rem",
                      borderRadius: "0.75rem",
                      border: `2px solid ${docType === opt.value ? "#D4AF37" : "var(--border)"}`,
                      background:
                        docType === opt.value
                          ? "rgba(212,175,55,0.08)"
                          : "var(--surface)",
                      cursor: "pointer",
                      fontSize: "0.8125rem",
                      fontWeight: "600",
                      color: docType === opt.value ? "#D4AF37" : "var(--muted)",
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* File uploads */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginBottom: "1.5rem",
              }}
            >
              {[
                { key: "front" as const, label: "Front of ID", required: true },
                {
                  key: "back" as const,
                  label: "Back of ID",
                  required: docType !== "passport",
                },
                {
                  key: "selfie" as const,
                  label: "Selfie Photo",
                  required: true,
                },
                {
                  key: "selfieWithId" as const,
                  label: "Selfie Holding ID",
                  required: true,
                },
              ].map(({ key, label, required }) => (
                <UploadBox
                  key={key}
                  label={label}
                  required={required}
                  file={files[key]}
                  preview={previews[key]}
                  onSelect={handleFileSelect(key)}
                  onRemove={() => removeFile(key)}
                />
              ))}
            </div>

            <div
              style={{
                background: "rgba(212,175,55,0.06)",
                border: "1px solid rgba(212,175,55,0.2)",
                borderRadius: "0.875rem",
                padding: "1rem",
                marginBottom: "1.5rem",
                display: "flex",
                gap: "0.625rem",
              }}
            >
              <AlertCircle
                size={16}
                color="#D4AF37"
                style={{ flexShrink: 0, marginTop: "0.125rem" }}
              />
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--muted)",
                  lineHeight: "1.6",
                }}
              >
                Your documents are stored securely and only accessible to
                GlowReserve administrators for verification purposes. Max 5MB
                per file. JPG, PNG, WEBP only.
              </p>
            </div>

            <button
              onClick={submitDocuments}
              disabled={
                uploading ||
                !files.front ||
                !files.selfie ||
                !files.selfieWithId
              }
              className="btn-gold"
              style={{
                width: "100%",
                justifyContent: "center",
                opacity: uploading ? 0.7 : 1,
              }}
            >
              {uploading ? (
                <>
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
                  />{" "}
                  Uploading...
                </>
              ) : (
                "Submit for Review →"
              )}
            </button>
          </div>
        )}

        {/* Step: Submitted */}
        {step === "submitted" && !isVerified && !isRejected && (
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "1.25rem",
              padding: "2.5rem",
              border: "1px solid var(--border)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(91,141,239,0.1)",
                border: "2px solid rgba(91,141,239,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <FileText size={28} color="#5B8DEF" />
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.375rem",
                color: "var(--charcoal)",
                marginBottom: "0.5rem",
              }}
            >
              Documents Under Review
            </h2>
            <p
              style={{
                color: "var(--muted)",
                lineHeight: "1.7",
                marginBottom: "1.5rem",
              }}
            >
              Your verification documents have been submitted and are being
              reviewed by our team. This usually takes{" "}
              <strong style={{ color: "var(--charcoal)" }}>24–48 hours</strong>.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(91,141,239,0.1)",
                border: "1px solid rgba(91,141,239,0.2)",
                borderRadius: "9999px",
                padding: "0.5rem 1.25rem",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#5B8DEF",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  color: "#5B8DEF",
                }}
              >
                Pending Review
              </span>
            </div>
            <div style={{ marginTop: "2rem" }}>
              <Link
                href="/dashboard"
                style={{
                  fontSize: "0.875rem",
                  color: "var(--muted)",
                  textDecoration: "none",
                }}
              >
                ← Return to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}

function UploadBox({
  label,
  required,
  file,
  preview,
  onSelect,
  onRemove,
}: {
  label: string;
  required: boolean;
  file: File | null;
  preview?: string;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
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
          {label} {required && <span style={{ color: "#E85C5C" }}>*</span>}
        </label>
        {!required && (
          <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>
            Optional
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={onSelect}
        style={{ display: "none" }}
      />

      {preview ? (
        <div
          style={{
            position: "relative",
            borderRadius: "0.875rem",
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          <img
            src={preview}
            alt=""
            style={{ width: "100%", height: "140px", objectFit: "cover" }}
          />
          <button
            onClick={onRemove}
            style={{
              position: "absolute",
              top: "0.5rem",
              right: "0.5rem",
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              border: "none",
              cursor: "pointer",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} />
          </button>
          <div
            style={{
              position: "absolute",
              bottom: "0.5rem",
              left: "0.5rem",
              background: "rgba(76,175,124,0.9)",
              color: "white",
              fontSize: "0.6875rem",
              fontWeight: "600",
              padding: "0.2rem 0.5rem",
              borderRadius: "9999px",
            }}
          >
            ✓ Ready
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            height: "100px",
            borderRadius: "0.875rem",
            border: "2px dashed rgba(212,175,55,0.3)",
            background: "rgba(212,175,55,0.04)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            cursor: "pointer",
            color: "var(--muted)",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#D4AF37";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(212,175,55,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(212,175,55,0.3)";
            (e.currentTarget as HTMLElement).style.background =
              "rgba(212,175,55,0.04)";
          }}
        >
          <Upload size={20} color="#D4AF37" />
          <span style={{ fontSize: "0.875rem", fontWeight: "500" }}>
            Click to upload
          </span>
          <span style={{ fontSize: "0.75rem" }}>JPG, PNG, WEBP · Max 5MB</span>
        </button>
      )}
    </div>
  );
}
