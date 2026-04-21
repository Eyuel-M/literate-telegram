import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const clients = await prisma.client.findMany({
    where: { workspaceId, deletedAt: null },
    include: {
      projects: {
        include: {
          _count:     { select: { deliverables: true } },
          timeEntries: { select: { duration: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { workspaceId } = session.user as SessionUser;

    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Client name is required" }, { status: 400 });

    const client = await prisma.client.create({
      data: {
        name:        body.name.trim(),
        email:       body.email?.trim()   || null,
        company:     body.company?.trim() || null,
        color:       body.color           ?? "#7c3aed",
        notes:       body.notes           || null,
        workspaceId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("[POST /api/clients]", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
