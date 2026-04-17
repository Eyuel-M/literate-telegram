import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDuration, formatDate, getInitials } from "@/lib/utils";
import { ArrowLeft, Mail, Calendar, DollarSign, Layers } from "lucide-react";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { QuickStatus } from "@/components/ui/quick-status";
import { CircularProgress } from "@/components/dashboard/circular-progress";

async function getClient(id: string, userId: string) {
  return prisma.client.findFirst({
    where: { id, userId },
    include: {
      projects: {
        include: {
          deliverables: { select: { status: true } },
          timeEntries: { select: { duration: true } },
          _count: { select: { deliverables: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId  = (session!.user as { id: string }).id;
  const client  = await getClient(params.id, userId);
  if (!client) notFound();

  const totalMinutes = client.projects.reduce(
    (sum, p) => sum + p.timeEntries.reduce((s, e) => s + e.duration, 0), 0
  );
  const totalBudget = client.projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <div className="animate-fade-in" style={{ color: "var(--c-text)" }}>
      {/* Header */}
      <div className="px-8 py-7" style={{ borderBottom: "1px solid var(--c-border)" }}>
        <Link
          href="/clients"
          className="flex items-center gap-1.5 text-xs mb-4 w-fit hover:opacity-70 transition-opacity"
          style={{ color: "var(--c-text-muted)" }}
        >
          <ArrowLeft size={12} /> Clients
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${client.color}, ${client.color}99)` }}
            >
              {getInitials(client.name)}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{client.name}</h1>
              {client.company && <p className="text-sm mt-0.5" style={{ color: "var(--c-text-muted)" }}>{client.company}</p>}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-1.5 text-xs mt-1 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--c-text-muted)" }}
                >
                  <Mail size={11} /> {client.email}
                </a>
              )}
            </div>
          </div>
          <NewProjectButton clientId={client.id} />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mt-5 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers size={14} style={{ color: "var(--c-text-muted)" }} />
            <span className="text-sm font-semibold">{client.projects.length}</span>
            <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>projects</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} style={{ color: "var(--c-text-muted)" }} />
            <span className="text-sm font-semibold">{formatDuration(totalMinutes)}</span>
            <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>logged</span>
          </div>
          {totalBudget > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign size={14} style={{ color: "var(--c-text-muted)" }} />
              <span className="text-sm font-semibold">${totalBudget.toLocaleString()}</span>
              <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>total budget</span>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="px-8 py-6">
        <h2 className="text-sm font-semibold mb-4">Projects</h2>

        {client.projects.length === 0 ? (
          <div className="card p-12 text-center">
            <Layers size={32} style={{ color: "var(--c-text-faint)" }} className="mx-auto mb-3" />
            <p className="text-sm mb-4" style={{ color: "var(--c-text-muted)" }}>No projects yet</p>
            <NewProjectButton clientId={client.id} />
          </div>
        ) : (
          <div className="space-y-3">
            {client.projects.map((project) => {
              const total    = project.deliverables.length;
              const done     = project.deliverables.filter((d) => d.status === "APPROVED").length;
              const pct      = total > 0 ? Math.round((done / total) * 100) : 0;
              const minutes  = project.timeEntries.reduce((s, e) => s + e.duration, 0);

              return (
                <div
                  key={project.id}
                  className="card p-5 flex items-center gap-5 hover:scale-[1.005] transition-transform"
                >
                  <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: project.color }} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                      <Link href={`/projects/${project.id}`}>
                        <h3 className="font-semibold hover:underline">{project.name}</h3>
                      </Link>
                      <QuickStatus entity="project" id={project.id} current={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-xs mb-2 line-clamp-1" style={{ color: "var(--c-text-muted)" }}>{project.description}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-xs h-1 rounded-full overflow-hidden" style={{ background: "var(--c-elevated)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: project.color }} />
                      </div>
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--c-text-faint)" }}>{done}/{total}</span>
                      <span className="text-xs flex-shrink-0" style={{ color: "var(--c-text-faint)" }}>{formatDuration(minutes)}</span>
                      {project.dueDate && (
                        <span className="text-xs flex-shrink-0" style={{ color: "var(--c-text-faint)" }}>Due {formatDate(project.dueDate)}</span>
                      )}
                    </div>
                  </div>

                  <CircularProgress value={done} max={Math.max(total, 1)} size={48} color={project.color} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
