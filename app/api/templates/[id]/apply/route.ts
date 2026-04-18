import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const template = await prisma.template.findFirst({
    where: { id: params.id, userId },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { projectId } = await req.json();
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const project = await prisma.project.findFirst({
    where: { id: projectId, client: { userId } },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const deliverables = await prisma.$transaction(
    template.items.map((item) =>
      prisma.deliverable.create({
        data: {
          name:        item.name,
          type:        item.type,
          description: item.description ?? null,
          sortOrder:   item.sortOrder,
          projectId,
        },
      })
    )
  );

  return NextResponse.json({ created: deliverables.length });
}
