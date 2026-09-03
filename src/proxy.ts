import { NextResponse, type NextRequest } from "next/server";
import { withBasePath } from "@/lib/basePath";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIE_NAMES.some((name) =>
    request.cookies.has(name),
  );

  if (!hasSession) {
    // NextResponse.redirect takes a full URL, so basePath is ours to add.
    const loginUrl = new URL(withBasePath("/login"), request.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  // An allowlist of the *protected* areas, so the storefront is public by
  // construction: "/", "/clinicians", "/explore", "/courses/:slug", "/login"
  // and the API routes are not listed here and so are never redirected.
  // Adding a signed-in area means adding it below.
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/professor/:path*",
    "/student/:path*",
    "/settings/:path*",
  ],
};
