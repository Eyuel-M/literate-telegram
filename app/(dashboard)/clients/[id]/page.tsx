import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDuration, formatDate, getInitials, STATUS_LABELS, STATUS_COLORS } from "@/lib/utils";
import { ArrowLeft, Mail, Calendar, DollarSign, Layers } from "lucide-react";
import { NewProjectButton } from "@/components/projects/new-project-button";

async function getClient(id: string, userId: string) {
  return prisma.client.findFirst({
    where: { id, userId },
    include: {
      projects: {
        include: {
          deliverables: {
            select: { status: true },
          },
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
  const userId = (session!.user as { id: string }).id;
  const client = await getClient(params.id, userId);

  if (!client) notFound();

  const totalMinutes = client.projects.reduce(
    (sum, p) => sum + p.timeEntries.reduce((s, e) => s + e.duration, 0),
    0
  );
  const totalBudget = client.projects.reduce((sum, p) => sum + (p.budget ?? 0), 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="px-8 py-7 border-b border-[#1e1e2e]">
        <Link href="/clients" className="flex items-center gap-1.5 text-xs text-[#6b6b85] hover:text-[#f0f0f8] mb-4 transition-colors w-fit">
          <ArrowLeft size={12} /> Clients
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${client.color}, ${client.color}99)` }}
            >
              {getInitials(client.name)}
            </div>
            <div>
              <h1 className="text-xl font-semibold text-[#f0f0f8] tracking-tight">{client.name}</h1>
              {client.company && <p className="text-sm text-[#6b6b85] mt-0.5">{client.company}</p>}
              {client.email && (
                <a href={`mailto:${client.email}`} className="flex items-center gap-1.5 text-xs text-[#6b6b85] hover:text-violet-400 mt-1 transition-colors">
                  <Mail size={11} /> {client.email}
                </a>
              )}
            </div>
          </div>
          <NewProjectButton clientId={client.id} />
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#6b6b85]" />
            <span className="text-sm text-[#f0f0f8] font-medium">{client.projects.length}</span>
            <span className="text-xs text-[#6b6b85]">projects</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-[#6b6b85]" />
            <span className="text-sm text-[#f0f0f8] font-medium">{formatDuration(totalMinutes)}</span>
            <span className="text-xs text-[#6b6b85]">logged</span>
          </div>
          {totalBudget > 0 && (
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-[#6b6b85]" />
              <span className="text-sm text-[#f0f0f8] font-medium">${totalBudget.toLocaleString()}</span>
              <span className="text-xs text-[#6b6b85]">total budget</span>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      <div className="px-8 py-6">
        <h2 className="text-sm font-semibold text-[#f0f0f8] mb-4">Projects</h2>

        {client.projects.length === 0 ? (
          <div className="card p-12 text-center">
            <Layers size={32} className="text-[#3a3a50] mx-auto mb-3" />
            <p className="text-sm text-[#6b6b85] mb-4">No projects yet for this client</p>
            <NewProjectButton clientId={client.id} />
          </div>
        ) : (
          <div className="space-y-3">
            {client.projects.map((project) => {
              const total = project.deliverables.length;
              const done = project.deliverables.filter((d) => d.status === "APPROVED").length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const minutes = project.timeEntries.reduce((s, e) => s + e.duration, 0);

              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="card p-5 hover:border-[#2a2a40] hover:bg-[#15151f] transition-all cursor-pointer group flex items-center gap-5">
                    <div
                      className="w-1 h-12 rounded-full flex-shrink-0"
                      style={{ background: project.color }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h3 className="font-semibold text-[#f0f0f8] group-hover:text-violet-300 transition-colors">
                          {project.name}
                        </h3>
                        <span className={`badge text-[10px] ${STATUS_COLORS[project.status]}`}>
                          {STATUS_LABELS[project.status]}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-[#6b6b85] mb-2 line-clamp-1">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: project.color }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-[#3a3a50] flex-shrink-0">{done}/{total} done</span>
                        <span className="text-xs text-[#3a3a50] flex-shrink-0">{formatDuration(minutes)}</span>
                        {project.dueDate && (
                          <span className="text-xs text-[#3a3a50] flex-shrink-0">Due {formatDate(project.dueDate)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
