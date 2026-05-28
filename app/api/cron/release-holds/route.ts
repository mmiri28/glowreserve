import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

// Called by a cron job (e.g. Vercel Cron or external scheduler) every minute
// to release slots whose hold has expired.
// Protect with a secret header.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from("slots")
    .update({ status: "free", hold_expires_at: null })
    .eq("status", "hold")
    .lt("hold_expires_at", new Date().toISOString())
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    released: data?.length ?? 0,
    timestamp: new Date().toISOString(),
  });
}
