import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getDeliverable(id: string, userId: string) {
  return prisma.deliverable.findFirst({
    where: { id, deletedAt: null, project: { deletedAt: null, client: { userId, deletedAt: null } } },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const deliverable = await prisma.deliverable.findFirst({
    where: { id: params.id, deletedAt: null, project: { deletedAt: null, client: { userId, deletedAt: null } } },
    include: {
      project: {
        include: {
          client: { select: { id: true, name: true, color: true } },
        },
      },
      versions: {
        orderBy: { number: "asc" },
        include: {
          assets: { orderBy: { createdAt: "asc" } },
          feedback: {
            orderBy: { createdAt: "asc" },
            include: { replies: { orderBy: { createdAt: "asc" } } },
          },
        },
      },
      timeEntries: {
        select: { duration: true, date: true, description: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!deliverable) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deliverable);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const existing = await getDeliverable(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const deliverable = await prisma.deliverable.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      type: body.type,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
  });

  return NextResponse.json(deliverable);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const existing = await getDeliverable(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deliverable.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}
