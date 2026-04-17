import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const deliverableId = searchParams.get("deliverableId");

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      ...(projectId ? { projectId } : {}),
      ...(deliverableId ? { deliverableId } : {}),
    },
    include: {
      project: { select: { name: true } },
      deliverable: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const body = await req.json();

  const entry = await prisma.timeEntry.create({
    data: {
      description: body.description,
      duration: parseInt(body.duration),
      date: body.date ? new Date(body.date) : new Date(),
      userId,
      projectId: body.projectId ?? null,
      deliverableId: body.deliverableId ?? null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
