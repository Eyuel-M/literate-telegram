import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Return all users who have login accounts (both admins and linked team members)
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatar: true, role: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}
