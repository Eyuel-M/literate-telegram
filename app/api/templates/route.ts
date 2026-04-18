import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const templates = await prisma.template.findMany({
    where: { userId, deletedAt: null },
    include: { items: { orderBy: { sortOrder: "asc" } } },
    orderBy: [{ isPreset: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = (session.user as { id: string }).id;

    const body = await req.json();
    if (!body.name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const template = await prisma.template.create({
      data: {
        name:        body.name.trim(),
        description: body.description?.trim() || null,
        color:       body.color   ?? "#7c3aed",
        icon:        body.icon    ?? "Layers",
        isPreset:    false,
        userId,
        items: body.items?.length
          ? { create: body.items.map((item: { name: string; type?: string; description?: string }, i: number) => ({
              name:      item.name.trim(),
              type:      item.type ?? "OTHER",
              description: item.description?.trim() || null,
              sortOrder: i,
            })) }
          : undefined,
      },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("[POST /api/templates]", err);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}
