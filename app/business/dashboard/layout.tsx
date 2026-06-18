import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BusinessSidebar from "@/components/business/BusinessSidebar";

export default async function BusinessDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/auth/login");

  // Only business owners and admins can access this
  if (profile.role === "customer") redirect("/dashboard");

  // Get their business
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  // No business yet — send to registration
  if (!business && profile.role === "business_owner") {
    redirect("/business/register");
  }

  const enrichedProfile = {
    ...profile,
    email: user.email,
    full_name: profile.full_name || user.email?.split("@")[0] || "Owner",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <BusinessSidebar profile={enrichedProfile} business={business} />
      <main style={{ flex: 1, overflow: "auto" }}>
        <div className="md:hidden" style={{ height: "60px" }} />
        {children}
      </main>
    </div>
  );
}