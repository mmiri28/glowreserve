import { createServerSupabaseClient } from "@/lib/supabase/server";
import { format } from "date-fns";
import { Users, Calendar } from "lucide-react";

export default async function CustomersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: business } = await supabase
    .from("businesses").select("id, name").eq("owner_id", user!.id).maybeSingle();

  if (!business) {
    return <div style={{ padding: "2rem", color: "var(--muted)" }}>No business found.</div>;
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*, profiles(full_name, avatar_url, phone), services(name)")
    .eq("business_id", business.id)
    .order("created_at", { ascending: false });

  // Group by customer
  const customerMap: Record<string, any> = {};
  (bookings || []).forEach((b: any) => {
    const id = b.customer_id;
    if (!id) return;
    if (!customerMap[id]) {
      customerMap[id] = {
        id,
        name: b.profiles?.full_name || b.customer_name || "Customer",
        phone: b.profiles?.phone || b.customer_phone || null,
        email: b.customer_email || null,
        avatar: b.profiles?.avatar_url || null,
        bookings: [],
        totalSpent: 0,
      };
    }
    customerMap[id].bookings.push(b);
  });

  const customers = Object.values(customerMap).sort((a, b) => b.bookings.length - a.bookings.length);

  return (
    <div style={{ padding: "1.25rem 1.25rem 4rem" }} className="md:p-8">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.5rem,4vw,1.875rem)", fontWeight: "700", color: "var(--charcoal)", marginBottom: "0.375rem" }}>
          Customers
        </h1>
        <p style={{ color: "var(--muted)" }}>
          {customers.length} customer{customers.length !== 1 ? "s" : ""} have booked with {business.name}.
        </p>
      </div>

      {customers.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "1.25rem", border: "2px dashed rgba(212,175,55,0.2)" }}>
          <Users size={48} color="rgba(212,175,55,0.4)" style={{ margin: "0 auto 1rem" }} />
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "var(--charcoal)", marginBottom: "0.5rem" }}>
            No customers yet
          </h3>
          <p style={{ color: "var(--muted)" }}>Once customers book with you, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {customers.map((customer: any) => {
            const lastBooking = customer.bookings[0];
            const completedCount = customer.bookings.filter((b: any) => b.status === "completed").length;
            return (
              <div key={customer.id} style={{ background: "var(--surface)", borderRadius: "1rem", padding: "1.25rem", border: "1px solid var(--border)", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                {/* Avatar */}
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #B8941F)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "1.125rem", flexShrink: 0, overflow: "hidden" }}>
                  {customer.avatar
                    ? <img src={customer.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : customer.name[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <p style={{ fontWeight: "600", color: "var(--charcoal)", fontSize: "1rem", marginBottom: "0.25rem" }}>
                    {customer.name}
                  </p>
                  <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap" }}>
                    {customer.phone && <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{customer.phone}</span>}
                    {customer.email && <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>{customer.email}</span>}
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "700", color: "#D4AF37" }}>
                      {customer.bookings.length}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Bookings</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: "700", color: "#4CAF7C" }}>
                      {completedCount}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Completed</p>
                  </div>
                </div>

                {/* Last booking */}
                {lastBooking && (
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "0.8125rem", fontWeight: "500", color: "var(--charcoal)" }}>
                      {(lastBooking as any).services?.name}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
                      <Calendar size={11} />
                      {format(new Date(lastBooking.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}