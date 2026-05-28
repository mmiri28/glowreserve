const STEPS = [
  {
    step: "01",
    title: "Find Your Provider",
    description: "Browse thousands of verified beauty professionals. Filter by service, location, ratings, and availability.",
    icon: "🔍",
  },
  {
    step: "02",
    title: "Book Instantly",
    description: "Select your preferred date, time, and staff. Secure your slot in real-time with zero double-booking.",
    icon: "📅",
  },
  {
    step: "03",
    title: "Visit & Glow",
    description: "Show up and enjoy your treatment. Leave a review to help others find their perfect match.",
    icon: "✨",
  },
];

export default function HowItWorks() {
  return (
    <section style={{
      padding: "5rem 1.5rem",
      background: "linear-gradient(135deg, #FDFBF7 0%, #F5F0E8 100%)",
    }}>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span style={{
            fontSize: "0.8125rem",
            fontWeight: "600",
            color: "#D4AF37",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}>Simple & Seamless</span>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            fontWeight: "700",
            color: "#1A1A1A",
            marginTop: "0.5rem",
          }}>
            How GlowReserve Works
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "2rem",
        }}>
          {STEPS.map((step, index) => (
            <div
              key={step.step}
              style={{
                position: "relative",
                background: "white",
                borderRadius: "1.25rem",
                padding: "2rem",
                border: "1px solid rgba(232,226,217,0.8)",
                boxShadow: "0 4px 20px rgba(26,26,26,0.06)",
              }}
            >
              {/* Step number */}
              <div style={{
                position: "absolute",
                top: "-1px",
                left: "2rem",
                background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                color: "white",
                fontSize: "0.6875rem",
                fontWeight: "700",
                letterSpacing: "0.08em",
                padding: "0.25rem 0.625rem",
                borderRadius: "0 0 0.5rem 0.5rem",
              }}>
                STEP {step.step}
              </div>

              {/* Icon */}
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "1rem",
                background: "linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.05))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.75rem",
                marginBottom: "1.25rem",
                marginTop: "1rem",
              }}>
                {step.icon}
              </div>

              <h3 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#1A1A1A",
                marginBottom: "0.75rem",
              }}>
                {step.title}
              </h3>
              <p style={{ fontSize: "0.9375rem", color: "#8A8680", lineHeight: "1.7" }}>
                {step.description}
              </p>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div style={{
                  display: "none",
                  position: "absolute",
                  right: "-1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#D4AF37",
                  fontSize: "1.25rem",
                  zIndex: 1,
                }}
                  className="lg:block">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
