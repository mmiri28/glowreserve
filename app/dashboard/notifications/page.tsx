"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Bell, Check, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Real-time updates
    const supabase = createClient();
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, fetchNotifications)
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

  const markRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(n => n.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  const markAllRead = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    setNotifications(n => n.map(x => ({ ...x, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const ICONS: Record<string, string> = {
    booking_created: "📅",
    booking_confirmed: "✅",
    booking_cancelled: "❌",
    booking_reminder: "⏰",
    review_received: "⭐",
    default: "🔔",
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "640px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
        <h1 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.875rem",
          fontWeight: "700",
          color: "#1A1A1A",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          Notifications
          {unreadCount > 0 && (
            <span style={{
              background: "linear-gradient(135deg, #D4AF37, #B8941F)",
              color: "white",
              fontSize: "0.75rem",
              fontWeight: "700",
              padding: "0.2rem 0.6rem",
              borderRadius: "9999px",
            }}>
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{
            display: "flex", alignItems: "center", gap: "0.375rem",
            background: "none", border: "none", cursor: "pointer",
            color: "#D4AF37", fontWeight: "600", fontSize: "0.875rem",
          }}>
            <CheckCheck size={16} /> Mark all read
          </button>
        )}
      </div>
      <p style={{ color: "#8A8680", marginBottom: "2rem" }}>Stay updated on your bookings and activity.</p>

      {loading ? (
        <p style={{ color: "#8A8680" }}>Loading...</p>
      ) : notifications.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "white", borderRadius: "1.25rem", border: "1px solid #E8E2D9",
        }}>
          <Bell size={40} color="#E8E2D9" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "#1A1A1A", marginBottom: "0.5rem" }}>
            All caught up!
          </h3>
          <p style={{ color: "#8A8680" }}>No notifications yet. They'll appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {notifications.map((notif) => (
            <div key={notif.id}
              onClick={() => !notif.is_read && markRead(notif.id)}
              style={{
                background: notif.is_read ? "white" : "rgba(212,175,55,0.04)",
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                border: `1px solid ${notif.is_read ? "#E8E2D9" : "rgba(212,175,55,0.25)"}`,
                display: "flex",
                gap: "0.875rem",
                alignItems: "flex-start",
                cursor: notif.is_read ? "default" : "pointer",
                transition: "all 0.2s",
              }}>
              <span style={{ fontSize: "1.375rem", flexShrink: 0 }}>
                {ICONS[notif.type] || ICONS.default}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                  <p style={{ fontWeight: "600", color: "#1A1A1A", fontSize: "0.9375rem", marginBottom: "0.25rem" }}>
                    {notif.title}
                  </p>
                  {!notif.is_read && (
                    <div style={{
                      width: "8px", height: "8px", borderRadius: "50%",
                      background: "#D4AF37", flexShrink: 0, marginTop: "0.375rem",
                    }} />
                  )}
                </div>
                <p style={{ color: "#8A8680", fontSize: "0.875rem", lineHeight: "1.5", marginBottom: "0.375rem" }}>
                  {notif.message}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#C4BFB9" }}>
                  {format(new Date(notif.created_at), "MMM d 'at' h:mm a")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
