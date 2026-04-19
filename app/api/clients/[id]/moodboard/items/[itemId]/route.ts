import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccessItem(itemId: string, userId: string, role: string) {
  const item = await prisma.moodboardItem.findFirst({
    where: { id: itemId },
    include: { moodboard: { include: { client: true } } },
  });
  if (!item) return null;

  const client = item.moodboard.client;
  if (role === "ADMIN" && client.userId === userId) return item;

  const member = await prisma.teamMember.findFirst({ where: { linkedUserId: userId } });
  if (!member) return null;
  const delegation = await prisma.delegation.findFirst({
    where: { teamMemberId: member.id, project: { clientId: client.id, deletedAt: null }, deletedAt: null },
  });
  return delegation ? item : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string };

  const item = await canAccessItem(params.itemId, user.id, user.role);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.moodboardItem.update({
    where: { id: params.itemId },
    data: {
      content: body.content ?? item.content,
      label:   body.label !== undefined ? body.label : item.label,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string };

  const item = await canAccessItem(params.itemId, user.id, user.role);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.moodboardItem.delete({ where: { id: params.itemId } });
  return NextResponse.json({ success: true });
}
