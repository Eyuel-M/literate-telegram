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

  const deliverable = await prisma.deliverable.findFirst({
    where:   { id: body.deliverableId, project: { client: { workspaceId } } },
    include: { versions: { orderBy: { number: "desc" }, take: 1 } },
  });
  if (!deliverable) return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });

  const nextNumber = deliverable.versions.length > 0 ? deliverable.versions[0].number + 1 : 1;

  const version = await prisma.version.create({
    data: {
      number:        nextNumber,
      notes:         body.notes,
      status:        body.status ?? "DRAFT",
      deliverableId: body.deliverableId,
    },
    include: {
      assets:   true,
      feedback: { include: { replies: true } },
    },
  });

  return NextResponse.json(version, { status: 201 });
}
