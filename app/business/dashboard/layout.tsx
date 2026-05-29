import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BusinessSidebar from "@/components/business/BusinessSidebar";

export default async function BusinessDashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (profile?.role !== "business_owner") redirect("/dashboard");

  const { data: business } = await supabase
    .from("businesses").select("*").eq("owner_id", user.id).single();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <BusinessSidebar profile={profile} business={business} />
      <main style={{ flex: 1, overflow: "auto" }}>
        <div className="md:hidden" style={{ height: "60px" }} />
        {children}
      </main>
    </div>
  );
}