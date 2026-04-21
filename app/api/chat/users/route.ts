import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SessionUser = { id: string; workspaceId: string };

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { workspaceId } = session.user as SessionUser;

    const users = await prisma.user.findMany({
      where:   { workspaceId },
      select:  { id: true, name: true, avatar: true, role: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(users);
  } catch (err) {
    console.error("[GET /api/chat/users]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
