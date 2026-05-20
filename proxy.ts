import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PERSONA_COOKIE = "hanaloop_persona";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const role = request.nextUrl.searchParams.get("role");
  const urlRole = role === "operator" || role === "executive" ? role : null;

  if (urlRole) {
    request.cookies.set(PERSONA_COOKIE, urlRole);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (urlRole) {
    response.cookies.set(PERSONA_COOKIE, urlRole, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
