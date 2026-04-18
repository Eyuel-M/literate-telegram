import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const [clients, projects, delegations, templates, deliverables] = await Promise.all([
    prisma.client.findMany({
      where: { userId, deletedAt: { not: null } },
      include: { _count: { select: { projects: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { deletedAt: { not: null }, client: { userId } },
      include: { client: { select: { name: true, color: true } }, _count: { select: { deliverables: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.delegation.findMany({
      where: { assignedById: userId, deletedAt: { not: null } },
      include: {
        teamMember: { select: { name: true, color: true } },
        project: { select: { name: true } },
      },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.template.findMany({
      where: { userId, deletedAt: { not: null } },
      include: { _count: { select: { items: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.deliverable.findMany({
      where: { deletedAt: { not: null }, project: { deletedAt: null, client: { userId, deletedAt: null } } },
      include: { project: { select: { name: true, client: { select: { name: true, color: true } } } } },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  return NextResponse.json({ clients, projects, delegations, templates, deliverables });
}
