import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isSuperAdmin(session: any) {
  return session?.user?.role === "SUPER_ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const workspaces = await prisma.workspace.findMany({
    include: { _count: { select: { users: true, clients: true, teamMembers: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workspaces);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isSuperAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, plan, subscriptionStatus, subscriptionExpiresAt } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const workspace = await prisma.workspace.update({
    where: { id },
    data: {
      ...(plan                  ? { plan }               : {}),
      ...(subscriptionStatus    ? { subscriptionStatus } : {}),
      ...(subscriptionExpiresAt !== undefined
        ? { subscriptionExpiresAt: subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null }
        : {}),
    },
  });

  return NextResponse.json(workspace);
}
