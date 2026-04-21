import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_PATHS = ["/clients", "/projects", "/delegations", "/templates", "/time", "/settings", "/archive"];

export default withAuth(
  function middleware(req) {
    const role     = (req.nextauth.token as { role?: string })?.role;
    const pathname = req.nextUrl.pathname;

    // Non-admins blocked from admin-only pages (moodboard is exempt — access checked in the page)
    const isMoodboard = /^\/clients\/[^/]+\/moodboard/.test(pathname);
    if (role !== "ADMIN" && !isMoodboard && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL("/my-tasks", req.url));
    }

    // Admins have no /my-tasks — redirect to dashboard
    if (role === "ADMIN" && pathname.startsWith("/my-tasks")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/delegations/:path*",
    "/templates/:path*",
    "/time/:path*",
    "/settings/:path*",
    "/archive/:path*",
    "/my-tasks/:path*",
    "/chat/:path*",
  ],
};
