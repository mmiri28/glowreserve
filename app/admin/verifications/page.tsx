"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState("pending_review");

  useEffect(() => { fetchVerifications(); }, [filter]);

  const fetchVerifications = async () => {
    setLoading(true);
    const supabase = createClient();
    let q = supabase
      .from("verifications")
      .select("*, profiles(full_name, avatar_url, phone)")
      .order("submitted_at", { ascending: false });
    if (filter !== "all") q = q.eq("verification_status", filter);
    const { data } = await q;
    setVerifications(data || []);
    setLoading(false);
  };

  const getDocUrl = async (path: string | null) => {
    if (!path) return null;
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("verifications")
      .createSignedUrl(path, 60 * 5); // 5 min signed URL
    return data?.signedUrl || null;
  };

  const handleViewDocs = async (verif: any) => {
    setSelected(verif);
    // Get signed URLs for private docs
    const [front, back, selfie, selfieId] = await Promise.all([
      getDocUrl(verif.document_front_url),
      getDocUrl(verif.document_back_url),
      getDocUrl(verif.selfie_url),
      getDocUrl(verif.selfie_with_id_url),
    ]);
    setSelected({ ...verif, signedFront: front, signedBack: back, signedSelfie: selfie, signedSelfieId: selfieId });
  };

  const handleApprove = async (userId: string) => {
    setProcessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("verifications").update({
      verification_status: "verified",
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq("user_id", userId);

    await supabase.from("profiles").update({
      verification_status: "verified",
    }).eq("id", userId);

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "verification_approved",
      title: "Verification Approved! 🎉",
      message: "Congratulations! Your identity has been verified. You can now create and publish your business on GlowReserve.",
      metadata: {},
    });

    toast.success("Verification approved!");
    setSelected(null);
    fetchVerifications();
    setProcessing(false);
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setProcessing(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from("verifications").update({
      verification_status: "rejected",
      rejection_reason: rejectionReason,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user?.id,
    }).eq("user_id", userId);

    await supabase.from("profiles").update({
      verification_status: "rejected",
    }).eq("id", userId);

    await supabase.from("notifications").insert({
      user_id: userId,
      type: "verification_rejected",
      title: "Verification Update",
      message: `Your verification was not approved. Reason: ${rejectionReason}. Please resubmit your documents.`,
      metadata: {},
    });

    toast.success("Verification rejected.");
    setSelected(null);
    setRejectionReason("");
    fetchVerifications();
    setProcessing(false);
  };

  const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    pending_review: { bg: "rgba(212,175,55,0.1)", color: "#D4AF37", label: "Pending" },
    verified: { bg: "rgba(76,175,124,0.1)", color: "#4CAF7C", label: "Verified" },
    rejected: { bg: "rgba(232,92,92,0.1)", color: "#E85C5C", label: "Rejected" },
    documents_submitted: { bg: "rgba(91,141,239,0.1)", color: "#5B8DEF", label: "Submitted" },
  };

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
        Verifications
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        Review and approve business owner identity documents.
      </p>

      {/* Filter tabs */}
      <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: "0.875rem", padding: "0.25rem", border: "1px solid var(--border)", marginBottom: "1.5rem", width: "fit-content" }}>
        {[
          { value: "pending_review", label: "Pending" },
          { value: "verified", label: "Verified" },
          { value: "rejected", label: "Rejected" },
          { value: "all", label: "All" },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{ padding: "0.4375rem 1rem", borderRadius: "0.625rem", border: "none", background: filter === f.value ? "var(--surface)" : "transparent", color: filter === f.value ? "var(--charcoal)" : "var(--muted)", cursor: "pointer", fontSize: "0.875rem", fontWeight: "600", fontFamily: "inherit", boxShadow: filter === f.value ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : verifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", background: "var(--surface)", borderRadius: "1.25rem", border: "1px solid var(--border)" }}>
          <Clock size={40} color="rgba(212,175,55,0.4)" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--muted)" }}>No {filter === "all" ? "" : filter} verifications.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {verifications.map((v: any) => {
            const statusStyle = STATUS_STYLES[v.verification_status] || STATUS_STYLES.pending_review;
            return (
              <div key={v.id} style={{ background: "var(--surface)", borderRadius: "1rem", padding: "1.25rem", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "1.125rem", flexShrink: 0, overflow: "hidden" }}>
                  {v.profiles?.avatar_url
                    ? <img src={v.profiles.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : v.profiles?.full_name?.[0]?.toUpperCase() || "?"}
                </div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <p style={{ fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.2rem" }}>
                    {v.profiles?.full_name || "Unknown User"}
                  </p>
                  <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{v.document_type?.replace(/_/g, " ")}</span>
                    {v.submitted_at && <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{format(new Date(v.submitted_at), "MMM d, yyyy")}</span>}
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", fontWeight: "600", padding: "0.25rem 0.75rem", borderRadius: "9999px", background: statusStyle.bg, color: statusStyle.color }}>
                  {statusStyle.label}
                </span>
                <button onClick={() => handleViewDocs(v)} style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderRadius: "0.625rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--charcoal)", fontSize: "0.8125rem", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" }}>
                  <Eye size={14} /> Review
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Review modal */}
      {selected && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", overflowY: "auto" }}
          onClick={(e) => e.target === e.currentTarget && setSelected(null)}>
          <div style={{ background: "var(--surface)", borderRadius: "1.5rem", maxWidth: "700px", width: "calc(100% - 2rem)", margin: "2rem auto", padding: "2rem", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.375rem", fontWeight: "700", color: "var(--charcoal)" }}>
                Review Documents
              </h2>
              <button onClick={() => setSelected(null)} style={{ background: "var(--surface-2)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)", width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <XCircle size={16} />
              </button>
            </div>

            {/* User info */}
            <div style={{ background: "var(--surface-2)", borderRadius: "0.875rem", padding: "1rem", marginBottom: "1.5rem" }}>
              <p style={{ fontWeight: "600", color: "var(--charcoal)" }}>{selected.profiles?.full_name}</p>
              <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Document: {selected.document_type?.replace(/_/g, " ")}</p>
              {selected.phone && <p style={{ fontSize: "0.875rem", color: "var(--muted)" }}>Phone: {selected.phone}</p>}
            </div>

            {/* Document images */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem", marginBottom: "1.5rem" }}>
              {[
                { url: selected.signedFront, label: "Front of ID" },
                { url: selected.signedBack, label: "Back of ID" },
                { url: selected.signedSelfie, label: "Selfie" },
                { url: selected.signedSelfieId, label: "Selfie with ID" },
              ].map(({ url, label }) => url && (
                <div key={label}>
                  <p style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--muted)", marginBottom: "0.375rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={label} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "0.75rem", border: "1px solid var(--border)", cursor: "pointer" }} />
                  </a>
                </div>
              ))}
            </div>

            {selected.verification_status === "pending_review" && (
              <>
                {/* Rejection reason */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "600", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
                    Rejection Reason (required if rejecting)
                  </label>
                  <textarea className="input-glow" rows={2}
                    placeholder="Explain why the verification was rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    style={{ resize: "none" }} />
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button onClick={() => handleReject(selected.user_id)} disabled={processing}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem", padding: "0.75rem", borderRadius: "0.75rem", border: "1px solid rgba(232,92,92,0.3)", background: "rgba(232,92,92,0.08)", color: "#E85C5C", fontWeight: "600", cursor: "pointer", fontFamily: "inherit", fontSize: "0.9375rem", opacity: processing ? 0.7 : 1 }}>
                    <XCircle size={16} /> Reject
                  </button>
                  <button onClick={() => handleApprove(selected.user_id)} disabled={processing} className="btn-gold"
                    style={{ flex: 2, justifyContent: "center", opacity: processing ? 0.7 : 1 }}>
                    <CheckCircle size={16} style={{ marginRight: "0.375rem" }} />
                    {processing ? "Processing..." : "Approve Verification"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}