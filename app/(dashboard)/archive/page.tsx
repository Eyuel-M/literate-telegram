export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArchiveClient } from "@/components/archive/archive-client";

async function getArchivedData(userId: string) {
  const [clients, projects, delegations, templates, deliverables] = await Promise.all([
    prisma.client.findMany({
      where: { userId, deletedAt: { not: null } },
      include: { _count: { select: { projects: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.project.findMany({
      where: { deletedAt: { not: null }, client: { userId } },
      include: { client: { select: { name: true, color: true } }, _count: { select: { deliverables: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.delegation.findMany({
      where: { assignedById: userId, deletedAt: { not: null } },
      include: {
        teamMember: { select: { name: true, color: true } },
        project: { select: { name: true } },
      },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.template.findMany({
      where: { userId, deletedAt: { not: null } },
      include: { _count: { select: { items: true } } },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.deliverable.findMany({
      where: { deletedAt: { not: null }, project: { deletedAt: null, client: { userId, deletedAt: null } } },
      include: { project: { select: { name: true, client: { select: { name: true, color: true } } } } },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  return {
    clients:      clients.map((c)      => ({ ...c, deletedAt: c.deletedAt!.toISOString() })),
    projects:     projects.map((p)     => ({ ...p, deletedAt: p.deletedAt!.toISOString(), dueDate: p.dueDate?.toISOString() ?? null })),
    delegations:  delegations.map((d)  => ({ ...d, deletedAt: d.deletedAt!.toISOString(), dueDate: d.dueDate?.toISOString() ?? null, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })),
    templates:    templates.map((t)    => ({ ...t, deletedAt: t.deletedAt!.toISOString() })),
    deliverables: deliverables.map((d) => ({ ...d, deletedAt: d.deletedAt!.toISOString(), dueDate: d.dueDate?.toISOString() ?? null, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })),
  };
}

export default async function ArchivePage() {
  const session = await getServerSession(authOptions);
  const userId  = (session!.user as { id: string }).id;
  const data = await getArchivedData(userId);
  const total = data.clients.length + data.projects.length + data.delegations.length + data.templates.length + data.deliverables.length;

  return (
    <div className="animate-fade-in">
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--c-text)" }}>Archive</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>
          {total} archived item{total !== 1 ? "s" : ""} — restore or permanently delete
        </p>
      </div>

      <div className="px-8 py-6">
        <ArchiveClient initialData={data} />
      </div>
    </div>
  );
}
