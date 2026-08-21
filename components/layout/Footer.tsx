"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <>
      {/* Footer */}
      <footer
        style={{
          background: "#1A1A1A",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "4rem 1.5rem 2rem",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "3rem",
              marginBottom: "3rem",
            }}
          >
            {/* Brand column */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background:
                      "linear-gradient(135deg, #D4AF37, #B8941F)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ color: "white", fontSize: "1rem" }}>✨</span>
                </div>

                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    color: "white",
                  }}
                >
                  Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
                </span>
              </div>

              <p
                style={{
                  fontSize: "0.875rem",
                  color: "rgba(255,255,255,0.45)",
                  lineHeight: "1.7",
                  marginBottom: "1.5rem",
                  maxWidth: "220px",
                }}
              >
                The premium marketplace connecting you with top-rated beauty
                professionals in Nigeria.
              </p>

              {/* Social links */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                {/* Instagram */}
                <a
                  href="https://instagram.com/glowreserve"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(212,175,55,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)";
                  }}
                  title="Instagram"
                >
                  📷
                </a>

                {/* Twitter / X */}
                <a
                  href="https://twitter.com/glowreserve"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(212,175,55,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)";
                  }}
                  title="Twitter / X"
                >
                  🐦
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com/glowreserve"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    textDecoration: "none",
                    fontSize: "1rem",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "rgba(212,175,55,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "rgba(255,255,255,0.08)";
                  }}
                  title="Facebook"
                >
                  📘
                </a>
              </div>
            </div>

            {/* Explore column */}
            <div>
              <h4
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: "700",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "1.25rem",
                }}
              >
                Explore
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {[
                  { label: "Browse Services", href: "/explore" },
                  { label: "Top-Rated Salons", href: "/explore?sort=rating" },
                  { label: "Book Appointment", href: "/explore" },
                  { label: "How It Works", href: "/#how-it-works" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontSize: "0.9375rem",
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#D4AF37";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* For Business column */}
            <div>
              <h4
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: "700",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "1.25rem",
                }}
              >
                For Business
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {[
                  { label: "List Your Business", href: "/business/register" },
                  {
                    label: "Business Dashboard",
                    href: "/business/dashboard",
                  },
                  {
                    label: "Manage Bookings",
                    href: "/business/dashboard/appointments",
                  },
                  {
                    label: "Business Settings",
                    href: "/business/dashboard/settings",
                  },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontSize: "0.9375rem",
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#D4AF37";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Support column */}
            <div>
              <h4
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: "700",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: "1.25rem",
                }}
              >
                Support
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {[
                  { label: "Contact Us", href: "mailto:hello@glowreserve.com" },
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                  { label: "Sign In", href: "/auth/login" },
                ].map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    style={{
                      fontSize: "0.9375rem",
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "none",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#D4AF37";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(255,255,255,0.5)";
                    }}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <p
              style={{
                fontSize: "0.875rem",
                color: "rgba(255,255,255,0.3)",
              }}
            >
              © 2026 GlowReserve. All rights reserved.
            </p>

            <p
              style={{
                fontSize: "0.8125rem",
                color: "rgba(255,255,255,0.2)",
              }}
            >
              Built for Nigerian beauty professionals 🇳🇬
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}