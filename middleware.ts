import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const ADMIN_PATHS = ["/clients", "/projects", "/delegations", "/templates", "/time", "/settings", "/archive", "/billing"];

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token as { role?: string; workspaceId?: string } | null;
    const role     = token?.role;
    const pathname = req.nextUrl.pathname;

    // Super-admin panel protection
    if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Non-admins blocked from admin-only pages (moodboard is exempt)
    const isMoodboard = /^\/clients\/[^/]+\/moodboard/.test(pathname);
    if (role !== "ADMIN" && role !== "SUPER_ADMIN" && !isMoodboard && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
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
    "/billing/:path*",
    "/admin/:path*",
  ],
};
