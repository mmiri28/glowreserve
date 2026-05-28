import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #FDFBF7, #F5E6E8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
      }}>
        <div>
          <div style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "8rem",
            fontWeight: "700",
            lineHeight: 1,
            marginBottom: "0.5rem",
            background: "linear-gradient(135deg, #D4AF37, #B8941F)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            404
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.75rem",
            fontWeight: "600",
            color: "#1A1A1A",
            marginBottom: "0.75rem",
          }}>
            Page not found
          </h1>
          <p style={{ color: "#8A8680", marginBottom: "2rem", maxWidth: "360px" }}>
            The page you're looking for doesn't exist or may have been moved.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <Link href="/" className="btn-gold">Go Home</Link>
            <Link href="/explore" className="btn-ghost">Browse Services</Link>
          </div>
        </div>
      </div>
    </>
  );
}
