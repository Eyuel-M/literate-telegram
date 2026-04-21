import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, workspaceId } = session.user as SessionUser;

  const [
    totalClients,
    activeProjects,
    pendingReviews,
    recentProjects,
    weekTimeEntries,
  ] = await Promise.all([
    prisma.client.count({ where: { workspaceId, status: "ACTIVE", deletedAt: null } }),
    prisma.project.count({ where: { client: { workspaceId }, status: { in: ["IN_PROGRESS", "REVIEW"] }, deletedAt: null } }),
    prisma.deliverable.count({ where: { project: { client: { workspaceId } }, status: "IN_REVIEW", deletedAt: null } }),
    prisma.project.findMany({
      where: { client: { workspaceId }, deletedAt: null },
      include: {
        client:      { select: { name: true, color: true } },
        _count:      { select: { deliverables: true } },
        deliverables: { select: { status: true } },
      },
      orderBy: { updatedAt: "desc" },
      take:    6,
    }),
    prisma.timeEntry.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      select: { duration: true },
    }),
  ]);

  const weekHours = weekTimeEntries.reduce((sum, e) => sum + e.duration, 0);

  return NextResponse.json({
    stats: { totalClients, activeProjects, pendingReviews, weekMinutes: weekHours },
    recentProjects,
  });
}
