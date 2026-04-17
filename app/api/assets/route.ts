import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const asset = await prisma.asset.create({
    data: {
      name: body.name,
      url: body.url,
      mimeType: body.mimeType ?? "image/png",
      size: body.size,
      width: body.width,
      height: body.height,
      versionId: body.versionId,
    },
  });

  return NextResponse.json(asset, { status: 201 });
}
