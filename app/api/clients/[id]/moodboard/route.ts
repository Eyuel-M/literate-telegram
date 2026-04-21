import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; role: string; workspaceId: string };

async function canAccess(clientId: string, userId: string, workspaceId: string, role: string) {
  if (role === "ADMIN") {
    return prisma.client.findFirst({ where: { id: clientId, workspaceId, deletedAt: null } });
  }
  const member = await prisma.teamMember.findFirst({ where: { linkedUserId: userId } });
  if (!member) return null;
  return prisma.delegation.findFirst({
    where: { teamMemberId: member.id, project: { clientId, deletedAt: null }, deletedAt: null },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role, workspaceId } = session.user as SessionUser;

  if (!await canAccess(params.id, userId, workspaceId, role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let moodboard = await prisma.moodboard.findUnique({
    where:   { clientId: params.id },
    include: { items: { orderBy: { zIndex: "asc" } } },
  });

  if (!moodboard) {
    moodboard = await prisma.moodboard.create({
      data:    { clientId: params.id },
      include: { items: { orderBy: { zIndex: "asc" } } },
    });
  }

  return NextResponse.json(moodboard);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: userId, role, workspaceId } = session.user as SessionUser;

  if (!await canAccess(params.id, userId, workspaceId, role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  let moodboard = await prisma.moodboard.findUnique({ where: { clientId: params.id } });
  if (!moodboard) {
    moodboard = await prisma.moodboard.create({ data: { clientId: params.id } });
  }

  const maxZ = await prisma.moodboardItem.aggregate({
    where: { moodboardId: moodboard.id },
    _max:  { zIndex: true },
  });

  const item = await prisma.moodboardItem.create({
    data: {
      moodboardId: moodboard.id,
      type:        body.type,
      content:     body.content,
      label:       body.label ?? null,
      x:           body.x     ?? 80,
      y:           body.y     ?? 80,
      width:       body.width  ?? 300,
      zIndex:      (maxZ._max.zIndex ?? 0) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
