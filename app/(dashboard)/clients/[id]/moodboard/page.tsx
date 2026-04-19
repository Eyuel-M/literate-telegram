export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Palette } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { MoodboardClient } from "@/components/moodboard/moodboard-client";

async function getData(clientId: string, userId: string, isAdmin: boolean) {
  const client = await prisma.client.findFirst({
    where: isAdmin
      ? { id: clientId, userId, deletedAt: null }
      : { id: clientId, deletedAt: null },
  });
  if (!client) return null;

  if (!isAdmin) {
    const member = await prisma.teamMember.findFirst({ where: { linkedUserId: userId } });
    if (!member) return null;
    const ok = await prisma.delegation.findFirst({
      where: { teamMemberId: member.id, project: { clientId, deletedAt: null }, deletedAt: null },
    });
    if (!ok) return null;
  }

  await prisma.moodboard.upsert({
    where:  { clientId },
    create: { clientId },
    update: {},
  });
  const moodboard = await prisma.moodboard.findUnique({
    where:   { clientId },
    include: { items: { orderBy: { zIndex: "asc" } } },
  })!;

  const collaborators = await prisma.teamMember.findMany({
    where: { delegations: { some: { project: { clientId }, deletedAt: null } } },
    select: { id: true, name: true, color: true, role: true },
    distinct: ["id"],
  });

  return { client, moodboard, collaborators };
}

export default async function MoodboardPage({ params }: { params: { id: string } }) {
  const session  = await getServerSession(authOptions);
  const user     = session!.user as { id: string; role: string; name: string };
  const isAdmin  = user.role === "ADMIN";

  const data = await getData(params.id, user.id, isAdmin);
  if (!data) notFound();

  const { client, moodboard, collaborators } = data;
  const items = (moodboard?.items ?? []).map((i) => ({
    ...i,
    type:      i.type as "IMAGE" | "NOTE",
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--c-border)", background: "var(--c-bg)" }}
      >
        <div className="flex items-center gap-4">
          <Link
            href={isAdmin ? `/clients/${client.id}` : "/dashboard"}
            className="hover:opacity-70 transition-opacity flex-shrink-0"
            style={{ color: "var(--c-text-muted)" }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${client.color}, ${client.color}88)` }}
            >
              {getInitials(client.name)}
            </div>
            <div>
              <p className="text-[11px] leading-none mb-1" style={{ color: "var(--c-text-muted)" }}>
                {client.name}
              </p>
              <h1
                className="text-sm font-bold tracking-tight flex items-center gap-1.5"
                style={{ color: "var(--c-text)" }}
              >
                <Palette size={12} style={{ color: "var(--c-accent-text)" }} />
                Moodboard
              </h1>
            </div>
          </div>
        </div>

        {collaborators.length > 0 && (
          <div className="flex items-center gap-2.5">
            <span className="text-[11px]" style={{ color: "var(--c-text-faint)" }}>
              Collaborators
            </span>
            <div className="flex items-center -space-x-1.5">
              {collaborators.slice(0, 6).map((c) => (
                <div
                  key={c.id}
                  title={c.name}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white ring-2 flex-shrink-0"
                  style={{ background: c.color, ringColor: "var(--c-bg)" } as React.CSSProperties}
                >
                  {getInitials(c.name)}
                </div>
              ))}
              {collaborators.length > 6 && (
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold ring-2"
                  style={{ background: "var(--c-elevated)", color: "var(--c-text-muted)" }}
                >
                  +{collaborators.length - 6}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MoodboardClient clientId={client.id} initialItems={items} />
    </div>
  );
}
