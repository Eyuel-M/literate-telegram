import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const reply = await prisma.feedbackReply.create({
    data: {
      content: body.content,
      author: body.author ?? session.user.name ?? "Designer",
      feedbackId: params.id,
    },
  });

  return NextResponse.json(reply, { status: 201 });
}
