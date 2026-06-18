import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { businessId, weeksAhead = 1 } = await req.json();

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    // Verify this user owns the business
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return NextResponse.json(
        { error: "Business not found or you don't have permission" },
        { status: 403 }
      );
    }

    // Fetch templates
    const { data: templates, error: templateError } = await supabase
      .from("availability_templates")
      .select("*")
      .eq("business_id", businessId)
      .eq("is_active", true);

    if (templateError) {
      console.error("Template fetch error:", templateError);
      return NextResponse.json(
        { error: "Failed to fetch templates: " + templateError.message },
        { status: 500 }
      );
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json(
        { error: "No active availability templates found. Please save your schedule first." },
        { status: 400 }
      );
    }

    // Build all slot rows
    const slotsToInsert: any[] = [];
    const now = new Date();

    for (let week = 0; week < weeksAhead; week++) {
      // Get start of week (Sunday)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek + (week * 7));
      weekStart.setHours(0, 0, 0, 0);

      for (const template of templates) {
        // Get the specific day this template applies to
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + template.day_of_week);
        dayDate.setHours(0, 0, 0, 0);

        // Skip days in the past
        const dayStart = new Date(dayDate);
        dayStart.setHours(0, 0, 0, 0);
        if (dayStart < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          continue;
        }

        const [startH, startM] = (template.start_time as string).split(":").map(Number);
        const [endH, endM] = (template.end_time as string).split(":").map(Number);
        const duration = template.slot_duration_minutes || 60;

        const startTotalMins = startH * 60 + startM;
        const endTotalMins = endH * 60 + endM;

        let currentMins = startTotalMins;

        while (currentMins < endTotalMins) {
          const slotH = Math.floor(currentMins / 60);
          const slotM = currentMins % 60;

          const slotDate = new Date(dayDate);
          slotDate.setHours(slotH, slotM, 0, 0);

          slotsToInsert.push({
            business_id: businessId,
            slot_datetime: slotDate.toISOString(),
            duration_minutes: duration,
            status: "free",
          });

          currentMins += duration;
        }
      }
    }

    if (slotsToInsert.length === 0) {
      return NextResponse.json(
        { error: "No slots to generate. All days may be in the past." },
        { status: 400 }
      );
    }

    // Insert in batches of 50
    let totalInserted = 0;
    let totalSkipped = 0;
    const batchSize = 50;

    for (let i = 0; i < slotsToInsert.length; i += batchSize) {
      const batch = slotsToInsert.slice(i, i + batchSize);

      const { data: inserted, error: insertError } = await supabase
        .from("slots")
        .upsert(batch, {
          onConflict: "business_id,slot_datetime",
          ignoreDuplicates: true,
        })
        .select("id");

      if (insertError) {
        console.error("Batch insert error:", insertError);
        return NextResponse.json(
          { error: "Insert failed: " + insertError.message },
          { status: 500 }
        );
      }

      totalInserted += inserted?.length || 0;
      totalSkipped += batch.length - (inserted?.length || 0);
    }

    return NextResponse.json({
      success: true,
      generated: totalInserted,
      skipped: totalSkipped,
      total: slotsToInsert.length,
      message: `Generated ${totalInserted} new slots${totalSkipped > 0 ? `, ${totalSkipped} already existed` : ""}.`,
    });

  } catch (err: any) {
    console.error("Generate slots error:", err);
    return NextResponse.json(
      { error: err?.message || "Something went wrong" },
      { status: 500 }
    );
  }
}