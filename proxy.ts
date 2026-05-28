import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect these specific paths
  const protectedPaths = ["/dashboard", "/business/dashboard"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // Check for the Supabase auth cookie directly — no API call needed
  const hasSession =
    request.cookies.has("sb-access-token") ||
    request.cookies.has(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("//")[1]?.split(".")[0]}-auth-token`) ||
    [...request.cookies.getAll()].some((c) => c.name.includes("auth-token"));

  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};