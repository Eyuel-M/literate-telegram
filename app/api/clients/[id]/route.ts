import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

async function getClient(id: string, workspaceId: string) {
  return prisma.client.findFirst({ where: { id, workspaceId, deletedAt: null } });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const client = await prisma.client.findFirst({
    where: { id: params.id, workspaceId, deletedAt: null },
    include: {
      projects: {
        where: { deletedAt: null },
        include: {
          deliverables: {
            where: { deletedAt: null },
            include: { versions: { orderBy: { number: "desc" } }, _count: { select: { versions: true } } },
          },
          timeEntries: { select: { duration: true } },
          _count: { select: { deliverables: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const existing = await getClient(params.id, workspaceId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const client = await prisma.client.update({
    where: { id: params.id },
    data: { name: body.name, email: body.email, company: body.company, color: body.color, status: body.status, notes: body.notes },
  });

  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const existing = await getClient(params.id, workspaceId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.client.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
