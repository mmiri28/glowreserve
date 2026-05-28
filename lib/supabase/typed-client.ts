// This helper adds `as any` casts to avoid TS errors when the DB types
// are inferred as `never` without a live Supabase project.
// In production, run `supabase gen types typescript` to replace Database with
// your real generated types and remove the `as any` casts.

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) as any;
}
