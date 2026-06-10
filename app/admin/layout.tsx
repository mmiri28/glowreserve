import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <AdminSidebar />
      <main style={{ flex: 1, overflow: "auto" }}>
        <div className="md:hidden" style={{ height: "60px" }} />
        {children}
      </main>
    </div>
  );
}