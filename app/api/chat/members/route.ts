import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

type SessionUser = { id: string; role: string; workspaceId: string };

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const actor = session.user as SessionUser;
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (userId === actor.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

    // Verify user belongs to same workspace
    const target = await prisma.user.findFirst({ where: { id: userId, workspaceId: actor.workspaceId } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/chat/members]", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const actor = session.user as SessionUser;
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const members = await prisma.teamMember.findMany({
      where:   { workspaceId: actor.workspaceId, linkedUserId: null },
      select:  { id: true, name: true, email: true, role: true, color: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(members);
  } catch (err) {
    console.error("[GET /api/chat/members]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const actor = session.user as SessionUser;
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });

    const { teamMemberId, password } = await req.json();
    if (!teamMemberId)                      return NextResponse.json({ error: "Team member is required" }, { status: 400 });
    if (!password?.trim() || password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const member = await prisma.teamMember.findFirst({ where: { id: teamMemberId, workspaceId: actor.workspaceId } });
    if (!member)             return NextResponse.json({ error: "Team member not found" },             { status: 404 });
    if (member.linkedUserId) return NextResponse.json({ error: "Member already has a login account" }, { status: 409 });
    if (!member.email)       return NextResponse.json({ error: "Team member has no email address" },  { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: member.email } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name:        member.name,
          email:       member.email!,
          password:    hash,
          role:        "MEMBER",
          workspaceId: actor.workspaceId,
        },
      });
      await tx.teamMember.update({ where: { id: teamMemberId }, data: { linkedUserId: u.id } });
      return u;
    });

    return NextResponse.json({ id: user.id, name: user.name, avatar: null, role: user.role }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/chat/members]", err);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
