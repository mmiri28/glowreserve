import { createClient } from "@supabase/supabase-js";
import { runVerificationDocumentCleanup } from "../../lib/retention/verificationDocuments";

// Netlify Scheduled Function: once a day, delete identity-document photos
// two months after an admin verified or rejected them (see the privacy policy).
// Uses the same environment variables as the app.
export default async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Verification clean-up skipped: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
    return new Response("missing configuration", { status: 500 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await runVerificationDocumentCleanup(supabase);
  console.log(`Verification clean-up: ${result.cleaned} cleaned, ${result.failed} failed`);
  return new Response(JSON.stringify(result), { status: 200, headers: { "content-type": "application/json" } });
};

export const config = { schedule: "@daily" };
