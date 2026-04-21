import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  // Verify delegation belongs to this workspace
  const existing = await prisma.delegation.findFirst({
    where: { id: params.id, teamMember: { workspaceId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const delegation = await prisma.delegation.update({
    where: { id: params.id },
    data: {
      title:        body.title,
      description:  body.description,
      status:       body.status,
      priority:     body.priority,
      dueDate:      body.dueDate ? new Date(body.dueDate) : undefined,
      teamMemberId: body.teamMemberId,
    },
    include: {
      teamMember: { select: { id: true, name: true, color: true, role: true } },
      project:    { select: { id: true, name: true, client: { select: { name: true, color: true } } } },
    },
  });

  return NextResponse.json(delegation);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const existing = await prisma.delegation.findFirst({
    where: { id: params.id, teamMember: { workspaceId } },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.delegation.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
