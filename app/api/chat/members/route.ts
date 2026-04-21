import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = session.user as { id: string; role: string };
    if (actor.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });
    }

    const { name, email, password, role } = await req.json();

    if (!name?.trim())     return NextResponse.json({ error: "Name is required" },     { status: 400 });
    if (!email?.trim())    return NextResponse.json({ error: "Email is required" },    { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: "Password is required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password: hash,
        role:     role ?? "MEMBER",
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[POST /api/chat/members]", err);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
