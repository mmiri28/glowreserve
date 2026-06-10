import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { username, phone } = await req.json();
    const supabase = await createServiceRoleClient();
    const errors: Record<string, string> = {};

    if (username) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username.toLowerCase())
        .maybeSingle();
      if (data) errors.username = "This username is already taken.";
    }

    if (phone) {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .maybeSingle();
      if (data) errors.phone = "This phone is already linked to an account.";
    }

    return NextResponse.json({ errors });
  } catch (err) {
    console.error("Check unique error:", err);
    return NextResponse.json({ errors: {} });
  }
}