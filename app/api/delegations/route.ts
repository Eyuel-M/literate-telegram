import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const delegations = await prisma.delegation.findMany({
    where: { teamMember: { workspaceId }, deletedAt: null },
    include: {
      teamMember: { select: { id: true, name: true, color: true, role: true } },
      project:    { select: { id: true, name: true, client: { select: { name: true, color: true } } } },
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(delegations);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, workspaceId } = session.user as SessionUser;

  const body = await req.json();

  // Verify team member belongs to workspace
  const member = await prisma.teamMember.findFirst({
    where: { id: body.teamMemberId, workspaceId },
  });
  if (!member) return NextResponse.json({ error: "Team member not found" }, { status: 404 });

  const delegation = await prisma.delegation.create({
    data: {
      title:        body.title,
      description:  body.description,
      status:       body.status   ?? "PENDING",
      priority:     body.priority ?? "MEDIUM",
      dueDate:      body.dueDate ? new Date(body.dueDate) : null,
      teamMemberId: body.teamMemberId,
      assignedById: userId,
      projectId:    body.projectId ?? null,
    },
    include: {
      teamMember: { select: { id: true, name: true, color: true, role: true } },
      project:    { select: { id: true, name: true, client: { select: { name: true, color: true } } } },
    },
  });

  return NextResponse.json(delegation, { status: 201 });
}
