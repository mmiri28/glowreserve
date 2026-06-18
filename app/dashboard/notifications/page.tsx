"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, CheckCheck, Calendar, Star, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => fetchNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setNotifications(data || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const ICONS: Record<string, React.ReactNode> = {
    booking_created: <Calendar size={18} color="#D4AF37" />,
    booking_confirmed: <CheckCheck size={18} color="#4CAF7C" />,
    booking_cancelled: <AlertCircle size={18} color="#E85C5C" />,
    booking_pending: <Clock size={18} color="#D4AF37" />,
    verification_approved: <CheckCheck size={18} color="#4CAF7C" />,
    verification_rejected: <AlertCircle size={18} color="#E85C5C" />,
    verification_submitted: <Bell size={18} color="#5B8DEF" />,
    review: <Star size={18} color="#D4AF37" />,
    default: <Bell size={18} color="#D4AF37" />,
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: "2rem",
        flexWrap: "wrap", gap: "1rem",
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.5rem, 4vw, 1.875rem)",
            fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem",
          }}>
            Notifications
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.125rem", borderRadius: "0.75rem",
              border: "1px solid var(--border)", background: "var(--surface)",
              color: "var(--charcoal)", fontWeight: "600", fontSize: "0.875rem",
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: "var(--surface)", borderRadius: "1rem", padding: "1.25rem", border: "1px solid var(--border)", opacity: 0.5, display: "flex", gap: "1rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--surface-2)", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ height: "16px", background: "var(--surface-2)", borderRadius: "4px", width: "60%", marginBottom: "0.5rem" }} />
                <div style={{ height: "13px", background: "var(--surface-2)", borderRadius: "4px", width: "80%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "5rem 2rem",
          background: "var(--surface)", borderRadius: "1.5rem",
          border: "2px dashed rgba(212,175,55,0.2)",
        }}>
          <Bell size={48} color="rgba(212,175,55,0.3)" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
            No notifications yet
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
            You&apos;ll see booking updates and alerts here.
          </p>
          <Link href="/explore" className="btn-gold">
            Explore Businesses
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => !notif.is_read && markAsRead(notif.id)}
              style={{
                background: notif.is_read ? "var(--surface)" : "rgba(212,175,55,0.04)",
                borderRadius: "1rem",
                border: `1px solid ${notif.is_read ? "var(--border)" : "rgba(212,175,55,0.2)"}`,
                padding: "1rem 1.25rem",
                display: "flex", gap: "0.875rem", alignItems: "flex-start",
                cursor: notif.is_read ? "default" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {/* Icon */}
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: notif.is_read ? "var(--surface-2)" : "rgba(212,175,55,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {ICONS[notif.type] || ICONS.default}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", flexWrap: "wrap" }}>
                  <p style={{
                    fontWeight: notif.is_read ? "500" : "700",
                    color: "var(--charcoal)", fontSize: "0.9375rem",
                    marginBottom: "0.25rem",
                  }}>
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "#D4AF37", flexShrink: 0, marginTop: "0.375rem",
                    }} />
                  )}
                </div>
                <p style={{ fontSize: "0.875rem", color: "var(--muted)", lineHeight: "1.5", marginBottom: "0.375rem" }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}