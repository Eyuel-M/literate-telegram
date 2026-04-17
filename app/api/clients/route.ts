import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  if (!userId) return NextResponse.json({ error: "Session missing user id" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { userId },
    include: {
      projects: {
        include: {
          _count: { select: { deliverables: true } },
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

    const userId = (session.user as { id: string }).id;
    if (!userId) return NextResponse.json({ error: "Session missing user id" }, { status: 401 });

    const body = await req.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name: body.name.trim(),
        email:   body.email?.trim()   || null,
        company: body.company?.trim() || null,
        color:   body.color           ?? "#7c3aed",
        notes:   body.notes           || null,
        userId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error("[POST /api/clients]", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
