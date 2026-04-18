import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const { type, id } = await req.json();

  switch (type) {
    case "client":
      await prisma.client.updateMany({ where: { id, userId }, data: { deletedAt: null } });
      break;
    case "project":
      await prisma.project.updateMany({ where: { id, client: { userId } }, data: { deletedAt: null } });
      break;
    case "delegation":
      await prisma.delegation.updateMany({ where: { id, assignedById: userId }, data: { deletedAt: null } });
      break;
    case "template":
      await prisma.template.updateMany({ where: { id, userId }, data: { deletedAt: null } });
      break;
    case "deliverable":
      await prisma.deliverable.updateMany({ where: { id, project: { client: { userId } } }, data: { deletedAt: null } });
      break;
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
