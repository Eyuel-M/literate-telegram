import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const messages = await prisma.chatMessage.findMany({
    take: 50,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: { mentions: { select: { userId: true, read: true } } },
  });

  return NextResponse.json(messages.reverse());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id: string; name: string };
  const { content, color } = await req.json();

  if (!content?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  // Extract @mentions — match @display-names from users list
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentionedUserIds: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = mentionPattern.exec(content)) !== null) {
    mentionedUserIds.push(m[2]);
  }

  const message = await prisma.chatMessage.create({
    data: {
      content,
      authorId:    user.id,
      authorName:  user.name ?? "Unknown",
      authorColor: color ?? "#7c3aed",
      mentions: mentionedUserIds.length > 0 ? {
        create: mentionedUserIds
          .filter((uid) => uid !== user.id)
          .map((uid) => ({ userId: uid })),
      } : undefined,
    },
    include: { mentions: { select: { userId: true, read: true } } },
  });

  return NextResponse.json(message);
}
