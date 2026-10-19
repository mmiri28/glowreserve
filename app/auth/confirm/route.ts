import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * Opened from the links in GlowReserve's emails (reset password, confirm
 * sign-up). The email template links here with a one-time token_hash, which
 * works on any device or browser, unlike the default link that only works
 * where the request was made.
 *
 * Supabase → Authentication → Email Templates, "Reset Password" link:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
 */
const ALLOWED_TYPES: EmailOtpType[] = ["recovery", "signup", "email", "email_change", "invite", "magiclink"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? (type === "recovery" ? "/auth/reset-password" : "/dashboard");
  // Only paths inside this site.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (tokenHash && type && ALLOWED_TYPES.includes(type)) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const failed = type === "recovery" ? "/auth/reset-password?error=link_invalid" : "/auth/login?error=auth_callback_error";
  return NextResponse.redirect(`${origin}${failed}`);
}
