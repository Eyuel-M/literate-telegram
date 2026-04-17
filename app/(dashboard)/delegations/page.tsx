import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getInitials } from "@/lib/utils";
import { DelegationsClient } from "@/components/delegations/delegations-client";

const ROLE_LABELS: Record<string, string> = {
  SENIOR_DESIGNER: "Senior Designer",
  JUNIOR_DESIGNER: "Junior Designer",
  ART_DIRECTOR: "Art Director",
  DESIGNER: "Designer",
  MEMBER: "Member",
};

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
    // ← include delegations so we can count open tasks per member
    prisma.teamMember.findMany({
      where: { userId },
      include: {
        delegations: { select: { status: true } },
      },
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
  const session   = await getServerSession(authOptions);
  const userId    = (session!.user as { id: string }).id;
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

        {/* Team overview pills */}
        {teamMembers.length > 0 && (
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            {teamMembers.map((m) => {
              const open = m.delegations.filter((d) => d.status !== "DONE").length;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ background: m.color }}
                  >
                    {getInitials(m.name)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "var(--c-text)" }}>{m.name}</p>
                    <p className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>
                      {ROLE_LABELS[m.role] ?? m.role}
                      {open > 0 && (
                        <span style={{ color: "var(--c-warning)" }}>
                          {" · "}{open} open
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
        }))}
        projects={projects}
      />
    </div>
  );
}
