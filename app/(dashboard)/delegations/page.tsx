export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DelegationsClient } from "@/components/delegations/delegations-client";

async function getData(userId: string) {
  const [delegations, teamMembers, projects] = await Promise.all([
    prisma.delegation.findMany({
      where: { assignedById: userId },
      include: {
        teamMember: { select: { id: true, name: true, color: true, role: true } },
        project: { select: { id: true, name: true, client: { select: { name: true, color: true } } } },
      },
      orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
    }),
    prisma.teamMember.findMany({
      where: { userId },
      include: { delegations: { select: { status: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { client: { userId } },
      select: { id: true, name: true, client: { select: { name: true, color: true } } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return { delegations, teamMembers, projects };
}

export default async function DelegationsPage() {
  const session = await getServerSession(authOptions);
  const userId  = (session!.user as { id: string }).id;
  const { delegations, teamMembers, projects } = await getData(userId);

  return (
    <div className="animate-fade-in">
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
          Delegations
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>
          Assign and track work across your team
        </p>
      </div>

      <DelegationsClient
        initialDelegations={delegations.map((d) => ({
          ...d,
          dueDate:   d.dueDate?.toISOString() ?? null,
          createdAt: d.createdAt.toISOString(),
          updatedAt: d.updatedAt.toISOString(),
        }))}
        teamMembers={teamMembers.map((m) => ({
          id: m.id, name: m.name, color: m.color, role: m.role,
          openCount: m.delegations.filter((d) => d.status !== "DONE").length,
        }))}
        projects={projects}
      />
    </div>
  );
}
