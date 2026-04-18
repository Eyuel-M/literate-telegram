import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function owned(id: string, userId: string) {
  return prisma.template.findFirst({ where: { id, userId } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  if (!await owned(params.id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Replace all items atomically
  await prisma.templateItem.deleteMany({ where: { templateId: params.id } });

  const template = await prisma.template.update({
    where: { id: params.id },
    data: {
      name:        body.name?.trim(),
      description: body.description?.trim() || null,
      color:       body.color,
      icon:        body.icon,
      items: body.items?.length
        ? { create: body.items.map((item: { name: string; type?: string; description?: string }, i: number) => ({
            name:        item.name.trim(),
            type:        item.type ?? "OTHER",
            description: item.description?.trim() || null,
            sortOrder:   i,
          })) }
        : undefined,
    },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(template);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  if (!await owned(params.id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.template.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
