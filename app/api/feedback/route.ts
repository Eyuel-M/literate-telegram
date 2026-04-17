import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { versionId, content, author, xPos, yPos } = body;

  const feedback = await prisma.feedback.create({
    data: {
      content,
      author: author ?? session.user.name ?? "Designer",
      xPos: xPos ?? null,
      yPos: yPos ?? null,
      versionId,
    },
    include: { replies: true },
  });

  return NextResponse.json(feedback, { status: 201 });
}
