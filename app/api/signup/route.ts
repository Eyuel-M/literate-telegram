import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/plans";
import bcrypt from "bcryptjs";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    const { studioName, name, email, password } = await req.json();

    if (!studioName?.trim()) return NextResponse.json({ error: "Studio name is required" },    { status: 400 });
    if (!name?.trim())        return NextResponse.json({ error: "Your name is required" },      { status: 400 });
    if (!email?.trim())       return NextResponse.json({ error: "Email is required" },          { status: 400 });
    if (!password)            return NextResponse.json({ error: "Password is required" },       { status: 400 });
    if (password.length < 8)  return NextResponse.json({ error: "Password must be 8+ characters" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const slug = await uniqueSlug(slugify(studioName.trim()));
    const hash = await bcrypt.hash(password, 12);

    const { workspace, user } = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name:                  studioName.trim(),
          slug,
          plan:                  "TRIAL",
          subscriptionStatus:    "ACTIVE",
          subscriptionExpiresAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
        },
      });

      const user = await tx.user.create({
        data: {
          email:       email.trim().toLowerCase(),
          name:        name.trim(),
          password:    hash,
          role:        "ADMIN",
          workspaceId: workspace.id,
        },
      });

      return { workspace, user };
    });

    return NextResponse.json(
      { ok: true, workspaceId: workspace.id, userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/signup]", err);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
