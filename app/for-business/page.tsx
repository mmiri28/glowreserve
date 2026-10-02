"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Calendar, Star, Users, TrendingUp,
  CheckCircle, ArrowRight, Sparkles,
} from "lucide-react";

export default function ForBusinessPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  const handleCTA = async () => {
    setChecking(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Logged in — check if they already have a business
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (business) {
        // Already has a business — go to dashboard
        router.push("/business/dashboard");
      } else {
        // Logged in but no business yet — go to register
        router.push("/business/register");
      }
    } else {
      // Not logged in — show get-started gate
      router.push("/auth/get-started");
    }
    setChecking(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
        padding: "8rem 1.5rem 5rem",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: "-80px", left: "50%", transform: "translateX(-50%)", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: "720px", margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: "9999px", padding: "0.375rem 1rem", marginBottom: "1.5rem" }}>
            <Sparkles size={14} color="#D4AF37" />
            <span style={{ fontSize: "0.8125rem", fontWeight: "600", color: "#D4AF37" }}>
              For Beauty Professionals
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 6vw, 3.75rem)",
            fontWeight: "700", color: "white", lineHeight: 1.1,
            marginBottom: "1.25rem", letterSpacing: "-0.02em",
          }}>
            Grow Your Beauty Business
            <span style={{ color: "#D4AF37", display: "block" }}>With GlowReserve</span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2.5vw, 1.1875rem)",
            color: "rgba(255,255,255,0.6)", lineHeight: "1.75",
            marginBottom: "2.5rem", maxWidth: "520px", margin: "0 auto 2.5rem",
          }}>
            Join hundreds of salons, spas, and beauty professionals already using GlowReserve to manage bookings, attract new clients, and grow their revenue.
          </p>

          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {/* Main CTA — checks auth */}
            <button
              onClick={handleCTA}
              disabled={checking}
              className="btn-gold"
              style={{ fontSize: "1rem", padding: "0.9375rem 2rem", opacity: checking ? 0.75 : 1 }}
            >
              {checking ? "Checking..." : "List Your Business Free →"}
            </button>

            <Link href="/explore" style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.9375rem 2rem", borderRadius: "0.875rem",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "rgba(255,255,255,0.8)", textDecoration: "none",
              fontSize: "1rem", fontWeight: "600",
            }}>
              Browse Businesses
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "2rem 1.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", justifyContent: "center", gap: "4rem", flexWrap: "wrap" }}>
          {[
            { value: "Free", label: "To list your business" },
            { value: "0%", label: "Commission on bookings" },
            { value: "24/7", label: "Online booking for clients" },
            { value: "₦0", label: "Setup cost" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: "700", color: "#D4AF37", marginBottom: "0.25rem" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section style={{ padding: "5rem 1.5rem" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.75rem" }}>
              Everything You Need to Run Your Business
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "1.0625rem", maxWidth: "520px", margin: "0 auto" }}>
              No tech skills needed. Set up in minutes and start accepting bookings today.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.5rem" }}>
            {[
              {
                icon: <Calendar size={28} color="#D4AF37" />,
                title: "Online Booking 24/7",
                desc: "Clients can book anytime — even while you sleep. No more back-and-forth on WhatsApp.",
              },
              {
                icon: <Users size={28} color="#D4AF37" />,
                title: "Manage Your Team",
                desc: "Add staff members, set their schedules, and let clients choose who they want.",
              },
              {
                icon: <TrendingUp size={28} color="#D4AF37" />,
                title: "Track Your Revenue",
                desc: "See your earnings, busiest services, and booking trends from your analytics dashboard.",
              },
              {
                icon: <Star size={28} color="#D4AF37" />,
                title: "Build Your Reputation",
                desc: "Collect verified reviews from real clients and stand out from the competition.",
              },
              {
                icon: <CheckCircle size={28} color="#D4AF37" />,
                title: "Automated Reminders",
                desc: "Clients get SMS and email reminders automatically. Reduce no-shows effortlessly.",
              },
              {
                icon: <Sparkles size={28} color="#D4AF37" />,
                title: "Verified Badge",
                desc: "Complete our verification process to get a trusted badge that builds client confidence.",
              },
            ].map((benefit) => (
              <div key={benefit.title} style={{
                background: "var(--surface)", borderRadius: "1.25rem",
                padding: "1.75rem", border: "1px solid var(--border)",
                transition: "all 0.2s",
              }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.3)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ width: "52px", height: "52px", borderRadius: "0.875rem", background: "rgba(212,175,55,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.125rem" }}>
                  {benefit.icon}
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  {benefit.title}
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--muted)", lineHeight: "1.6" }}>
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: "var(--surface)", padding: "5rem 1.5rem", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "860px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.75rem, 4vw, 2.25rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.75rem" }}>
            Get Started in 3 Steps
          </h2>
          <p style={{ color: "var(--muted)", marginBottom: "3.5rem", fontSize: "1.0625rem" }}>
            No technical knowledge needed. We handle everything.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem" }}>
            {[
              { step: "1", title: "Create Your Account", desc: "Sign up free as a business owner in under 2 minutes." },
              { step: "2", title: "Set Up Your Business", desc: "Add your services, photos, pricing, and working hours." },
              { step: "3", title: "Start Accepting Bookings", desc: "Share your profile link and clients start booking immediately." },
            ].map((item) => (
              <div key={item.step} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                <div style={{
                  width: "56px", height: "56px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontFamily: "'Playfair Display', serif",
                  fontSize: "1.375rem", fontWeight: "700",
                  marginBottom: "1.125rem",
                  boxShadow: "0 8px 24px rgba(212,175,55,0.3)",
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.125rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: "0.9375rem", color: "var(--muted)", lineHeight: "1.6" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{
        background: "linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%)",
        padding: "5rem 1.5rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.75rem, 4vw, 2.5rem)", fontWeight: "700", color: "white", marginBottom: "1rem" }}>
            Ready to Grow Your Business?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "1.0625rem", marginBottom: "2rem", lineHeight: "1.7" }}>
            Join GlowReserve today. It&apos;s completely free to list your business and start accepting bookings.
          </p>

          {/* Bottom CTA — also checks auth */}
          <button
            onClick={handleCTA}
            disabled={checking}
            className="btn-gold"
            style={{ fontSize: "1.0625rem", padding: "1rem 2.5rem", opacity: checking ? 0.75 : 1 }}
          >
            {checking ? "Checking..." : <>Get Started Free <ArrowRight size={18} style={{ marginLeft: "0.375rem" }} /></>}
          </button>

          <p style={{ marginTop: "1.25rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.3)" }}>
            No credit card required · Free forever plan available
          </p>
        </div>
      </section>

    </div>
  );
}