import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// DELETE — revoke a member's chat access (deletes their User account, keeps TeamMember)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = session.user as { id: string; role: string };
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Prevent removing yourself
    if (userId === actor.id) return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/chat/members]", err);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}

// GET — team members that don't have a login account yet
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = session.user as { id: string; role: string };
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const members = await prisma.teamMember.findMany({
      where:   { userId: actor.id, linkedUserId: null },
      select:  { id: true, name: true, email: true, role: true, color: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(members);
  } catch (err) {
    console.error("[GET /api/chat/members]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — create a login account for a team member and link them
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const actor = session.user as { id: string; role: string };
    if (actor.role !== "ADMIN") return NextResponse.json({ error: "Only admins can add members" }, { status: 403 });

    const { teamMemberId, password } = await req.json();

    if (!teamMemberId) return NextResponse.json({ error: "Team member is required" }, { status: 400 });
    if (!password?.trim() || password.length < 6)
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const member = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
    if (!member)          return NextResponse.json({ error: "Team member not found" },           { status: 404 });
    if (member.linkedUserId) return NextResponse.json({ error: "Member already has a login account" }, { status: 409 });
    if (!member.email)    return NextResponse.json({ error: "Team member has no email address" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: member.email } });
    if (existing) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);

    // Create user + link team member in a transaction
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name:     member.name,
          email:    member.email!,
          password: hash,
          role:     "MEMBER",
        },
      });
      await tx.teamMember.update({
        where: { id: teamMemberId },
        data:  { linkedUserId: u.id },
      });
      return u;
    });

    return NextResponse.json(
      { id: user.id, name: user.name, avatar: null, role: user.role },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/chat/members]", err);
    return NextResponse.json({ error: "Failed to create member" }, { status: 500 });
  }
}
