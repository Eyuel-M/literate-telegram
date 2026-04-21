import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = (session.user as { id: string }).id;
    const body   = await req.json();

    // ── Account info update ──
    if (body.action === "update-profile") {
      const { name, email } = body;
      if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

      if (email && email !== session.user.email) {
        const conflict = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (conflict && conflict.id !== userId)
          return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          name:  name.trim(),
          email: email?.trim().toLowerCase() ?? undefined,
        },
        select: { id: true, name: true, email: true, role: true },
      });
      return NextResponse.json(user);
    }

    // ── Password change ──
    if (body.action === "change-password") {
      const { current, next } = body;
      if (!current || !next) return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
      if (next.length < 6)   return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

      const valid = await bcrypt.compare(current, user.password);
      if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

      const hash = await bcrypt.hash(next, 12);
      await prisma.user.update({ where: { id: userId }, data: { password: hash } });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("[PATCH /api/settings]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
