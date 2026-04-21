import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const projects = await prisma.project.findMany({
    where: {
      deletedAt: null,
      client: { workspaceId, deletedAt: null },
    },
    select: {
      id:       true,
      name:     true,
      status:   true,
      priority: true,
      dueDate:  true,
      color:    true,
      client: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(projects);
}
