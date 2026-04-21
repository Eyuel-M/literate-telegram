import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const members = await prisma.teamMember.findMany({
    where: { workspaceId },
    include: { delegations: { select: { status: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { workspaceId } = session.user as SessionUser;

    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const member = await prisma.teamMember.create({
      data: {
        name:        body.name.trim(),
        email:       body.email?.trim() || null,
        role:        body.role          ?? "DESIGNER",
        color:       body.color         ?? "#7c3aed",
        workspaceId,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (err) {
    console.error("[POST /api/team]", err);
    return NextResponse.json({ error: "Failed to create team member" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Verify it belongs to this workspace
  const member = await prisma.teamMember.findFirst({ where: { id, workspaceId } });
  if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.teamMember.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
