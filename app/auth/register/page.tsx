import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <DashboardSidebar profile={profile} />
      <main style={{ flex: 1, overflow: "auto" }}>
        <div className="md:hidden" style={{ height: "60px" }} />
        {children}
      </main>
    </div>
  );
}