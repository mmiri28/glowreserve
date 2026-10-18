import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Identity documents retention.
 *
 * Business owners upload photos of an ID document (front and back), a selfie
 * and a selfie holding the ID so an admin can confirm who they are. Two months
 * after the admin decides (verified or rejected), the photos are deleted from
 * the private "verifications" bucket and their paths cleared. The decision
 * itself (status, reviewed_at, reviewed_by) stays, so a verified business keeps
 * its badge. Requests still waiting for review keep their photos.
 */
export const DOCUMENT_RETENTION_DAYS = 60;
const BUCKET = "verifications";
const BATCH_SIZE = 100;
const DOC_COLUMNS = ["document_front_url", "document_back_url", "selfie_url", "selfie_with_id_url"] as const;

type Row = { user_id: string } & Record<(typeof DOC_COLUMNS)[number], string | null>;

export async function runVerificationDocumentCleanup(
  supabase: SupabaseClient,
  now: Date = new Date(),
): Promise<{ cleaned: number; failed: number }> {
  const cutoff = new Date(now.getTime() - DOCUMENT_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  let cleaned = 0;
  let failed = 0;

  for (;;) {
    const { data, error } = await supabase
      .from("verifications")
      .select(`user_id, ${DOC_COLUMNS.join(", ")}`)
      .in("verification_status", ["verified", "rejected"])
      .lt("reviewed_at", cutoff)
      .or(DOC_COLUMNS.map((c) => `${c}.not.is.null`).join(","))
      .order("reviewed_at", { ascending: true })
      .limit(BATCH_SIZE);
    if (error) throw new Error(`Could not list verifications: ${error.message}`);

    const rows = (data ?? []) as unknown as Row[];
    if (rows.length === 0) break;

    let progressed = 0;
    for (const row of rows) {
      const paths = DOC_COLUMNS.map((c) => row[c]).filter((p): p is string => Boolean(p));
      // Files missing from the bucket are simply not returned; that counts as removed.
      const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
      if (removeError) {
        failed += 1;
        console.error("Verification clean-up: could not remove documents", { userId: row.user_id, error: removeError.message });
        continue;
      }
      const cleared = Object.fromEntries(DOC_COLUMNS.map((c) => [c, null]));
      const { error: updateError } = await supabase.from("verifications").update(cleared).eq("user_id", row.user_id);
      if (updateError) {
        failed += 1;
        console.error("Verification clean-up: removed files but could not clear paths", { userId: row.user_id, error: updateError.message });
        continue;
      }
      cleaned += 1;
      progressed += 1;
    }
    // Stop if a whole batch failed, so one broken row cannot loop forever; the next run retries.
    if (progressed === 0 || rows.length < BATCH_SIZE) break;
  }

  return { cleaned, failed };
}
