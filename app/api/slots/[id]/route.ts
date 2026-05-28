import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// PUT /api/slots/[id] — hold or release a slot
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action } = await req.json(); // "hold" | "release"

  if (action === "hold") {
    const holdUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Atomic: only update if still "free"
    const { data, error } = await supabase
      .from("slots")
      .update({ status: "hold", hold_expires_at: holdUntil })
      .eq("id", params.id)
      .eq("status", "free")
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Slot is no longer available" },
        { status: 409 }
      );
    }
    return NextResponse.json({ slot: data });
  }

  if (action === "release") {
    const { error } = await supabase
      .from("slots")
      .update({ status: "free", hold_expires_at: null })
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
