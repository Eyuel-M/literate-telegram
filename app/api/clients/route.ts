import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

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
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const client = await prisma.client.create({
    data: {
      name: body.name,
      email: body.email,
      company: body.company,
      color: body.color ?? "#7c3aed",
      notes: body.notes,
      userId,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
