import { NextResponse, type NextRequest } from "next/server";
import { decrypt, isStaffRole, SESSION_COOKIE } from "@/lib/auth/jwt";

const customerOnly = ["/account", "/checkout"];
const guestOnly = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value);
  const loginUrl = new URL(`/login?next=${encodeURIComponent(pathname + search)}`, request.url);

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(loginUrl);
    if (!isStaffRole(session.role)) return NextResponse.redirect(new URL("/", request.url));
  }

  if (customerOnly.some((p) => pathname.startsWith(p)) && !session) {
    return NextResponse.redirect(loginUrl);
  }

  if (guestOnly.includes(pathname) && session) {
    return NextResponse.redirect(new URL(isStaffRole(session.role) ? "/admin" : "/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/login", "/register"],
};
