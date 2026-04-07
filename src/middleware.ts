import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const FLEET_PREFIXES = [
  "/dashboard",
  "/calendar",
  "/tasks",
  "/yachts",
  "/logs",
  "/crew",
  "/documents",
  "/profile",
  "/admin",
  "/maintenance",
];

function isFleetPath(pathname: string) {
  return FLEET_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const PUBLIC_PREFIXES = ["/signin", "/login", "/accept-invite", "/api/auth"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Static files under / (e.g. navis-logo.jpg)
  if (pathname.includes(".") && !pathname.startsWith("/api")) {
    const ext = pathname.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg", "ico", "txt", "xml"].includes(ext ?? "")) {
      return NextResponse.next();
    }
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("middleware: NEXTAUTH_SECRET is not set");
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret });

  if (pathname === "/platform" || pathname.startsWith("/platform/")) {
    if (!token) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    if (!token.isPlatformAdmin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (isFleetPath(pathname)) {
    if (!token) {
      return NextResponse.redirect(new URL("/signin", request.url));
    }
    if (token.isPlatformAdmin) {
      return NextResponse.redirect(new URL("/platform", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/calendar/:path*",
    "/tasks/:path*",
    "/yachts/:path*",
    "/logs/:path*",
    "/crew/:path*",
    "/documents/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/maintenance/:path*",
    "/platform",
    "/platform/:path*",
  ],
};
