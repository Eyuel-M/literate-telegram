import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const body = await req.json();

  const project = await prisma.project.findFirst({
    where: { id: body.projectId, client: { workspaceId } },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const count = await prisma.deliverable.count({ where: { projectId: body.projectId } });

  const deliverable = await prisma.deliverable.create({
    data: {
      name:        body.name,
      description: body.description,
      type:        body.type   ?? "OTHER",
      status:      body.status ?? "PENDING",
      dueDate:     body.dueDate ? new Date(body.dueDate) : null,
      sortOrder:   count,
      projectId:   body.projectId,
    },
    include: {
      versions: true,
      _count:   { select: { versions: true } },
    },
  });

  return NextResponse.json(deliverable, { status: 201 });
}
