export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MyTasksClient } from "@/components/my-tasks/my-tasks-client";

async function getData(userId: string) {
  const profile = await prisma.teamMember.findUnique({
    where: { linkedUserId: userId },
    include: {
      delegations: {
        include: {
          project: { select: { id: true, name: true, client: { select: { name: true, color: true } } } },
        },
        orderBy: [{ status: "asc" }, { priority: "asc" }, { dueDate: "asc" }],
      },
    },
  });
  return profile;
}

export default async function MyTasksPage() {
  const session = await getServerSession(authOptions);
  const userId  = (session!.user as { id: string }).id;

  const profile = await getData(userId);
  if (!profile) {
    return (
      <div className="px-8 py-12 text-center">
        <p className="text-sm" style={{ color: "var(--c-text-muted)" }}>
          Your account isn't linked to a team member profile yet. Ask your admin.
        </p>
      </div>
    );
  }

  const total       = profile.delegations.length;
  const pending     = profile.delegations.filter((d) => d.status === "PENDING").length;
  const inProgress  = profile.delegations.filter((d) => d.status === "IN_PROGRESS").length;
  const done        = profile.delegations.filter((d) => d.status === "DONE").length;

  const tasks = profile.delegations.map((d) => ({
    ...d,
    dueDate:   d.dueDate?.toISOString()   ?? null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <div className="animate-fade-in">
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: profile.color }}
          >
            {profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>
              My Tasks
            </h1>
            <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
              {profile.name} · {profile.role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-5">
          {[
            { label: "Total",       value: total,      color: "var(--c-text)"       },
            { label: "Pending",     value: pending,    color: "var(--c-warning)"    },
            { label: "In Progress", value: inProgress, color: "var(--c-accent-text)"},
            { label: "Done",        value: done,       color: "var(--c-success)"    },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="px-4 py-2.5 rounded-xl flex flex-col"
              style={{ background: "var(--c-elevated)", border: "1px solid var(--c-border)" }}
            >
              <span className="text-lg font-bold" style={{ color }}>{value}</span>
              <span className="text-[10px]" style={{ color: "var(--c-text-muted)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <MyTasksClient tasks={tasks} memberId={profile.id} />
    </div>
  );
}
