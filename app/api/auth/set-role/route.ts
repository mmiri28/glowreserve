import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { userId, role, username, fullName, phone } = await req.json();

    if (!userId || !role || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    // Upsert profile with correct role — overwrites trigger if it fired wrong
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: userId,
        username: username.toLowerCase(),
        full_name: fullName || "",
        role: role,
        phone: phone || null,
      }, {
        onConflict: "id",
      });

    if (error) {
      console.error("Set role error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Set role error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}