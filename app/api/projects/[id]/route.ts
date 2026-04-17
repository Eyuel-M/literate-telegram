import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getProject(id: string, userId: string) {
  return prisma.project.findFirst({
    where: { id, client: { userId } },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const project = await prisma.project.findFirst({
    where: { id: params.id, client: { userId } },
    include: {
      client: { select: { id: true, name: true, color: true, email: true } },
      deliverables: {
        include: {
          versions: {
            orderBy: { number: "desc" },
            include: {
              assets: { take: 1 },
              _count: { select: { feedback: true, assets: true } },
            },
          },
          _count: { select: { versions: true, timeEntries: true } },
          timeEntries: { select: { duration: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      timeEntries: {
        select: { duration: true, date: true, description: true },
        orderBy: { date: "desc" },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const existing = await getProject(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const project = await prisma.project.update({
    where: { id: params.id },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
      color: body.color,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      budget: body.budget ? parseFloat(body.budget) : null,
    },
  });

  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const existing = await getProject(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
