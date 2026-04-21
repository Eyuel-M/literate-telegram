import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
    if (!workspaceId)  return NextResponse.json({ error: "No workspace" }, { status: 400 });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: { users: true, clients: true, teamMembers: true },
        },
      },
    });

    if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

    return NextResponse.json(workspace);
  } catch (err) {
    console.error("[GET /api/workspace]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role        = (session.user as { role?: string }).role;
    const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
    if (role !== "ADMIN") return NextResponse.json({ error: "Admin required" }, { status: 403 });
    if (!workspaceId)     return NextResponse.json({ error: "No workspace" },   { status: 400 });

    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const workspace = await prisma.workspace.update({
      where: { id: workspaceId },
      data:  { name: name.trim() },
    });

    return NextResponse.json(workspace);
  } catch (err) {
    console.error("[PATCH /api/workspace]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
