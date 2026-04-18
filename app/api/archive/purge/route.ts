import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { type, id } = await req.json();

  switch (type) {
    case "client":
      await prisma.client.deleteMany({ where: { id, userId, deletedAt: { not: null } } });
      break;
    case "project":
      await prisma.project.deleteMany({ where: { id, deletedAt: { not: null }, client: { userId } } });
      break;
    case "delegation":
      await prisma.delegation.deleteMany({ where: { id, assignedById: userId, deletedAt: { not: null } } });
      break;
    case "template":
      await prisma.template.deleteMany({ where: { id, userId, deletedAt: { not: null } } });
      break;
    case "deliverable":
      await prisma.deliverable.deleteMany({ where: { id, deletedAt: { not: null }, project: { client: { userId } } } });
      break;
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
