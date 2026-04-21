import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspaceId } = session.user as SessionUser;

  const { type, id } = await req.json();

  switch (type) {
    case "client":
      await prisma.client.updateMany({ where: { id, workspaceId }, data: { deletedAt: null } });
      break;
    case "project":
      await prisma.project.updateMany({ where: { id, client: { workspaceId } }, data: { deletedAt: null } });
      break;
    case "delegation":
      await prisma.delegation.updateMany({ where: { id, teamMember: { workspaceId } }, data: { deletedAt: null } });
      break;
    case "template":
      await prisma.template.updateMany({ where: { id, workspaceId }, data: { deletedAt: null } });
      break;
    case "deliverable":
      await prisma.deliverable.updateMany({ where: { id, project: { client: { workspaceId } } }, data: { deletedAt: null } });
      break;
    default:
      return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
