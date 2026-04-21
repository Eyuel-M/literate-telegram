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

  const client = await prisma.client.findFirst({ where: { id: body.clientId, workspaceId } });
  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const project = await prisma.project.create({
    data: {
      name:        body.name,
      description: body.description,
      status:      body.status ?? "DISCOVERY",
      color:       body.color  ?? client.color,
      dueDate:     body.dueDate ? new Date(body.dueDate) : null,
      budget:      body.budget  ? parseFloat(body.budget)  : null,
      clientId:    body.clientId,
    },
    include: { client: { select: { name: true, color: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}
