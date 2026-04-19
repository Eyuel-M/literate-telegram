import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function canAccess(clientId: string, userId: string, role: string) {
  if (role === "ADMIN") {
    return prisma.client.findFirst({ where: { id: clientId, userId, deletedAt: null } });
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
  const user = session.user as { id: string; role: string };

  if (!await canAccess(params.id, user.id, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let moodboard = await prisma.moodboard.findUnique({
    where: { clientId: params.id },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  if (!moodboard) {
    moodboard = await prisma.moodboard.create({
      data: { clientId: params.id },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });
  }

  return NextResponse.json(moodboard);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { id: string; role: string };

  if (!await canAccess(params.id, user.id, user.role)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();

  let moodboard = await prisma.moodboard.findUnique({ where: { clientId: params.id } });
  if (!moodboard) {
    moodboard = await prisma.moodboard.create({ data: { clientId: params.id } });
  }

  const count = await prisma.moodboardItem.count({
    where: { moodboardId: moodboard.id, section: body.section },
  });

  const item = await prisma.moodboardItem.create({
    data: {
      moodboardId: moodboard.id,
      section:     body.section,
      type:        body.type,
      content:     body.content,
      label:       body.label ?? null,
      sortOrder:   count,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
