import { Suspense } from "react";
import ExploreClient from "./ExploreClient";

export const dynamic = "force-dynamic";

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FDFBF7" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>✨</div>
          <p style={{ color: "#8A8680", fontFamily: "Montserrat, sans-serif" }}>Loading...</p>
        </div>
      </div>
    }>
      <ExploreClient />
    </Suspense>
  );
}
