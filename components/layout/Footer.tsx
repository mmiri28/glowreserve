"use client"
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: "#1A1A1A", color: "#8A8680", padding: "4rem 1.5rem 2rem" }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={16} color="white" />
              </div>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "700", color: "white" }}>
                Glow<span style={{ color: "#D4AF37" }}>Reserve</span>
              </span>
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: "1.7", maxWidth: "220px", marginBottom: "1.25rem" }}>
              The premium marketplace connecting you with top-rated beauty professionals.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              {["📷", "🐦", "📘"].map((icon, i) => (
                <a key={i} href="#" style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: "1rem" }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>
          {[
            { title: "Explore", links: ["Browse Services", "Top-Rated Salons", "New Openings", "Gift Cards"] },
            { title: "For Business", links: ["List Your Business", "Business Dashboard", "Pricing", "API"] },
            { title: "Support", links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 style={{ fontSize: "0.8125rem", fontWeight: "700", color: "white", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "1rem" }}>
                {col.title}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.links.map((link) => (
                  <li key={link} style={{ marginBottom: "0.625rem" }}>
                    <a href="#" style={{ fontSize: "0.875rem", color: "#8A8680", textDecoration: "none", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.target as HTMLElement).style.color = "#D4AF37"}
                      onMouseLeave={(e) => (e.target as HTMLElement).style.color = "#8A8680"}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ fontSize: "0.8125rem" }}>© 2024 GlowReserve. All rights reserved.</p>
          <p style={{ fontSize: "0.8125rem" }}>Crafted with ✦ for beauty lovers everywhere</p>
        </div>
      </div>
    </footer>
  );
}
