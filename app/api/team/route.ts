import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const members = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      _count: { select: { delegations: true } },
      delegations: { select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(members);
}
